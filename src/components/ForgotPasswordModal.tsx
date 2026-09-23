"use client";

import { useState } from "react";
import { LifeBuoy, Loader2, X, CheckCircle2, Send } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  kind: "staff" | "academy";
  defaultEmail?: string;
}

export default function ForgotPasswordModal({ open, onClose, kind, defaultEmail }: Props) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);

  if (!open) return null;

  const close = () => {
    onClose();
    setTimeout(() => {
      setEmail(defaultEmail || "");
      setError("");
      setSuccess(false);
      setTicketId(null);
    }, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Password reset request (${kind})`,
          message: `Please reset the ${kind} password for ${email}. Requested from the ${kind} login forgot-password form.`,
          category: "login",
          email,
          name: kind === "staff" ? "Staff password reset" : "Academy password reset",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      setTicketId(data.ticket?.id ?? null);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="card relative w-full max-w-md p-6 sm:p-8">
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 text-nmcn-muted transition hover:text-nmcn-blue"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-nmcn-blue" />
            <h3 className="font-heading mb-2 text-xl font-bold text-white">
              Reset Request Submitted
            </h3>
            <p className="mb-1 text-sm text-nmcn-muted">
              If an account exists for{" "}
              <span className="text-nmcn-blue">{email}</span>, an admin will
              process your password reset.
            </p>
            {ticketId && (
              <p className="mb-6 text-xs text-nmcn-muted/70">Ticket #{ticketId}</p>
            )}
            <button type="button" onClick={close} className="btn-gold text-sm">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nmcn-blue/30 bg-nmcn-blue/10">
                <LifeBuoy className="h-5 w-5 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Forgot Password?
                </h3>
                <p className="text-xs text-nmcn-muted">
                  {kind === "staff"
                    ? "Submit a reset request — an admin will set a new temporary password."
                    : "Submit a reset request — an admin will help you regain access."}
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-nmcn-muted">
                  Account email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading ? "Submitting..." : "Request Password Reset"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
