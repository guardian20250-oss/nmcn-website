"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquare, LogOut, Loader2 } from "lucide-react";

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  totalContacts: number;
  unreadContacts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAdminName(data.adminName);
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "admin-token=; path=/; max-age=0";
    router.push("/admin/login");
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
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-nmcn-muted">Welcome back, {adminName}</p>
          </div>
          <button onClick={handleLogout} className="btn-outline flex items-center gap-2 text-sm">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="stat-card">
            <div className="stat-num">{stats?.totalApplications || 0}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats?.pendingApplications || 0}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats?.totalContacts || 0}</div>
            <div className="stat-label">Contact Messages</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/admin/applications" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
              <Users className="h-6 w-6 text-nmcn-blue" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">Join Applications</h3>
              <p className="text-sm text-nmcn-muted">{stats?.pendingApplications || 0} pending review</p>
            </div>
          </Link>

          <Link href="/admin/contacts" className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-gold/10">
              <MessageSquare className="h-6 w-6 text-nmcn-gold" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">Contact Messages</h3>
              <p className="text-sm text-nmcn-muted">{stats?.unreadContacts || 0} unread</p>
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
