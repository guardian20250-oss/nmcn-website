import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { canManageCreatorStats, emailKey } from "@/lib/creator-stats-access";

export const runtime = "nodejs";

// Admin-only: assign managers to team leads (or to specific creators).
async function requireAdmin(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canManageCreatorStats(staff.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { staff };
}

export async function GET(request: NextRequest) {
  const { staff, error } = await requireAdmin(request);
  if (!staff) return error;
  // Latest row per creator (uploads can be partial, so never rely on one snapshot).
  const [assignments, managers, teamLeads, latestRows] = await Promise.all([
    prisma.creatorStatManagerAssignment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, backstageCreatorId: true,
        manager: { select: { id: true, name: true, email: true } },
        teamLead: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.admin.findMany({ where: { role: "manager" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    prisma.admin.findMany({ where: { role: "team_lead" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    prisma.creatorStat.findMany({
      orderBy: { exportedAt: "desc" },
      distinct: ["backstageCreatorId"],
      select: { backstageCreatorId: true, username: true, teamLead: true },
    }),
  ]);
  const creators = [...latestRows].sort((a, b) => a.username.localeCompare(b.username)).map(({ backstageCreatorId, username }) => ({ backstageCreatorId, username }));

  const countByLead = new Map<string, number>();
  for (const c of latestRows) {
    const k = emailKey(c.teamLead);
    if (k) countByLead.set(k, (countByLead.get(k) || 0) + 1);
  }
  const leadEmails = new Set(teamLeads.map(t => emailKey(t.email)));
  const usernameById = new Map(creators.map(c => [c.backstageCreatorId, c.username]));

  return NextResponse.json({
    managers,
    teamLeads: teamLeads.map(t => ({ ...t, creators: countByLead.get(emailKey(t.email)) || 0 })),
    // Values in the export's "Creator Network manager" column with no team lead staff account.
    unmatchedTeamLeads: [...countByLead.entries()].filter(([k]) => !leadEmails.has(k)).map(([value, count]) => ({ value, count })),
    creators,
    assignments: assignments.map(a => ({
      ...a,
      creatorUsername: a.backstageCreatorId ? usernameById.get(a.backstageCreatorId) ?? null : null,
    })),
  });
}

// POST { managerId, teamLeadId } or { managerId, backstageCreatorId }
export async function POST(request: NextRequest) {
  const { staff, error } = await requireAdmin(request);
  if (!staff) return error;
  const body = await request.json().catch(() => ({}));
  const managerId = Number(body.managerId);
  const teamLeadId = body.teamLeadId ? Number(body.teamLeadId) : null;
  const backstageCreatorId = body.backstageCreatorId ? String(body.backstageCreatorId).trim().slice(0, 40) : null;
  if (!Number.isInteger(managerId) || (!teamLeadId && !backstageCreatorId) || (teamLeadId && backstageCreatorId)) {
    return NextResponse.json({ error: "Provide managerId and either teamLeadId or backstageCreatorId" }, { status: 400 });
  }
  const manager = await prisma.admin.findUnique({ where: { id: managerId }, select: { email: true, role: true } });
  if (!manager || manager.role !== "manager") return NextResponse.json({ error: "Selected account is not a manager" }, { status: 400 });

  let label = "";
  if (teamLeadId) {
    const lead = await prisma.admin.findUnique({ where: { id: teamLeadId }, select: { email: true, role: true } });
    if (!lead || lead.role !== "team_lead") return NextResponse.json({ error: "Selected account is not a team lead" }, { status: 400 });
    const exists = await prisma.creatorStatManagerAssignment.findFirst({ where: { managerId, teamLeadId } });
    if (!exists) await prisma.creatorStatManagerAssignment.create({ data: { managerId, teamLeadId } });
    label = `team lead ${lead.email}`;
  } else {
    const known = await prisma.creatorStat.findFirst({ where: { backstageCreatorId: backstageCreatorId! }, select: { username: true } });
    if (!known) return NextResponse.json({ error: "Unknown Creator ID" }, { status: 400 });
    const exists = await prisma.creatorStatManagerAssignment.findFirst({ where: { managerId, backstageCreatorId } });
    if (!exists) await prisma.creatorStatManagerAssignment.create({ data: { managerId, backstageCreatorId } });
    label = `creator @${known.username}`;
  }
  await prisma.creatorStatAuditLog.create({
    data: { action: "manager_assign", adminId: staff.id, adminEmail: staff.email, details: `Assigned ${label} to manager ${manager.email}` },
  });
  return NextResponse.json({ ok: true });
}

// DELETE ?id=<assignmentId>
export async function DELETE(request: NextRequest) {
  const { staff, error } = await requireAdmin(request);
  if (!staff) return error;
  const id = Number(request.nextUrl.searchParams.get("id"));
  const row = Number.isInteger(id)
    ? await prisma.creatorStatManagerAssignment.findUnique({
        where: { id },
        select: { backstageCreatorId: true, manager: { select: { email: true } }, teamLead: { select: { email: true } } },
      })
    : null;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.creatorStatManagerAssignment.delete({ where: { id } });
  await prisma.creatorStatAuditLog.create({
    data: {
      action: "manager_unassign", adminId: staff.id, adminEmail: staff.email,
      details: `Removed ${row.teamLead ? `team lead ${row.teamLead.email}` : `creator ${row.backstageCreatorId}`} from manager ${row.manager.email}`,
    },
  });
  return NextResponse.json({ ok: true });
}
