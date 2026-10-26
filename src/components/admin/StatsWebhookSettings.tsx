"use client";

// Stats Discord settings.
//
//   1. Webhooks — Exchange-style: ONE url box, a "what's this for" dropdown,
//      and a list you can edit, remove or send a test to. Two purposes:
//        · Manager reminders — daily/weekly "this team is overdue" cron
//        · Creator upload cards — gold "summary uploaded" embed on import
//      (Cards accept several URLs, one per Discord server. Reminders is a
//       single slot — the cron posts to one managers channel.)
//   2. When reminders go out — day/time/timezone, dashboard-configurable.
//   3. Team names — the export only has the team lead's email; give each
//      team a real name here (editable any time).
//   4. Send now — send the first card manually for stats that were already
//      uploaded before the cards existed.
//
// CRON_SECRET still lives in Vercel (Vercel signs cron calls with it);
// this box shows whether it's set so nothing is silently broken.
import { useEffect, useState } from "react";
import { Loader2, Send, Save, Trash2, Pencil, XCircle, CheckCircle, Plus, X } from "lucide-react";

type HookPurpose = "reminders" | "notify";

interface Hook {
  /** `${purpose}:${index}` — edit/remove by this, never by the real URL. */
  id: string;
  purpose: HookPurpose;
  url: string; // masked by the API
  source: "dashboard" | "env" | "unset";
}

interface Status {
  hooks: Hook[];
  purposes: { value: HookPurpose; label: string; description: string }[];
  teamNames: Record<string, string>;
  teamLeads: string[];
  schedule: { enabled: boolean; day: number; time: string; timeZone: string };
  timezones: string[];
  firstCardSent: boolean;
  cronSecretConfigured: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PURPOSE_TITLE: Record<HookPurpose, string> = {
  reminders: "Manager reminders",
  notify: "Creator upload card",
};

const PURPOSE_BLURB: Record<HookPurpose, string> = {
  reminders: "“This team is overdue” ping for managers",
  notify: "Gold embed card when a Backstage export lands",
};

// Shown before the first load lands, so the dropdown is never empty.
const FALLBACK_PURPOSES: { value: HookPurpose; label: string; description: string }[] = [
  { value: "notify", label: PURPOSE_TITLE.notify, description: PURPOSE_BLURB.notify },
  { value: "reminders", label: PURPOSE_TITLE.reminders, description: PURPOSE_BLURB.reminders },
];

const inputClass =
  "w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted";

export default function StatsWebhookSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // The one URL box — used for both adding and editing.
  const [draftUrl, setDraftUrl] = useState("");
  const [draftPurpose, setDraftPurpose] = useState<HookPurpose>("notify");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Team names editor
  const [names, setNames] = useState<Record<string, string>>({});
  const [newTeamEmail, setNewTeamEmail] = useState("");
  const [newTeamName, setNewTeamName] = useState("");

  // Reminder schedule editor
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedDay, setSchedDay] = useState(1);
  const [schedTime, setSchedTime] = useState("09:00");
  const [schedTz, setSchedTz] = useState("America/New_York");
  const [schedMsg, setSchedMsg] = useState("");
  const [schedErr, setSchedErr] = useState("");

  // Manual send
  const [sendPeriod, setSendPeriod] = useState<"weekly" | "monthly">("weekly");
  const [sendScope, setSendScope] = useState("master");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [sendErr, setSendErr] = useState("");

  const applyStatus = (d: Status) => {
    setStatus(d);
    setNames(d.teamNames || {});
    if (d.schedule) {
      setSchedEnabled(d.schedule.enabled);
      setSchedDay(d.schedule.day);
      setSchedTime(d.schedule.time);
      setSchedTz(d.schedule.timeZone);
    }
  };

  const load = async () => {
    try {
      const res = await fetch("/api/admin/stats-webhook");
      if (!res.ok) return;
      applyStatus(await res.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Webhook list: add / edit / remove / test ──────────────────────────────
  const submitHook = async () => {
    if (!draftUrl.trim()) return;
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { action: "update", id: editingId, url: draftUrl.trim() }
            : { action: "add", purpose: draftPurpose, url: draftUrl.trim() }
        ),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Could not save that webhook");
        return;
      }
      setMsg(editingId ? "Webhook updated ✓" : "Webhook added ✓");
      if (d.note) setMsg(`${d.note} ✓`);
      setDraftUrl("");
      setEditingId(null);
      await load();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  const removeHook = async (h: Hook) => {
    if (!confirm(`Remove the ${PURPOSE_TITLE[h.purpose].toLowerCase()} webhook ${h.url}?`)) return;
    setBusyId(h.id);
    setErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id: h.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error || "Could not remove that webhook"); return; }
      if (editingId === h.id) { setEditingId(null); setDraftUrl(""); }
      setMsg("Webhook removed ✓");
      await load();
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  };

  const testHook = async (h: Hook) => {
    setBusyId(h.id);
    setErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", id: h.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error || "Discord rejected the test"); return; }
      setMsg(`Test sent to ${h.url} ✓`);
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (h: Hook) => {
    setEditingId(h.id);
    setDraftPurpose(h.purpose);
    setDraftUrl("");
    setMsg("");
    setErr("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftUrl("");
  };

  const sourceLabel = (source: Hook["source"]) =>
    source === "dashboard" ? "saved on this dashboard ✓" : source === "env" ? "Vercel env var" : "not configured";

  // ── Team names ────────────────────────────────────────────────────────────
  const saveTeamNames = async () => {
    // Fold in any new row typed at the bottom before saving.
    const merged = { ...names };
    if (newTeamEmail.trim() && newTeamName.trim()) merged[newTeamEmail.trim().toLowerCase()] = newTeamName.trim();
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_team_names", names: merged }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Could not save team names");
        return;
      }
      setNames(d.teamNames || merged);
      setNewTeamEmail("");
      setNewTeamName("");
      setMsg("Team names saved ✓");
      load();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  const saveSchedule = async () => {
    setBusy(true);
    setSchedMsg("");
    setSchedErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_schedule", enabled: schedEnabled, day: schedDay, time: schedTime, timeZone: schedTz }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSchedErr(d.error || "Could not save the schedule");
        return;
      }
      setSchedMsg(
        d.schedule.enabled
          ? `Saved — reminders post on ${DAYS[d.schedule.day]}s at/after ${d.schedule.time} (${d.schedule.timeZone}) ✓`
          : "Saved — schedule off, reminders check daily for overdue teams ✓"
      );
    } catch {
      setSchedErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  const sendNow = async () => {
    setSending(true);
    setSendMsg("");
    setSendErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_now", periodType: sendPeriod, scope: sendScope }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendErr(d.error || "Could not send");
        return;
      }
      setSendMsg(`Card sent to ${d.sent} webhook(s) ✓${d.failed ? ` (${d.failed} failed)` : ""}`);
      // First card is out — refresh so "Send now" retires itself.
      load();
    } catch {
      setSendErr("Network error");
    } finally {
      setSending(false);
    }
  };

  // Every known team lead gets a row; saved names for unknown emails too.
  const teamRows = [
    ...new Set([...(status?.teamLeads || []), ...Object.keys(names)]),
  ].sort((a, b) => a.localeCompare(b));

  const hooks = status?.hooks || [];
  const editing = editingId ? hooks.find(h => h.id === editingId) || null : null;

  return (
    <div className="rounded-xl border border-nmcn-border bg-nmcn-panel/50 p-4 sm:p-5 space-y-6">
      <div>
        <p className="text-sm font-semibold text-white">Discord webhooks</p>
        <p className="text-xs text-nmcn-muted">
          Paste a webhook URL, pick what it&apos;s for, add it. Everything saved is listed below.
        </p>
      </div>

      {/* 1 — One URL box + a purpose dropdown */}
      <div>
        <label className={labelClass}>{editing ? "Edit webhook" : "Add a webhook"}</label>
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} min-w-[240px] flex-1`}
            placeholder={editing ? editing.url : "https://discord.com/api/webhooks/…"}
            value={draftUrl}
            onChange={e => setDraftUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submitHook(); }}
          />
          <select
            className={`${inputClass} w-auto`}
            value={draftPurpose}
            onChange={e => setDraftPurpose(e.target.value as HookPurpose)}
            disabled={!!editing}
            title={editing ? "A webhook can't be moved to a different channel" : "What is this notification for?"}
          >
            {(status?.purposes || FALLBACK_PURPOSES).map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button
            className="btn-gold text-sm disabled:opacity-50"
            disabled={busy || !draftUrl.trim()}
            onClick={submitHook}
          >
            {busy ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : editing ? <Save className="mr-1 inline h-3.5 w-3.5" /> : <Plus className="mr-1 inline h-3.5 w-3.5" />}
            {editing ? "Save changes" : "Add"}
          </button>
          {editing && (
            <button className="btn-outline text-sm" disabled={busy} onClick={cancelEdit}>
              <X className="mr-1 inline h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-nmcn-muted">
          Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
          Creator upload cards can have one per Discord server.
        </p>
      </div>

      {/* 1b — The list: each webhook editable / removable / testable */}
      <div>
        <label className={labelClass}>Saved webhooks ({hooks.length})</label>
        {hooks.length === 0 ? (
          <p className="rounded-lg border border-nmcn-border p-3 text-sm text-nmcn-muted">
            Nothing saved yet — nothing will be posted to Discord until you add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {hooks.map(h => (
              <li
                key={h.id}
                className={`rounded-lg border p-3 ${editingId === h.id ? "border-nmcn-gold/60 bg-nmcn-gold/5" : "border-nmcn-border"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{PURPOSE_TITLE[h.purpose]}</p>
                    <p className="text-xs text-nmcn-muted">{PURPOSE_BLURB[h.purpose]}</p>
                    <p className="mt-1 break-all font-mono text-xs text-nmcn-gold">{h.url}</p>
                    <p className="text-[11px] text-nmcn-muted">via {sourceLabel(h.source)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      className="btn-outline text-xs disabled:opacity-50"
                      disabled={busyId === h.id}
                      onClick={() => testHook(h)}
                      title="Send a test to this webhook"
                    >
                      {busyId === h.id ? <Loader2 className="inline h-3 w-3 animate-spin" /> : <Send className="inline h-3 w-3" />} Test
                    </button>
                    <button className="btn-outline text-xs disabled:opacity-50" disabled={busyId === h.id} onClick={() => startEdit(h)}>
                      <Pencil className="inline h-3 w-3" /> Edit
                    </button>
                    <button
                      className="btn-outline text-xs text-red-400 disabled:opacity-50"
                      disabled={busyId === h.id}
                      onClick={() => removeHook(h)}
                    >
                      <Trash2 className="inline h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2 — Reminder schedule (gates the managers cron) */}
      <div>
        <label className={labelClass}>When should the manager reminder go out?</label>
        <p className="mb-2 text-xs text-nmcn-muted">
          Off = the daily job only pings when a team is overdue. On = one reminder a week,
          posted on the chosen day at/after the chosen time.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex items-center gap-2 pb-2.5 text-sm text-white">
            <input type="checkbox" checked={schedEnabled} onChange={e => setSchedEnabled(e.target.checked)} />
            Weekly schedule on
          </label>
          <div>
            <span className="mb-1 block text-xs text-nmcn-muted">Day</span>
            <select className={inputClass} value={schedDay} onChange={e => setSchedDay(Number(e.target.value))} disabled={!schedEnabled}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1 block text-xs text-nmcn-muted">Time</span>
            <input type="time" className={inputClass} value={schedTime} onChange={e => setSchedTime(e.target.value)} disabled={!schedEnabled} />
          </div>
          <div>
            <span className="mb-1 block text-xs text-nmcn-muted">Timezone</span>
            <select className={inputClass} value={schedTz} onChange={e => setSchedTz(e.target.value)} disabled={!schedEnabled}>
              {(status?.timezones || ["America/New_York"]).map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <button className="btn-gold text-sm disabled:opacity-50" disabled={busy} onClick={saveSchedule}>
            <Save className="mr-1 inline h-3.5 w-3.5" /> Save schedule
          </button>
        </div>
        {schedMsg && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" /> {schedMsg}
          </p>
        )}
        {schedErr && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
            <XCircle className="h-4 w-4" /> {schedErr}
          </p>
        )}
      </div>

      {/* 3 — Team names */}
      <div>
        <label className={labelClass}>Team names (used on the cards)</label>
        <p className="mb-2 text-xs text-nmcn-muted">
          The Backstage export only has the team lead&apos;s email — give each team a name here.
          Rename any time.
        </p>
        {teamRows.length > 0 && (
          <div className="mb-3 space-y-2">
            {teamRows.map(email => (
              <div key={email} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-nmcn-muted">{email}</span>
                <input
                  className={`${inputClass} max-w-[240px] flex-1`}
                  placeholder="Team name"
                  value={names[email.toLowerCase()] || ""}
                  onChange={e => setNames({ ...names, [email.toLowerCase()]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mb-2 flex flex-wrap gap-2">
          <input
            className={`${inputClass} min-w-[220px] flex-1`}
            placeholder="Team lead email (if not listed above)"
            value={newTeamEmail}
            onChange={e => setNewTeamEmail(e.target.value)}
          />
          <input
            className={`${inputClass} min-w-[160px] flex-1`}
            placeholder="Team name"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
          />
        </div>
        <button className="btn-gold text-sm disabled:opacity-50" disabled={busy} onClick={saveTeamNames}>
          <Save className="mr-1 inline h-3.5 w-3.5" /> Save team names
        </button>
      </div>

      {/* 4 — Manual send — retires itself once the first card has gone out */}
      {!status?.firstCardSent && (
      <div>
        <label className={labelClass}>Send a card now</label>
        <p className="mb-2 text-xs text-nmcn-muted">
          For stats that were uploaded before the cards existed — sends the same
          &quot;summary uploaded&quot; card to every creators channel.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <span className="mb-1 block text-xs text-nmcn-muted">Summary type</span>
            <select className={inputClass} value={sendPeriod} onChange={e => setSendPeriod(e.target.value as "weekly" | "monthly")}>
              <option value="weekly">Weekly</option>
              <option value="monthly">End of Month</option>
            </select>
          </div>
          <div className="min-w-[240px] flex-1">
            <span className="mb-1 block text-xs text-nmcn-muted">Which upload</span>
            <select className={inputClass} value={sendScope} onChange={e => setSendScope(e.target.value)}>
              <option value="master">Master file (all teams, one card)</option>
              {teamRows.map(email => (
                <option key={email} value={email}>
                  {names[email.toLowerCase()] || email}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold text-sm disabled:opacity-50" disabled={sending} onClick={sendNow}>
            {sending ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 inline h-3.5 w-3.5" />}
            Send now
          </button>
        </div>
        {sendMsg && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" /> {sendMsg}
          </p>
        )}
        {sendErr && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
            <XCircle className="h-4 w-4" /> {sendErr}
          </p>
        )}
      </div>
      )}

      {msg && (
        <p className="flex items-center gap-1 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4" /> {msg}
        </p>
      )}
      {err && (
        <p className="flex items-center gap-1 text-sm text-red-400">
          <XCircle className="h-4 w-4" /> {err}
        </p>
      )}

      {status && !status.cronSecretConfigured && (
        <p className="flex items-start gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-300">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          CRON_SECRET is not set in Vercel yet — the scheduled job still returns 503 until you add it
          (Vercel → Settings → Environment Variables → name <span className="font-mono">CRON_SECRET</span>,
          value <span className="font-mono">e452de009a0db421c900f1392915791456b8938c2ce239a13a38e16cdf526bc7</span>).
        </p>
      )}
    </div>
  );
}
