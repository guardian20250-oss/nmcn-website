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

export async function getStatsViewer(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { status: 401 as const };
  const scope = statsScopeForRole(staff.role);
  if (!scope) return { status: 403 as const };

  const access: StatsViewerScope = { teamLeadEmails: [], creatorIds: [] };
  if (scope === "team_lead") {
    access.teamLeadEmails = [emailKey(staff.email)];
  } else if (scope === "manager") {
    const rows = await prisma.creatorStatManagerAssignment.findMany({
      where: { managerId: staff.id },
      select: { backstageCreatorId: true, teamLead: { select: { email: true, role: true } } },
    });
    access.teamLeadEmails = [
      emailKey(staff.email),
      ...rows.filter(r => r.teamLead?.role === "team_lead").map(r => emailKey(r.teamLead!.email)),
    ];
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
