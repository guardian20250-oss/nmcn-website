"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, Plus, CheckCircle, XCircle, Mail, Shield, GraduationCap, Crown, Search, Star, Swords, Eye, Pencil, Trash2, KeyRound, Copy, X } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<
    "pending" | "creators" | "independent" | "staff" | "rejected"
  >("pending");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [createMsg, setCreateMsg] = useState("");
  const [createdStaff, setCreatedStaff] = useState<{ name: string; email: string; role: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [approveForm, setApproveForm] = useState({ accountId: "", assignedRole: "creator" });
  const [approveLoading, setApproveLoading] = useState(false);
  const [accountRoles, setAccountRoles] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [editingCreator, setEditingCreator] = useState<any | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    tiktokHandle: "",
    assignedRole: "creator",
    status: "active",
    role: "admin",
    password: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const editFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editingCreator || editingStaff) {
      const id = window.setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [editingCreator, editingStaff]);

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
      setCreatedStaff({
        name: data.staff.name || createForm.name,
        email: data.staff.email || createForm.email,
        role: data.staff.role || createForm.role,
        tempPassword: createForm.password,
      });
      setCopied(false);
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

  const openEditCreator = (account: any) => {
    setEditingStaff(null);
    setEditError("");
    setEditingCreator(account);
    setEditForm({
      name: account.name || "",
      email: account.email || "",
      tiktokHandle: account.tiktokHandle || "",
      assignedRole: account.assignedRole || "creator",
      status: account.status || "active",
      role: "admin",
      password: "",
    });
  };

  const openEditStaff = (s: any) => {
    setEditingCreator(null);
    setEditError("");
    setEditingStaff(s);
    setEditForm({
      name: s.name || "",
      email: s.email || "",
      tiktokHandle: "",
      assignedRole: "creator",
      status: "active",
      role: s.role || "admin",
      password: "",
    });
  };

  const closeEdit = () => {
    setEditingCreator(null);
    setEditingStaff(null);
    setEditError("");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    try {
      if (editingCreator) {
        const res = await fetch("/api/admin/staff/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateAccount",
            id: editingCreator.id,
            name: editForm.name,
            email: editForm.email,
            tiktokHandle: editForm.tiktokHandle || null,
            assignedRole: editForm.assignedRole,
            status: editForm.status,
            independentCreator: editForm.assignedRole === "independent_creator",
            password: editForm.password || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEditError(data.error || "Update failed");
          return;
        }
      } else if (editingStaff) {
        const res = await fetch("/api/admin/staff/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateStaff",
            id: editingStaff.id,
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEditError(data.error || "Update failed");
          return;
        }
      }
      closeEdit();
      await fetchAccounts();
    } catch {
      setEditError("Network error");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteCreator = async (id: number) => {
    if (!window.confirm("Delete this creator account? This cannot be undone.")) return;
    setActionError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAccount", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error || "Delete failed");
      else await fetchAccounts();
    } catch {
      setActionError("Delete failed — network error");
    } finally {
      setBusyId(null);
    }
  };

  const deleteStaffMember = async (id: number) => {
    if (!window.confirm("Delete this staff account? This cannot be undone.")) return;
    setActionError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/staff/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteStaff", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error || "Delete failed");
      else await fetchAccounts();
    } catch {
      setActionError("Delete failed — network error");
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
  const rejected = accounts?.rejected || [];
  const staff = accounts?.staff || [];
  const activeAccounts = accounts?.active || [];
  const isIndependent = (a: any) =>
    Boolean(a.independentCreator) || a.assignedRole === "independent_creator";
  const creators = accounts?.creators || activeAccounts.filter((a: any) => !isIndependent(a));
  const independent = accounts?.independent || activeAccounts.filter(isIndependent);
  const tabDefs = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "creators", label: "Creators", count: creators.length },
    { id: "independent", label: "Independent", count: independent.length },
    { id: "staff", label: "Staff", count: staff.length },
    { id: "rejected", label: "Rejected", count: rejected.length },
  ] as const;

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Staff & Accounts</h1>
            <p className="text-nmcn-muted">            Creators, independent creators, and staff are managed as separate categories.</p>
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
              <button
                type="button"
                onClick={() => {
                  setCreateStatus("idle");
                  setCreateMsg("");
                }}
                className="btn-outline mt-4 text-sm"
              >
                Create Another
              </button>
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
                    {roleLabels[createdStaff.role] || createdStaff.role}
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

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-nmcn-border">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "border-b-2 border-nmcn-blue text-nmcn-blue" : "text-nmcn-muted hover:text-white"}`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-nmcn-muted">({tab.count})</span>
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </div>
        )}

        {(editingCreator || editingStaff) && (
          <form ref={editFormRef} onSubmit={saveEdit} className="card mb-6 border border-nmcn-blue/50 p-6 shadow-lg shadow-nmcn-blue/10">
            <h2 className="mb-4 font-heading text-lg font-semibold text-white">
              {editingCreator ? "Edit Creator Account" : "Edit Staff Account"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="input"
                placeholder="Full name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <input
                className="input"
                type="email"
                placeholder="Email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              {editingCreator && (
                <>
                  <input
                    className="input"
                    placeholder="TikTok handle"
                    value={editForm.tiktokHandle}
                    onChange={(e) => setEditForm({ ...editForm, tiktokHandle: e.target.value })}
                  />
                  <select
                    className="input"
                    value={editForm.assignedRole}
                    onChange={(e) => setEditForm({ ...editForm, assignedRole: e.target.value })}
                  >
                    <optgroup label="Creators">
                      <option value="creator">Creator</option>
                      <option value="independent_creator">Independent Creator</option>
                    </optgroup>
                    <optgroup label="Staff">
                      <option value="team_lead">Team Lead</option>
                      <option value="manager">Manager</option>
                      <option value="scout">Scout</option>
                      <option value="battle_coordinator">Battle Coordinator</option>
                      <option value="admin">Admin</option>
                    </optgroup>
                  </select>
                  <select
                    className="input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    className="input"
                    type="password"
                    placeholder="New password (optional, 8+ chars)"
                    minLength={8}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                </>
              )}
              {editingStaff && (
                <select
                  className="input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="scout">Scout</option>
                  <option value="battle_coordinator">Battle Coordinator</option>
                </select>
              )}
            </div>
            {editError && (
              <p className="mt-3 text-sm text-red-400">{editError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={editSaving} className="btn-gold disabled:opacity-50">
                {editSaving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={closeEdit} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        )}

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
                          <optgroup label="Creators">
                            <option value="creator">Creator</option>
                            <option value="independent_creator">Independent Creator</option>
                          </optgroup>
                          <optgroup label="Staff">
                            <option value="team_lead">Team Lead</option>
                            <option value="manager">Manager</option>
                            <option value="scout">Scout</option>
                            <option value="battle_coordinator">Battle Coordinator</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(account.id)}
                          disabled={busyId !== null}
                          className="btn-ghost text-sm text-red-400 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
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

        {/* Creators */}
        {activeTab === "creators" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-white">
                Creators ({creators.length})
              </h2>
              <span className="text-sm text-nmcn-muted">Agency creators</span>
            </div>
            {creators.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No active creator accounts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {creators.map((account: any) => (
                  <div key={account.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
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
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-nmcn-muted">
                          Created {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditCreator(account)}
                          disabled={busyId !== null}
                          className="btn-outline flex items-center gap-1 text-xs disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCreator(account.id)}
                          disabled={busyId !== null}
                          className="btn-ghost flex items-center gap-1 text-xs text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Independent Creators */}
        {activeTab === "independent" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-white">
                Independent Creators ({independent.length})
              </h2>
              <span className="text-sm text-nmcn-muted">Separate from agency creators</span>
            </div>
            {independent.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No active independent creator accounts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {independent.map((account: any) => (
                  <div key={account.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-nmcn-border bg-nmcn-gold/10">
                          {roleIcons[account.assignedRole] || <Star className="h-5 w-5 text-nmcn-gold" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{account.name}</p>
                          <p className="text-sm text-nmcn-muted">{account.email}</p>
                          {account.tiktokHandle && (
                            <p className="text-xs text-nmcn-muted">@{account.tiktokHandle}</p>
                          )}
                          <p className="text-xs text-nmcn-gold capitalize mt-1">
                            {roleLabels[account.assignedRole] || account.assignedRole}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-nmcn-muted">
                          Created {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditCreator(account)}
                          disabled={busyId !== null}
                          className="btn-outline flex items-center gap-1 text-xs disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCreator(account.id)}
                          disabled={busyId !== null}
                          className="btn-ghost flex items-center gap-1 text-xs text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
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
                  <div key={account.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{account.name}</p>
                          <p className="text-sm text-nmcn-muted">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-nmcn-muted">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditCreator(account)}
                          disabled={busyId !== null}
                          className="btn-outline flex items-center gap-1 text-xs disabled:opacity-50"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCreator(account.id)}
                          disabled={busyId !== null}
                          className="btn-ghost flex items-center gap-1 text-xs text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
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
            <p className="mb-4 text-sm text-nmcn-muted">
              Staff roles live only here — separate from creator accounts.
            </p>
            {staff.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No staff accounts yet.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {staff.map((s: any) => (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-nmcn-muted">
                          Created {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditStaff(s)}
                          disabled={busyId !== null}
                          className="btn-outline flex items-center gap-1 text-xs disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStaffMember(s.id)}
                          disabled={busyId !== null}
                          className="btn-ghost flex items-center gap-1 text-xs text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
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
