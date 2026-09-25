"use client";

import { useState } from "react";
import { Ticket, Send, X, CheckCircle2, LifeBuoy } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

const CATEGORIES = [
  { value: "account", label: "Account creation" },
  { value: "academy", label: "Academy / courses" },
  { value: "login", label: "Login issue" },
  { value: "other", label: "Other" },
];

export default function SupportTicketModal({ open, onClose, defaultEmail, defaultName }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("account");
  const [email, setEmail] = useState(defaultEmail || "");
  const [name, setName] = useState(defaultName || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketToken, setTicketToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, category, email, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");
      setTicketId(data.ticket.id);
      setTicketToken(data.ticket.accessToken || null);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubject("");
      setMessage("");
      setCategory("account");
      setEmail(defaultEmail || "");
      setName(defaultName || "");
      setPhone("");
      setError("");
      setSuccess(false);
      setTicketId(null);
      setTicketToken(null);
    }, 200);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="card relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-nmcn-muted hover:text-nmcn-blue transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-nmcn-blue mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-white mb-2">Ticket Submitted</h3>
            <p className="text-nmcn-muted text-sm mb-1">
              Your ticket has been received. We&apos;ll get back to you at{" "}
              <span className="text-nmcn-blue">{email}</span>.
            </p>
            {ticketId && (
              <p className="text-nmcn-muted/70 text-xs mb-2">
                Ticket #{ticketId}
              </p>
            )}
            {ticketId && ticketToken && (
              <a
                href={`/support/${ticketId}?token=${ticketToken}`}
                className="btn-outline mb-6 inline-flex text-sm"
              >
                View Ticket &amp; Replies
              </a>
            )}
            <div className="mt-4">
              <button
                onClick={handleClose}
                className="btn-gold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-nmcn-blue/10 border border-nmcn-blue/30 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-nmcn-blue" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">Submit a Support Ticket</h3>
                <p className="text-nmcn-muted text-xs">Account or academy issues — we&apos;ll respond via email.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-nmcn-muted mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nmcn-blue/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-nmcn-muted mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-nmcn-muted mb-1.5">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-nmcn-muted mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-nmcn-muted mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50"
                />
              </div>

              <div>
                <label className="block text-xs text-nmcn-muted mb-1.5">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-nmcn-deep/80 border border-nmcn-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:outline-none focus:border-nmcn-blue/50 resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full text-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
