// Shared types + tiny formatters for the creator-stats dashboard
// (/admin/creator-stats) and its backend management page (/admin/creator-stats/manage).
// Kept in one place so the two panels and the dashboard table stay in sync.

export interface PreviewRow {
  backstageCreatorId: string; username: string; teamLead: string | null; diamondsL30D: number; validDaysL30D: number;
  conflict: string | null; linkedBy: string | null; match: { id: number; name: string; email: string | null } | null;
}
export interface Counts { total: number; toImport: number; skippedOutOfScope: number; duplicateCount: number; unmatchedCount: number; linkedCount: number; imported?: number }
export interface Preview { filename: string; exportedAt: string; periodType: string; warnings: string[]; counts: Counts; rows: PreviewRow[] }
export interface History {
  canSeeAudit: boolean; accountsWithoutHandle: number;
  snapshots: {
    id: number; exportedAt: string; periodType: string; originalFilename: string; uploaderRole: string | null; createdAt: string;
    rowCount: number; matchedCount: number; skippedOutOfScope: number; duplicateCount: number; unmatchedCount: number;
    uploadedBy: { id: number; name: string } | null;
  }[];
  audit: { id: number; action: string; adminEmail: string; details: string; createdAt: string }[];
}
export type Person = { id: number; name: string; email: string };
export interface Assignments {
  viewerRole: string;
  managers: Person[];
  scouts: Person[];
  teamLeads: (Person & { role: string; creators: number; mappedBackstageEmails: string[] })[];
  unmatchedTeamLeads: { value: string; count: number }[];
  mappings: { id: number; backstageEmail: string; adminId: number; admin: Person }[];
  creators: { backstageCreatorId: string; username: string; teamLead: string | null; accountId: number | null; leadId: number | null }[];
  hidden: { backstageCreatorId: string; username: string; hiddenAt: string }[];
  creatorAccounts: { id: number; name: string; email: string; assignedRole: string; status: string; linked: { backstageCreatorId: string; username: string } | null }[];
  assignments: { id: number; backstageCreatorId: string | null; creatorUsername: string | null; manager: Person & { role: string }; teamLead: Person | null; leadId: number | null }[];
}

export const fmt = (n: number) => n.toLocaleString("en-US");
export const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
export const typeLabel = (t: string) => (t === "monthly" ? "Monthly" : "Weekly");
