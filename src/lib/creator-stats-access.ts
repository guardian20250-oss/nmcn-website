// Role scoping for Creator Stats. Every stats API route MUST use these helpers
// so access is enforced server-side on each request.
//
//   admin (owner / co-owner) → all creators
//   team_lead → creators whose "Creator Network manager" column = their staff email
//   manager   → creators of the team leads assigned to them + individually
//               assigned creators (+ any rows carrying their own email)
//   anyone else → no access
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { getStaffFromRequest } from "./auth";

export type StatsScope = "all" | "team_lead" | "manager";

export function statsScopeForRole(role: string): StatsScope | null {
  if (role === "admin") return "all";
  if (role === "team_lead") return "team_lead";
  if (role === "manager") return "manager";
  return null;
}

/** Only full admins can assign managers or delete other people's uploads. Uploads are open to every stats scope (owner, manager, team lead), filtered by rowInScope. */
export function canManageCreatorStats(role: string): boolean {
  return role === "admin";
}

export const emailKey = (v: string | null | undefined) => (v || "").trim().toLowerCase();

export interface StatsViewerScope {
  teamLeadEmails: string[];
  creatorIds: string[];
}

/**
 * Backstage emails mapped onto these staff accounts (see CreatorStatEmailMapping).
 * Returns lowercased values, de-duplicated, empty when nothing is mapped.
 */
async function mappedBackstageEmails(adminIds: number[]): Promise<string[]> {
  const ids = [...new Set(adminIds.filter(Boolean))];
  if (!ids.length) return [];
  const rows = await prisma.creatorStatEmailMapping.findMany({
    where: { adminId: { in: ids } },
    select: { backstageEmail: true },
  });
  return [...new Set(rows.map(r => emailKey(r.backstageEmail)).filter(Boolean))];
}

export async function getStatsViewer(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { status: 401 as const };
  const scope = statsScopeForRole(staff.role);
  if (!scope) return { status: 403 as const };

  const access: StatsViewerScope = { teamLeadEmails: [], creatorIds: [] };
  if (scope === "team_lead") {
    // Own signup email PLUS any Backstage email mapped to this account, so a
    // lead whose Backstage email differs from their site email still gets their
    // creators. Additive: the original rule is never removed.
    access.teamLeadEmails = [...new Set([emailKey(staff.email), ...(await mappedBackstageEmails([staff.id]))])];
  } else if (scope === "manager") {
    const rows = await prisma.creatorStatManagerAssignment.findMany({
      where: { managerId: staff.id },
      select: { backstageCreatorId: true, teamLead: { select: { id: true, email: true, role: true } } },
    });
    const leadIds = rows.filter(r => ["team_lead", "admin"].includes(r.teamLead?.role || "")).map(r => r.teamLead!.id);
    // The manager's own mapped emails, plus each assigned lead's mapped emails.
    access.teamLeadEmails = [...new Set([
      emailKey(staff.email),
      ...rows.filter(r => ["team_lead", "admin"].includes(r.teamLead?.role || "")).map(r => emailKey(r.teamLead!.email)),
      ...(await mappedBackstageEmails([staff.id, ...leadIds])),
    ])];
    access.creatorIds = rows.map(r => r.backstageCreatorId).filter((x): x is string => Boolean(x));
  }
  return { status: 200 as const, staff, scope, access };
}

/**
 * Prisma where-clause restricting CreatorStat rows to what this viewer may
 * see. Non-admin viewers with nothing assigned get a clause matching nothing.
 */
export function statsRowScope(scope: StatsScope, access: StatsViewerScope) {
  if (scope === "all") return {};
  const or: object[] = [
    ...[...new Set(access.teamLeadEmails.filter(Boolean))].map(e => ({ teamLead: { equals: e, mode: "insensitive" as const } })),
    ...(access.creatorIds.length ? [{ backstageCreatorId: { in: access.creatorIds } }] : []),
  ];
  return or.length ? { OR: or } : { id: -1 };
}

/** Same rule as statsRowScope, for rows parsed from an upload (not yet stored). */
export function rowInScope(scope: StatsScope, access: StatsViewerScope, row: { teamLead: string | null; backstageCreatorId: string }) {
  if (scope === "all") return true;
  const lead = emailKey(row.teamLead);
  return (Boolean(lead) && access.teamLeadEmails.includes(lead)) || access.creatorIds.includes(row.backstageCreatorId);
}
