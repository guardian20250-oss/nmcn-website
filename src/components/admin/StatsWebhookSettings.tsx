"use client";

// Stats Discord settings — laid out like the Exchange's Notification
// Settings panel (tickets page): plain labelled fields, Save, Send test.
//
//   1. Reminders webhook (managers channel) — daily overdue-team cron.
//   2. Creators webhook(s) — auto "summary uploaded" cards. Paste one URL
//      per line to post the same card to several Discord servers.
//   3. Team names — the export only has the team lead's email; give each
//      team a real name here (editable any time).
//   4. Send now — send the first card manually for stats that were already
//      uploaded before the cards existed.
//
// CRON_SECRET still lives in Vercel (Vercel signs cron calls with it);
// this box shows whether it's set so nothing is silently broken.
import { useEffect, useState } from "react";
import { Loader2, Send, Save, Trash2, XCircle, CheckCircle } from "lucide-react";

interface Status {
  webhook: string;
  source: "dashboard" | "env" | "unset";
  notifyWebhooks: string[];
  notifySource: "dashboard" | "env" | "unset";
  teamNames: Record<string, string>;
  teamLeads: string[];
  schedule: { enabled: boolean; day: number; time: string; timeZone: string };
  timezones: string[];
  firstCardSent: boolean;
  cronSecretConfigured: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const inputClass =
  "w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted";

export default function StatsWebhookSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("");
  const [notifyUrls, setNotifyUrls] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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

  const post = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/stats-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error || "Something went wrong");
        return;
      }
      if (body.action === "save") {
        if (body.channel === "notify") {
          if (d.notifyWebhooks !== undefined) setStatus(s => (s ? { ...s, notifyWebhooks: d.notifyWebhooks, notifySource: d.notifySource } : s));
          setNotifyUrls("");
        } else {
          if (d.webhook !== undefined) setStatus(s => (s ? { ...s, webhook: d.webhook, source: d.source } : s));
          setUrl("");
        }
      }
      if (body.action === "clear") load();
      setMsg(okMsg);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

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

  const sourceLabel = (source: Status["source"], none: string) =>
    source === "dashboard" ? "Saved on this dashboard ✓" : source === "env" ? "Set as a Vercel env var" : none;

  // Every known team lead gets a row; saved names for unknown emails too.
  const teamRows = [
    ...new Set([...(status?.teamLeads || []), ...Object.keys(names)]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="rounded-xl border border-nmcn-border bg-nmcn-panel/50 p-4 sm:p-5 space-y-6">
      <div>
        <p className="text-sm font-semibold text-white">Discord notifications</p>
        <p className="text-xs text-nmcn-muted">
          Reminders go to managers · &quot;summary uploaded&quot; cards go to creators
        </p>
      </div>

      {/* 1 — Managers reminders webhook (unchanged behaviour) */}
      <div>
        <label className={labelClass}>Managers channel — weekly upload reminders</label>
        {status && (
          <p className="mb-1.5 break-all text-xs text-nmcn-muted">
            Current:{" "}
            {status.webhook ? (
              <span className="font-mono text-nmcn-gold">{status.webhook}</span>
            ) : (
              <span className="text-amber-300">none — reminders are off</span>
            )}{" "}
            · {sourceLabel(status.source, "not configured")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} min-w-[260px] flex-1`}
            placeholder="https://discord.com/api/webhooks/…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button
            className="btn-gold text-sm disabled:opacity-50"
            disabled={busy || !url.trim()}
            onClick={() => post({ action: "save", channel: "reminders", url: url.trim() }, "Reminders webhook saved ✓")}
          >
            <Save className="mr-1 inline h-3.5 w-3.5" /> Save
          </button>
          <button
            className="btn-outline text-sm disabled:opacity-50"
            disabled={busy || status?.source === "unset"}
            onClick={() => post({ action: "test", channel: "reminders" }, "Test reminder sent to Discord ✓")}
          >
            {busy ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 inline h-3.5 w-3.5" />}
            Send test
          </button>
          {status?.source === "dashboard" && (
            <button
              className="btn-outline text-sm text-red-400 disabled:opacity-50"
              disabled={busy}
              onClick={() => post({ action: "clear", channel: "reminders" }, "Reminders webhook cleared")}
            >
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* 1b — Reminder schedule (gates the managers cron above) */}
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

      {/* 2 — Creators channels webhook(s) */}
      <div>
        <label className={labelClass}>Creators channel(s) — &quot;summary uploaded&quot; cards</label>
        {status && (
          <p className="mb-1.5 break-all text-xs text-nmcn-muted">
            Current:{" "}
            {status.notifyWebhooks.length ? (
              <span className="font-mono text-nmcn-gold">{status.notifyWebhooks.join(" · ")}</span>
            ) : (
              <span className="text-amber-300">none — cards are off</span>
            )}{" "}
            · {sourceLabel(status.notifySource, "not configured")}
          </p>
        )}
        <textarea
          className={`${inputClass} font-mono`}
          rows={3}
          placeholder={"https://discord.com/api/webhooks/…\n(one URL per line — add one per Discord server)"}
          value={notifyUrls}
          onChange={e => setNotifyUrls(e.target.value)}
        />
        <div className="mt-1 text-xs text-nmcn-muted">
          Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
          Every card is posted to all saved servers.
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            className="btn-gold text-sm disabled:opacity-50"
            disabled={busy || !notifyUrls.trim()}
            onClick={() => post({ action: "save", channel: "notify", url: notifyUrls }, "Creators webhook(s) saved ✓")}
          >
            <Save className="mr-1 inline h-3.5 w-3.5" /> Save
          </button>
          <button
            className="btn-outline text-sm disabled:opacity-50"
            disabled={busy || !status?.notifyWebhooks.length}
            onClick={() => post({ action: "test", channel: "notify" }, "Test card sent to Discord ✓")}
          >
            {busy ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 inline h-3.5 w-3.5" />}
            Send test
          </button>
          {status?.notifySource === "dashboard" && (
            <button
              className="btn-outline text-sm text-red-400 disabled:opacity-50"
              disabled={busy}
              onClick={() => post({ action: "clear", channel: "notify" }, "Creators webhook cleared")}
            >
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
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
