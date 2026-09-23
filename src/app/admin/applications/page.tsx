"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock, Filter } from "lucide-react";

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
                      <span className="font-heading text-lg font-semibold text-white">@{app.tiktokHandle}</span>
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
                    <p className="mt-1 text-xs text-nmcn-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
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
                        onClick={() => updateStatus(app.id, "rejected")}
                        disabled={updatingId !== null}
                        className="btn-danger text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        {updatingId === app.id ? "..." : "Reject"}
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
      </div>
    </div>
  );
}
