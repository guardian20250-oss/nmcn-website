// Creator Stats: parsing + config for the TikTok LIVE Backstage
// "Manage creators" export. Server-side only.
import { readFirstSheet, type Cell } from "./xlsx-reader";

// ── Config (TODO: confirm real values with NMCN leadership) ─────────────────
export const STATS_CONFIG = {
  /** Monthly goal: valid go-LIVE days (compared against the export's L30D value). */
  validDaysGoal: 8,
  /** Monthly goal: LIVE hours (compared against the export's L30D value). */
  liveHoursGoal: 20,
  /**
   * Diamond targets per tier. Only Tier 5 is confirmed (500,000).
   * TODO: add cutoffs for Tiers 1-4 once known. The current tier itself is
   * shown from the export ("Tier last month" + "Tier status").
   */
  tierTargets: { 5: 500_000 } as Record<number, number>,
  /** Max upload size for the admin import. */
  maxUploadBytes: 10 * 1024 * 1024,
};

// ── Upload period types ─────────────────────────────────────────────────────
export const PERIOD_TYPES = ["weekly", "monthly"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];
export const isPeriodType = (v: unknown): v is PeriodType => PERIOD_TYPES.includes(v as PeriodType);
/** Neutral label used on creator + staff pages. */
export const periodLabel = (v: string) => (v === "monthly" ? "Monthly" : "Weekly");

/** True when a snapshot row meets BOTH monthly goals (8 valid days AND 20 LIVE hours). */
export function meetsGoals(r: { validDaysL30D: number; liveDurationL30D: number }) {
  return r.validDaysL30D >= STATS_CONFIG.validDaysGoal && r.liveDurationL30D >= STATS_CONFIG.liveHoursGoal;
}

// ── Column mapping (header text in the export → field) ──────────────────────
export const COLUMNS = {
  backstageCreatorId: "Creator ID",
  username: "Creator's username",
  groupName: "Group",
  teamLead: "Creator Network manager", // holds the TEAM LEAD's email
  graduationStatus: "Graduation status",
  tierStatus: "Tier status",
  tierLastMonth: "Tier last month",
  relationshipStatus: "Relationship status",
  subscriptionStatus: "Subscription status",
  joinTime: "Join time",
  daysSinceJoining: "Days since joining",
  invitationType: "Invitation type",
  invitedBy: "Invited by", // ADMIN-ONLY
  promotePermission: "Promote permission",
  lastLive: "Last LIVE",
  notes: "Notes", // ADMIN-ONLY
  followers: "Followers",
  videos: "Videos",
  likes: "Likes",
  diamondsL30D: "Diamonds in L30D",
  validDaysL30D: "Valid go LIVE days in L30D",
  liveDurationL30D: "LIVE duration in L30D",
  fanClubDiamondsL30D: "Diamonds from Fan Club in L30D",
  fanClubActiveFansL30D: "Active fans from Fan Club in L30D",
  managementDates: "Management relationship dates",
  renewedManagementDates: "Renewed management relationship dates",
  achievedStarCreator: "Achieved Star Creator",
  starCreatorDaysThisMonth: "Star Creator days this month",
} as const;

type Field = keyof typeof COLUMNS;

export interface ParsedStatRow {
  backstageCreatorId: string;
  username: string;
  groupName: string | null;
  teamLead: string | null;
  graduationStatus: string | null;
  tierStatus: string | null;
  tierLastMonth: number | null;
  relationshipStatus: string | null;
  subscriptionStatus: string | null;
  joinTime: Date | null;
  daysSinceJoining: number | null;
  invitationType: string | null;
  invitedBy: string | null;
  promotePermission: string | null;
  lastLive: Date | null;
  notes: string | null;
  followers: number;
  videos: number;
  likes: bigint;
  diamondsL30D: number;
  validDaysL30D: number;
  liveDurationL30D: number;
  fanClubDiamondsL30D: number;
  fanClubActiveFansL30D: number;
  managementDates: string | null;
  renewedManagementDates: string | null;
  achievedStarCreator: boolean;
  starCreatorDaysThisMonth: number;
}

export interface ParsedExport {
  exportedAt: Date | null;
  rows: ParsedStatRow[];
  warnings: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[:\s]+$/g, "").replace(/\s+/g, " ").trim();

/** Normalizes a TikTok handle for matching: lowercase, no @, no URL prefix. */
export function normalizeHandle(h: string | null | undefined): string {
  if (!h) return "";
  return h.trim().toLowerCase().replace(/^https?:\/\/(www\.)?tiktok\.com\//, "").replace(/^@+/, "").replace(/[/?#].*$/, "").trim();
}

function str(v: Cell): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || s === "-" ? null : s;
}
function num(v: Cell): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = Number(v.replace(/,/g, "").trim()); return Number.isFinite(n) ? n : 0; }
  return 0;
}
const int = (v: Cell) => Math.round(num(v));
function intOrNull(v: Cell): number | null { return str(v) === null ? null : int(v); }
function yes(v: Cell): boolean { return v === true || (typeof v === "string" && /^(yes|true|y)$/i.test(v.trim())); }

/** Parses "2026:10:23 12:34:56 (UTC+0)" or "2026-10-23 12:34:56" into a Date. */
export function parseBackstageDate(v: Cell): Date | null {
  const s = str(v);
  if (!s) return null;
  const m = s.match(/(\d{4})[:\-/](\d{2})[:\-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\s*\(UTC([+-]\d{1,2})(?::?(\d{2}))?\))?/);
  if (!m) return null;
  const off = m[7] ? Number(m[7]) * 60 + Math.sign(Number(m[7]) || 1) * Number(m[8] || 0) : 0;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) - off * 60_000;
  return new Date(utc);
}

export function parseBackstageExport(buf: Buffer): ParsedExport {
  const grid = readFirstSheet(buf);
  const warnings: string[] = [];
  const usernameKey = norm(COLUMNS.username);
  const headerIdx = grid.slice(0, 10).findIndex(r => r.some(c => typeof c === "string" && norm(c) === usernameKey));
  if (headerIdx < 0) throw new Error("Could not find the header row (expected a \"Creator's username\" column). Is this the Backstage 'Manage creators' export?");

  let exportedAt: Date | null = null;
  for (const r of grid.slice(0, headerIdx)) for (const c of r) {
    const m = typeof c === "string" ? c.match(/Exported at\s*:?\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i) : null;
    if (m) exportedAt = parseBackstageDate(m[1]);
  }
  if (!exportedAt) warnings.push("Export timestamp not found in row 1; the upload time will be used instead.");

  const header = grid[headerIdx].map(c => (typeof c === "string" ? norm(c) : ""));
  const idx = {} as Record<Field, number>;
  for (const [field, label] of Object.entries(COLUMNS) as [Field, string][]) {
    idx[field] = header.indexOf(norm(label));
    if (idx[field] < 0) warnings.push(`Column missing: "${label}"`);
  }
  if (idx.backstageCreatorId < 0 || idx.username < 0) throw new Error("The export must include \"Creator ID\" and \"Creator's username\" columns.");

  const rows: ParsedStatRow[] = [];
  const seen = new Set<string>();
  for (const r of grid.slice(headerIdx + 1)) {
    const g = (f: Field): Cell => (idx[f] >= 0 ? r[idx[f]] ?? null : null);
    const id = str(g("backstageCreatorId"));
    const username = str(g("username"));
    if (!id || !username) continue;
    if (seen.has(id)) { warnings.push(`Duplicate Creator ID skipped (row ${rows.length + headerIdx + 2}).`); continue; }
    seen.add(id);
    let likes = BigInt(0);
    try { likes = BigInt(Math.max(0, int(g("likes")))); } catch { /* keep 0 */ }
    rows.push({
      backstageCreatorId: id,
      username: normalizeHandle(username),
      groupName: str(g("groupName")),
      teamLead: str(g("teamLead")),
      graduationStatus: str(g("graduationStatus")),
      tierStatus: str(g("tierStatus")),
      tierLastMonth: intOrNull(g("tierLastMonth")),
      relationshipStatus: str(g("relationshipStatus")),
      subscriptionStatus: str(g("subscriptionStatus")),
      joinTime: parseBackstageDate(g("joinTime")),
      daysSinceJoining: intOrNull(g("daysSinceJoining")),
      invitationType: str(g("invitationType")),
      invitedBy: str(g("invitedBy")),
      promotePermission: str(g("promotePermission")),
      lastLive: parseBackstageDate(g("lastLive")),
      notes: str(g("notes")),
      followers: int(g("followers")),
      videos: int(g("videos")),
      likes,
      diamondsL30D: int(g("diamondsL30D")),
      validDaysL30D: int(g("validDaysL30D")),
      liveDurationL30D: Math.round(num(g("liveDurationL30D")) * 100) / 100,
      fanClubDiamondsL30D: int(g("fanClubDiamondsL30D")),
      fanClubActiveFansL30D: int(g("fanClubActiveFansL30D")),
      managementDates: str(g("managementDates")),
      renewedManagementDates: str(g("renewedManagementDates")),
      achievedStarCreator: yes(g("achievedStarCreator")),
      starCreatorDaysThisMonth: int(g("starCreatorDaysThisMonth")),
    });
  }
  if (!rows.length) throw new Error("No creator rows found in the export.");
  return { exportedAt, rows, warnings };
}

/**
 * The ONLY fields a creator may see about themselves (owner's decision):
 * manager/team lead, tier status, days since joining, diamonds, valid days,
 * LIVE duration, Star Creator. Everything else (Notes, Invited by, followers,
 * fan club, etc.) is staff-only. Always use this select for creator queries.
 */
export const CREATOR_SAFE_SELECT = {
  id: true,
  teamLead: true,
  tierStatus: true,
  daysSinceJoining: true,
  diamondsL30D: true,
  validDaysL30D: true,
  liveDurationL30D: true,
  achievedStarCreator: true,
  starCreatorDaysThisMonth: true,
  exportedAt: true,
  periodType: true,
} as const;
