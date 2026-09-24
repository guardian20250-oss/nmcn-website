"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, Eye, X } from "lucide-react";

interface Application {
  id: number;
  tiktokHandle: string;
  discordHandle: string;
  email: string;
  followerCount: string | null;
  avgLiveViewers: string | null;
  agencyExperience: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [viewingApp, setViewingApp] = useState<Application | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setApplications(apps =>
          apps.map(app => (app.id === id ? { ...app, status } : app))
        );
      } else {
        setError(data.error || "Failed to update application");
      }
    } catch (error) {
      console.error("Update failed:", error);
      setError("Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === "all" ? applications : applications.filter(app => app.status === filter);

  const openView = (app: Application) => {
    setViewingApp(app);
    setNoteDraft(app.notes || "");
    setRejectMode(false);
  };

  const openReject = (app: Application) => {
    setViewingApp(app);
    setNoteDraft(app.notes || "");
    setRejectMode(true);
  };

  const patchApplication = async (id: number, payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to update application");
    return data.application as Application;
  };

  const saveNote = async () => {
    if (!viewingApp) return;
    setSavingNote(true);
    setError("");
    try {
      const updated = await patchApplication(viewingApp.id, { notes: noteDraft });
      setApplications(apps => apps.map(app => (app.id === updated.id ? { ...app, notes: updated.notes } : app)));
      setViewingApp(prev => (prev ? { ...prev, notes: updated.notes } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const confirmReject = async () => {
    if (!viewingApp) return;
    setSavingNote(true);
    setError("");
    try {
      const updated = await patchApplication(viewingApp.id, {
        status: "rejected",
        notes: noteDraft,
      });
      setApplications(apps => apps.map(app => (app.id === updated.id ? updated : app)));
      setViewingApp(updated);
      setRejectMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setSavingNote(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
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
            <h1 className="font-heading text-3xl font-bold text-white">Join Applications</h1>
            <p className="text-nmcn-muted">{applications.length} total applications</p>
          </div>
          <a href="/admin" className="text-sm text-nmcn-muted hover:text-nmcn-blue transition">← Back to Dashboard</a>
        </div>

        <div className="flex gap-2 mb-6">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s ? "bg-nmcn-blue/20 text-nmcn-blue border border-nmcn-blue/40" : "border border-nmcn-border text-nmcn-muted hover:text-white"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-nmcn-muted">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => (
              <div key={app.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {statusIcon(app.status)}
                      <span className="font-heading text-lg font-semibold text-white">@{app.tiktokHandle.replace(/^@/, "")}</span>
                      <span className={`badge ${
                        app.status === "approved" ? "border-green-500/40 text-green-400" :
                        app.status === "rejected" ? "border-red-500/40 text-red-400" :
                        "border-yellow-500/40 text-yellow-400"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-nmcn-muted">
                      <span>Discord: {app.discordHandle}</span>
                      <span>Email: {app.email}</span>
                      <span>Followers: {app.followerCount || "N/A"}</span>
                      <span>Avg Viewers: {app.avgLiveViewers || "N/A"}</span>
                    </div>
                    {app.agencyExperience && (
                      <p className="mt-2 text-sm text-nmcn-muted">Experience: {app.agencyExperience}</p>
                    )}
                    {app.notes && (
                      <p className="mt-2 rounded-lg border border-nmcn-border bg-white/5 px-3 py-1.5 text-xs text-nmcn-muted">
                        Note: {app.notes}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-nmcn-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openView(app)}
                      className="flex items-center gap-1.5 border border-nmcn-border px-3 py-1.5 text-xs font-medium text-nmcn-muted hover:border-nmcn-blue/40 hover:text-white transition rounded-lg"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                    {app.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(app.id, "approved")}
                        disabled={updatingId !== null}
                        className="btn-gold text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        {updatingId === app.id ? "..." : "Approve"}
                      </button>
                    )}
                    {app.status !== "rejected" && (
                      <button
                        onClick={() => openReject(app)}
                        disabled={updatingId !== null}
                        className="btn-danger text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {app.status !== "pending" && (
                      <button
                        onClick={() => updateStatus(app.id, "pending")}
                        disabled={updatingId !== null}
                        className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewingApp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => {
              setViewingApp(null);
              setRejectMode(false);
            }}
          >
            <div
              className="card w-full max-w-lg p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(viewingApp.status)}
                  <h2 className="font-heading text-xl font-bold text-white">
                    Application Details
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setViewingApp(null);
                    setRejectMode(false);
                  }}
                  className="text-nmcn-muted hover:text-white transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-nmcn-border bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    TikTok @
                  </p>
                  <a
                    href={`https://www.tiktok.com/@${viewingApp.tiktokHandle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading text-lg font-semibold text-nmcn-blue hover:underline"
                  >
                    @{viewingApp.tiktokHandle.replace(/^@/, "")}
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-nmcn-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Discord</p>
                    <p className="mt-1 text-white">{viewingApp.discordHandle}</p>
                  </div>
                  <div className="rounded-xl border border-nmcn-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Email</p>
                    <p className="mt-1 break-all text-white">{viewingApp.email}</p>
                  </div>
                  <div className="rounded-xl border border-nmcn-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Followers</p>
                    <p className="mt-1 text-white">{viewingApp.followerCount || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-nmcn-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Avg LIVE Viewers</p>
                    <p className="mt-1 text-white">{viewingApp.avgLiveViewers || "N/A"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-nmcn-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Previous Agency Experience
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white">
                    {viewingApp.agencyExperience || "N/A"}
                  </p>
                </div>

                <div className="rounded-xl border border-nmcn-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Admin Note / Rejection Reason
                  </p>
                  <textarea
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder="Leave a note explaining why this application was rejected (the applicant will be emailed this reason when you reject)..."
                    rows={3}
                    className="textarea mt-2 w-full text-sm"
                  />
                  {!rejectMode && (
                    <button
                      onClick={saveNote}
                      disabled={savingNote}
                      className="mt-2 btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      {savingNote ? "Saving..." : "Save Note"}
                    </button>
                  )}
                </div>

                {rejectMode && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-300">
                      Reject this application?
                    </p>
                    <p className="mt-1 text-xs text-red-300/80">
                      The applicant will be emailed the note above as the reason.
                      {noteDraft.trim() === "" && " No note entered — the email will not include a reason."}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={confirmReject}
                        disabled={savingNote}
                        className="btn-danger text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        {savingNote ? "Rejecting..." : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => setRejectMode(false)}
                        disabled={savingNote}
                        className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-nmcn-border pt-4 text-xs text-nmcn-muted">
                  <span>
                    Status:{" "}
                    <span className={
                      viewingApp.status === "approved" ? "text-green-400" :
                      viewingApp.status === "rejected" ? "text-red-400" :
                      "text-yellow-400"
                    }>
                      {viewingApp.status}
                    </span>
                  </span>
                  <span>Applied: {new Date(viewingApp.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
