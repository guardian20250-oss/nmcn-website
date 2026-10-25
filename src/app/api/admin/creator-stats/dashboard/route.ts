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

  const [rows, exportDates, light] = await Promise.all([
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
    prisma.creatorStat.findMany({
      where: { ...where, exportedAt: { gte: new Date(Date.now() - 400 * 86_400_000) } },
      orderBy: { exportedAt: "desc" },
      select: { backstageCreatorId: true, exportedAt: true, periodType: true, diamondsL30D: true },
    }),
  ]);

  const byCreator = new Map<string, typeof light>();
  for (const l of light) byCreator.set(l.backstageCreatorId, [...(byCreator.get(l.backstageCreatorId) || []), l]);

  return NextResponse.json({
    scope,
    viewer: { name: staff.name, role: staff.role },
    teamLeadEmails: scope === "manager" ? access.teamLeadEmails.slice(1) : access.teamLeadEmails,
    assignedCreatorCount: access.creatorIds.length,
    goals: { validDays: STATS_CONFIG.validDaysGoal, liveHours: STATS_CONFIG.liveHoursGoal, tier5: STATS_CONFIG.tierTargets[5] },
    period: isPeriodType(period) ? period : "all",
    asOf: asOf ? asOf.toISOString() : null,
    exportDates: exportDates.map(e => ({ exportedAt: e.exportedAt, periodType: e.periodType, creators: e._count._all })),
    rows: rows
      .sort((a, b) => b.diamondsL30D - a.diamondsL30D)
      .map(r => {
        const prev = (byCreator.get(r.backstageCreatorId) || []).find(p => p.periodType === r.periodType && p.exportedAt < r.exportedAt);
        return { ...r, likes: Number(r.likes), prevDiamondsL30D: prev?.diamondsL30D ?? null };
      }),
  });
}
