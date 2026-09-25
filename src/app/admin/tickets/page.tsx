"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, LifeBuoy, Loader2, RefreshCw, Send, SendHorizonal } from "lucide-react";
import GetHelpButton from "@/components/GetHelpButton";

interface Reply {
  id: number;
  ticketId: number;
  authorType: string;
  authorName: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
  handledBy: { id: number; name: string } | null;
  replies: Reply[];
}

interface StaffOption {
  id: number;
  name: string;
  role: string;
}

interface NotificationSettings {
  discordWebhookUrl: string;
  notifyPhone: string;
  notifyCarrier: string;
  notifyEmail: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  in_progress: { label: "In Progress", className: "bg-nmcn-blue/15 text-nmcn-blue border-nmcn-blue/30" },
  resolved: { label: "Resolved", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

const CATEGORIES: Record<string, string> = {
  account: "Account",
  academy: "Academy",
  login: "Login",
  other: "Other",
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, resolved: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [scope, setScope] = useState<"all" | "assigned">("assigned");
  const [staff, setStaff] = useState<StaffOption[]>([]);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);
  const [replyError, setReplyError] = useState("");

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    discordWebhookUrl: "",
    notifyPhone: "",
    notifyCarrier: "",
    notifyEmail: "nexusmafiacreatornetworkllc@outlook.com",
  });
  const [carriers, setCarriers] = useState<Record<string, { label: string; gateway: string }>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsErr, setSettingsErr] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const isAdmin = scope === "all";

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/tickets?status=${encodeURIComponent(status)}`);
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load tickets");
      }
      const data = await res.json();
      setTickets(data.tickets || []);
      setCounts(data.counts || { open: 0, in_progress: 0, resolved: 0 });
      setScope(data.scope === "all" ? "all" : "assigned");
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/staff/accounts");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStaff(data.accounts?.staff || []);
        }
      } catch {
        // ignore
      }
      try {
        const res = await fetch("/api/admin/support-settings");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            if (data.settings) setSettings(data.settings);
            if (data.carriers) setCarriers(data.carriers);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      await load(filter);
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function transferTicket(id: number, handledById: number | null) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handledById }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Transfer failed");
      }
      await load(filter);
    } catch (err: any) {
      setError(err.message || "Transfer failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeTicket(id: number) {
    if (!confirm(`Delete ticket #${id}?`)) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/tickets?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      await load(filter);
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function sendReply(id: number) {
    const message = replyText.trim();
    if (!message) return;
    setSendingReplyId(id);
    setReplyError("");
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Reply failed");
      }
      setReplyText("");
      await load(filter);
    } catch (err: any) {
      setReplyError(err.message || "Reply failed");
    } finally {
      setSendingReplyId(null);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg("");
    setSettingsErr("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data.settings);
      setSettingsMsg("Settings saved");
    } catch (err: any) {
      setSettingsErr(err.message || "Save failed");
    } finally {
      setSavingSettings(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setTestMsg("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Test failed");
      const parts: string[] = [];
      const w = data.results?.webhook;
      const s = data.results?.sms;
      if (w) parts.push(w.ok ? "Discord: sent ✓" : `Discord: ${w.error}`);
      if (s) parts.push(s.ok ? "SMS: sent ✓" : `SMS: ${s.error}`);
      setTestMsg(parts.join(" · ") || "Nothing to test");
    } catch (err: any) {
      setTestMsg(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">
              {isAdmin ? "Support Tickets" : "Tickets Transferred to You"}
            </h1>
            <p className="text-nmcn-muted">
              {counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved
            </p>
            {!isAdmin && (
              <p className="mt-1 text-xs text-nmcn-muted">
                You only see tickets assigned to you by an admin.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowSettings(v => !v)}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </button>
            )}
            <button
              onClick={() => load(filter)}
              className="btn-outline flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <GetHelpButton className="btn-gold text-sm" />
          </div>
        </div>

        {isAdmin && showSettings && (
          <div className="card mb-6 p-5">
            <h2 className="font-heading text-lg font-semibold text-white mb-4">
              Notification Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Discord Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.discordWebhookUrl}
                  onChange={e =>
                    setSettings({ ...settings, discordWebhookUrl: e.target.value })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                />
                <p className="mt-1 text-xs text-nmcn-muted">
                  Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy
                  Webhook URL
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Text Message Number
                  </label>
                  <input
                    type="tel"
                    value={settings.notifyPhone}
                    onChange={e => setSettings({ ...settings, notifyPhone: e.target.value })}
                    placeholder="(555) 555-5555"
                    className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Carrier
                  </label>
                  <select
                    value={settings.notifyCarrier}
                    onChange={e => setSettings({ ...settings, notifyCarrier: e.target.value })}
                    className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nmcn-blue/50"
                  >
                    <option value="">No carrier (SMS off)</option>
                    {Object.entries(carriers).map(([key, c]) => (
                      <option key={key} value={key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Close Transcript Email (you)
                </label>
                <input
                  type="email"
                  value={settings.notifyEmail}
                  onChange={e => setSettings({ ...settings, notifyEmail: e.target.value })}
                  placeholder="nexusmafiacreatornetworkllc@outlook.com"
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                />
                <p className="mt-1 text-xs text-nmcn-muted">
                  When a ticket is marked resolved, both this address and the submitter
                  receive the full transcript by email.
                </p>
              </div>

              {settingsErr && <p className="text-sm text-red-400">{settingsErr}</p>}
              {settingsMsg && <p className="text-sm text-green-400">{settingsMsg}</p>}
              {testMsg && <p className="text-sm text-nmcn-blue">{testMsg}</p>}

              <div className="flex flex-wrap gap-3">
                <button onClick={saveSettings} disabled={savingSettings} className="btn-gold text-sm disabled:opacity-50">
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
                <button onClick={sendTest} disabled={testing} className="btn-outline text-sm disabled:opacity-50">
                  {testing ? "Sending..." : "Send Test Notification"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                filter === f.value
                  ? "border-nmcn-blue bg-nmcn-blue/15 text-nmcn-blue"
                  : "border-nmcn-border text-nmcn-muted hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="card p-10 text-center">
            <LifeBuoy className="mx-auto mb-4 h-10 w-10 text-nmcn-muted" />
            <p className="text-nmcn-muted">
              {isAdmin
                ? "No tickets match this filter."
                : "No tickets have been transferred to you yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => {
              const meta = STATUS_META[t.status] || STATUS_META.open;
              const expanded = expandedId === t.id;
              return (
                <div key={t.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-nmcn-muted">#{t.id}</span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="rounded-full border border-nmcn-border px-2.5 py-0.5 text-[11px] text-nmcn-muted">
                          {CATEGORIES[t.category] || t.category}
                        </span>
                      </div>
                      <h3 className="mt-2 font-heading text-lg font-semibold text-white">{t.subject}</h3>
                      <p className="mt-1 text-sm text-nmcn-muted whitespace-pre-wrap">{t.message}</p>
                      <p className="mt-3 text-xs text-nmcn-muted">
                        {t.name ? `${t.name} · ` : ""}
                        {t.email}
                        {t.phone ? ` · ${t.phone}` : ""} ·{" "}
                        {new Date(t.createdAt).toLocaleString()}
                        {t.handledBy ? ` · handled by ${t.handledBy.name}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      <select
                        value={t.status}
                        disabled={updatingId === t.id}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className="rounded-lg border border-nmcn-border bg-black/40 px-3 py-2 text-sm text-white focus:border-nmcn-blue focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      {isAdmin && (
                        <select
                          value={t.handledBy?.id ?? ""}
                          disabled={updatingId === t.id}
                          onChange={(e) => {
                            const value = e.target.value;
                            transferTicket(t.id, value === "" ? null : Number(value));
                          }}
                          className="rounded-lg border border-nmcn-border bg-black/40 px-3 py-2 text-sm text-white focus:border-nmcn-blue focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => {
                          setExpandedId(expanded ? null : t.id);
                          setReplyError("");
                        }}
                        className="flex items-center justify-center gap-2 rounded-lg border border-nmcn-blue/40 bg-nmcn-blue/10 px-3 py-2 text-sm font-semibold text-nmcn-blue hover:bg-nmcn-blue/20 transition"
                      >
                        <SendHorizonal className="h-4 w-4" />
                        {expanded ? "Hide Thread" : `Reply${t.replies?.length ? ` (${t.replies.length})` : ""}`}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => removeTicket(t.id)}
                          disabled={updatingId === t.id}
                          className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 border-t border-nmcn-border pt-4">
                      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                        <div className="rounded-lg border border-nmcn-border bg-black/30 p-3">
                          <p className="mb-1 text-xs text-nmcn-muted">
                            <strong className="text-white">{t.name || t.email}</strong>
                            {" (submitter) · "}
                            {new Date(t.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-white whitespace-pre-wrap">{t.message}</p>
                        </div>
                        {(t.replies || []).map((r) => {
                          const isStaff = r.authorType === "staff";
                          return (
                            <div
                              key={r.id}
                              className={`rounded-lg border p-3 ${
                                isStaff
                                  ? "border-nmcn-gold/30 bg-nmcn-gold/5"
                                  : "border-nmcn-border bg-nmcn-deep/60"
                              }`}
                            >
                              <p className="mb-1 text-xs text-nmcn-muted">
                                <strong className={isStaff ? "text-nmcn-gold" : "text-white"}>
                                  {r.authorName}
                                </strong>
                                {isStaff ? " (NMCN staff)" : " (user)"} ·{" "}
                                {new Date(r.createdAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-white whitespace-pre-wrap">{r.message}</p>
                            </div>
                          );
                        })}
                        {!t.replies?.length && (
                          <p className="py-2 text-center text-xs text-nmcn-muted">
                            No replies yet — the conversation starts here.
                          </p>
                        )}
                      </div>

                      <div className="mt-3">
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply to the user (they receive it by email and in the ticket)..."
                          className="w-full resize-none rounded-lg border border-nmcn-border bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:border-nmcn-blue focus:outline-none"
                        />
                        {replyError && (
                          <p className="mt-1 text-xs text-red-400">{replyError}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-xs text-nmcn-muted">
                            Replying moves an unassigned open ticket to In Progress and claims it.
                          </p>
                          <button
                            onClick={() => sendReply(t.id)}
                            disabled={sendingReplyId === t.id || !replyText.trim()}
                            className="btn-gold flex items-center gap-2 text-sm disabled:opacity-50"
                          >
                            {sendingReplyId === t.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Send Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a href="/admin" className="text-sm text-nmcn-muted hover:text-nmcn-blue transition">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
