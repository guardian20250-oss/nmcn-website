"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, Users, MessageSquare, LogOut, Loader2, Quote, BookOpen, Users as UsersIcon, LifeBuoy } from "lucide-react";
import GetHelpButton from "@/components/GetHelpButton";

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  totalContacts: number;
  unreadContacts: number;
  totalTestimonials: number;
  pendingTestimonials: number;
  role: string;
  totalCreators: number;
  totalCourses: number;
  pendingAccounts: number;
  totalAccounts: number;
  totalIndependent: number;
  totalStaff: number;
  openTickets?: number;
  inProgressTickets?: number;
  resolvedTickets?: number;
  ticketScope?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [role, setRole] = useState("");
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([]);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAdminName(data.adminName);
        setRole(data.stats?.role || "");
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
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    document.cookie = "admin-token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  const isAdmin = role === "admin";
  const canViewAllTickets = stats?.ticketScope === "all";
  const canViewApps = isAdmin;
  const canViewContacts = isAdmin;
  const canViewTestimonials = isAdmin;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-nmcn-muted capitalize">Welcome back, {adminName} — {role}</p>
          </div>
          <button onClick={handleLogout} className="btn-outline flex items-center gap-2 text-sm">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-nmcn-border bg-nmcn-panel/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
              <LifeBuoy className="h-5 w-5 text-nmcn-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Support</p>
              <p className="text-xs text-nmcn-muted">
                {canViewAllTickets
                  ? "Submit a ticket or review open support requests"
                  : "Submit a ticket or review tickets transferred to you"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GetHelpButton className="btn-outline text-sm" />
            <Link href="/admin/tickets" className="btn-gold text-sm">
              {canViewAllTickets ? "Support Tickets" : "My Tickets"}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {isAdmin && (
            <>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalApplications || 0}</div>
                <div className="stat-label">Total Applications</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.pendingApplications || 0}</div>
                <div className="stat-label">Pending Review</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.pendingAccounts || 0}</div>
                <div className="stat-label">Pending Accounts</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalIndependent || 0}</div>
                <div className="stat-label">Independent Creators</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalAccounts || 0}</div>
                <div className="stat-label">Total Accounts</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalStaff || 0}</div>
                <div className="stat-label">Staff</div>
              </div>
            </>
          )}
          {(role === "manager" || role === "team_lead" || role === "scout" || role === "battle_coordinator" || role === "creator") && (
            <>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalCreators || 0}</div>
                <div className="stat-label">Total Creators</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats?.totalCourses || 0}</div>
                <div className="stat-label">Total Courses</div>
              </div>
              {role === "team_lead" && (
                <div className="stat-card">
                  <div className="stat-num">—</div>
                  <div className="stat-label">Team Lead View</div>
                </div>
              )}
              {role === "manager" && (
                <div className="stat-card">
                  <div className="stat-num">—</div>
                  <div className="stat-label">Manager View</div>
                </div>
              )}
              {role === "scout" && (
                <div className="stat-card">
                  <div className="stat-num">—</div>
                  <div className="stat-label">Scout View</div>
                </div>
              )}
              {role === "battle_coordinator" && (
                <div className="stat-card">
                  <div className="stat-num">—</div>
                  <div className="stat-label">Battle Coordinator View</div>
                </div>
              )}
              {role === "creator" && (
                <div className="stat-card">
                  <div className="stat-num">—</div>
                  <div className="stat-label">Creator View</div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {canViewApps && (
            <Link href="/admin/applications" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
                <UsersIcon className="h-6 w-6 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Join Applications</h3>
                <p className="text-sm text-nmcn-muted">{stats?.pendingApplications || 0} pending review</p>
              </div>
            </Link>
          )}

          {canViewContacts && (
            <Link href="/admin/contacts" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
                <MessageSquare className="h-6 w-6 text-nmcn-gold" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Contact Messages</h3>
                <p className="text-sm text-nmcn-muted">{stats?.unreadContacts || 0} unread</p>
              </div>
            </Link>
          )}

          {canViewTestimonials && (
            <Link href="/admin/testimonials" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-blue/10">
                <Quote className="h-6 w-6 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Testimonials</h3>
                <p className="text-sm text-nmcn-muted">{stats?.pendingTestimonials || 0} pending review</p>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin/staff/accounts" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
                <Users className="h-6 w-6 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Staff & Accounts</h3>
                <p className="text-sm text-nmcn-muted">{stats?.totalStaff || 0} staff · {stats?.totalAccounts || 0} accounts</p>
              </div>
            </Link>
          )}

          {(role === "manager" || role === "team_lead" || role === "scout" || role === "battle_coordinator" || role === "creator") && (
            <Link href="/admin/creators" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
                <Users className="h-6 w-6 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Creators</h3>
                <p className="text-sm text-nmcn-muted">{stats?.totalCreators || 0} total</p>
              </div>
            </Link>
          )}

          <Link href="/admin/team-lead" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
              <BookOpen className="h-6 w-6 text-nmcn-gold" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">Team Lead Academy</h3>
              <p className="text-sm text-nmcn-muted">Course management & certificate verification</p>
            </div>
          </Link>

          <Link href="/admin/manager" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
              <Award className="h-6 w-6 text-nmcn-gold" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">Manager Academy</h3>
              <p className="text-sm text-nmcn-muted">Course management & certificate verification</p>
            </div>
          </Link>

          <Link href="/admin/certificates" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
              <BookOpen className="h-6 w-6 text-nmcn-blue" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">Academy</h3>
              <p className="text-sm text-nmcn-muted">{stats?.totalCourses || 0} courses</p>
            </div>
          </Link>

          <Link href="/admin/tickets" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
              <LifeBuoy className="h-6 w-6 text-nmcn-gold" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">
                {canViewAllTickets ? "Support Tickets" : "My Tickets"}
              </h3>
              <p className="text-sm text-nmcn-muted">
                {stats?.openTickets || 0} open · {stats?.inProgressTickets || 0} in progress
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-nmcn-muted hover:text-nmcn-blue transition">
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}
