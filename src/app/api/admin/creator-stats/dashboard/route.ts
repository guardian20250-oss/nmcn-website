import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStatsViewer, statsRowScope } from "@/lib/creator-stats-access";
import { STATS_CONFIG, isPeriodType } from "@/lib/creator-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET ?period=all|weekly|monthly&asOf=<ISO export date>
//
// Default view = each creator's LATEST stat row (from whichever upload it came
// from). Creators missing from newer partial uploads simply keep their latest
// row; nothing is ever marked missing. `asOf` shows rows from one export date.
//
// Scope (applied in the DB query, see creator-stats-access.ts):
//   admin → all · team_lead → own email · manager → assigned leads + creators
export async function GET(request: NextRequest) {
  const viewer = await getStatsViewer(request);
  if (viewer.status !== 200) {
    return NextResponse.json({ error: viewer.status === 401 ? "Unauthorized" : "Forbidden" }, { status: viewer.status });
  }
  const { staff, scope, access } = viewer;
  const isAll = scope === "all";
  const sp = request.nextUrl.searchParams;
  const period = sp.get("period");
  const asOfRaw = sp.get("asOf");
  const asOf = asOfRaw && !Number.isNaN(Date.parse(asOfRaw)) ? new Date(asOfRaw) : null;

  const where = { ...statsRowScope(scope, access), ...(isPeriodType(period) ? { periodType: period } : {}) };

  const [rows, exportDates, light, routeEmail] = await Promise.all([
    prisma.creatorStat.findMany({
      where: asOf ? { ...where, exportedAt: asOf } : where,
      orderBy: [{ exportedAt: "desc" }, { id: "desc" }],
      ...(asOf ? {} : { distinct: ["backstageCreatorId"] as const }),
      include: isAll ? { creatorAccount: { select: { id: true, name: true, email: true } } } : undefined,
    }),
    prisma.creatorStat.groupBy({
      by: ["exportedAt", "periodType"],
      where,
      _count: { _all: true },
      orderBy: { exportedAt: "desc" },
      take: 60,
    }),
    // light history for "vs previous" deltas (same period type, earlier export)
    // + the month-to-date totals (every upload this calendar month, added up).
    prisma.creatorStat.findMany({
      where: { ...where, exportedAt: { gte: new Date(Date.now() - 400 * 86_400_000) } },
      orderBy: [{ exportedAt: "desc" }, { id: "desc" }],
      select: { backstageCreatorId: true, exportedAt: true, periodType: true, diamondsL30D: true, liveDurationL30D: true },
    }),
    // Manual routes (the owner's round-one assignment) = the default sort:
    // creator → its manager/scout's anchored team → that lead's email.
    (async () => {
      const [anchors, creatorRows] = await Promise.all([
        prisma.creatorStatManagerAssignment.findMany({ where: { teamLeadId: { not: null } }, select: { managerId: true, teamLeadId: true } }),
        prisma.creatorStatManagerAssignment.findMany({ where: { teamLeadId: null, backstageCreatorId: { not: null } }, select: { backstageCreatorId: true, managerId: true } }),
      ]);
      const managerTeam = new Map<number, number>();
      for (const a of anchors) if (a.teamLeadId !== null) managerTeam.set(a.managerId, a.teamLeadId);
      const routeTeam = new Map<string, number>();
      for (const r of creatorRows) {
        if (!r.backstageCreatorId) continue;
        const t = managerTeam.get(r.managerId);
        if (t !== undefined && !routeTeam.has(r.backstageCreatorId)) routeTeam.set(r.backstageCreatorId, t);
      }
      const leadIds = [...new Set([...routeTeam.values()])];
      const leads = leadIds.length
        ? await prisma.admin.findMany({ where: { id: { in: leadIds } }, select: { id: true, email: true } })
        : [];
      const emailById = new Map(leads.map(l => [l.id, l.email]));
      const out = new Map<string, string>();
      for (const [cid, tid] of routeTeam) {
        const e = emailById.get(tid);
        if (e) out.set(cid, e);
      }
      return out;
    })(),
  ]);

  const byCreator = new Map<string, typeof light>();
  for (const l of light) byCreator.set(l.backstageCreatorId, [...(byCreator.get(l.backstageCreatorId) || []), l]);

  // Month-to-date: every upload exported THIS calendar month, added up per
  // creator, then across creators — so week 1 + week 2 + … all count.
  // (The weekly boxes stay on each creator's latest row.)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthAgg = new Map<string, { diamonds: number; hours: number }>();
  for (const l of light) {
    if (new Date(l.exportedAt) < monthStart) continue;
    const a = monthAgg.get(l.backstageCreatorId) || { diamonds: 0, hours: 0 };
    a.diamonds += l.diamondsL30D;
    a.hours += l.liveDurationL30D;
    monthAgg.set(l.backstageCreatorId, a);
  }

  // ── Graph series ──────────────────────────────────────────────────────────
  // Per-export totals (every creator in scope summed at each export date) →
  // the bar charts. Latest export = "this week", the one before = "last week".
  const exportAgg = new Map<number, { exportedAt: Date; periodType: string; diamonds: number; hours: number; creators: Set<string> }>();
  for (const l of light) {
    const t = new Date(l.exportedAt).getTime();
    const a = exportAgg.get(t) || { exportedAt: new Date(t), periodType: l.periodType, diamonds: 0, hours: 0, creators: new Set<string>() };
    a.diamonds += l.diamondsL30D;
    a.hours += l.liveDurationL30D;
    a.creators.add(l.backstageCreatorId);
    exportAgg.set(t, a);
  }
  const exportsSorted = [...exportAgg.values()].sort((a, b) => b.exportedAt.getTime() - a.exportedAt.getTime());
  const [latestExport, prevExport] = exportsSorted;
  // Previous calendar month totals (this month is already monthTotals).
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonth = { diamonds: 0, hours: 0 };
  for (const l of light) {
    const d = new Date(l.exportedAt);
    if (d >= prevMonthStart && d < monthStart) {
      prevMonth.diamonds += l.diamondsL30D;
      prevMonth.hours += l.liveDurationL30D;
    }
  }
  const curMonth = {
    diamonds: [...monthAgg.values()].reduce((s, a) => s + a.diamonds, 0),
    hours: [...monthAgg.values()].reduce((s, a) => s + a.hours, 0),
  };

  return NextResponse.json({
    scope,
    viewer: { name: staff.name, role: staff.role },
    teamLeadEmails: scope === "manager" ? access.teamLeadEmails.slice(1) : access.teamLeadEmails,
    assignedCreatorCount: access.creatorIds.length,
    goals: { validDays: STATS_CONFIG.validDaysGoal, liveHours: STATS_CONFIG.liveHoursGoal, tier5: STATS_CONFIG.tierTargets[5] },
    period: isPeriodType(period) ? period : "all",
    asOf: asOf ? asOf.toISOString() : null,
    monthStart: monthStart.toISOString(),
    monthTotals: {
      diamonds: curMonth.diamonds,
      hours: Math.round(curMonth.hours),
    },
    // Graph data: per-export sums (latest N), this week vs last week,
    // this month vs last month.
    series: {
      exports: [...exportAgg.values()].sort((a, b) => a.exportedAt.getTime() - b.exportedAt.getTime()).slice(-16).map(e => ({
        exportedAt: e.exportedAt.toISOString(),
        periodType: e.periodType,
        diamonds: e.diamonds,
        hours: Math.round(e.hours * 100) / 100,
        creators: e.creators.size,
      })),
      week: {
        current: latestExport ? { exportedAt: latestExport.exportedAt.toISOString(), diamonds: latestExport.diamonds, hours: Math.round(latestExport.hours * 100) / 100 } : null,
        previous: prevExport ? { exportedAt: prevExport.exportedAt.toISOString(), diamonds: prevExport.diamonds, hours: Math.round(prevExport.hours * 100) / 100 } : null,
      },
      month: {
        current: { diamonds: curMonth.diamonds, hours: Math.round(curMonth.hours) },
        previous: { diamonds: prevMonth.diamonds, hours: Math.round(prevMonth.hours) },
      },
    },
    exportDates: exportDates.map(e => ({ exportedAt: e.exportedAt, periodType: e.periodType, creators: e._count._all })),
    rows: rows
      .sort((a, b) => b.diamondsL30D - a.diamondsL30D)
      .map(r => {
        const prev = (byCreator.get(r.backstageCreatorId) || []).find(p => p.periodType === r.periodType && p.exportedAt < r.exportedAt);
        return {
          ...r,
          // Manual route wins over the export column (owner's default sort);
          // creators routed into a team appear under that lead immediately.
          teamLead: routeEmail.get(r.backstageCreatorId) ?? r.teamLead,
          likes: Number(r.likes),
          prevDiamondsL30D: prev?.diamondsL30D ?? null,
        };
      }),
  });
}
