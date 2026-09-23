"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, Loader2, Search, ShieldCheck, XCircle, Download } from "lucide-react";

interface CertRow {
  id: number;
  code: string;
  learnerName: string;
  completedAt: string;
  createdAt: string;
  creator: { id: number; name: string; email: string } | null;
  course: { title: string; slug: string };
}

interface CourseOption {
  slug: string;
  title: string;
}

export default function AdminCertificatesPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CertRow | null>(null);
  const [notFound, setNotFound] = useState("");
  const [searching, setSearching] = useState(false);
  const [rows, setRows] = useState<CertRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseSlug, setCourseSlug] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadList = async (opts?: { courseSlug?: string; name?: string }) => {
    try {
      const qs = new URLSearchParams();
      if (opts?.courseSlug) qs.set("courseSlug", opts.courseSlug);
      if (opts?.name) qs.set("name", opts.name);
      const res = await fetch(`/api/admin/certificates?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.certificates || []);
        setCourses(data.courses || []);
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
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearching(true);
    setResult(null);
    setNotFound("");
    try {
      const res = await fetch(
        `/api/admin/certificates?code=${encodeURIComponent(code.trim())}`
      );
      const data = await res.json();
      if (res.ok && data.certificate) {
        setResult(data.certificate);
      } else {
        setNotFound(data.error || "No certificate matches this code");
      }
    } catch {
      setNotFound("Lookup failed — try again.");
    } finally {
      setSearching(false);
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
            <h1 className="font-heading text-3xl font-bold text-white">
              Certificates
            </h1>
            <p className="text-nmcn-muted">
              Verify short codes · staff only · {rows.length} loaded
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/courses" className="btn-outline text-sm">
              Academy
            </Link>
            <a
              href="/admin"
              className="text-sm text-nmcn-muted transition hover:text-nmcn-blue"
            >
              ← Dashboard
            </a>
          </div>
        </div>

        <form onSubmit={verifyCode} className="card mb-8 p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-white">
            Verify a code
          </h2>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="input flex-1"
              placeholder="e.g. NMCN-TIKTOK-7F3A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-gold disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Lookup
            </button>
          </div>

          {result && (
            <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <span className="font-semibold text-green-400">
                  Valid certificate
                </span>
              </div>
              <div className="grid gap-2 text-sm text-white md:grid-cols-2">
                <p>
                  <span className="text-nmcn-muted">Code:</span>{" "}
                  <span className="font-mono text-nmcn-gold">{result.code}</span>
                </p>
                <p>
                  <span className="text-nmcn-muted">Learner:</span>{" "}
                  {result.learnerName}
                </p>
                <p>
                  <span className="text-nmcn-muted">Course:</span>{" "}
                  {result.course.title}
                </p>
                <p>
                  <span className="text-nmcn-muted">Issued:</span>{" "}
                  {new Date(result.completedAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-nmcn-muted">Account:</span>{" "}
                  {result.creator
                    ? `${result.creator.name} (${result.creator.email})`
                    : "Guest"}
                </p>
              </div>
              <a
                href={`/api/admin/certificates/download?code=${result.code}`}
                download={`certificate-${result.code}.pdf`}
                className="mt-3 btn-blue text-sm inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> Download PDF
              </a>
            </div>
          )}

          {notFound && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
              <XCircle className="h-4 w-4" /> {notFound}
            </div>
          )}
        </form>

        <div className="card p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-heading text-lg font-semibold text-white">
              <Award className="mr-1 inline h-4 w-4 text-nmcn-gold" />
              All certificates
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="input !w-auto"
                value={courseSlug}
                onChange={(e) => {
                  setCourseSlug(e.target.value);
                  loadList({ courseSlug: e.target.value, name });
                }}
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
              <input
                className="input !w-48"
                placeholder="Filter by name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    loadList({ courseSlug, name: e.currentTarget.value });
                }}
              />
              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => loadList({ courseSlug, name })}
              >
                Filter
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="py-8 text-center text-nmcn-muted">
              No certificates issued yet.
            </p>
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
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-nmcn-border/50 text-nmcn-muted"
                    >
                      <td className="py-3 pr-4 font-mono text-nmcn-gold">
                        {r.code}
                      </td>
                      <td className="py-3 pr-4 text-white">{r.learnerName}</td>
                      <td className="py-3 pr-4">{r.course.title}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`badge ${
                            r.creator
                              ? "border-nmcn-blue/40 text-nmcn-blue"
                              : "border-nmcn-border text-nmcn-muted"
                          }`}
                        >
                          {r.creator ? "Account" : "Guest"}
                        </span>
                      </td>
                      <td className="py-3">
                        {new Date(r.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
