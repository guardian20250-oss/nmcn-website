"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, BarChart3, Loader2, Plus, UserPlus, Users, Pencil, Trash2 } from "lucide-react";

interface CourseProgress {
  courseId: number;
  title: string;
  slug: string;
  lessonCount: number;
  completed: number;
  percent: number;
}

interface CreatorRow {
  id: number;
  name: string;
  email: string;
  tiktokHandle: string | null;
  status: string;
  assignedRole: string;
  independentCreator: boolean;
  createdAt: string;
  createdBy: { id: number; name: string; role: string } | null;
  lessonCount: number;
  passedLessons: number;
  overallPercent: number;
  certificates: number;
  courses: CourseProgress[];
  lastActiveAt: string | null;
  active: boolean;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  avgPercent: number;
  certificates: number;
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [createOnly, setCreateOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tiktokHandle: "",
  });
  const [editing, setEditing] = useState<CreatorRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    tiktokHandle: "",
    assignedRole: "creator",
    status: "active",
    password: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const load = async () => {
    try {
      const res = await fetch("/api/admin/creators");
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
        setSummary(data.summary || null);
        setCanCreate(Boolean(data.canCreate));
        setCreateOnly(false);
      } else if (res.status === 401) {
        router.push("/admin/login");
        return;
      } else {
        setCreateOnly(true);
        setCanCreate(true);
      }
    } catch {
      router.push("/admin/login");
      return;
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("create") === "1"
    ) {
      setShowCreate(true);
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) {
      const id = window.setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [editing]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          tiktokHandle: form.tiktokHandle || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("Account created.");
        setForm({ name: "", email: "", password: "", tiktokHandle: "" });
        setShowCreate(false);
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

  const openEdit = (c: CreatorRow) => {
    setMessage("");
    setEditError("");
    setEditing(c);
    setEditForm({
      name: c.name || "",
      email: c.email || "",
      tiktokHandle: c.tiktokHandle || "",
      assignedRole: c.assignedRole || "creator",
      status: c.status || "active",
      password: "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditError("");
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
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
      closeEdit();
      setMessage("Account updated.");
      await load();
    } catch {
      setEditError("Network error");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteCreator = async (id: number) => {
    if (!window.confirm("Delete this creator account? This cannot be undone.")) return;
    setBusyId(id);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/creators?id=${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Delete failed");
        return;
      }
      setMessage("Account deleted.");
      await load();
    } catch {
      setMessage("Delete failed");
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

  return (
    <div className="min-h-screen px-6 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <BarChart3 className="h-7 w-7 text-nmcn-blue" />
              <h1 className="font-heading text-3xl font-bold text-white">
                Creator Progress
              </h1>
            </div>
            <p className="text-nmcn-muted">
              {createOnly
                ? "Create academy accounts for new creators"
                : `${summary?.active || 0} active · ${summary?.total || 0} total creators`}
            </p>
          </div>
          <div className="flex gap-3">
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreate((v) => !v)}
                className="btn-gold text-sm"
              >
                <UserPlus className="mr-1 inline h-4 w-4" /> New Account
              </button>
            )}
            <a
              href="/admin"
              className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
            >
              ← Dashboard
            </a>
          </div>
        </div>

        {message && (
          <div
            className={`card mb-6 border p-4 text-sm ${
              message.includes("created") || message.includes("updated") || message.includes("deleted")
                ? "border-green-500/40 text-green-400"
                : "border-red-500/40 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {editing && (
          <form ref={editFormRef} onSubmit={saveEdit} className="card mb-8 space-y-4 border border-nmcn-blue/50 p-6 shadow-lg shadow-nmcn-blue/10">
            <h2 className="font-heading text-lg font-semibold text-white">
              Edit Account — {editing.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="input"
                placeholder="Name"
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
                <option value="creator">Creator</option>
                <option value="independent_creator">Independent Creator</option>
                <option value="team_lead">Team Lead</option>
                <option value="manager">Manager</option>
                <option value="scout">Scout</option>
                <option value="battle_coordinator">Battle Coordinator</option>
                <option value="admin">Admin</option>
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
            </div>
            {editError && <p className="text-sm text-red-400">{editError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={editSaving} className="btn-gold disabled:opacity-50">
                {editSaving ? (
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                ) : null}
                Save
              </button>
              <button type="button" onClick={closeEdit} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        )}

        {showCreate && canCreate && (
          <form onSubmit={createAccount} className="card mb-8 space-y-4 p-6">
            <h2 className="font-heading text-lg font-semibold text-white">
              Create Account
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="input"
                placeholder="Creator name *"
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
              <input
                className="input"
                placeholder="TikTok handle (optional)"
                value={form.tiktokHandle}
                onChange={(e) =>
                  setForm({ ...form, tiktokHandle: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
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
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!createOnly && (
          <div className="mb-8 grid gap-6 md:grid-cols-4">
            <div className="stat-card">
              <div className="stat-num">{summary?.total || 0}</div>
              <div className="stat-label">Total Creators</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{summary?.active || 0}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{summary?.avgPercent || 0}%</div>
              <div className="stat-label">Avg Completion</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{summary?.certificates || 0}</div>
              <div className="stat-label">Certificates</div>
            </div>
          </div>
        )}

        {!createOnly && (
          <div className="space-y-4">
            {creators.length === 0 && (
              <div className="card p-10 text-center text-nmcn-muted">
                <Users className="mx-auto mb-3 h-8 w-8 text-nmcn-muted" />
                No academy creators yet.
              </div>
            )}
            {creators.map((c) => (
              <div key={c.id} className="card p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-heading text-lg font-semibold text-white">
                    {c.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      disabled={busyId !== null}
                      className="btn-outline flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCreator(c.id)}
                      disabled={busyId === c.id}
                      className="btn-ghost flex items-center gap-1 text-xs text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`badge ${
                          c.active
                            ? "border-green-500/40 text-green-400"
                            : "border-nmcn-border text-nmcn-muted"
                        }`}
                      >
                        {c.active ? "active" : "inactive"}
                      </span>
                      <span className="badge border-nmcn-blue/40 text-nmcn-blue capitalize">
                        {c.assignedRole || "creator"}
                      </span>
                      {c.status && c.status !== "active" && (
                        <span className="badge border-nmcn-gold/40 text-nmcn-gold capitalize">
                          {c.status}
                        </span>
                      )}
                      {c.certificates > 0 && (
                        <span className="badge border-nmcn-gold/40 text-nmcn-gold">
                          <Award className="mr-1 h-3 w-3" /> {c.certificates}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-nmcn-muted">
                      {c.email}
                      {c.tiktokHandle ? ` · ${c.tiktokHandle}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-nmcn-muted">
                      {c.passedLessons}/{c.lessonCount || 0} lessons ·{" "}
                      {c.lastActiveAt
                        ? `last active ${new Date(c.lastActiveAt).toLocaleDateString()}`
                        : "no activity yet"}
                      {c.createdBy ? ` · by ${c.createdBy.name}` : ""}
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-nmcn-border/50">
                      <div
                        className="h-full rounded-full bg-nmcn-blue transition-all"
                        style={{ width: `${c.overallPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-nmcn-blue">
                      {c.overallPercent}% overall
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 md:w-64">
                    {c.courses.map((course) => (
                      <div
                        key={course.courseId}
                        className="rounded-lg border border-nmcn-border px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate text-white">
                            {course.title}
                          </span>
                          <span className="ml-2 shrink-0 text-nmcn-muted">
                            {course.completed}/{course.lessonCount}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-nmcn-border/50">
                          <div
                            className="h-full rounded-full bg-nmcn-gold"
                            style={{ width: `${course.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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