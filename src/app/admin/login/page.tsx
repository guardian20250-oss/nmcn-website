"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Loader2, KeyRound } from "lucide-react";
import ForcePasswordChangeModal from "@/components/ForcePasswordChangeModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mustChangePassword) {
          setMustChange(true);
        } else {
          router.push("/admin");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full border-2 border-nmcn-blue bg-nmcn-blue/10 font-heading text-2xl font-bold text-nmcn-blue">
            N
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-nmcn-muted">Nexus Mafia Creator Network</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5 p-8">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nmcn-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nexusmafiacreatornetworkllc@outlook.com"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nmcn-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input pl-10"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-nmcn-muted transition hover:text-nmcn-blue"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Forgot password?
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-nmcn-muted hover:text-nmcn-blue transition">
            ← Back to Main Site
          </Link>
        </div>
      </div>

      <ForcePasswordChangeModal
        open={mustChange}
        email={email}
        onDone={() => router.push("/admin")}
      />
      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        kind="staff"
        defaultEmail={email}
      />
    </div>
  );
}
