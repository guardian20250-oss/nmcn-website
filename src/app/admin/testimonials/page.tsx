"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  PenLine,
  Trash2,
  Save,
} from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
  status: string;
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", quote: "", rating: 5 });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials);
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
    fetchTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTestimonials(items =>
          items.map(t => (t.id === id ? { ...t, status } : t))
        );
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      role: t.role || "",
      quote: t.quote,
      rating: t.rating,
    });
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(items =>
          items.map(t => (t.id === id ? data.testimonial : t))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTestimonial = async (id: number) => {
    if (!confirm("Delete this testimonial permanently?")) return;
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTestimonials(items => items.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const filtered =
    filter === "all"
      ? testimonials
      : testimonials.filter(t => t.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
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
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">
              Testimonials
            </h1>
            <p className="text-nmcn-muted">{testimonials.length} total submissions</p>
          </div>
          <a
            href="/admin"
            className="text-sm text-nmcn-muted hover:text-nmcn-blue transition"
          >
            ← Back to Dashboard
          </a>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s
                  ? "bg-nmcn-blue/20 text-nmcn-blue border border-nmcn-blue/40"
                  : "border border-nmcn-border text-nmcn-muted hover:text-white"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-nmcn-muted">No testimonials found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(t => (
              <div key={t.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {statusIcon(t.status)}
                      <span className="font-heading text-lg font-semibold text-white">
                        {t.name}
                      </span>
                      <span className="text-sm text-nmcn-muted">
                        {t.role || "Creator"}
                      </span>
                      <span
                        className={`badge ${
                          t.status === "approved"
                            ? "border-green-500/40 text-green-400"
                            : t.status === "rejected"
                              ? "border-red-500/40 text-red-400"
                              : "border-yellow-500/40 text-yellow-400"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="mb-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={
                            n <= t.rating
                              ? "h-4 w-4 fill-nmcn-gold text-nmcn-gold"
                              : "h-4 w-4 text-nmcn-border"
                          }
                        />
                      ))}
                    </div>

                    {editingId === t.id ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e =>
                                setEditForm(f => ({ ...f, name: e.target.value }))
                              }
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                              Role
                            </label>
                            <input
                              type="text"
                              value={editForm.role}
                              onChange={e =>
                                setEditForm(f => ({ ...f, role: e.target.value }))
                              }
                              className="input"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                            Testimonial
                          </label>
                          <textarea
                            value={editForm.quote}
                            onChange={e =>
                              setEditForm(f => ({ ...f, quote: e.target.value }))
                            }
                            className="textarea"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                            Rating
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button
                                key={n}
                                type="button"
                                onClick={() =>
                                  setEditForm(f => ({ ...f, rating: n }))
                                }
                                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    n <= editForm.rating
                                      ? "fill-nmcn-gold text-nmcn-gold"
                                      : "text-nmcn-border"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-nmcn-muted">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    )}

                    <p className="mt-2 text-xs text-nmcn-muted">
                      Submitted: {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {editingId === t.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(t.id)}
                          disabled={saving}
                          className="btn-gold text-xs px-3 py-1.5 disabled:opacity-50"
                        >
                          <Save className="mr-1 inline h-3 w-3" />
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-outline text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {t.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(t.id, "approved")}
                            className="btn-gold text-xs px-3 py-1.5"
                          >
                            Approve
                          </button>
                        )}
                        {t.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(t.id, "rejected")}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            Deny
                          </button>
                        )}
                        {t.status !== "pending" && (
                          <button
                            onClick={() => updateStatus(t.id, "pending")}
                            className="btn-ghost text-xs px-3 py-1.5"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(t)}
                          className="btn-outline text-xs px-3 py-1.5"
                        >
                          <PenLine className="mr-1 inline h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTestimonial(t.id)}
                          className="btn-danger text-xs px-3 py-1.5"
                        >
                          <Trash2 className="mr-1 inline h-3 w-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
