"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, Plus, CheckCircle, XCircle, Mail, Shield, GraduationCap, Crown, Search, Star, Swords, Eye } from "lucide-react";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-5 w-5 text-nmcn-blue" />,
  manager: <Users className="h-5 w-5 text-nmcn-gold" />,
  team_lead: <GraduationCap className="h-5 w-5 text-nmcn-blue" />,
  scout: <Search className="h-5 w-5 text-nmcn-blue" />,
  battle_coordinator: <Swords className="h-5 w-5 text-nmcn-blue" />,
  creator: <Star className="h-5 w-5 text-nmcn-gold" />,
  independent_creator: <Star className="h-5 w-5 text-nmcn-blue" />,
};

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Manager",
  team_lead: "Team Lead",
  scout: "Scout",
  battle_coordinator: "Battle Coordinator",
  creator: "Creator",
  independent_creator: "Independent Creator",
};

export default function StaffAccountsPage() {
  const [accounts, setAccounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "rejected" | "staff">("pending");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [createMsg, setCreateMsg] = useState("");
  const [approveForm, setApproveForm] = useState({ accountId: "", assignedRole: "creator" });
  const [approveLoading, setApproveLoading] = useState(false);
  const [accountRoles, setAccountRoles] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const router = useRouter();

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/admin/staff/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
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
    fetchAccounts();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus("loading");
    setCreateMsg("");
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createStaff", ...createForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateStatus("error");
        setCreateMsg(data.error || "Failed to create staff");
        return;
      }
      setCreateStatus("success");
      setCreateMsg(`Staff account created for ${data.staff.email}`);
      setCreateForm({ name: "", email: "", password: "", role: "admin" });
      fetchAccounts();
    } catch {
      setCreateStatus("error");
      setCreateMsg("Network error");
    }
  };

  const handleApprove = async (accountId: number) => {
    if (!accountId || busyId !== null) return;
    setActionError("");
    setBusyId(accountId);
    setApproveLoading(true);
    try {
      const assignedRole = accountRoles[String(accountId)] || approveForm.assignedRole || "creator";
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approveAccount", accountId: Number(accountId), assignedRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setApproveForm({ accountId: "", assignedRole: "creator" });
        await fetchAccounts();
      } else {
        setActionError(data.error || "Approve failed");
      }
    } catch {
      setActionError("Approve failed — network error");
    } finally {
      setApproveLoading(false);
      setBusyId(null);
    }
  };

  const handleReject = async (accountId: number) => {
    if (busyId !== null) return;
    setActionError("");
    setBusyId(accountId);
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rejectAccount", accountId: Number(accountId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchAccounts();
      } else {
        setActionError(data.error || "Reject failed");
      }
    } catch {
      setActionError("Reject failed — network error");
    } finally {
      setBusyId(null);
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
            <h1 className="font-heading text-2xl font-bold text-white">Admins Only</h1>
            <p className="mt-2 text-nmcn-muted">
              Creating staff accounts and approving or denying accounts requires an admin account.
            </p>
            <Link href="/admin" className="btn-outline mt-6 inline-flex">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pending = accounts?.pending || [];
  const active = accounts?.active || [];
  const rejected = accounts?.rejected || [];
  const staff = accounts?.staff || [];

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Staff & Accounts</h1>
            <p className="text-nmcn-muted">Manage staff accounts, creator accounts, and pending approvals.</p>
          </div>
          <Link href="/admin" className="btn-ghost text-sm">← Back to Dashboard</Link>
        </div>

        {/* Create Staff */}
        <div className="mb-8">
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">Create Staff Account</h2>
          {creating || createStatus === "loading" ? (
            <div className="card p-6 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-nmcn-blue" />
              <p className="text-sm text-nmcn-muted">Creating staff account...</p>
            </div>
          ) : createStatus === "success" ? (
            <div className="card p-6 text-center border-green-500/30">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
              <p className="text-sm text-white">{createMsg}</p>
            </div>
          ) : createStatus === "error" ? (
            <div className="card p-6 text-center border-red-500/30">
              <XCircle className="mx-auto mb-2 h-6 w-6 text-red-400" />
              <p className="text-sm text-red-400">{createMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleCreateStaff} className="card p-6">
              <div className="grid gap-4 md:grid-cols-4">
                <input
                  className="input"
                  placeholder="Full name *"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="Email *"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Password *"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
                <select
                  className="input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="scout">Scout</option>
                  <option value="battle_coordinator">Battle Coordinator</option>
                </select>
              </div>
              <button type="submit" className="btn-gold mt-4">
                Create Staff Account
              </button>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-nmcn-border">
          {(["pending", "active", "rejected", "staff"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${activeTab === tab ? "border-b-2 border-nmcn-blue text-nmcn-blue" : "text-nmcn-muted hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Pending */}
        {activeTab === "pending" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-white">
                Pending Accounts ({pending.length})
              </h2>
              <span className="text-sm text-nmcn-muted">Awaiting role assignment</span>
            </div>
            {pending.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
                <p className="text-nmcn-muted">No pending accounts.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {actionError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {actionError}
                  </div>
                )}
                {pending.map((account: any) => (
                  <div key={account.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-nmcn-border bg-nmcn-blue/10">
                          <Mail className="h-5 w-5 text-nmcn-blue" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{account.name}</p>
                          <p className="text-sm text-nmcn-muted">{account.email}</p>
                          {account.tiktokHandle && (
                            <p className="text-xs text-nmcn-muted">@{account.tiktokHandle}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-nmcn-muted">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-nmcn-muted">Assign role:</span>
                        <select
                          value={accountRoles[String(account.id)] || "creator"}
                          disabled={busyId === account.id}
                          onChange={(e) =>
                            setAccountRoles((prev) => ({
                              ...prev,
                              [String(account.id)]: e.target.value,
                            }))
                          }
                          className="input py-1 px-2 text-xs"
                        >
                          <option value="creator">Creator</option>
                          <option value="independent_creator">Independent Creator</option>
                          <option value="team_lead">Team Lead</option>
                          <option value="manager">Manager</option>
                          <option value="scout">Scout</option>
                          <option value="battle_coordinator">Battle Coordinator</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(account.id)}
                          disabled={busyId !== null}
                          className="btn-ghost text-sm text-red-400 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(account.id)}
                          disabled={busyId !== null}
                          className="btn-gold text-sm disabled:opacity-50"
                        >
                          {busyId === account.id && approveLoading ? "..." : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active */}
        {activeTab === "active" && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold text-white">
              Active Accounts ({active.length})
            </h2>
            {active.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No active accounts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {active.map((account: any) => (
                  <div key={account.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-nmcn-border bg-nmcn-blue/10">
                        {roleIcons[account.assignedRole] || <Users className="h-5 w-5 text-nmcn-blue" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{account.name}</p>
                        <p className="text-sm text-nmcn-muted">{account.email}</p>
                        {account.tiktokHandle && (
                          <p className="text-xs text-nmcn-muted">@{account.tiktokHandle}</p>
                        )}
                        <p className="text-xs text-nmcn-blue capitalize mt-1">
                          {roleLabels[account.assignedRole] || account.assignedRole}
                          {account.independentCreator && " • Independent"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-nmcn-muted">
                      Created {new Date(account.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rejected */}
        {activeTab === "rejected" && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold text-white">
              Rejected Accounts ({rejected.length})
            </h2>
            {rejected.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No rejected accounts.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {rejected.map((account: any) => (
                  <div key={account.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{account.name}</p>
                        <p className="text-sm text-nmcn-muted">{account.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-nmcn-muted">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Staff */}
        {activeTab === "staff" && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold text-white">
              Staff Accounts ({staff.length})
            </h2>
            {staff.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No staff accounts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {staff.map((s: any) => (
                  <div key={s.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-nmcn-border bg-nmcn-blue/10">
                        {roleIcons[s.role] || <Shield className="h-5 w-5 text-nmcn-blue" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        <p className="text-sm text-nmcn-muted">{s.email}</p>
                        <p className="text-xs text-nmcn-blue capitalize mt-1">
                          {roleLabels[s.role] || s.role}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-nmcn-muted">
                      Created {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
