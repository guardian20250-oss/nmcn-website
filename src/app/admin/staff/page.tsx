"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Shield, UserCog, CheckCircle, KeyRound, Copy, X } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "team_lead", label: "Team Lead" },
  { value: "scout", label: "Scout" },
  { value: "battle_coordinator", label: "Battle Coordinator" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  team_lead: "Team Lead",
  scout: "Scout",
  battle_coordinator: "Battle Coordinator",
};

interface StaffMember {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [admins, setAdmins] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "scout",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createdStaff, setCreatedStaff] = useState<{ name: string; email: string; role: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
        setSelfId(data.selfId ?? null);
      } else if (res.status === 401) {
        router.push("/admin/login");
        return;
      } else {
        setForbidden(true);
      }
    } catch {
      router.push("/admin/login");
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("Staff account created.");
        setCreatedStaff({
          name: form.name,
          email: form.email,
          role: form.role,
          tempPassword: form.password,
        });
        setCopied(false);
        setForm({ name: "", email: "", password: "", role: "scout" });
        await load();
      } else {
        setMessage(data.error || "Failed to create account");
      }
    } catch {
      setMessage("Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id: number, role: string) => {
    setMessage("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEditingId(null);
        setMessage(`Role updated to ${ROLE_LABELS[role] || role}.`);
        await load();
      } else {
        setMessage(data.error || "Failed to update role");
      }
    } catch {
      setMessage("Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen px-6 pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="card p-10 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10 text-nmcn-gold" />
            <h1 className="font-heading text-2xl font-bold text-white">
              Admins Only
            </h1>
            <p className="mt-2 text-nmcn-muted">
              Staff role management requires an admin account.
            </p>
            <Link href="/admin" className="btn-outline mt-6 inline-flex">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Shield className="h-7 w-7 text-nmcn-blue" />
              <h1 className="font-heading text-3xl font-bold text-white">
                Staff Roles
              </h1>
            </div>
            <p className="text-nmcn-muted">
              {admins.length} team members · managers, leads & scouts
            </p>
          </div>
          <a
            href="/admin"
            className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
          >
            ← Dashboard
          </a>
        </div>

        {message && (
          <div
            className={`card mb-6 border p-4 text-sm ${
              message.startsWith("Staff") || message.startsWith("Role")
                ? "border-green-500/40 text-green-400"
                : "border-red-500/40 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {createdStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setCreatedStaff(null)}
            />
            <div className="card relative w-full max-w-md p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setCreatedStaff(null)}
                className="absolute top-4 right-4 text-nmcn-muted transition hover:text-nmcn-blue"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/40 bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Staff Account Created
                  </h3>
                  <p className="text-xs text-nmcn-muted">
                    Share these credentials securely with the new staff member.
                  </p>
                </div>
              </div>
              <dl className="mb-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3 rounded-lg border border-nmcn-border bg-nmcn-deep/40 px-3 py-2">
                  <dt className="text-nmcn-muted">Name</dt>
                  <dd className="text-right text-white">{createdStaff.name}</dd>
                </div>
                <div className="flex justify-between gap-3 rounded-lg border border-nmcn-border bg-nmcn-deep/40 px-3 py-2">
                  <dt className="text-nmcn-muted">Email</dt>
                  <dd className="break-all text-right text-white">{createdStaff.email}</dd>
                </div>
                <div className="flex justify-between gap-3 rounded-lg border border-nmcn-border bg-nmcn-deep/40 px-3 py-2">
                  <dt className="text-nmcn-muted">Role</dt>
                  <dd className="text-right capitalize text-nmcn-blue">
                    {ROLE_LABELS[createdStaff.role] || createdStaff.role}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 rounded-lg border border-nmcn-gold/40 bg-nmcn-gold/10 px-3 py-2">
                  <dt className="flex items-center gap-1.5 text-nmcn-gold">
                    <KeyRound className="h-3.5 w-3.5" /> Temp password
                  </dt>
                  <dd className="flex items-center gap-2 break-all text-right font-mono text-white">
                    {createdStaff.tempPassword}
                    <button
                      type="button"
                      title="Copy password"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(createdStaff.tempPassword)
                          .then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          })
                          .catch(() => {});
                      }}
                      className="text-nmcn-muted transition hover:text-nmcn-blue"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {copied && <span className="text-xs text-green-400">Copied</span>}
                  </dd>
                </div>
              </dl>
              <p className="mb-5 rounded-lg border border-nmcn-blue/30 bg-nmcn-blue/10 px-3 py-2.5 text-xs text-nmcn-muted">
                <strong className="text-nmcn-blue">Must change password:</strong>{" "}
                When {createdStaff.email} signs in for the first time, a popup
                will force them to set a new password before accessing the
                dashboard.
              </p>
              <button
                type="button"
                onClick={() => setCreatedStaff(null)}
                className="btn-gold w-full"
              >
                Done
              </button>
            </div>
          </div>
        )}

        <form onSubmit={createStaff} className="card mb-8 space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Invite Staff Member
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="Full name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              type="email"
              placeholder="Email *"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input"
              type="password"
              placeholder="Password * (min 8 chars)"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-nmcn-muted">
            Admin: everything · Manager / Team Lead: courses + creator
            dashboard · Scout: create academy accounts only
          </p>
          <button
            type="submit"
            disabled={saving}
            className="btn-gold disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1 inline h-4 w-4" />
            )}
            Create Account
          </button>
        </form>

        <div className="space-y-4">
          {admins.map((a) => (
            <div key={a.id} className="card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
                    <UserCog className="h-6 w-6 text-nmcn-blue" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-lg font-semibold text-white">
                        {a.name}
                      </span>
                      <span
                        className={`badge ${
                          a.role === "admin"
                            ? "border-nmcn-gold/40 text-nmcn-gold"
                            : "border-nmcn-blue/40 text-nmcn-blue"
                        }`}
                      >
                        {ROLE_LABELS[a.role] || a.role}
                      </span>
                      {selfId === a.id && (
                        <span className="badge border-nmcn-border text-nmcn-muted">
                          you
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-nmcn-muted">
                      {a.email} · joined{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === a.id ? (
                    <>
                      <select
                        className="input py-1.5 text-sm"
                        defaultValue={a.role}
                        onChange={(e) => changeRole(a.id, e.target.value)}
                        autoFocus
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-outline text-xs px-3 py-1.5"
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingId(a.id)}
                      className="btn-outline text-xs px-3 py-1.5"
                    >
                      Change Role
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/admin"
            className="text-sm text-nmcn-muted hover:text-nmcn-blue transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
