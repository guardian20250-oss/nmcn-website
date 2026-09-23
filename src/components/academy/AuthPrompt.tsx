"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle, KeyRound, ShieldCheck } from "lucide-react";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

type Mode = "login" | "register";

export default function AuthPrompt({ initialMode }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode || "login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tiktokHandle: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "pending">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          name: form.name,
          email: form.email,
          password: form.password,
          tiktokHandle: form.tiktokHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }

      if (mode === "register") {
        if (data.pending) {
          setStatus("pending");
          setMessage(
            "Account created! It is pending approval — an admin will assign your role soon."
          );
          setTimeout(() => window.location.reload(), 3000);
          return;
        }
        try {
          const raw = window.localStorage.getItem("nmcn-academy-progress");
          if (raw) {
            const local = JSON.parse(raw);
            const progress = Object.entries(local).map(
              ([lessonId, v]) => ({
                lessonId: Number(lessonId),
                score: (v as { score?: number }).score || 100,
                passed: Boolean((v as { passed?: boolean }).passed),
              })
            );
            await fetch("/api/academy/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ progress }),
            });
          }
        } catch {
          // merge best-effort
        }
      }

      if (mode === "login" && data.user?.mustChangePassword) {
        setMustChange(true);
        setStatus("idle");
        setMessage("");
        return;
      }

      setStatus("success");
      setMessage(
        mode === "login"
          ? "Signed in. Your progress will now sync across devices."
          : "Account created! Check your email for role assignment or sign in to continue."
      );
      setTimeout(() => {
        window.location.href = "/academy";
      }, 800);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");
    if (newPassword.length < 8) {
      setChangeError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match");
      return;
    }
    setChangeLoading(true);
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "changePassword", newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setChangeError(data.error || "Failed to update password");
        return;
      }
      setMustChange(false);
      setStatus("success");
      setMessage("Password updated. Redirecting…");
      setTimeout(() => {
        window.location.href = "/academy";
      }, 600);
    } catch {
      setChangeError("Network error");
    } finally {
      setChangeLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/academy/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    window.location.reload();
  };

  if (mustChange) {
    return (
      <div className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-gold/40 bg-nmcn-gold/10">
            <ShieldCheck className="h-5 w-5 text-nmcn-gold" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Change Your Password
            </h3>
            <p className="text-xs text-nmcn-muted">
              You must set a new password before continuing to the academy.
            </p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-3">
          <input
            className="input"
            type="password"
            placeholder="New password * (8+ characters)"
            required
            minLength={8}
            autoFocus
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password *"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {changeError && (
            <p className="flex items-center gap-1 text-sm text-red-400">
              <XCircle className="h-4 w-4" /> {changeError}
            </p>
          )}
          <button
            type="submit"
            disabled={changeLoading}
            className="btn-gold w-full disabled:opacity-50"
          >
            {changeLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4 inline" />
            )}
            Set Password & Continue
          </button>
        </form>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="card p-6 text-center">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
        <p className="text-sm text-nmcn-muted">{message}</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="card p-6 text-center">
        <span className="mx-auto mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-nmcn-blue border-t-transparent" />
        <p className="text-sm text-nmcn-muted">{message}</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "login"
              ? "border border-nmcn-blue/40 bg-nmcn-blue/20 text-nmcn-blue"
              : "border border-nmcn-border text-nmcn-muted hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "register"
              ? "border border-nmcn-blue/40 bg-nmcn-blue/20 text-nmcn-blue"
              : "border border-nmcn-border text-nmcn-muted hover:text-white"
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <input
              className="input"
              placeholder="Your name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="TikTok handle (optional)"
              value={form.tiktokHandle}
              onChange={(e) => setForm({ ...form, tiktokHandle: e.target.value })}
            />
            <p className="text-xs text-nmcn-muted">
              An admin will assign your role after you create your account.
            </p>
          </>
        )}
        <input
          className="input"
          type="email"
          placeholder="Email *"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password * (8+ characters)"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {mode === "login" && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="inline-flex items-center gap-1 text-xs text-nmcn-muted transition hover:text-nmcn-blue"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Forgot password?
            </button>
          </div>
        )}

        {status === "error" && message && (
          <p className="flex items-center gap-1 text-sm text-red-400">
            <XCircle className="h-4 w-4" /> {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-gold w-full disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-nmcn-muted">
        Optional — guests can complete training without an account.
      </p>
      <button
        type="button"
        onClick={logout}
        className="btn-ghost mt-2 w-full text-xs"
      >
        Sign out
      </button>

      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        kind="academy"
        defaultEmail={form.email}
      />
    </div>
  );
}
