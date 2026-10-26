"use client";

// Backend management for creator stats — everything that isn't numbers.
//   • Upload a Backstage export + upload history / audit log
//   • Teams & manager assignments
//   • The full roster (every profile, grouped by team)
//   • Link a creator profile to an account
//   • Add a team lead or manager
//   • Remove / restore creators from stats
// The dashboard itself (/admin/creator-stats) links here and stays pure numbers.
//
// Same audience as the panels inside it: owner or team lead. Managers can open
// the page too, but only for the upload panel — they have no staff-management
// access (the assignments API returns 403 for role=manager). The APIs enforce
// all of this server-side; the checks here only decide what we render.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Settings2 } from "lucide-react";
import UploadPanel from "@/components/admin/creator-stats/UploadPanel";
import AssignmentsPanel from "@/components/admin/creator-stats/AssignmentsPanel";

export default function CreatorStatsManagePage() {
  const router = useRouter();
  const [scope, setScope] = useState<"all" | "team_lead" | "manager" | null>(null);
  const [err, setErr] = useState("");
  // Bumped after an import so the roster below remounts and refetches.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/creator-stats/dashboard")
      .then(async res => {
        if (res.status === 401) { router.push("/admin/login"); return; }
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) setErr(data.error || "Failed to load");
        else setScope(data.scope);
      })
      .catch(() => alive && setErr("Network error"));
    return () => { alive = false; };
  }, [router]);

  if (err) {
    return (
      <div className="min-h-screen px-6 pt-28">
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-white">{err === "Forbidden" ? "This page is available to owners, managers and team leads." : err}</p>
          <a href="/admin/creator-stats" className="btn-outline mt-4 inline-block text-sm">← Back to Creator Stats</a>
        </div>
      </div>
    );
  }
  if (scope === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" /></div>;
  }

  const isOwner = scope === "all";
  // Managers get the upload panel only — no roster, no staff, no assignments.
  const isManager = scope === "manager";

  return (
    <div className="min-h-screen px-6 pb-16 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-3xl font-bold text-white">
              <Settings2 className="h-7 w-7 text-nmcn-gold" />
              Creator Stats · Management
            </h1>
            <p className="text-sm text-nmcn-muted">
              {isManager
                ? "Upload a Backstage export here. The numbers live on the "
                : "Uploads, history, teams, roster and staff. The numbers live on the "}
              <a href="/admin/creator-stats" className="text-nmcn-gold hover:underline">dashboard</a>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/admin/creator-stats" className="btn-outline text-sm">
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              Back to dashboard
            </a>
            <a href="/admin" className="text-sm text-nmcn-muted transition hover:text-nmcn-blue">← Dashboard</a>
          </div>
        </div>

        <UploadPanel isOwner={isOwner} onImported={() => setRefreshKey(k => k + 1)} />

        {/* Staff management is owner / team lead only. The assignments API
            returns 403 for managers, so rendering this for them would just
            show an empty panel. Remount after an import so the roster picks up
            newly added creators. */}
        {!isManager && <AssignmentsPanel key={refreshKey} />}
      </div>
    </div>
  );
}
