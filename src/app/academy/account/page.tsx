"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPrompt from "@/components/academy/AuthPrompt";
import SupportTicketModal from "@/components/SupportTicketModal";
import {
  Loader2,
  User,
  Mail,
  AtSign,
  ShieldCheck,
  Calendar,
  Pencil,
  KeyRound,
  CheckCircle,
  LifeBuoy,
} from "lucide-react";
import { Suspense } from "react";

interface Userinfo {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  tiktokHandle: string | null;
  createdAt: string | null;
  mustChangePassword?: boolean;
}

interface MyTicket {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  _count?: { replies: number };
}

const TICKET_STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "border-amber-500/40 text-amber-300" },
  in_progress: { label: "In Progress", className: "border-nmcn-blue/40 text-nmcn-blue" },
  resolved: { label: "Resolved", className: "border-emerald-500/40 text-emerald-300" },
};

const roleLabels: Record<string, string> = {
  creator: "Creator",
  independent_creator: "Independent Creator",
  team_lead: "Team Lead",
  manager: "Manager",
  scout: "Scout",
  battle_coordinator: "Battle Coordinator",
  admin: "Admin",
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-nmcn-border p-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-nmcn-blue/30 bg-nmcn-blue/10">
        <Icon className="h-4 w-4 text-nmcn-blue" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
          {label}
        </p>
        <p className="truncate text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function AcademyAccountContent() {
  const [user, setUser] = useState<Userinfo | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", tiktokHandle: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  const reloadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/academy/auth");
        const data = await res.json();
        setUser(data.user);
        if (data.user) {
          setForm({
            name: data.user.name || "",
            email: data.user.email || "",
            tiktokHandle: data.user.tiktokHandle || "",
          });
          try {
            const t = await fetch("/api/support");
            if (t.ok) {
              const td = await t.json();
              setTickets(td.tickets || []);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr("");
    setSaveMsg("");
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "updateProfile", ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveErr(data.error || "Failed to update profile");
        return;
      }
      setUser(prev =>
        prev
          ? {
              ...prev,
              name: data.user.name,
              email: data.user.email,
              tiktokHandle: data.user.tiktokHandle,
            }
          : prev
      );
      setSaveMsg("Profile updated");
      setEditing(false);
    } catch {
      setSaveErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwMsg("");
    if (pw.password.length < 8) {
      setPwErr("Password must be at least 8 characters");
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwErr("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "changePassword", newPassword: pw.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwErr(data.error || "Failed to update password");
        return;
      }
      setPwMsg("Password updated");
      setPw({ password: "", confirm: "" });
      if (user) setUser({ ...user, mustChangePassword: false });
    } catch {
      setPwErr("Network error. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-md">
          {user === undefined ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
            </div>
          ) : user ? (
            <>
              <div className="mb-8 text-center">
                <span className="mb-4 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
                  Academy
                </span>
                <h1 className="mb-2 font-heading text-3xl font-bold text-white">
                  My <span className="gold-text">Account</span>
                </h1>
                <p className="text-sm text-nmcn-muted">
                  Your account information and settings.
                </p>
              </div>

              <div className="card p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-nmcn-gold bg-nmcn-gold/10 font-heading text-xl font-bold text-nmcn-gold">
                    {(user.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-xl font-semibold text-white">
                      {user.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="badge border-nmcn-blue/40 text-nmcn-blue">
                        {roleLabels[user.role] || user.role}
                      </span>
                      <span
                        className={`badge ${
                          user.status === "active"
                            ? "border-green-500/40 text-green-400"
                            : "border-yellow-500/40 text-yellow-400"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {!editing ? (
                  <>
                    <div className="space-y-3">
                      <InfoRow icon={User} label="Full Name" value={user.name} />
                      <InfoRow icon={Mail} label="Email" value={user.email} />
                      <InfoRow
                        icon={AtSign}
                        label="TikTok Handle"
                        value={user.tiktokHandle || "Not set"}
                      />
                      <InfoRow
                        icon={ShieldCheck}
                        label="Role"
                        value={roleLabels[user.role] || user.role}
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Member Since"
                        value={
                          user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "—"
                        }
                      />
                    </div>

                    {saveMsg && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-green-400">
                        <CheckCircle className="h-4 w-4" /> {saveMsg}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        setSaveMsg("");
                        setEditing(true);
                      }}
                      className="btn-outline mt-4 flex w-full items-center justify-center gap-2 py-2.5"
                    >
                      <Pencil className="h-4 w-4" />
                      Update Information
                    </button>
                  </>
                ) : (
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                        TikTok Handle
                      </label>
                      <input
                        type="text"
                        placeholder="@yourusername"
                        value={form.tiktokHandle}
                        onChange={e =>
                          setForm({ ...form, tiktokHandle: e.target.value })
                        }
                        className="input"
                      />
                    </div>

                    {saveErr && <p className="text-sm text-red-400">{saveErr}</p>}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-gold flex-1 py-2.5 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setSaveErr("");
                          setForm({
                            name: user.name,
                            email: user.email,
                            tiktokHandle: user.tiktokHandle || "",
                          });
                        }}
                        className="btn-ghost py-2.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="card mt-4 p-6">
                <p className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-white">
                  <KeyRound className="h-4 w-4 text-nmcn-blue" />
                  Change Password
                </p>
                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={pw.password}
                      onChange={e =>
                        setPw({ ...pw, password: e.target.value })
                      }
                      placeholder="At least 8 characters"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={pw.confirm}
                      onChange={e =>
                        setPw({ ...pw, confirm: e.target.value })
                      }
                      placeholder="Re-enter new password"
                      className="input"
                    />
                  </div>

                  {pwErr && <p className="text-sm text-red-400">{pwErr}</p>}
                  {pwMsg && (
                    <p className="flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="h-4 w-4" /> {pwMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="btn-outline w-full py-2.5 disabled:opacity-50"
                  >
                    {pwSaving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

              <div className="card mt-4 p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-heading text-lg font-semibold text-white">
                    <LifeBuoy className="h-4 w-4 text-nmcn-blue" />
                    Support Tickets
                  </p>
                  <button
                    onClick={() => setShowTicketModal(true)}
                    className="btn-outline px-3 py-1.5 text-xs"
                  >
                    New Ticket
                  </button>
                </div>
                {ticketsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-nmcn-blue" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-nmcn-muted">
                    No tickets yet. Need help? Submit one and track every reply right
                    here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => {
                      const meta =
                        TICKET_STATUS_META[t.status] || TICKET_STATUS_META.open;
                      return (
                        <Link
                          key={t.id}
                          href={`/support/${t.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-nmcn-border p-3 transition hover:border-nmcn-blue/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white">{t.subject}</p>
                            <p className="text-xs text-nmcn-muted">
                              #{t.id} · {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                              {t._count?.replies ?? 0} replies
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <SupportTicketModal
                open={showTicketModal}
                onClose={() => {
                  setShowTicketModal(false);
                  reloadTickets();
                }}
                defaultEmail={user.email}
                defaultName={user.name}
              />

              <div className="mt-4 flex flex-col gap-3">
                <Link href="/academy" className="btn-gold text-center py-2.5">
                  Back to Academy
                </Link>
                <AuthPrompt />
              </div>
            </>
          ) : (
            <div className="mb-8 text-center">
              <span className="mb-4 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
                Academy
              </span>
              <h1 className="mb-2 font-heading text-3xl font-bold text-white">
                Save Your <span className="gold-text">Progress</span>
              </h1>
              <p className="mb-4 text-sm text-nmcn-muted">
                Log in or create a free account to view your account
                information — plus lesson scores and certificates synced across
                devices.
              </p>
              <AuthPrompt initialMode={mode} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AcademyAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
        </div>
      }
    >
      <AcademyAccountContent />
    </Suspense>
  );
}
