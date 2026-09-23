"use client";

import { useLayoutEffect, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, BarChart3, Loader2, Plus, UserPlus, Users } from "lucide-react";

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
              message === "Account created."
                ? "border-green-500/40 text-green-400"
                : "border-red-500/40 text-red-400"
            }`}
          >
            {message}
          </div>
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
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-heading text-lg font-semibold text-white">
                        {c.name}
                      </span>
                      <span
                        className={`badge ${
                          c.active
                            ? "border-green-500/40 text-green-400"
                            : "border-nmcn-border text-nmcn-muted"
                        }`}
                      >
                        {c.active ? "active" : "inactive"}
                      </span>
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