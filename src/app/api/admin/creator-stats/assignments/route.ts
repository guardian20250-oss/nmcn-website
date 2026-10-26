import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { emailKey } from "@/lib/creator-stats-access";

export const runtime = "nodejs";

// The owner edits everything; team leads may edit their own slice (see
// writeForbidden).
//
// Managers are deliberately NOT on this list. Their only backend job is
// uploading a Backstage export (/api/admin/creator-stats), so this route — the
// roster, every staff account, the manager/scout lists, the mappings — is
// closed to them. The manager-specific branches further down (the scoped GET
// view and the "manager may only add themselves" POST check) are retained so
// access can be widened again without rediscovering the scoping rules, but
// nothing role=manager reaches them today: the gate below returns 403 first.
const EDIT_ROLES = ["admin", "team_lead"];

async function requireEditor(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!EDIT_ROLES.includes(staff.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { staff };
}

type Staff = { id: number; email: string; role: string };
type Row = { managerId: number; teamLeadId: number | null; backstageCreatorId: string | null };

// Non-admins only touch their own slice of the roster.
async function writeForbidden(staff: Staff, row: Row): Promise<boolean> {
  if (staff.role === "admin") return false;
  if (staff.role === "manager") return row.managerId !== staff.id;
  // team_lead: their own team (anchor row), their own rows, or a creator whose
  // Backstage "Creator Network manager" maps to them.
  if (row.teamLeadId === staff.id || row.managerId === staff.id) return false;
  if (!row.backstageCreatorId) return true;
  const c = await prisma.creatorStat.findFirst({
    where: { backstageCreatorId: row.backstageCreatorId },
    orderBy: { exportedAt: "desc" },
    select: { teamLead: true },
  });
  if (!c?.teamLead) return true;
  if (emailKey(c.teamLead) === emailKey(staff.email)) return false;
  const m = await prisma.creatorStatEmailMapping.findFirst({
    where: { backstageEmail: emailKey(c.teamLead), adminId: staff.id },
    select: { id: true },
  });
  return !m;
}

export async function GET(request: NextRequest) {
  const { staff, error } = await requireEditor(request);
  if (!staff) return error;
  // Latest row per creator (uploads can be partial, so never rely on one snapshot).
  const [assignments, managers, scouts, others, teamLeads, latestRows, mappings, creatorAccounts, linkedRows, hiddenRows] = await Promise.all([
    prisma.creatorStatManagerAssignment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, backstageCreatorId: true,
        manager: { select: { id: true, name: true, email: true, role: true } },
        teamLead: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.admin.findMany({ where: { role: "manager" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    // Scouts are assignable to teams too (same assignment rows, role shown in the UI).
    prisma.admin.findMany({ where: { role: "scout" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    // Everyone else — NOT assignable yet, because both dropdowns and the
    // server-side check only accept role manager/scout. Without this list an
    // account created with any other role could never be picked at all.
    // Owners promote them to manager/scout straight from the assign box.
    prisma.admin.findMany({
      where: { role: { notIn: ["manager", "scout"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    // Staff anchors for the assign flow: team leads AND owner accounts, so the
    // owner's own account (role admin) can be picked even though their profile
    // is not in the Backstage export at all.
    prisma.admin.findMany({ where: { role: { in: ["team_lead", "admin"] } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } }),
    prisma.creatorStat.findMany({
      orderBy: { exportedAt: "desc" },
      distinct: ["backstageCreatorId"],
      select: { backstageCreatorId: true, username: true, teamLead: true, creatorAccountId: true },
    }),
    // Backstage emails already mapped onto a staff account.
    prisma.creatorStatEmailMapping.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, backstageEmail: true, adminId: true, admin: { select: { id: true, name: true, email: true } } },
    }),
    // Every site account (for the profile ↔ account link box).
    prisma.creatorAccount.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, assignedRole: true, status: true },
    }),
    // Profiles already bound to an account (any export snapshot).
    prisma.creatorStat.findMany({
      where: { creatorAccountId: { not: null } },
      orderBy: { exportedAt: "desc" },
      distinct: ["backstageCreatorId"],
      select: { backstageCreatorId: true, username: true, creatorAccountId: true },
    }),
    // Creators removed from stats (left the agency) — owner can restore them.
    prisma.creatorStatHidden.findMany({
      orderBy: { hiddenAt: "desc" },
      select: { backstageCreatorId: true, hiddenAt: true },
    }),
  ]);
  const hiddenIds = new Set(hiddenRows.map(h => h.backstageCreatorId));
  const usernameOfHidden = new Map(latestRows.map(r => [r.backstageCreatorId, r.username]));

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
  // Group mapped Backstage emails by staff account so the UI can show them inline.
  const mappingsByAdmin = new Map<number, string[]>();
  for (const m of mappings) {
    mappingsByAdmin.set(m.adminId, [...(mappingsByAdmin.get(m.adminId) || []), m.backstageEmail]);
  }

  // Profile ↔ account bindings, grouped by account for the link box.
  const linkedByAccount = new Map<number, { backstageCreatorId: string; username: string }>();
  for (const r of linkedRows) {
    if (r.creatorAccountId !== null && !linkedByAccount.has(r.creatorAccountId)) {
      linkedByAccount.set(r.creatorAccountId, { backstageCreatorId: r.backstageCreatorId, username: r.username });
    }
  }
  // Team a creator-only row belongs to. Resolution order (the owner's manual
  // assignment is the DEFAULT SORT for everything that follows):
  //   1. manual route — the creator's manager/scout is anchored on a team,
  //   2. the export's own anchor row,
  //   3. the export's "Creator Network manager" column mapped to an account.
  const anchorsByManager = new Map<number, number>();
  for (const a of assignments) {
    if (a.teamLead) anchorsByManager.set(a.manager.id, a.teamLead.id);
  }
  const routeOfCreator = new Map<string, number>();
  for (const a of assignments) {
    if (a.backstageCreatorId && !a.teamLead) {
      const via = anchorsByManager.get(a.manager.id);
      if (via !== undefined && !routeOfCreator.has(a.backstageCreatorId)) {
        routeOfCreator.set(a.backstageCreatorId, via);
      }
    }
  }
  // Hidden (removed-from-agency) profiles never appear in the roster, the
  // assign lists, or the stats pages — but the owner can restore them.
  const creators = [...latestRows]
    .filter(r => !hiddenIds.has(r.backstageCreatorId))
    .sort((a, b) => a.username.localeCompare(b.username))
    .map(({ backstageCreatorId, username, teamLead, creatorAccountId }) => ({
      backstageCreatorId, username, teamLead, accountId: creatorAccountId,
      // Team this profile sits on: manual route wins, else the export column
      // mapped to a staff account. Powers the full roster listing.
      leadId: routeOfCreator.get(backstageCreatorId) ?? emailToAdmin.get(emailKey(teamLead)) ?? null,
    }));
  const usernameById = new Map(creators.map(c => [c.backstageCreatorId, c.username]));
  const leadOfCreator = new Map(latestRows.map(r => [r.backstageCreatorId, r.teamLead]));
  const leadIdFor = (a: { teamLead: { id: number } | null; backstageCreatorId: string | null }) => {
    if (a.backstageCreatorId) {
      const route = routeOfCreator.get(a.backstageCreatorId);
      if (route !== undefined) return route;
    }
    if (a.teamLead) return a.teamLead.id;
    if (a.backstageCreatorId) {
      const email = leadOfCreator.get(a.backstageCreatorId);
      if (email) return emailToAdmin.get(emailKey(email)) ?? null;
    }
    return null;
  };

  const withLead = assignments.map(a => ({ ...a, creatorUsername: a.backstageCreatorId ? usernameById.get(a.backstageCreatorId) ?? null : null, leadId: leadIdFor(a) }));

  // ── View scope: a team lead sees their own team (managers, scouts,
  // creators); a manager sees their own rows and their teams' creators.
  let outTeamLeads = teamLeads;
  let outCreators = creators;
  let scoped = withLead;
  if (staff.role === "team_lead") {
    scoped = withLead.filter(a => a.leadId === staff.id || a.manager.id === staff.id);
    const myEmails = new Set([
      emailKey(staff.email),
      ...mappings.filter(m => m.adminId === staff.id).map(m => emailKey(m.backstageEmail)),
    ]);
    const onMyTeam = new Set(scoped.filter(a => a.backstageCreatorId).map(a => a.backstageCreatorId));
    outCreators = creators.filter(c =>
      onMyTeam.has(c.backstageCreatorId) ||
      routeOfCreator.get(c.backstageCreatorId) === staff.id ||
      (c.teamLead && myEmails.has(emailKey(c.teamLead)))
    );
    outTeamLeads = teamLeads.filter(t => t.id === staff.id);
  } else if (staff.role === "manager") {
    scoped = withLead.filter(a => a.manager.id === staff.id);
    const leadIds = new Set(scoped.map(a => a.leadId).filter((x): x is number => x !== null));
    const leadEmails = new Set<string>();
    for (const id of leadIds) {
      const t = teamLeads.find(x => x.id === id);
      if (t) leadEmails.add(emailKey(t.email));
      for (const m of mappings) if (m.adminId === id) leadEmails.add(emailKey(m.backstageEmail));
    }
    const mineIds = new Set(scoped.filter(a => a.backstageCreatorId).map(a => a.backstageCreatorId));
    outCreators = creators.filter(c =>
      mineIds.has(c.backstageCreatorId) ||
      (c.teamLead && leadEmails.has(emailKey(c.teamLead)))
    );
    outTeamLeads = teamLeads.filter(t => leadIds.has(t.id));
  }

  return NextResponse.json({
    viewerRole: staff.role,
    managers,
    scouts,
    // Who's left to promote into manager/scout — owner-only, since setRole is.
    others: staff.role === "admin" ? others.filter(o => o.id !== staff.id) : [],
    teamLeads: outTeamLeads.map(t => ({
      ...t,
      creators: countByAdmin.get(t.id) || 0,
      mappedBackstageEmails: mappingsByAdmin.get(t.id) || [],
    })),
    mappings,
    // Backstage values with neither a team lead staff account nor a mapping.
    unmatchedTeamLeads: [...countByLead.entries()]
      .filter(([k]) => !leadEmails.has(k) && !mappedEmails.has(k))
      .map(([value, count]) => ({ value, count })),
    creators: outCreators,
    // Removed-from-stats profiles — an owner tool (restore lives here).
    hidden: staff.role === "admin"
      ? hiddenRows.map(h => ({
          backstageCreatorId: h.backstageCreatorId,
          username: usernameOfHidden.get(h.backstageCreatorId) ?? "(unknown)",
          hiddenAt: h.hiddenAt,
        }))
      : [],
    // Profile ↔ account linking is an owner tool.
    creatorAccounts: staff.role === "admin"
      ? creatorAccounts.map(a => ({ ...a, linked: linkedByAccount.get(a.id) ?? null }))
      : [],
    assignments: scoped,
  });
}

// POST { managerId, teamLeadId } | { managerId, backstageCreatorId } | { backstageEmail, adminId }
export async function POST(request: NextRequest) {
  const { staff, error } = await requireEditor(request);
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
    // Non-admins may only map an email onto their own account.
    if (staff.role !== "admin" && adminId !== staff.id) {
      return NextResponse.json({ error: "You can only link an email to your own account" }, { status: 403 });
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

  // — Link / unlink a Backstage profile (one of the 162) to a site account. —
  // Owner-only: this re-points identity data, so the owner decides.
  if (body.action === "linkProfile" || body.action === "unlinkProfile") {
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Only the owner can link profiles to accounts" }, { status: 403 });
    }
    const cid = String(body.backstageCreatorId || "").trim().slice(0, 40);
    const profile = cid
      ? await prisma.creatorStat.findFirst({ where: { backstageCreatorId: cid }, orderBy: { exportedAt: "desc" }, select: { username: true, creatorAccountId: true } })
      : null;
    if (!profile) return NextResponse.json({ error: "No profile with that Creator ID" }, { status: 404 });

    if (body.action === "unlinkProfile") {
      if (!profile.creatorAccountId) {
        return NextResponse.json({ error: "That profile is not linked to an account" }, { status: 409 });
      }
      await prisma.creatorStat.updateMany({ where: { backstageCreatorId: cid }, data: { creatorAccountId: null } });
      await prisma.creatorStatAuditLog.create({
        data: { action: "profile_unlink", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Unlinked profile @${profile.username} (${cid}) from account #${profile.creatorAccountId}` },
      });
      return NextResponse.json({ ok: true, username: profile.username });
    }

    const accountId = Number(body.creatorAccountId);
    const account = Number.isInteger(accountId)
      ? await prisma.creatorAccount.findUnique({ where: { id: accountId }, select: { id: true, name: true, email: true } })
      : null;
    if (!account) return NextResponse.json({ error: "Choose the account this profile belongs to" }, { status: 400 });

    // One account, one Creator ID (same rule the upload path enforces): if the
    // account already holds a different profile, release it first.
    const prev = await prisma.creatorStat.findFirst({
      where: { creatorAccountId: accountId, backstageCreatorId: { not: cid } },
      select: { backstageCreatorId: true, username: true },
    });
    if (prev) {
      await prisma.creatorStat.updateMany({ where: { creatorAccountId: accountId, backstageCreatorId: { not: cid } }, data: { creatorAccountId: null } });
    }
    await prisma.creatorStat.updateMany({ where: { backstageCreatorId: cid }, data: { creatorAccountId: accountId } });
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "profile_link", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Linked profile @${profile.username} (${cid}) to ${account.name} (${account.email})`
          + (prev ? `; released @${prev.username} (${prev.backstageCreatorId}) from that account` : "")
          + (profile.creatorAccountId && profile.creatorAccountId !== accountId ? `; took over from account #${profile.creatorAccountId}` : ""),
      },
    });
    return NextResponse.json({ ok: true, username: profile.username, account: account.name });
  }

  // — Remove a creator from the stats pages (left the agency) / restore. —
  // Owner-only. No stats rows are deleted: a hide flag makes the profile
  // invisible on every stats view AND future imports skip it, so a re-upload
  // never brings them back. Restore deletes the flag (rows were kept intact).
  if (body.action === "hideCreator" || body.action === "unhideCreator") {
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Only the owner can remove or restore creators" }, { status: 403 });
    }
    const cid = String(body.backstageCreatorId || "").trim().slice(0, 40);
    const profile = await prisma.creatorStat.findFirst({
      where: { backstageCreatorId: cid }, orderBy: { exportedAt: "desc" }, select: { username: true },
    });
    if (!profile) return NextResponse.json({ error: "No profile with that Creator ID" }, { status: 404 });

    if (body.action === "hideCreator") {
      try {
        await prisma.creatorStatHidden.create({ data: { backstageCreatorId: cid, hiddenBy: staff.id } });
      } catch (e) {
        // P2002 = already hidden.
        if ((e as { code?: string })?.code === "P2002") {
          return NextResponse.json({ error: "That creator is already removed from stats." }, { status: 409 });
        }
        throw e;
      }
      await prisma.creatorStatAuditLog.create({
        data: { action: "stats_hide", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Removed @${profile.username} (${cid}) from all stats pages` },
      });
      return NextResponse.json({ ok: true, username: profile.username, hidden: true });
    }

    const removed = await prisma.creatorStatHidden.deleteMany({ where: { backstageCreatorId: cid } });
    if (removed.count === 0) {
      return NextResponse.json({ error: "That creator is not removed from stats" }, { status: 409 });
    }
    await prisma.creatorStatAuditLog.create({
      data: { action: "stats_unhide", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Restored @${profile.username} (${cid}) to the stats pages` },
    });
    return NextResponse.json({ ok: true, username: profile.username, hidden: false });
  }

  // — Assign managers/scouts to a team and/or several creators at once. —
  const rawAssignees: unknown[] = Array.isArray(body.assigneeIds)
    ? body.assigneeIds
    : body.managerId
      ? [body.managerId]
      : [];
  const assigneeIds: number[] = [...new Set(rawAssignees.map(n => Number(n)).filter(n => Number.isInteger(n) && n > 0))];
  const teamLeadId = body.teamLeadId ? Number(body.teamLeadId) : null;
  const creatorIds = [...new Set(
    [...(Array.isArray(body.backstageCreatorIds) ? body.backstageCreatorIds : []), ...(body.backstageCreatorId ? [body.backstageCreatorId] : [])]
      .map(s => String(s).trim().slice(0, 40))
      .filter(Boolean)
  )].slice(0, 500);
  if (!assigneeIds.length || (!teamLeadId && !creatorIds.length)) {
    return NextResponse.json({ error: "Pick a manager or scout, plus a team lead and/or one or more creators" }, { status: 400 });
  }

  // Scope for non-admins: a lead assigns only onto their own team, a manager
  // only adds themselves.
  if (staff.role === "team_lead" && teamLeadId !== staff.id) {
    return NextResponse.json({ error: "You can only assign managers and creators to your own team" }, { status: 403 });
  }
  if (staff.role === "manager" && assigneeIds.some(id => id !== staff.id)) {
    return NextResponse.json({ error: "Managers can only add themselves to a team" }, { status: 403 });
  }

  const assignees = await prisma.admin.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, email: true, role: true } });
  if (assignees.length !== assigneeIds.length || assignees.some(a => !["manager", "scout"].includes(a.role))) {
    return NextResponse.json({ error: "Every assignee must be a manager or scout account" }, { status: 400 });
  }
  let lead: { email: string; role: string } | null = null;
  if (teamLeadId) {
    lead = await prisma.admin.findUnique({ where: { id: teamLeadId }, select: { email: true, role: true } });
    // Owners (role admin) are accepted too: their account may not exist in the
    // Backstage export, but managers can still be assigned under them.
    if (!lead || !["team_lead", "admin"].includes(lead.role)) {
      return NextResponse.json({ error: "Selected account is not a team lead or owner" }, { status: 400 });
    }
  }
  if (creatorIds.length) {
    const known = await prisma.creatorStat.findMany({
      where: { backstageCreatorId: { in: creatorIds } },
      distinct: ["backstageCreatorId"],
      select: { backstageCreatorId: true },
    });
    if (known.length !== creatorIds.length) {
      return NextResponse.json({ error: "One of the selected creators is not in the data sheet" }, { status: 400 });
    }
  }

  // One row per (assignee, team) plus one row per (assignee, creator). Rows that
  // already exist count as covered, never as errors (unique pairs).
  const attempts: { managerId: number; teamLeadId: number | null; backstageCreatorId: string | null }[] = [];
  if (teamLeadId) for (const id of assigneeIds) attempts.push({ managerId: id, teamLeadId, backstageCreatorId: null });
  for (const cid of creatorIds) for (const id of assigneeIds) attempts.push({ managerId: id, teamLeadId: null, backstageCreatorId: cid });

  let createdCount = 0;
  let existingCount = 0;
  for (const t of attempts) {
    const exists = await prisma.creatorStatManagerAssignment.findFirst({ where: t });
    if (exists) { existingCount++; continue; }
    try {
      await prisma.creatorStatManagerAssignment.create({ data: t });
      createdCount++;
    } catch (e) {
      if ((e as { code?: string })?.code === "P2002") existingCount++;
      else throw e;
    }
  }
  if (createdCount) {
    const who = assignees.map(a => `${a.role === "scout" ? "scout" : "manager"} ${a.email}`).join(", ");
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "manager_assign", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Assigned ${who} → ${lead ? `team lead ${lead.email}` : ""}`
          + (lead && creatorIds.length ? " + " : "")
          + (creatorIds.length ? `${creatorIds.length} creator(s)` : "")
          + ` (${createdCount} new, ${existingCount} already covered)`,
      },
    });
  }
  return NextResponse.json({ ok: true, created: createdCount, already: existingCount });
}

// PATCH { id, backstageCreatorId } — swap the creator on an assignment row.
// PATCH { action: "setRole", adminId, role } — change someone's role (owner only).
export async function PATCH(request: NextRequest) {
  const { staff, error } = await requireEditor(request);
  if (!staff) return error;
  const body = await request.json().catch(() => ({}));

  if (body.action === "setRole") {
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });
    }
    const adminId = Number(body.adminId);
    const role = String(body.role || "");
    if (!Number.isInteger(adminId) || !["team_lead", "manager", "scout", "battle_coordinator"].includes(role)) {
      return NextResponse.json({ error: "Pick a valid role" }, { status: 400 });
    }
    if (adminId === staff.id) return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    const target = await prisma.admin.findUnique({ where: { id: adminId }, select: { email: true, role: true } });
    if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    await prisma.admin.update({ where: { id: adminId }, data: { role } });
    await prisma.creatorStatAuditLog.create({
      data: { action: "role_change", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Changed role of ${target.email} from ${target.role} to ${role}` },
    });
    return NextResponse.json({ ok: true });
  }

  const id = Number(body.id);
  const cid = String(body.backstageCreatorId || "").trim().slice(0, 40);
  if (!Number.isInteger(id) || !cid) {
    return NextResponse.json({ error: "Provide the assignment id and a Creator ID" }, { status: 400 });
  }
  const row = await prisma.creatorStatManagerAssignment.findUnique({
    where: { id },
    select: { managerId: true, teamLeadId: true, backstageCreatorId: true, manager: { select: { email: true } } },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (await writeForbidden(staff, row)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const known = await prisma.creatorStat.findFirst({ where: { backstageCreatorId: cid }, select: { username: true } });
  if (!known) return NextResponse.json({ error: "Unknown Creator ID" }, { status: 400 });
  try {
    await prisma.creatorStatManagerAssignment.update({ where: { id }, data: { backstageCreatorId: cid } });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "That manager is already assigned to this creator" }, { status: 409 });
    }
    throw e;
  }
  await prisma.creatorStatAuditLog.create({
    data: {
      action: "manager_reassign", adminId: staff.id, adminEmail: staff.email,
      details: `[${staff.role}] Changed creator on an assignment row for ${row.manager.email}: ${row.backstageCreatorId} → @${known.username} (${cid})`,
    },
  });
  return NextResponse.json({ ok: true });
}

// DELETE ?id=<assignmentId> | ?mappingId=<email mapping id>
export async function DELETE(request: NextRequest) {
  const { staff, error } = await requireEditor(request);
  if (!staff) return error;

  const mappingId = Number(request.nextUrl.searchParams.get("mappingId"));
  if (Number.isInteger(mappingId) && mappingId > 0) {
    const mapping = await prisma.creatorStatEmailMapping.findUnique({
      where: { id: mappingId },
      select: { adminId: true, backstageEmail: true, admin: { select: { name: true, email: true } } },
    });
    if (!mapping) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Non-admins may only unlink mappings that point at their own account.
    if (staff.role !== "admin" && mapping.adminId !== staff.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
        select: { managerId: true, teamLeadId: true, backstageCreatorId: true, manager: { select: { email: true } }, teamLead: { select: { email: true } } },
      })
    : null;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (await writeForbidden(staff, row)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.creatorStatManagerAssignment.delete({ where: { id } });
  await prisma.creatorStatAuditLog.create({
    data: {
      action: "manager_unassign", adminId: staff.id, adminEmail: staff.email,
      details: `[${staff.role}] Removed ${row.teamLead ? `team lead ${row.teamLead.email}` : `creator ${row.backstageCreatorId}`} from manager ${row.manager.email}`,
    },
  });
  return NextResponse.json({ ok: true });
}
