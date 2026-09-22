"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type Mode = "login" | "register";

export default function AuthPrompt({ initialMode }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode || "login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    tiktokHandle: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }

      if (mode === "register") {
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

      setStatus("success");
      setMessage(
        mode === "login"
          ? "Signed in. Your progress will now sync across devices."
          : "Account created and progress synced."
      );
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const logout = async () => {
    await fetch("/api/academy/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.reload();
  };

  if (status === "success") {
    return (
      <div className="card p-6 text-center">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
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
    </div>
  );
}
