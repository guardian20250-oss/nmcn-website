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
  const [assignments, managers, teamLeads, latestRows, mappings] = await Promise.all([
    prisma.creatorStatManagerAssignment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, backstageCreatorId: true,
        manager: { select: { id: true, name: true, email: true } },
        teamLead: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.admin.findMany({ where: { role: "manager" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    // Staff anchors for the assign flow: team leads AND owner accounts, so the
    // owner's own account (role admin) can be picked even though their profile
    // is not in the Backstage export at all.
    prisma.admin.findMany({ where: { role: { in: ["team_lead", "admin"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } }),
    prisma.creatorStat.findMany({
      orderBy: { exportedAt: "desc" },
      distinct: ["backstageCreatorId"],
      select: { backstageCreatorId: true, username: true, teamLead: true },
    }),
    // Backstage emails already mapped onto a staff account.
    prisma.creatorStatEmailMapping.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, backstageEmail: true, adminId: true, admin: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  const creators = [...latestRows].sort((a, b) => a.username.localeCompare(b.username)).map(({ backstageCreatorId, username, teamLead }) => ({ backstageCreatorId, username, teamLead }));

  // Per-Backstage-email counts — powers the "no account with that email" box.
  const countByLead = new Map<string, number>();
  for (const c of latestRows) {
    const k = emailKey(c.teamLead);
    if (k) countByLead.set(k, (countByLead.get(k) || 0) + 1);
  }
  // Per-staff-account counts — this is the roster number. It matches on the
  // account's own email AND any Backstage email mapped to it, so a lead whose
  // Backstage email differs from their signup email (Daniel's case) shows
  // their real creator count instead of 0.
  const emailToAdmin = new Map<string, number>();
  for (const t of teamLeads) emailToAdmin.set(emailKey(t.email), t.id);
  for (const m of mappings) {
    const k = emailKey(m.backstageEmail);
    if (!emailToAdmin.has(k)) emailToAdmin.set(k, m.adminId); // a staff account's own email always wins
  }
  const countByAdmin = new Map<number, number>();
  for (const c of latestRows) {
    const adminId = emailToAdmin.get(emailKey(c.teamLead));
    if (adminId) countByAdmin.set(adminId, (countByAdmin.get(adminId) || 0) + 1);
  }
  const leadEmails = new Set(teamLeads.map(t => emailKey(t.email)));
  const mappedEmails = new Set(mappings.map(m => emailKey(m.backstageEmail)));
  const usernameById = new Map(creators.map(c => [c.backstageCreatorId, c.username]));
  // Group mapped Backstage emails by staff account so the UI can show them inline.
  const mappingsByAdmin = new Map<number, string[]>();
  for (const m of mappings) {
    mappingsByAdmin.set(m.adminId, [...(mappingsByAdmin.get(m.adminId) || []), m.backstageEmail]);
  }

  return NextResponse.json({
    managers,
    teamLeads: teamLeads.map(t => ({
      ...t,
      creators: countByAdmin.get(t.id) || 0,
      mappedBackstageEmails: mappingsByAdmin.get(t.id) || [],
    })),
    mappings,
    // Backstage values with neither a team lead staff account nor a mapping.
    unmatchedTeamLeads: [...countByLead.entries()]
      .filter(([k]) => !leadEmails.has(k) && !mappedEmails.has(k))
      .map(([value, count]) => ({ value, count })),
    creators,
    assignments: assignments.map(a => ({
      ...a,
      creatorUsername: a.backstageCreatorId ? usernameById.get(a.backstageCreatorId) ?? null : null,
    })),
  });
}

// POST { managerId, teamLeadId } | { managerId, backstageCreatorId } | { backstageEmail, adminId }
export async function POST(request: NextRequest) {
  const { staff, error } = await requireAdmin(request);
  if (!staff) return error;
  const body = await request.json().catch(() => ({}));

  // Map a Backstage "Creator Network manager" email onto a staff account.
  // This is what fixes "In Backstage data but no team lead account with that email".
  if (body.backstageEmail !== undefined) {
    const email = String(body.backstageEmail).trim().toLowerCase();
    const adminId = Number(body.adminId);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid Backstage email" }, { status: 400 });
    }
    if (!Number.isInteger(adminId) || adminId <= 0) {
      return NextResponse.json({ error: "Choose the staff account this email belongs to" }, { status: 400 });
    }
    const target = await prisma.admin.findUnique({ where: { id: adminId }, select: { id: true, name: true, email: true, role: true } });
    if (!target || !["admin", "manager", "team_lead"].includes(target.role)) {
      return NextResponse.json({ error: "That account cannot be assigned creators" }, { status: 400 });
    }
    try {
      await prisma.creatorStatEmailMapping.create({ data: { backstageEmail: email, adminId } });
    } catch (e) {
      // P2002 = that Backstage email is already mapped.
      if ((e as { code?: string })?.code === "P2002") {
        return NextResponse.json({ error: "That Backstage email is already mapped to someone." }, { status: 409 });
      }
      throw e;
    }
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "email_map", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Mapped Backstage email ${email} to ${target.name} (${target.email})`,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const managerId = Number(body.managerId);
  const teamLeadId = body.teamLeadId ? Number(body.teamLeadId) : null;
  const backstageCreatorId = body.backstageCreatorId ? String(body.backstageCreatorId).trim().slice(0, 40) : null;
  // The flow is lead → manager → creator, so lead and creator may now arrive
  // together: "assign this manager under that lead, to that person".
  if (!Number.isInteger(managerId) || (!teamLeadId && !backstageCreatorId)) {
    return NextResponse.json({ error: "Provide managerId and a team lead, a creator, or both" }, { status: 400 });
  }
  const manager = await prisma.admin.findUnique({ where: { id: managerId }, select: { email: true, role: true } });
  if (!manager || manager.role !== "manager") return NextResponse.json({ error: "Selected account is not a manager" }, { status: 400 });

  const parts: string[] = [];
  if (teamLeadId) {
    const lead = await prisma.admin.findUnique({ where: { id: teamLeadId }, select: { email: true, role: true } });
    // Owners (role admin) are accepted too: their account may not exist in the
    // Backstage export, but managers can still be assigned under them.
    if (!lead || !["team_lead", "admin"].includes(lead.role)) return NextResponse.json({ error: "Selected account is not a team lead or owner" }, { status: 400 });
    parts.push(`team lead ${lead.email}`);
  }
  if (backstageCreatorId) {
    const known = await prisma.creatorStat.findFirst({ where: { backstageCreatorId }, select: { username: true } });
    if (!known) return NextResponse.json({ error: "Unknown Creator ID" }, { status: 400 });
    parts.push(`creator @${known.username}`);
  }

  const where = { managerId, teamLeadId: teamLeadId ?? null, backstageCreatorId: backstageCreatorId ?? null };
  let created = false;
  const exists = await prisma.creatorStatManagerAssignment.findFirst({ where });
  if (!exists) {
    try {
      await prisma.creatorStatManagerAssignment.create({ data: where });
      created = true;
    } catch (e) {
      // P2002: a unique pair already covers this (e.g. the manager is already
      // assigned to that whole team). Treat as already done, not an error.
      if ((e as { code?: string })?.code !== "P2002") throw e;
    }
  }
  if (created) {
    await prisma.creatorStatAuditLog.create({
      data: { action: "manager_assign", adminId: staff.id, adminEmail: staff.email, details: `Assigned ${parts.join(" + ")} to manager ${manager.email}` },
    });
  }
  return NextResponse.json({ ok: true, created });
}

// DELETE ?id=<assignmentId> | ?mappingId=<email mapping id>
export async function DELETE(request: NextRequest) {
  const { staff, error } = await requireAdmin(request);
  if (!staff) return error;

  const mappingId = Number(request.nextUrl.searchParams.get("mappingId"));
  if (Number.isInteger(mappingId) && mappingId > 0) {
    const mapping = await prisma.creatorStatEmailMapping.findUnique({
      where: { id: mappingId },
      select: { backstageEmail: true, admin: { select: { name: true, email: true } } },
    });
    if (!mapping) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.creatorStatEmailMapping.delete({ where: { id: mappingId } });
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "email_unmap", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Removed mapping for Backstage email ${mapping.backstageEmail} (was ${mapping.admin.name} / ${mapping.admin.email})`,
      },
    });
    return NextResponse.json({ ok: true });
  }

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
