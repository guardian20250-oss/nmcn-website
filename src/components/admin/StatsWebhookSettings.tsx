"use client";

// Discord stats-reminder webhook — configured from the dashboard like the
// Exchange's settings, saved in the database (SiteSetting), read by the cron
// route. CRON_SECRET still lives in Vercel (Vercel signs cron calls with it);
// this box shows whether it's set so nothing is silently broken.
import { useEffect, useState } from "react";
import { Loader2, Send, Save, Trash2, XCircle, CheckCircle } from "lucide-react";

interface Status {
  webhook: string;
  source: "dashboard" | "env" | "unset";
  cronSecretConfigured: boolean;
}

export default function StatsWebhookSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/stats-webhook");
      if (!res.ok) return;
      const d = await res.json();
      setStatus(d);
      if (d.source === "dashboard") setUrl("");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
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
      if (d.webhook !== undefined) setStatus(s => (s ? { ...s, webhook: d.webhook, source: d.source } : s));
      setMsg(okMsg);
      if (body.action === "save") setUrl("");
      if (body.action === "clear") load();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  const sourceLabel =
    status?.source === "dashboard"
      ? "Saved on this dashboard ✓"
      : status?.source === "env"
        ? "Set as a Vercel env var"
        : "Not configured";

  return (
    <div className="rounded-xl border border-nmcn-border bg-nmcn-panel/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
          <Send className="h-5 w-5 text-nmcn-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Discord stats reminders</p>
          <p className="text-xs text-nmcn-muted">
            Weekly &quot;upload your Backstage export&quot; pings · {sourceLabel}
          </p>
        </div>
      </div>

      {status && (
        <p className="mb-2 break-all text-xs text-nmcn-muted">
          Current:{" "}
          {status.webhook ? (
            <span className="font-mono text-nmcn-gold">{status.webhook}</span>
          ) : (
            <span className="text-amber-300">none — reminders are off</span>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          className="input min-w-[260px] flex-1 text-sm"
          placeholder="Paste a Discord webhook URL (https://discord.com/api/webhooks/…)"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          className="btn-gold text-sm disabled:opacity-50"
          disabled={busy || !url.trim()}
          onClick={() => post({ action: "save", url: url.trim() }, "Webhook saved ✓")}
        >
          <Save className="mr-1 inline h-3.5 w-3.5" /> Save
        </button>
        <button
          className="btn-outline text-sm disabled:opacity-50"
          disabled={busy || status?.source === "unset"}
          onClick={() => post({ action: "test" }, "Test message sent to Discord ✓")}
        >
          {busy ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 inline h-3.5 w-3.5" />}
          Send test
        </button>
        {status?.source === "dashboard" && (
          <button
            className="btn-outline text-sm text-red-400 disabled:opacity-50"
            disabled={busy}
            onClick={() => post({ action: "clear" }, "Dashboard webhook cleared")}
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {msg && (
        <p className="mt-2 flex items-center gap-1 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4" /> {msg}
        </p>
      )}
      {err && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
          <XCircle className="h-4 w-4" /> {err}
        </p>
      )}

      {status && !status.cronSecretConfigured && (
        <p className="mt-3 flex items-start gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-300">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          CRON_SECRET is not set in Vercel yet — the scheduled job still returns 503 until you add it
          (Vercel → Settings → Environment Variables → name <span className="font-mono">CRON_SECRET</span>,
          value <span className="font-mono">e452de009a0db421c900f1392915791456b8938c2ce239a13a38e16cdf526bc7</span>).
        </p>
      )}
    </div>
  );
}
