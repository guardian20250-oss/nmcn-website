"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Search, Trophy, AlertTriangle, Users, Trash2, Link2, History as HistoryIcon } from "lucide-react";

// Staff dashboard for Creator Stats.
//   Owner/co-owner (admin): every creator, all columns, uploads, assignments, audit.
//   Team lead / manager: only their scope (enforced server-side), own uploads.
// Each row is the creator's latest stat row; "As of" is per row because
// partial uploads can have different export dates.

interface Row {
  id: number; backstageCreatorId: string; username: string; teamLead: string | null; groupName: string | null;
  exportedAt: string; periodType: string;
  graduationStatus: string | null; tierStatus: string | null; tierLastMonth: number | null; relationshipStatus: string | null;
  subscriptionStatus: string | null; joinTime: string | null; daysSinceJoining: number | null; invitationType: string | null;
  invitedBy: string | null; promotePermission: string | null; lastLive: string | null; notes: string | null;
  followers: number; videos: number; likes: number; diamondsL30D: number; validDaysL30D: number; liveDurationL30D: number;
  fanClubDiamondsL30D: number; fanClubActiveFansL30D: number; managementDates: string | null; renewedManagementDates: string | null;
  achievedStarCreator: boolean; starCreatorDaysThisMonth: number; prevDiamondsL30D: number | null;
  creatorAccount?: { id: number; name: string; email: string } | null;
}
interface Dash {
  scope: "all" | "team_lead" | "manager"; viewer: { name: string; role: string };
  teamLeadEmails: string[]; assignedCreatorCount: number;
  goals: { validDays: number; liveHours: number; tier5: number };
  period: "all" | "weekly" | "monthly"; asOf: string | null;
  exportDates: { exportedAt: string; periodType: string; creators: number }[];
  rows: Row[];
}
interface PreviewRow {
  backstageCreatorId: string; username: string; teamLead: string | null; diamondsL30D: number; validDaysL30D: number;
  conflict: string | null; linkedBy: string | null; match: { id: number; name: string; email: string | null } | null;
}
interface Counts { total: number; toImport: number; skippedOutOfScope: number; duplicateCount: number; unmatchedCount: number; linkedCount: number; imported?: number }
interface Preview { filename: string; exportedAt: string; periodType: string; warnings: string[]; counts: Counts; rows: PreviewRow[] }
interface History {
  canSeeAudit: boolean; accountsWithoutHandle: number;
  snapshots: {
    id: number; exportedAt: string; periodType: string; originalFilename: string; uploaderRole: string | null; createdAt: string;
    rowCount: number; matchedCount: number; skippedOutOfScope: number; duplicateCount: number; unmatchedCount: number;
    uploadedBy: { id: number; name: string } | null;
  }[];
  audit: { id: number; action: string; adminEmail: string; details: string; createdAt: string }[];
}
type Person = { id: number; name: string; email: string };
interface Assignments {
  managers: Person[];
  teamLeads: (Person & { creators: number; mappedBackstageEmails: string[] })[];
  unmatchedTeamLeads: { value: string; count: number }[];
  mappings: { id: number; backstageEmail: string; adminId: number; admin: Person }[];
  creators: { backstageCreatorId: string; username: string }[];
  assignments: { id: number; backstageCreatorId: string | null; creatorUsername: string | null; manager: Person; teamLead: Person | null }[];
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
const typeLabel = (t: string) => (t === "monthly" ? "Monthly" : "Weekly");
type SortKey = "username" | "teamLead" | "diamondsL30D" | "validDaysL30D" | "liveDurationL30D" | "followers" | "lastLive" | "exportedAt";

export default function CreatorStatsAdminPage() {
  const router = useRouter();
  const [dash, setDash] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState<{ period: string; asOf: string }>({ period: "all", asOf: "" });
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"all" | "behind" | "ontrack">("all");
  const [leadFilter, setLeadFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "diamondsL30D", dir: -1 });
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams();
    if (query.period !== "all") qs.set("period", query.period);
    if (query.asOf) qs.set("asOf", query.asOf);
    fetch(`/api/admin/creator-stats/dashboard?${qs}`)
      .then(async res => {
        if (res.status === 401) { router.push("/admin/login"); return; }
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) setErr(data.error || "Failed to load");
        else { setDash(data); setErr(""); }
      })
      .catch(() => alive && setErr("Network error"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query, version, router]);
  const reload = useCallback(() => setVersion(v => v + 1), []);

  const isAll = dash?.scope === "all";
  const goals = dash?.goals;
  const behind = useCallback((r: Row) => !!goals && (r.validDaysL30D < goals.validDays || r.liveDurationL30D < goals.liveHours), [goals]);

  const rows = useMemo(() => {
    if (!dash) return [];
    const q = search.trim().toLowerCase();
    return dash.rows
      .filter(r => !q || r.username.includes(q) || (r.teamLead || "").toLowerCase().includes(q) || (r.creatorAccount?.name || "").toLowerCase().includes(q))
      .filter(r => goalFilter === "all" || (goalFilter === "behind" ? behind(r) : !behind(r)))
      .filter(r => !leadFilter || r.teamLead === leadFilter)
      .sort((a, b) => {
        const av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
  }, [dash, search, goalFilter, leadFilter, sort, behind]);

  const totals = useMemo(() => {
    const all = dash?.rows || [];
    return {
      creators: all.length,
      diamonds: all.reduce((s, r) => s + r.diamondsL30D, 0),
      hours: Math.round(all.reduce((s, r) => s + r.liveDurationL30D, 0)),
      avgDays: all.length ? Math.round((all.reduce((s, r) => s + r.validDaysL30D, 0) / all.length) * 10) / 10 : 0,
      behind: all.filter(behind).length,
      fanClub: all.reduce((s, r) => s + r.fanClubDiamondsL30D, 0),
    };
  }, [dash, behind]);

  const leads = useMemo(() => [...new Set((dash?.rows || []).map(r => r.teamLead).filter(Boolean) as string[])].sort(), [dash]);
  const top = (key: "diamondsL30D" | "liveDurationL30D" | "validDaysL30D") => [...(dash?.rows || [])].sort((a, b) => b[key] - a[key]).slice(0, 5);

  const th = (key: SortKey, label: string) => (
    <th className="cursor-pointer whitespace-nowrap px-2 py-2 text-left font-semibold text-nmcn-muted hover:text-white"
      onClick={() => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}>
      {label}{sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
    </th>
  );

  if (loading && !dash) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" /></div>;
  }
  if (err && !dash) {
    return (
      <div className="min-h-screen px-6 pt-28">
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-white">{err === "Forbidden" ? "Creator stats are available to owners, managers and team leads." : err}</p>
          <a href="/admin" className="btn-outline mt-4 inline-block text-sm">← Back to Dashboard</a>
        </div>
      </div>
    );
  }
  if (!dash) return null;
  const asOfDates = [...new Map(dash.exportDates.map(e => [e.exportedAt, e])).values()];

  return (
    <div className="min-h-screen px-6 pb-16 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">{isAll ? "Creator Stats" : "My Team's Stats"}</h1>
            <p className="text-sm font-semibold text-nmcn-gold">
              {dash.asOf ? `Stats as of ${fmtDate(dash.asOf)}` : "Latest stats per creator · see “As of” on each row"}
            </p>
            <p className="text-xs text-nmcn-muted">
              {isAll && "All creators"}
              {dash.scope === "team_lead" && "Creators listed under your email in Backstage"}
              {dash.scope === "manager" && `${dash.teamLeadEmails.length} team lead(s) · ${dash.assignedCreatorCount} individually assigned creator(s)`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="input w-auto text-sm" value={query.period} onChange={e => setQuery({ period: e.target.value, asOf: "" })}>
              <option value="all">Weekly + Monthly</option>
              <option value="weekly">Weekly only</option>
              <option value="monthly">Monthly only</option>
            </select>
            <select className="input w-auto text-sm" value={query.asOf} onChange={e => setQuery(q => ({ ...q, asOf: e.target.value }))}>
              <option value="">Latest per creator</option>
              {asOfDates.map(e => <option key={e.exportedAt} value={e.exportedAt}>{fmtDate(e.exportedAt)} · {typeLabel(e.periodType)}</option>)}
            </select>
            <a href="/admin" className="text-sm text-nmcn-muted transition hover:text-nmcn-blue">← Dashboard</a>
          </div>
        </div>

        {dash.exportDates.length === 0 && (
          <div className="card mb-6 p-6 text-sm text-nmcn-muted">
            {isAll || dash.teamLeadEmails.length || dash.assignedCreatorCount
              ? "No stats on file yet. Upload a Backstage export below."
              : dash.scope === "team_lead"
                ? "No stats on file for creators listed under your email yet. Upload your team's Backstage export below."
                : "No team leads or creators are assigned to you yet. An owner can assign them on this page."}
          </div>
        )}

        {dash.rows.length > 0 && goals && (
          <>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Creators", fmt(totals.creators)],
                ["Diamonds (L30D)", fmt(totals.diamonds)],
                ["Fan Club ◆", fmt(totals.fanClub)],
                ["LIVE hours", fmt(totals.hours)],
                ["Avg valid days", String(totals.avgDays)],
                [`Goal not met (${goals.validDays}d / ${goals.liveHours}h)`, fmt(totals.behind)],
              ].map(([label, value]) => (
                <div key={label} className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {([["diamondsL30D", "Top diamonds", (r: Row) => `${fmt(r.diamondsL30D)} ◆`], ["liveDurationL30D", "Most LIVE hours", (r: Row) => `${r.liveDurationL30D}h`], ["validDaysL30D", "Most valid days", (r: Row) => `${r.validDaysL30D}d`]] as const).map(([key, label, show]) => (
                <div key={key} className="card p-4">
                  <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted"><Trophy className="h-3 w-3 text-nmcn-gold" /> {label}</h3>
                  <ol className="space-y-1 text-sm">
                    {top(key).map((r, i) => (
                      <li key={r.id} className="flex justify-between gap-2">
                        <span className="truncate text-white">{i + 1}. @{r.username}</span><span className="text-nmcn-gold">{show(r)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <div className="card p-4">
                <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted"><AlertTriangle className="h-3 w-3 text-amber-400" /> Goal not met · as of each row&apos;s upload</h3>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                  {dash.rows.filter(behind).sort((a, b) => a.validDaysL30D - b.validDaysL30D).map(r => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span className="truncate text-white">@{r.username}</span>
                      <span className="whitespace-nowrap text-amber-300">{r.validDaysL30D}/{goals.validDays}d · {r.liveDurationL30D}/{goals.liveHours}h</span>
                    </li>
                  ))}
                  {totals.behind === 0 && <li className="text-emerald-400">Everyone met both goals 🔥</li>}
                </ul>
              </div>
            </div>

            <div className="card mt-4 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nmcn-muted" />
                  <input className="input pl-9 text-sm" placeholder="Search username, team lead or account" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input w-auto text-sm" value={goalFilter} onChange={e => setGoalFilter(e.target.value as typeof goalFilter)}>
                  <option value="all">All creators</option>
                  <option value="behind">Goal not met</option>
                  <option value="ontrack">Goal met</option>
                </select>
                {leads.length > 1 && (
                  <select className="input w-auto text-sm" value={leadFilter} onChange={e => setLeadFilter(e.target.value)}>
                    <option value="">All team leads</option>
                    {leads.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                <span className="text-xs text-nmcn-muted">{rows.length} shown</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-nmcn-border">
                    <tr>
                      {th("username", "Creator")}{th("teamLead", "Team lead")}{th("exportedAt", "As of")}{th("diamondsL30D", "Diamonds")}
                      {th("validDaysL30D", "Valid days")}{th("liveDurationL30D", "LIVE hrs")}
                      <th className="whitespace-nowrap px-2 py-2 text-left font-semibold text-nmcn-muted" title="Against 8 valid days and 20 LIVE hours, as of that row's upload">Goals</th>
                      {th("followers", "Followers")}
                      <th className="px-2 py-2 text-left font-semibold text-nmcn-muted">Tier</th>
                      <th className="px-2 py-2 text-left font-semibold text-nmcn-muted">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const d = r.prevDiamondsL30D === null ? null : r.diamondsL30D - r.prevDiamondsL30D;
                      return (
                        <DetailRow key={r.id} open={expanded === r.id} onToggle={() => setExpanded(expanded === r.id ? null : r.id)} r={r} isAll={isAll}>
                          <td className="px-2 py-2 font-semibold text-white">@{r.username}{isAll && !r.creatorAccount && <span className="ml-1 text-[10px] text-nmcn-muted">(no account)</span>}</td>
                          <td className="px-2 py-2 text-nmcn-text">{r.teamLead || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-nmcn-text">{fmtDate(r.exportedAt)} <span className="text-[10px] text-nmcn-muted">{typeLabel(r.periodType)}</span></td>
                          <td className="px-2 py-2 text-white">{fmt(r.diamondsL30D)}{d !== null && d !== 0 && <span className={`ml-1 text-xs ${d > 0 ? "text-emerald-400" : "text-red-400"}`}>{d > 0 ? "▲" : "▼"}{fmt(Math.abs(d))}</span>}</td>
                          <td className={`px-2 py-2 ${r.validDaysL30D < goals.validDays ? "text-amber-300" : "text-emerald-400"}`}>{r.validDaysL30D}</td>
                          <td className={`px-2 py-2 ${r.liveDurationL30D < goals.liveHours ? "text-amber-300" : "text-emerald-400"}`}>{r.liveDurationL30D}</td>
                          <td className="px-2 py-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${behind(r) ? "border-amber-500/50 text-amber-300" : "border-emerald-500/50 text-emerald-300"}`}>{behind(r) ? "Not met" : "Met"}</span>
                          </td>
                          <td className="px-2 py-2 text-nmcn-text">{fmt(r.followers)}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-nmcn-text">{r.tierLastMonth ?? "—"} · {r.tierStatus || "—"}</td>
                          <td className="max-w-[220px] truncate px-2 py-2 text-nmcn-muted" title={r.notes || ""}>{r.notes || "—"}</td>
                        </DetailRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <UploadPanel isOwner={isAll} onImported={reload} />
        {isAll && <AssignmentsPanel />}
      </div>
    </div>
  );
}

function DetailRow({ r, isAll, open, onToggle, children }: { r: Row; isAll: boolean; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const detail: [string, string][] = [
    ["Creator ID", r.backstageCreatorId], ["Group", r.groupName || "—"], ["Graduation", r.graduationStatus || "—"],
    ["Relationship", r.relationshipStatus || "—"], ["Subscription", r.subscriptionStatus || "—"], ["Joined", fmtDate(r.joinTime)],
    ["Days since joining", String(r.daysSinceJoining ?? "—")], ["Last LIVE", fmtDate(r.lastLive)], ["Invitation type", r.invitationType || "—"],
    ["Invited by", r.invitedBy || "—"], ["Promote permission", r.promotePermission || "—"], ["Videos", fmt(r.videos)], ["Likes", fmt(r.likes)],
    ["Fan Club ◆ (L30D)", fmt(r.fanClubDiamondsL30D)], ["Active fans (L30D)", fmt(r.fanClubActiveFansL30D)],
    ["Star Creator", r.achievedStarCreator ? "Yes" : "No"], ["Star days this month", String(r.starCreatorDaysThisMonth)],
    ["Management dates", r.managementDates || "—"], ["Renewed dates", r.renewedManagementDates || "—"],
  ];
  if (isAll) detail.push(["Linked account", r.creatorAccount ? `${r.creatorAccount.name} (${r.creatorAccount.email})` : "Not linked"]);
  return (
    <>
      <tr className="cursor-pointer border-b border-nmcn-border/40 hover:bg-nmcn-blue/5" onClick={onToggle}>{children}</tr>
      {open && (
        <tr className="border-b border-nmcn-border/40 bg-nmcn-deep/60">
          <td colSpan={10} className="px-3 py-3">
            <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {detail.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span className="text-nmcn-muted">{k}</span><span className="text-right text-white">{v}</span></div>)}
            </div>
            {r.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-nmcn-text"><span className="text-nmcn-muted">Notes: </span>{r.notes}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Upload (owner, manager, team lead) + upload history ─────────────────────
function UploadPanel({ isOwner, onImported }: { isOwner: boolean; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [periodType, setPeriodType] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [unlink, setUnlink] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/creator-stats").then(r => (r.ok ? r.json() : null)).then(d => alive && d && setHistory(d)).catch(() => {});
    return () => { alive = false; };
  }, [version]);

  const send = async (action: "preview" | "import") => {
    if (!file || !periodType) return;
    setBusy(true); setMsg("");
    const fd = new FormData();
    fd.append("file", file); fd.append("action", action); fd.append("periodType", periodType); fd.append("unlink", JSON.stringify([...unlink]));
    try {
      const res = await fetch("/api/admin/creator-stats", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Upload failed"); return; }
      if (action === "preview") { setPreview(data); setUnlink(new Set()); }
      else {
        const c: Counts = data.counts;
        setMsg(`Imported ${c.imported ?? c.toImport} creators · ${c.skippedOutOfScope} skipped (out of scope) · ${c.duplicateCount} already on file · ${c.unmatchedCount} not linked to an account.`);
        setPreview(null); setFile(null); onImported(); setVersion(v => v + 1);
      }
    } catch { setMsg("Network error"); } finally { setBusy(false); }
  };

  const removeSnapshot = async (id: number) => {
    if (!confirm("Delete this upload and the rows it added? Creators fall back to their previous stats.")) return;
    const res = await fetch(`/api/admin/creator-stats?id=${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Delete failed"); return; }
    onImported(); setVersion(v => v + 1);
  };

  const c = preview?.counts;
  return (
    <div className="mt-10 space-y-6">
      <section className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-semibold text-white"><Upload className="h-5 w-5 text-nmcn-gold" /> Upload Backstage export</h2>
        <p className="mb-4 text-sm text-nmcn-muted">
          LIVE Backstage → Manage creators → Export (.xlsx). {isOwner ? "Owner uploads import every creator in the file." : "Only creators in your team are imported; anything else in the file is skipped and never saved."}{" "}
          Creators not in the file keep their existing stats. The file itself is never stored.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select className="input w-auto text-sm" value={periodType} onChange={e => { setPeriodType(e.target.value); setPreview(null); }}>
            <option value="">Upload type…</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">End of Month</option>
          </select>
          <input type="file" accept=".xlsx" className="text-sm text-nmcn-text" onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setMsg(""); }} />
          <button className="btn-outline text-sm disabled:opacity-50" disabled={!file || !periodType || busy} onClick={() => send("preview")}>
            {busy && !preview ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Preview"}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-nmcn-gold">{msg}</p>}

        {preview && c && (
          <div className="mt-5">
            <div className="mb-3 grid gap-3 sm:grid-cols-4">
              {[["To import", c.toImport, "text-emerald-400"], ["Skipped · out of scope", c.skippedOutOfScope, "text-nmcn-muted"], ["Already on file", c.duplicateCount, "text-nmcn-muted"], ["Not linked to an account", c.unmatchedCount, "text-amber-300"]].map(([l, v, cls]) => (
                <div key={String(l)} className="rounded-lg border border-nmcn-border p-3">
                  <p className="text-xs text-nmcn-muted">{l}</p><p className={`text-xl font-bold ${cls}`}>{fmt(Number(v))}</p>
                </div>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-nmcn-text">{typeLabel(preview.periodType)} · exported {new Date(preview.exportedAt).toLocaleString()} · {preview.rows.filter(r => r.conflict).length} conflicts</p>
              <button className="btn-gold text-sm disabled:opacity-50" disabled={busy || c.toImport === 0} onClick={() => send("import")}>
                {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `Confirm import (${c.toImport})`}
              </button>
            </div>
            {preview.warnings.map(w => <p key={w} className="text-xs text-amber-300">⚠ {w}</p>)}
            {preview.rows.length > 0 && (
              <div className="max-h-96 overflow-auto rounded-lg border border-nmcn-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-nmcn-panel text-nmcn-muted">
                    <tr><th className="p-2 text-left">Link</th><th className="p-2 text-left">Username</th><th className="p-2 text-left">Team lead</th><th className="p-2 text-left">Diamonds</th><th className="p-2 text-left">Days</th><th className="p-2 text-left">Account match</th></tr>
                  </thead>
                  <tbody>
                    {[...preview.rows].sort((a, b) => Number(!!b.conflict) - Number(!!a.conflict) || Number(!a.match) - Number(!b.match)).map(r => (
                      <tr key={r.backstageCreatorId} className={`border-t border-nmcn-border/40 ${r.conflict ? "bg-red-500/10" : !r.match ? "bg-amber-500/5" : ""}`}>
                        <td className="p-2">
                          {r.match && (
                            <input type="checkbox" checked={!unlink.has(r.backstageCreatorId)}
                              onChange={e => setUnlink(s => { const n = new Set(s); if (e.target.checked) n.delete(r.backstageCreatorId); else n.add(r.backstageCreatorId); return n; })} />
                          )}
                        </td>
                        <td className="p-2 text-white">@{r.username}</td>
                        <td className="p-2 text-nmcn-text">{r.teamLead || "—"}</td>
                        <td className="p-2 text-nmcn-text">{fmt(r.diamondsL30D)}</td>
                        <td className="p-2 text-nmcn-text">{r.validDaysL30D}</td>
                        <td className="p-2">
                          {r.match ? <span className="text-emerald-400"><Link2 className="inline h-3 w-3" /> {r.match.name}{r.match.email && ` · ${r.match.email}`}{r.linkedBy === "creatorId" && " (previous link)"}</span>
                            : <span className="text-amber-300">No account with this TikTok handle</span>}
                          {r.conflict && <p className="text-red-400">{r.conflict}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white"><HistoryIcon className="h-5 w-5 text-nmcn-gold" /> {history?.canSeeAudit ? "Upload history & audit log" : "My uploads"}</h2>
        {history && (
          <div className={`grid gap-6 ${history.canSeeAudit ? "lg:grid-cols-2" : ""}`}>
            <div>
              {history.accountsWithoutHandle > 0 && <p className="mb-2 text-xs text-amber-300">{history.accountsWithoutHandle} active accounts have no TikTok handle saved, so they can&apos;t be matched.</p>}
              <ul className="divide-y divide-nmcn-border/40 text-sm">
                {history.snapshots.map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="text-white">{fmtDate(s.exportedAt)} · {typeLabel(s.periodType)} <span className="text-xs text-nmcn-muted">{s.originalFilename}</span></p>
                      <p className="text-xs text-nmcn-muted">
                        {s.rowCount} imported · {s.skippedOutOfScope} out of scope · {s.duplicateCount} already on file · {s.unmatchedCount} unlinked · by {s.uploadedBy?.name || "—"}{s.uploaderRole ? ` (${s.uploaderRole.replace("_", " ")})` : ""}
                      </p>
                    </div>
                    <button className="text-nmcn-muted hover:text-red-400" onClick={() => removeSnapshot(s.id)} aria-label="Delete upload"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
                {history.snapshots.length === 0 && <li className="py-2 text-nmcn-muted">No uploads yet.</li>}
              </ul>
            </div>
            {history.canSeeAudit && (
              <ul className="max-h-72 space-y-2 overflow-y-auto text-xs">
                {history.audit.map(a => (
                  <li key={a.id} className="rounded-lg border border-nmcn-border/40 p-2">
                    <p className="text-nmcn-text"><b className="uppercase text-nmcn-gold">{a.action}</b> · {a.adminEmail} · {new Date(a.createdAt).toLocaleString()}</p>
                    <p className="text-nmcn-muted">{a.details}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Owner-only: manager ↔ team lead / creator assignments ───────────────────
function AssignmentsPanel() {
  const [asg, setAsg] = useState<Assignments | null>(null);
  const [assign, setAssign] = useState({ managerId: "", teamLeadId: "", backstageCreatorId: "" });
  const [version, setVersion] = useState(0);
  // backstageEmail -> chosen staff id, for the "unmatched" list
  const [mapChoice, setMapChoice] = useState<Record<string, string>>({});
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", role: "team_lead" });
  const [staffMsg, setStaffMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/creator-stats/assignments").then(r => (r.ok ? r.json() : null)).then(d => alive && d && setAsg(d)).catch(() => {});
    return () => { alive = false; };
  }, [version]);
  const reload = () => setVersion(v => v + 1);

  const save = async (kind: "lead" | "creator") => {
    if (!assign.managerId || (kind === "lead" ? !assign.teamLeadId : !assign.backstageCreatorId)) return;
    const body = kind === "lead"
      ? { managerId: assign.managerId, teamLeadId: assign.teamLeadId }
      : { managerId: assign.managerId, backstageCreatorId: assign.backstageCreatorId };
    const res = await fetch("/api/admin/creator-stats/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Failed"); return; }
    setAssign(a => ({ ...a, teamLeadId: "", backstageCreatorId: "" })); setVersion(v => v + 1);
  };
  const remove = async (id: number) => { await fetch(`/api/admin/creator-stats/assignments?id=${id}`, { method: "DELETE" }); setVersion(v => v + 1); };

  // Link a Backstage "Creator Network manager" email to a real staff account.
  // Fixes the case where Backstage holds a different address than the one the
  // person signed up with, so their creators never matched them.
  const linkEmail = async (backstageEmail: string) => {
    const adminId = Number(mapChoice[backstageEmail]);
    if (!adminId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/creator-stats/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backstageEmail, adminId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Could not link that email"); return; }
      setMapChoice(c => { const n = { ...c }; delete n[backstageEmail]; return n; });
      reload();
    } finally { setBusy(false); }
  };

  const unlinkEmail = async (id: number) => {
    await fetch(`/api/admin/creator-stats/assignments?mappingId=${id}`, { method: "DELETE" });
    reload();
  };

  // Shortcut so an owner never has to leave this page to add a team lead or
  // manager. Uses the same /api/admin/staff/accounts flow as Staff → Accounts.
  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password) return;
    setBusy(true); setStaffMsg("");
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createStaff", ...staffForm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStaffMsg(data.error || "Could not create that account"); return; }
      setStaffMsg(`Created ${staffForm.name.trim()} — they can sign in with ${staffForm.email.trim()}.`);
      setStaffForm({ name: "", email: "", password: "", role: "team_lead" });
      reload();
    } catch { setStaffMsg("Network error"); } finally { setBusy(false); }
  };

  return (
    <section className="card mt-6 p-6">
      <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-semibold text-white"><Users className="h-5 w-5 text-nmcn-gold" /> Teams &amp; manager assignments</h2>
      <p className="mb-4 text-sm text-nmcn-muted">
        Team leads see creators whose Backstage &quot;Creator Network manager&quot; is their staff email (automatic).
        Managers aren&apos;t in the export, so assign each manager their team leads and/or specific creators here.
      </p>
      {asg && (
        <>
          <div className="mb-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-nmcn-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Team leads · creators on file</p>
              <ul className="space-y-1">
                {asg.teamLeads.map(t => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="text-white">
                      {t.name} <span className="text-nmcn-muted">{t.email}</span>
                      {t.mappedBackstageEmails.length > 0 && (
                        <span className="block text-[11px] text-nmcn-blue">
                          Backstage: {t.mappedBackstageEmails.join(", ")}
                        </span>
                      )}
                    </span>
                    <span className="text-nmcn-gold">{t.creators}</span>
                  </li>
                ))}
                {asg.teamLeads.length === 0 && <li className="text-nmcn-muted">No team lead staff accounts yet.</li>}
              </ul>

              {/* Backstage emails matching no staff account: map one onto a real person. */}
              {asg.unmatchedTeamLeads.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-400/30 p-3">
                  <p className="mb-2 text-xs font-semibold text-amber-300">
                    In Backstage data but no team lead account with that email
                  </p>
                  <ul className="space-y-2">
                    {asg.unmatchedTeamLeads.map(u => (
                      <li key={u.value} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-nmcn-text">{u.value} ({u.count})</span>
                        <select
                          className="input min-w-[160px] flex-1 text-xs"
                          value={mapChoice[u.value] || ""}
                          onChange={e => setMapChoice(c => ({ ...c, [u.value]: e.target.value }))}
                        >
                          <option value="">Assign to…</option>
                          {[...asg.teamLeads, ...asg.managers].map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                          ))}
                        </select>
                        <button
                          className="btn-gold whitespace-nowrap px-2 py-1 text-xs disabled:opacity-50"
                          disabled={busy || !mapChoice[u.value]}
                          onClick={() => linkEmail(u.value)}
                        >
                          Link
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {asg.mappings.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Linked Backstage emails</p>
                  <ul className="divide-y divide-nmcn-border/40 text-xs">
                    {asg.mappings.map(m => (
                      <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-nmcn-text">
                          {m.backstageEmail} → <span className="text-white">{m.admin.name}</span>
                        </span>
                        <button
                          className="text-nmcn-muted hover:text-red-400"
                          onClick={() => unlinkEmail(m.id)}
                          aria-label={`Unlink ${m.backstageEmail}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2 rounded-lg border border-nmcn-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Assign to a manager</p>
              <select className="input text-sm" value={assign.managerId} onChange={e => setAssign({ ...assign, managerId: e.target.value })}>
                <option value="">Manager…</option>
                {asg.managers.map(m => <option key={m.id} value={m.id}>{m.name} · {m.email}</option>)}
              </select>
              <div className="flex gap-2">
                <select className="input text-sm" value={assign.teamLeadId} onChange={e => setAssign({ ...assign, teamLeadId: e.target.value })}>
                  <option value="">Team lead…</option>
                  {asg.teamLeads.map(t => <option key={t.id} value={t.id}>{t.name} ({t.creators})</option>)}
                </select>
                <button className="btn-gold whitespace-nowrap text-sm" onClick={() => save("lead")}>Add lead</button>
              </div>
              <div className="flex gap-2">
                <select className="input text-sm" value={assign.backstageCreatorId} onChange={e => setAssign({ ...assign, backstageCreatorId: e.target.value })}>
                  <option value="">Specific creator…</option>
                  {asg.creators.map(c => <option key={c.backstageCreatorId} value={c.backstageCreatorId}>@{c.username}</option>)}
                </select>
                <button className="btn-outline whitespace-nowrap text-sm" onClick={() => save("creator")}>Add creator</button>
              </div>
              {asg.managers.length === 0 && <p className="text-xs text-nmcn-muted">No manager staff accounts yet. Create them under Staff.</p>}
            </div>
          </div>
          <ul className="divide-y divide-nmcn-border/40 text-sm">
            {asg.assignments.map(a => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span className="text-white">
                  {a.manager.name} <span className="text-nmcn-muted">→ {a.teamLead ? `Team lead ${a.teamLead.name}` : `Creator @${a.creatorUsername || a.backstageCreatorId}`}</span>
                </span>
                <button className="text-nmcn-muted hover:text-red-400" onClick={() => remove(a.id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {asg.assignments.length === 0 && <li className="py-2 text-nmcn-muted">No manager assignments yet.</li>}
          </ul>

          {/* Shortcut: add a team lead or manager without leaving this page.
              Uses the same /api/admin/staff/accounts "createStaff" flow as Staff → Accounts. */}
          <form onSubmit={createStaff} className="mt-6 rounded-lg border border-nmcn-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              Add a team lead or manager
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-nmcn-muted">
                Name
                <input
                  className="input mt-1 block text-sm"
                  value={staffForm.name}
                  onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Email
                <input
                  type="email"
                  className="input mt-1 block text-sm"
                  value={staffForm.email}
                  onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="their@email.com"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Password
                <input
                  type="text"
                  className="input mt-1 block text-sm"
                  value={staffForm.password}
                  onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="They can change it later"
                  required
                />
              </label>
              <label className="text-xs text-nmcn-muted">
                Role
                <select
                  className="input mt-1 block text-sm"
                  value={staffForm.role}
                  onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="team_lead">Team Lead</option>
                  <option value="manager">Manager</option>
                </select>
              </label>
              <button type="submit" className="btn-gold text-sm disabled:opacity-50" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </div>
            {staffMsg && <p className="mt-3 text-sm text-nmcn-gold">{staffMsg}</p>}
            <p className="mt-2 text-xs text-nmcn-muted">
              Same accounts as Staff → Accounts. If their Backstage email differs from this one, link it above.
            </p>
          </form>
        </>
      )}
    </section>
  );
}
