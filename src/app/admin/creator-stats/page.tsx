"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trophy, AlertTriangle, Users, Settings2 } from "lucide-react";
import { typeLabel, fmt, fmtDate } from "@/components/admin/creator-stats/shared";

// Staff dashboard for Creator Stats.
//   Owner/co-owner (admin): every creator, all columns.
//   Team lead / manager: only their scope (enforced server-side).
// Deliberately just the numbers: summary boxes → graphs → the creator table.
// Uploading, history/audit, teams, roster, profile linking and staff creation
// live on the backend management page (/admin/creator-stats/manage).
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
  monthStart: string; monthTotals: { diamonds: number; hours: number };
  series: {
    exports: { exportedAt: string; periodType: string; diamonds: number; hours: number; creators: number }[];
    week: { current: { exportedAt: string; diamonds: number; hours: number } | null; previous: { exportedAt: string; diamonds: number; hours: number } | null };
    month: { current: { diamonds: number; hours: number }; previous: { diamonds: number; hours: number } };
  };
  exportDates: { exportedAt: string; periodType: string; creators: number }[];
  rows: Row[];
}
type SortKey = "username" | "teamLead" | "diamondsL30D" | "validDaysL30D" | "liveDurationL30D" | "followers" | "lastLive" | "exportedAt";

export default function CreatorStatsAdminPage() {
  const router = useRouter();
  const [dash, setDash] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState<{ period: string; asOf: string }>({ period: "all", asOf: "" });
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"all" | "behind" | "ontrack">("all");
  const [leadFilter, setLeadFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "diamondsL30D", dir: -1 });
  // Optional multi-select: narrow the table to specific creators.
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [pickQuery, setPickQuery] = useState("");
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
  }, [query, router]);

  const isAll = dash?.scope === "all";
  const goals = dash?.goals;
  const behind = useCallback((r: Row) => !!goals && (r.validDaysL30D < goals.validDays || r.liveDurationL30D < goals.liveHours), [goals]);

  // The full roster, minus whatever the picker/search/filters exclude.
  // Nothing is hidden by default — the table starts with everyone.
  const rows = useMemo(() => {
    if (!dash) return [];
    const q = search.trim().toLowerCase();
    const picked = new Set(pickedIds);
    return dash.rows
      .filter(r => picked.size === 0 || picked.has(r.backstageCreatorId))
      .filter(r => !q || r.username.includes(q) || (r.teamLead || "").toLowerCase().includes(q) || (r.creatorAccount?.name || "").toLowerCase().includes(q))
      .filter(r => goalFilter === "all" || (goalFilter === "behind" ? behind(r) : !behind(r)))
      .filter(r => !leadFilter || r.teamLead === leadFilter)
      .sort((a, b) => {
        const av = a[sort.key] ?? "";
        const bv = b[sort.key] ?? "";
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
      });
  }, [dash, search, goalFilter, leadFilter, sort, pickedIds, behind]);

  const totals = useMemo(() => {
    const all = dash?.rows || [];
    return {
      creators: all.length,
      diamonds: all.reduce((s, r) => s + r.diamondsL30D, 0),
      hours: Math.round(all.reduce((s, r) => s + r.liveDurationL30D, 0)),
      // Month-to-date: every upload this calendar month, added up (server-computed).
      monthDiamonds: dash?.monthTotals.diamonds ?? 0,
      monthHours: dash?.monthTotals.hours ?? 0,
      avgDays: all.length ? Math.round((all.reduce((s, r) => s + r.validDaysL30D, 0) / all.length) * 10) / 10 : 0,
      behind: all.filter(behind).length,
      fanClub: all.reduce((s, r) => s + r.fanClubDiamondsL30D, 0),
    };
  }, [dash, behind]);

  const leads = useMemo(() => [...new Set((dash?.rows || []).map(r => r.teamLead).filter(Boolean) as string[])].sort(), [dash]);
  const top = (key: "diamondsL30D" | "liveDurationL30D" | "validDaysL30D") => [...(dash?.rows || [])].sort((a, b) => b[key] - a[key]).slice(0, 5);

  // Clickable column header.
  const th = (key: SortKey, label: string) => (
    <th
      className="cursor-pointer whitespace-nowrap px-2 py-2 text-left font-semibold text-nmcn-muted hover:text-white"
      onClick={() => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}
    >
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
  // Owners, leads and managers can all reach the backend management page.
  const canManage = isAll || dash.viewer.role === "team_lead" || dash.viewer.role === "manager";

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
            {canManage && (
              <a href="/admin/creator-stats/manage" className="btn-outline text-sm">
                <Settings2 className="mr-1 inline h-4 w-4" />
                Manage creators &amp; staff
              </a>
            )}
            <a href="/admin" className="text-sm text-nmcn-muted transition hover:text-nmcn-blue">← Dashboard</a>
          </div>
        </div>

        {dash.exportDates.length === 0 && (
          <div className="card mb-6 p-6 text-sm text-nmcn-muted">
            {isAll || dash.teamLeadEmails.length || dash.assignedCreatorCount
              ? "No stats on file yet. Upload a Backstage export from the management page."
              : dash.scope === "team_lead"
                ? "No stats on file for creators listed under your email yet. Upload your team's Backstage export from the management page."
                : "No team leads or creators are assigned to you yet. An owner can set that up on the management page."}
          </div>
        )}

        {dash.rows.length > 0 && goals && (
          <>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[
                ["Creators", fmt(totals.creators)],
                ["Diamonds — this week", fmt(totals.diamonds)],
                ["Diamonds — this month", fmt(totals.monthDiamonds)],
                ["LIVE hours — this week", fmt(totals.hours)],
                ["LIVE hours — this month", fmt(totals.monthHours)],
                ["Fan Club ◆", fmt(totals.fanClub)],
                ["Avg valid days", String(totals.avgDays)],
                [`Goal not met (${goals.validDays}d / ${goals.liveHours}h)`, fmt(totals.behind)],
              ].map(([label, value]) => (
                <div key={label} className="card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-nmcn-muted">
              Week = latest upload per creator · Month = every upload this month added together (since {fmtDate(dash.monthStart)})
            </p>

            {/* vs cards live with the summary boxes, not down with the graphs */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CompareCard
                title="This week vs last week"
                current={dash.series.week.current}
                previous={dash.series.week.previous}
              />
              <CompareCard
                title={`This month vs last month (since ${fmtDate(dash.monthStart)})`}
                current={{ exportedAt: dash.monthStart, diamonds: dash.series.month.current.diamonds, hours: dash.series.month.current.hours }}
                previous={{ exportedAt: dash.monthStart, diamonds: dash.series.month.previous.diamonds, hours: dash.series.month.previous.hours }}
              />
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

            {/* ── Graphs: per-upload totals + week/week & month/month ───────── */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="card p-4">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">◆ Diamonds per upload</h3>
                <p className="mb-2 text-[11px] text-nmcn-muted">Total across everyone in your scope, at each upload date</p>
                <BarChart points={dash.series.exports.map(e => ({ label: fmtDate(e.exportedAt), value: e.diamonds }))} />
              </div>
              <div className="card p-4">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">LIVE hours per upload</h3>
                <p className="mb-2 text-[11px] text-nmcn-muted">Total across everyone in your scope, at each upload date</p>
                <BarChart points={dash.series.exports.map(e => ({ label: fmtDate(e.exportedAt), value: e.hours }))} />
              </div>
            </div>

            {/* ── The full roster ───────────────────────────────────────────── */}
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
                <button className="btn-outline text-sm" onClick={() => setPickOpen(o => !o)}>
                  <Users className="mr-1 inline h-4 w-4" />
                  Pick creators{pickedIds.length > 0 ? ` (${pickedIds.length})` : ""}
                </button>
                <span className="text-xs text-nmcn-muted">{rows.length} of {dash.rows.length} shown</span>
              </div>

              {pickOpen && (
                <div className="mb-3 rounded-lg border border-nmcn-border p-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nmcn-muted" />
                    <input
                      className="input pl-9 text-sm"
                      placeholder="Type a username or team lead"
                      value={pickQuery}
                      onChange={e => setPickQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {dash.rows
                      .filter(r => {
                        const q = pickQuery.trim().toLowerCase();
                        return !q || r.username.includes(q) || (r.teamLead || "").toLowerCase().includes(q);
                      })
                      .map(r => {
                        const on = pickedIds.includes(r.backstageCreatorId);
                        return (
                          <label key={r.backstageCreatorId} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-nmcn-border/30">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => setPickedIds(p =>
                                on ? p.filter(id => id !== r.backstageCreatorId) : [...p, r.backstageCreatorId]
                              )}
                            />
                            <span className={on ? "text-nmcn-gold" : "text-white"}>@{r.username}</span>
                            <span className="truncate text-xs text-nmcn-muted">{r.teamLead || "—"}</span>
                          </label>
                        );
                      })}
                    {dash.rows.length === 0 && <p className="text-sm text-nmcn-muted">No creators on file.</p>}
                  </div>
                  <div className="mt-2 flex gap-3 border-t border-nmcn-border/40 pt-2 text-xs">
                    <button className="text-nmcn-blue hover:underline" onClick={() => setPickedIds(dash.rows.map(r => r.backstageCreatorId))}>
                      Select all shown ({dash.rows.length})
                    </button>
                    <button className="text-nmcn-muted hover:text-white" onClick={() => { setPickedIds([]); setPickQuery(""); }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {pickedIds.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pickedIds.map(id => {
                    const r = dash.rows.find(x => x.backstageCreatorId === id);
                    if (!r) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 rounded-full border border-nmcn-border px-2 py-1 text-xs">
                        <span className="text-nmcn-gold">@{r.username}</span>
                        <button className="text-nmcn-muted hover:text-red-400" title="Remove" onClick={() => setPickedIds(p => p.filter(x => x !== id))}>
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {rows.length === 0 ? (
                <p className="text-sm text-nmcn-muted">
                  {dash.rows.length === 0
                    ? "No stats on file yet."
                    : "No creators match those filters."}
                </p>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-nmcn-border">
                    <tr>
                      {th("username", "Creator")}
                      {th("teamLead", "Team lead")}
                      {th("exportedAt", "As of")}
                      {th("diamondsL30D", "Diamonds")}
                      {th("validDaysL30D", "Valid days")}
                      {th("liveDurationL30D", "LIVE hrs")}
                      <th className="whitespace-nowrap px-2 py-2 text-left font-semibold text-nmcn-muted" title={`Against ${goals.validDays} valid days and ${goals.liveHours} LIVE hours, as of that row's upload`}>Goals</th>
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
              )}
            </div>
          </>
        )}
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

// ── Graphs ──────────────────────────────────────────────────────────────────
// Gold bar chart for per-upload totals (no chart lib — same SVG style as the
// creator-facing trend line).
function BarChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) return <p className="text-sm text-nmcn-muted">No uploads to chart yet.</p>;
  const max = Math.max(...points.map(p => p.value), 1);
  const H = 120;
  return (
    <div className="flex items-end gap-2" style={{ height: H }}>
      {points.map((p, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${p.label}: ${fmt(p.value)}`}>
          <span className="text-[10px] text-nmcn-muted">{p.value >= 1000 ? `${Math.round(p.value / 100) / 10}k` : fmt(Math.round(p.value))}</span>
          <div className="w-full rounded-t bg-nmcn-gold/80 transition hover:bg-nmcn-gold" style={{ height: `${Math.max((p.value / max) * (H - 34), 2)}px` }} />
          <span className="w-full truncate text-center text-[9px] text-nmcn-muted">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// This-week-vs-last-week and this-month-vs-last-month comparison card.
function CompareCard({ title, current, previous }: {
  title: string;
  current: { exportedAt: string; diamonds: number; hours: number } | null;
  previous: { exportedAt: string; diamonds: number; hours: number } | null;
}) {
  const pct = (c: number, p: number) => (p > 0 ? Math.round(((c - p) / p) * 100) : null);
  const dDiamonds = current && previous ? current.diamonds - previous.diamonds : null;
  const dHours = current && previous ? Math.round((current.hours - previous.hours) * 100) / 100 : null;
  const pDiamonds = current && previous ? pct(current.diamonds, previous.diamonds) : null;
  const pHours = current && previous ? pct(current.hours, previous.hours) : null;
  const delta = (d: number | null, p: number | null, suffix: string) => {
    if (d === null) return <span className="text-xs text-nmcn-muted">— no comparison yet</span>;
    const up = d > 0, flat = d === 0;
    return (
      <span className={`text-xs ${flat ? "text-nmcn-muted" : up ? "text-emerald-400" : "text-red-400"}`}>
        {flat ? "•" : up ? "▲" : "▼"} {fmt(Math.abs(d))}{suffix}{p !== null && p !== 0 ? ` (${up ? "+" : ""}${p}%)` : ""}
      </span>
    );
  };
  return (
    <div className="card p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-nmcn-muted">Now</p>
          <p className="text-xl font-bold text-white">{fmt(current?.diamonds ?? 0)} <span className="text-xs font-normal text-nmcn-gold">◆</span></p>
          {delta(dDiamonds, pDiamonds, " ◆")}
          <p className="mt-1 text-lg font-semibold text-white">{Math.round(current?.hours ?? 0)}<span className="text-xs font-normal text-nmcn-muted"> hrs</span></p>
          {delta(dHours, pHours, "h")}
        </div>
        <div className="border-l border-nmcn-border/40 pl-4">
          <p className="text-[11px] text-nmcn-muted">Previous</p>
          <p className="text-xl font-bold text-nmcn-text">{fmt(previous?.diamonds ?? 0)} <span className="text-xs font-normal text-nmcn-muted">◆</span></p>
          <p className="mt-1 text-lg font-semibold text-nmcn-text">{Math.round(previous?.hours ?? 0)}<span className="text-xs font-normal text-nmcn-muted"> hrs</span></p>
        </div>
      </div>
    </div>
  );
}
