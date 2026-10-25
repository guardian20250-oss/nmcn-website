"use client";

// Creator Stats quick search on the main admin dashboard — the page Lester
// lives on. Type a name (Backstage username, team lead, or linked account
// name/email) → results from the latest upload → open one to see its stats
// and edit the linked profile without leaving the dashboard.
//
// Scope is enforced server-side (owner → all, lead → own team, manager → own
// slice). Profile editing and profile↔account linking are owner-only, same
// rules as the Creator Stats page.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Pencil, XCircle, Link2, ExternalLink } from "lucide-react";

interface Acct {
  id: number;
  name: string;
  email: string;
  status: string;
  assignedRole: string;
  tiktokHandle: string | null;
}

interface Row {
  backstageCreatorId: string;
  username: string;
  teamLead: string | null;
  exportedAt: string;
  periodType: string;
  followers: number;
  likes: number;
  diamondsL30D: number;
  validDaysL30D: number;
  liveDurationL30D: number;
  fanClubDiamondsL30D: number;
  lastLive: string | null;
  graduationStatus: string | null;
  tierStatus: string | null;
  creatorAccount: Acct | null;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const STAT_ROLES = ["admin", "team_lead", "manager"] as const;

export default function CreatorStatsSearch({ role }: { role: string }) {
  const canView = (STAT_ROLES as readonly string[]).includes(role);
  const isOwner = role === "admin";

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Row[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0); // bump to re-run the current query after edits
  const firstRender = useRef(true);

  // Debounced live search (Enter also works via the form submit).
  useEffect(() => {
    if (!canView) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const term = q.trim();
    if (!term) {
      setResults(null);
      setOpenId(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/creator-stats/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) {
          setResults([]);
          setError(res.status === 403 ? "You don't have stats access" : "Search failed");
          return;
        }
        const d = await res.json();
        setResults(d.results);
        setError("");
      } catch {
        setResults([]);
        setError("Network error");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tick, canView]);

  if (!canView) return null;

  return (
    <section className="mb-8 rounded-xl border border-nmcn-blue/30 bg-nmcn-blue/5 px-4 py-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
            <Search className="h-5 w-5 text-nmcn-blue" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Creator Stats</p>
            <p className="text-xs text-nmcn-muted">
              Search any creator — stats, team and profile editing in one place
            </p>
          </div>
        </div>
        <Link href="/admin/creator-stats" className="btn-outline text-sm">
          Full Stats Page <ExternalLink className="ml-1 inline h-3 w-3" />
        </Link>
      </div>

      <form onSubmit={e => e.preventDefault()} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nmcn-muted" />
        <input
          className="input pl-9"
          placeholder="Search by username, team lead or account name…"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-nmcn-muted" />
        )}
      </form>

      {error && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
          <XCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {results && (
        <div className="mt-3 space-y-2">
          {results.length === 0 && (
            <p className="text-sm text-nmcn-muted">No creator matches &quot;{q}&quot;.</p>
          )}
          {results.map(r => (
            <CreatorCard
              key={`${r.backstageCreatorId}-${r.creatorAccount?.id ?? "none"}-${r.creatorAccount?.status ?? ""}-${r.creatorAccount?.name ?? ""}`}
              row={r}
              open={openId === r.backstageCreatorId}
              onToggle={() => setOpenId(openId === r.backstageCreatorId ? null : r.backstageCreatorId)}
              isOwner={isOwner}
              onChanged={() => setTick(t => t + 1)}
            />
          ))}
        </div>
      )}

      {results && results.length > 0 && (
        <p className="mt-2 text-[11px] text-nmcn-muted">
          Showing up to 25 matches from the latest upload in your scope.
        </p>
      )}
    </section>
  );
}

// ── One creator: stats summary + owner edit/link controls ───────────────────
function CreatorCard({
  row,
  open,
  onToggle,
  isOwner,
  onChanged,
}: {
  row: Row;
  open: boolean;
  onToggle: () => void;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: row.creatorAccount?.name || "",
    email: row.creatorAccount?.email || "",
    tiktokHandle: row.creatorAccount?.tiktokHandle || "",
    assignedRole: row.creatorAccount?.assignedRole || "creator",
    status: row.creatorAccount?.status || "active",
  });
  // Link box (owner): loaded on demand so the dashboard stays light.
  const [accounts, setAccounts] = useState<{ id: number; name: string; email: string; linked: unknown }[] | null>(null);
  const [pickAccount, setPickAccount] = useState("");

  const reload = () => {
    // Parent re-runs the same query to refresh the row.
    onChanged();
  };

  const save = async () => {
    if (!row.creatorAccount) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.creatorAccount.id,
          ...form,
          independentCreator: form.assignedRole === "independent_creator",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(d.error || "Could not save the profile");
        return;
      }
      setMsg("Profile saved ✓");
      setEditing(false);
      reload();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  const loadAccounts = async () => {
    if (accounts) return;
    try {
      const res = await fetch("/api/admin/creator-stats/assignments");
      if (res.ok) {
        const d = await res.json();
        setAccounts(d.creatorAccounts || []);
      }
    } catch {
      /* ignore */
    }
  };

  const link = async () => {
    if (!pickAccount) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/creator-stats/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "linkProfile",
          creatorAccountId: Number(pickAccount),
          backstageCreatorId: row.backstageCreatorId,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(d.error || "Could not link that profile");
        return;
      }
      setMsg(`Linked @${d.username} → ${d.account} ✓`);
      reload();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!row.creatorAccount) return;
    setBusy(true);
    try {
      await fetch("/api/admin/creator-stats/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlinkProfile", backstageCreatorId: row.backstageCreatorId }),
      });
      setMsg("Profile unlinked");
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-nmcn-border bg-nmcn-panel/60 p-3">
      {/* Summary row — click to expand */}
      <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={onToggle}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">@{row.username}</span>
          <span className="text-xs text-nmcn-muted">→ {row.teamLead || "no team lead in data"}</span>
          {row.creatorAccount ? (
            <span className="rounded-full border border-nmcn-gold/40 px-2 py-0.5 text-[11px] text-nmcn-gold">
              {row.creatorAccount.name}
            </span>
          ) : (
            <span className="rounded-full border border-nmcn-border px-2 py-0.5 text-[11px] text-nmcn-muted">
              no account linked
            </span>
          )}
        </span>
        <span className="flex items-center gap-3 text-xs text-nmcn-muted">
          <span>💎 {fmt(row.diamondsL30D)}</span>
          <span>👥 {fmt(row.followers)}</span>
          <span>📅 {row.validDaysL30D}d</span>
          <Pencil className="h-3.5 w-3.5" />
        </span>
      </button>

      {open && (
        <div className="mt-3 border-t border-nmcn-border/60 pt-3">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Stat label="Diamonds (30d)" value={fmt(row.diamondsL30D)} />
            <Stat label="Valid days (30d)" value={`${row.validDaysL30D}`} />
            <Stat label="Live hours (30d)" value={row.liveDurationL30D.toFixed(1)} />
            <Stat label="Followers" value={fmt(row.followers)} />
            <Stat label="Fan-club diamonds" value={fmt(row.fanClubDiamondsL30D)} />
            <Stat label="Likes" value={fmt(row.likes)} />
            <Stat label="Last live" value={row.lastLive ? new Date(row.lastLive).toLocaleDateString() : "—"} />
            <Stat label="Exported" value={new Date(row.exportedAt).toLocaleDateString()} />
          </div>
          {(row.graduationStatus || row.tierStatus) && (
            <p className="mt-2 text-[11px] text-nmcn-muted">
              {row.graduationStatus && <>Graduation: {row.graduationStatus} · </>}
              {row.tierStatus && <>Tier: {row.tierStatus}</>}
            </p>
          )}
          <p className="mt-1 text-[11px] text-nmcn-muted">
            Creator ID <span className="font-mono">{row.backstageCreatorId}</span>
            {row.creatorAccount && <> · account {row.creatorAccount.email}</>}
          </p>

          {msg && <p className="mt-2 text-sm text-nmcn-gold">{msg}</p>}

          {/* Owner: edit the linked profile in place */}
          {row.creatorAccount && isOwner && !editing && (
            <button className="btn-outline mt-3 text-sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 inline h-3 w-3" /> Edit profile
            </button>
          )}

          {row.creatorAccount && isOwner && editing && (
            <div className="mt-3 space-y-2 rounded-lg border border-nmcn-border p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-nmcn-muted">
                  Name
                  <input className="input mt-1 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </label>
                <label className="text-xs text-nmcn-muted">
                  Email
                  <input className="input mt-1 text-sm" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label className="text-xs text-nmcn-muted">
                  TikTok handle
                  <input className="input mt-1 text-sm" placeholder="@username" value={form.tiktokHandle} onChange={e => setForm(f => ({ ...f, tiktokHandle: e.target.value }))} />
                </label>
                <label className="text-xs text-nmcn-muted">
                  Role
                  <select className="input mt-1 text-sm" value={form.assignedRole} onChange={e => setForm(f => ({ ...f, assignedRole: e.target.value }))}>
                    <option value="creator">Creator</option>
                    <option value="independent_creator">Independent Creator</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Manager</option>
                    <option value="scout">Scout</option>
                    <option value="battle_coordinator">Battle Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label className="text-xs text-nmcn-muted">
                  Status
                  <select className="input mt-1 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <button className="btn-gold text-sm disabled:opacity-50" disabled={busy || !form.name || !form.email} onClick={save}>
                  {busy ? "Saving…" : "Save profile"}
                </button>
                <button className="btn-outline text-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="ml-auto text-xs text-nmcn-muted hover:text-red-400" disabled={busy} onClick={unlink}>
                  Unlink account
                </button>
              </div>
            </div>
          )}

          {/* Owner: link an account when this profile has none */}
          {!row.creatorAccount && isOwner && (
            <div className="mt-3 flex flex-wrap items-center gap-2" onMouseEnter={loadAccounts}>
              <Link2 className="h-4 w-4 text-nmcn-blue" />
              <select
                className="input min-w-[220px] flex-1 text-sm"
                value={pickAccount}
                onFocus={loadAccounts}
                onChange={e => setPickAccount(e.target.value)}
              >
                <option value="">{accounts ? `Account (${accounts.length})…` : "Loading accounts…"}</option>
                {(accounts || []).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.email}{a.linked ? " — has a profile" : ""}
                  </option>
                ))}
              </select>
              <button className="btn-gold text-sm disabled:opacity-50" disabled={busy || !pickAccount} onClick={link}>
                Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-nmcn-border/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-nmcn-muted">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
