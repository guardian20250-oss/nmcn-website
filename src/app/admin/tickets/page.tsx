"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, Loader2, RefreshCw } from "lucide-react";
import GetHelpButton from "@/components/GetHelpButton";

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
}

interface StaffOption {
  id: number;
  name: string;
  role: string;
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
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStaff(data.accounts?.staff || []);
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
