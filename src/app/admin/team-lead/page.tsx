"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Loader2,
  PenLine,
  Plus,
  Trash2,
  Search,
  Download,
  ShieldCheck,
  XCircle,
  GraduationCap,
} from "lucide-react";

interface CourseRow {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  passingScore: number;
  order: number;
  status: string;
  lessonCount: number;
  role: string;
}

interface CertRow {
  id: number;
  code: string;
  learnerName: string;
  completedAt: string;
  course: { title: string; slug: string };
  creator: { name: string; email: string } | null;
}

interface CourseForm {
  title: string;
  description: string;
  icon: string;
  passingScore: number;
  role: string;
  order: number;
}

export default function TeamLeadDashboard() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CourseForm>({
    title: "",
    description: "",
    icon: "BookOpen",
    passingScore: 70,
    role: "team_lead",
    order: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CourseForm>({
    title: "",
    description: "",
    icon: "BookOpen",
    passingScore: 70,
    role: "team_lead",
    order: 0,
  });
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<CertRow | null>(null);
  const [searching, setSearching] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      const cr = await fetch("/api/admin/courses");
      if (cr.ok) setCourses((await cr.json()).courses || []);
      const ce = await fetch("/api/admin/certificates");
      if (ce.ok) setCerts((await ce.json()).certificates || []);
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
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
        setForm({ title: "", description: "", icon: "BookOpen", passingScore: 70, role: "team_lead", order: 0 });
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: CourseRow) => {
    setEditingId(c.id);
    setEditForm({
      title: c.title,
      description: c.description,
      icon: c.icon,
      passingScore: c.passingScore,
      role: c.role || "team_lead",
      order: c.order,
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

  const removeCourse = async (id: number) => {
    if (!confirm("Delete this course and all its lessons?")) return;
    const res = await fetch("/api/admin/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/admin/certificates?code=${encodeURIComponent(searchCode.trim())}`);
      const data = await res.json();
      if (res.ok && data.certificate) {
        setSearchResult(data.certificate);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const downloadCert = async (code: string) => {
    setDownloadLoading(true);
    try {
      const res = await fetch(`/api/admin/certificates?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.certificate) {
        window.open(`/api/admin/certificates/download?code=${encodeURIComponent(code)}`, "_blank");
      }
    } catch {
      // ignore
    } finally {
      setDownloadLoading(false);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Team Lead Dashboard</h1>
            <p className="text-nmcn-muted">{courses.length} courses · {certs.length} certificates issued</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="text-sm text-nmcn-muted transition hover:text-nmcn-blue">
              ← Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Certificate Verification */}
        <div className="card mb-8 p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-white">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-nmcn-gold" /> Verify Certificate
          </h2>
          <form onSubmit={verifyCode} className="flex flex-col gap-3 md:flex-row">
            <input
              className="input flex-1"
              placeholder="e.g. NMCN-TIKTOK-7F3A"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <button type="submit" disabled={searching} className="btn-gold disabled:opacity-50">
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Lookup
            </button>
          </form>
          {searchResult && (
            <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <span className="font-semibold text-green-400">Valid certificate</span>
              </div>
              <div className="grid gap-2 text-sm text-white md:grid-cols-2">
                <p><span className="text-nmcn-muted">Code:</span> <span className="font-mono text-nmcn-gold">{searchResult.code}</span></p>
                <p><span className="text-nmcn-muted">Learner:</span> {searchResult.learnerName}</p>
                <p><span className="text-nmcn-muted">Course:</span> {searchResult.course.title}</p>
                <p><span className="text-nmcn-muted">Issued:</span> {new Date(searchResult.completedAt).toLocaleDateString()}</p>
                <p><span className="text-nmcn-muted">Account:</span> {searchResult.creator ? `${searchResult.creator.name} (${searchResult.creator.email})` : "Guest"}</p>
              </div>
              <button
                onClick={() => downloadCert(searchResult.code)}
                disabled={downloadLoading}
                className="mt-3 btn-blue text-sm"
              >
                {downloadLoading ? "Generating..." : <><Download className="mr-1 inline h-3 w-3" /> Download PDF</>}
              </button>
            </div>
          )}
          {!searchResult && searchCode && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
              <XCircle className="h-4 w-4" /> No certificate matches that code
            </div>
          )}
        </div>

        {/* All Certificates */}
        <div className="card p-6 mb-8">
          <h2 className="mb-4 font-heading text-lg font-semibold text-white">
            <Award className="mr-1 inline h-4 w-4 text-nmcn-gold" /> All Certificates
          </h2>
          {certs.length === 0 ? (
            <p className="text-nmcn-muted text-sm">No certificates issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-nmcn-border text-xs uppercase tracking-wider text-nmcn-muted">
                    <th className="pb-2 pr-4">Code</th>
                    <th className="pb-2 pr-4">Learner</th>
                    <th className="pb-2 pr-4">Course</th>
                    <th className="pb-2 pr-4">Source</th>
                    <th className="pb-2">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((r) => (
                    <tr key={r.id} className="border-b border-nmcn-border/50 text-nmcn-muted">
                      <td className="py-3 pr-4 font-mono text-nmcn-gold">{r.code}</td>
                      <td className="py-3 pr-4 text-white">{r.learnerName}</td>
                      <td className="py-3 pr-4">{r.course.title}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${r.creator ? "border-nmcn-blue/40 text-nmcn-blue" : "border-nmcn-border text-nmcn-muted"}`}>
                          {r.creator ? "Account" : "Guest"}
                        </span>
                      </td>
                      <td className="py-3">{new Date(r.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course Management */}
        <h2 className="mb-4 font-heading text-xl font-semibold text-white">Manage Courses</h2>

        <form onSubmit={createCourse} className="card mb-8 space-y-4 p-6">
          <h3 className="font-heading text-lg font-semibold text-white">New Course</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Course title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
              <option value="BookOpen">BookOpen</option>
              <option value="GraduationCap">GraduationCap</option>
              <option value="Video">Video</option>
              <option value="Swords">Swords</option>
              <option value="MessagesSquare">MessagesSquare</option>
            </select>
          </div>
          <textarea className="textarea" rows={2} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Pass %</label>
              <input className="input" type="number" min={0} max={100} value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="btn-gold w-full disabled:opacity-50">
                <Plus className="mr-1 h-4 w-4" /> Create
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          {courses.length === 0 && (
            <div className="card p-10 text-center text-nmcn-muted">No courses yet.</div>
          )}
          {courses.map((c) => (
            <div key={c.id} className="card p-6">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <input className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  <textarea className="textarea" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                      <option value="team_lead">Team Lead</option>
                      <option value="manager">Manager</option>
                      <option value="scout">Scout</option>
                      <option value="battle_coordinator">Battle Coordinator</option>
                    </select>
                    <input className="input" type="number" value={editForm.passingScore} onChange={(e) => setEditForm({ ...editForm, passingScore: Number(e.target.value) })} />
                    <input className="input" type="number" value={editForm.order} onChange={(e) => setEditForm({ ...editForm, order: Number(e.target.value) })} />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-gold text-xs px-3 py-1.5 disabled:opacity-50" disabled={saving} onClick={() => saveEdit(c.id)}>Save</button>
                    <button className="btn-outline text-xs px-3 py-1.5" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-nmcn-blue" />
                      <span className="font-heading text-lg font-semibold text-white">{c.title}</span>
                      <span className={`badge ${c.status === "published" ? "border-green-500/40 text-green-400" : "border-yellow-500/40 text-yellow-400"}`}>{c.status}</span>
                      <span className="badge"><BookOpen className="mr-1 h-3 w-3" /> {c.lessonCount}</span>
                    </div>
                    <p className="text-sm text-nmcn-muted">/{c.slug} · pass {c.passingScore}%</p>
                    <p className="mt-1 line-clamp-2 text-sm text-nmcn-muted">{c.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/courses/${c.id}`} className="btn-gold text-xs px-3 py-1.5">
                      <PenLine className="mr-1 inline h-3 w-3" /> Lessons
                    </Link>
                    <button onClick={() => startEdit(c)} className="btn-outline text-xs px-3 py-1.5">Edit</button>
                    <button onClick={() => removeCourse(c.id)} className="btn-danger text-xs px-3 py-1.5"><Trash2 className="inline h-3 w-3" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
