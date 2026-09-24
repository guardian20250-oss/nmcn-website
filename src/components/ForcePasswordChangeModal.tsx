"use client";

import { useState } from "react";
import { Lock, Loader2, X, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onDone: () => void;
  email?: string;
  variant?: "admin" | "creator";
}

export default function ForcePasswordChangeModal({ open, onDone, email, variant = "admin" }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(variant === "creator" ? "/api/academy/auth" : "/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          variant === "creator"
            ? { mode: "changePassword", newPassword: password }
            : { action: "changePassword", password }
        ),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update password");
        return;
      }
      onDone();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="card relative w-full max-w-md p-6 sm:p-8">
        <button
          type="button"
          disabled
          className="absolute top-4 right-4 text-nmcn-muted/40 cursor-not-allowed"
          aria-label="Cannot close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-gold/40 bg-nmcn-gold/10">
            <ShieldCheck className="h-5 w-5 text-nmcn-gold" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Change Your Password
            </h3>
            <p className="text-xs text-nmcn-muted">
              {email ? (
                <>
                  Signed in as <span className="text-nmcn-blue">{email}</span>.{" "}
                </>
              ) : null}
              You must set a new password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nmcn-muted" />
              <input
                type="password"
                required
                minLength={8}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nmcn-muted" />
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
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
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {loading ? "Updating..." : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
