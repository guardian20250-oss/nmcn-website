"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle, XCircle, Users, Briefcase } from "lucide-react";

type Tab = "creators" | "staff";

const STAFF_ROLES: { value: string; label: string }[] = [
  { value: "scout", label: "Scout" },
  { value: "manager", label: "Manager" },
  { value: "team_lead", label: "Team Lead" },
  { value: "battle_coordinator", label: "Battle Coordinator" },
  { value: "admin", label: "Admin" },
];

export default function CreateAccountModal({
  open,
  onClose,
  onOpenLogin,
}: {
  open: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("creators");
  const [accountType, setAccountType] = useState<"creator" | "independent">("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [staffRole, setStaffRole] = useState("scout");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  if (!open) return null;

  const reset = () => {
    setTab("creators");
    setAccountType("creator");
    setName("");
    setEmail("");
    setPassword("");
    setTiktokHandle("");
    setStaffRole("scout");
    setBusy(false);
    setError("");
    setDone("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/academy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          tab === "creators"
            ? JSON.stringify({
                mode: "register",
                name,
                email,
                password,
                tiktokHandle,
                accountType,
              })
            : JSON.stringify({
                mode: "registerStaff",
                name,
                email,
                password,
                role: staffRole,
              }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setDone(
        data.message ||
          (tab === "creators"
            ? "Account created! It is pending approval — an admin will assign your role soon."
            : "Staff request submitted!")
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setError("");
      }}
      className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        tab === id
          ? "border border-nmcn-blue/40 bg-nmcn-blue/20 text-nmcn-blue"
          : "border border-nmcn-border text-nmcn-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4"
      onClick={() => !busy && close()}
    >
      <div
        className="card max-h-[90vh] w-full max-w-sm overflow-y-auto p-6 sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Create Account</h2>
            <p className="mt-1 text-sm text-nmcn-muted">
              {tab === "creators"
                ? "Join as a creator with our network."
                : "Request a staff account — an admin approves every request."}
            </p>
          </div>
          <button
            onClick={close}
            className="text-nmcn-muted transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-400" />
            <p className="text-sm text-nmcn-muted">{done}</p>
            <button type="button" onClick={close} className="btn-gold mt-5 px-8">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {tabBtn("creators", "Creators")}
              {tabBtn("staff", "Staff")}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {tab === "creators" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("creator")}
                    className={`rounded-lg border p-3 text-left transition ${
                      accountType === "creator"
                        ? "border-nmcn-blue/60 bg-nmcn-blue/10"
                        : "border-nmcn-border hover:border-nmcn-blue/40"
                    }`}
                  >
                    <Users className="mb-1 h-4 w-4 text-nmcn-blue" />
                    <p className="text-sm font-semibold text-white">Creator</p>
                    <p className="text-xs text-nmcn-muted">Internal — with the agency</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("independent")}
                    className={`rounded-lg border p-3 text-left transition ${
                      accountType === "independent"
                        ? "border-nmcn-gold/60 bg-nmcn-gold/10"
                        : "border-nmcn-border hover:border-nmcn-gold/40"
                    }`}
                  >
                    <Briefcase className="mb-1 h-4 w-4 text-nmcn-gold" />
                    <p className="text-sm font-semibold text-white">Independent</p>
                    <p className="text-xs text-nmcn-muted">External creator</p>
                  </button>
                </div>
              )}

              {tab === "staff" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Requested role
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="input"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-nmcn-muted">
                    An admin reviews every request and can change the role before approving.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Name
                </label>
                <input
                  className="input"
                  placeholder="Your name *"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {tab === "creators" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    TikTok handle
                  </label>
                  <input
                    className="input"
                    placeholder="TikTok handle (optional)"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="Email *"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Password * (8+ characters)"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="flex items-center gap-1 text-sm text-red-400">
                  <XCircle className="h-4 w-4" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-gold flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : tab === "creators" ? (
                  "Create Account"
                ) : (
                  "Request Staff Account"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-nmcn-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const go = onOpenLogin;
                  reset();
                  go?.();
                }}
                className="text-nmcn-blue hover:underline"
              >
                Log In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
