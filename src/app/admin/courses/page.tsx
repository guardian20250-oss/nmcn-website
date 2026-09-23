"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  GraduationCap,
  Loader2,
  PenLine,
  Plus,
  Shield,
  Trash2,
  Check,
  X,
} from "lucide-react";

interface AdminCourse {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  passingScore: number;
  order: number;
  status: string;
  lessonCount: number;
  certificates: number;
  role: string;
  allowedRoles: string[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "GraduationCap",
    passingScore: 70,
    role: "creator",
    allowedRoles: [] as string[],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    icon: "GraduationCap",
    passingScore: 70,
    status: "draft",
    order: 0,
    role: "creator",
    allowedRoles: [] as string[],
  });
  const [assignModal, setAssignModal] = useState<number | null>(null);
  const [assignRoles, setAssignRoles] = useState<string[]>([]);
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const router = useRouter();

  const load = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({
          title: "",
          description: "",
          icon: "GraduationCap",
          passingScore: 70,
          role: "creator",
          allowedRoles: [],
        });
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: AdminCourse) => {
    setEditingId(c.id);
    setEditForm({
      title: c.title,
      description: c.description,
      icon: c.icon,
      passingScore: c.passingScore,
      status: c.status,
      order: c.order,
      role: c.role,
      allowedRoles: c.allowedRoles || [],
    });
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        setEditingId(null);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const startAssign = (c: AdminCourse) => {
    setAssignModal(c.id);
    setAssignRoles(c.allowedRoles || []);
  };

  const saveAssign = async (id: number) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "assignRoles", assignToRoles: assignRoles }),
      });
      if (res.ok) {
        setAssignModal(null);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleAssignRole = (role: string) => {
    setAssignRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const removeCourse = async (id: number) => {
    if (!confirm("Delete this course and all its lessons?")) return;
    const res = await fetch("/api/admin/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  };

  const toggleStatus = async (c: AdminCourse) => {
    await fetch("/api/admin/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: c.id,
        status: c.status === "published" ? "draft" : "published",
      }),
    });
    await load();
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">
              Creator Academy
            </h1>
            <p className="text-nmcn-muted">{courses.length} courses</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/certificates" className="btn-outline text-sm">
              <Award className="mr-1 inline h-4 w-4" /> Certificates
            </Link>
            <a
              href="/admin"
              className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
            >
              ← Dashboard
            </a>
          </div>
        </div>

        <form onSubmit={createCourse} className="card mb-8 space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            New Course
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="Course title *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className="input"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            >
              <option value="GraduationCap">GraduationCap</option>
              <option value="Video">Video (TikTok)</option>
              <option value="Swords">Swords (Battles)</option>
              <option value="MessagesSquare">MessagesSquare (Discord)</option>
              <option value="BookOpen">BookOpen</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="creator">Creator</option>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="scout">Scout</option>
              <option value="battle_coordinator">Battle Coordinator</option>
            </select>
            <div />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                Allowed Roles (extra access)
              </label>
              <select
                className="input"
                multiple
                value={form.allowedRoles}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                  setForm({ ...form, allowedRoles: selected });
                }}
              >
                <option value="manager">Manager</option>
                <option value="team_lead">Team Lead</option>
                <option value="scout">Scout</option>
                <option value="battle_coordinator">Battle Coordinator</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-gold w-full disabled:opacity-50"
              >
                <Plus className="mr-1 h-4 w-4" /> Create
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          {courses.length === 0 && (
            <div className="card p-10 text-center text-nmcn-muted">
              No courses yet — create one above or run the academy seed.
            </div>
          )}
          {courses.map((c) => (
            <div key={c.id} className="card p-6">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <input
                    className="input"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                  <textarea
                    className="textarea"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <select
                      className="input"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                    <input
                      className="input"
                      type="number"
                      value={editForm.passingScore}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          passingScore: Number(e.target.value),
                        })
                      }
                    />
                    <input
                      className="input"
                      type="number"
                      value={editForm.order}
                      onChange={(e) =>
                        setEditForm({ ...editForm, order: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-gold text-xs px-3 py-1.5 disabled:opacity-50"
                      disabled={saving}
                      onClick={() => saveEdit(c.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn-outline text-xs px-3 py-1.5"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-nmcn-blue" />
                      <span className="font-heading text-lg font-semibold text-white">
                        {c.title}
                      </span>
                      <span
                        className={`badge ${
                          c.status === "published"
                            ? "border-green-500/40 text-green-400"
                            : "border-yellow-500/40 text-yellow-400"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="badge">
                        <BookOpen className="mr-1 h-3 w-3" /> {c.lessonCount}
                      </span>
                      <span className="badge">
                        <Award className="mr-1 h-3 w-3" /> {c.certificates}
                      </span>
                    </div>
                    <p className="text-sm text-nmcn-muted">
                      /{c.slug} · pass {c.passingScore}% · order {c.order}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-nmcn-muted">
                      {c.description}
                    </p>
                    {(c.allowedRoles && c.allowedRoles.length > 0) && (
                      <p className="mt-1 text-xs text-nmcn-muted">
                        <Shield className="mr-1 inline h-3 w-3" />
                        Accessible to: {c.allowedRoles.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="btn-gold text-xs px-3 py-1.5"
                    >
                      <PenLine className="mr-1 inline h-3 w-3" /> Lessons
                    </Link>
                    <button
                      onClick={() => startAssign(c)}
                      className="btn-blue text-xs px-3 py-1.5"
                    >
                      <Shield className="mr-1 inline h-3 w-3" /> Assign Roles
                    </button>
                    <button
                      onClick={() => toggleStatus(c)}
                      className="btn-blue text-xs px-3 py-1.5"
                    >
                      {c.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => startEdit(c)}
                      className="btn-outline text-xs px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeCourse(c.id)}
                      className="btn-danger text-xs px-3 py-1.5"
                    >
                      <Trash2 className="inline h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="card max-w-md w-full mx-4 p-6">
              <h3 className="font-heading text-lg font-semibold text-white mb-4">
                <Shield className="mr-1 inline h-5 w-5 text-nmcn-blue" /> Assign Roles to Course
              </h3>
              <p className="mb-4 text-sm text-nmcn-muted">
                Select additional roles that can access this course (besides its primary role).
              </p>
              <div className="space-y-2">
                {["manager", "team_lead", "scout", "battle_coordinator"].map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignRoles.includes(role)}
                      onChange={() => toggleAssignRole(role)}
                      className="accent-nmcn-blue"
                    />
                    <span className="text-sm text-white capitalize">{role.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  className="btn-gold text-sm flex-1"
                  onClick={() => saveAssign(assignModal)}
                  disabled={saving}
                >
                  <Check className="mr-1 inline h-4 w-4" /> Save
                </button>
                <button
                  className="btn-outline text-sm"
                  onClick={() => setAssignModal(null)}
                >
                  <X className="mr-1 inline h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
