"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Loader2, Send } from "lucide-react";

interface Reply {
  id: number;
  ticketId: number;
  authorType: string;
  authorName: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  email: string;
  name: string | null;
  createdAt: string;
  replies: Reply[];
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  in_progress: { label: "In Progress", className: "bg-nmcn-blue/15 text-nmcn-blue border-nmcn-blue/30" },
  resolved: { label: "Resolved", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
};

export default function TicketThreadView({ id, token }: { id: string; token?: string }) {
  const [ticket, setTicket] = useState<Ticket | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyErr, setReplyErr] = useState("");
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams({ id });
        if (token) qs.set("token", token);
        const res = await fetch(`/api/support?${qs.toString()}`);
        if (res.status === 404) {
          setTicket(null);
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTicket(data.ticket);
      } catch {
        setError("Something went wrong loading this ticket. Please try again.");
        setTicket(null);
      }
    })();
  }, [id, token]);

  async function sendReply() {
    const message = replyText.trim();
    if (!message || !ticket) return;
    setSending(true);
    setReplyErr("");
    setNotice("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, message, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      setTicket(prev =>
        prev
          ? {
              ...prev,
              status: data.reopened ? "open" : prev.status,
              replies: [
                ...prev.replies,
                data.reply as Reply,
              ],
            }
          : prev
      );
      setReplyText("");
      setNotice(data.reopened ? "Reply sent — this ticket was reopened." : "Reply sent.");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setReplyErr(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen pt-24 px-6 pb-16">
      <div className="mx-auto max-w-3xl">
        {ticket === undefined ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
          </div>
        ) : ticket === null ? (
          <div className="card p-10 text-center">
            <LifeBuoy className="mx-auto mb-4 h-10 w-10 text-nmcn-muted" />
            <h1 className="font-heading text-xl font-bold text-white mb-2">
              Ticket Not Found
            </h1>
            <p className="text-sm text-nmcn-muted mb-6">
              {error || "This ticket doesn't exist or your access link is no longer valid."}
            </p>
            <Link href="/" className="btn-outline inline-block text-sm">
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-nmcn-muted">Ticket #{ticket.id}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    (STATUS_META[ticket.status] || STATUS_META.open).className
                  }`}
                >
                  {(STATUS_META[ticket.status] || STATUS_META.open).label}
                </span>
              </div>
              <h1 className="mt-2 font-heading text-2xl font-bold text-white">
                {ticket.subject}
              </h1>
              <p className="mt-1 text-xs text-nmcn-muted">
                Submitted {new Date(ticket.createdAt).toLocaleString()} · {ticket.email}
              </p>
            </div>

            <div className="card p-5">
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                <div className="rounded-lg border border-nmcn-border bg-black/30 p-3">
                  <p className="mb-1 text-xs text-nmcn-muted">
                    <strong className="text-white">{ticket.name || ticket.email}</strong>
                    {" (you) · "}
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap">{ticket.message}</p>
                </div>
                {ticket.replies.map((r) => {
                  const isStaff = r.authorType === "staff";
                  return (
                    <div
                      key={r.id}
                      className={`rounded-lg border p-3 ${
                        isStaff
                          ? "border-nmcn-gold/30 bg-nmcn-gold/5"
                          : "border-nmcn-border bg-nmcn-deep/60"
                      }`}
                    >
                      <p className="mb-1 text-xs text-nmcn-muted">
                        <strong className={isStaff ? "text-nmcn-gold" : "text-white"}>
                          {r.authorName}
                        </strong>
                        {isStaff ? " (NMCN staff)" : ""} ·{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-white whitespace-pre-wrap">{r.message}</p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="mt-4 border-t border-nmcn-border pt-4">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    ticket.status === "resolved"
                      ? "This ticket is resolved — sending a message will reopen it..."
                      : "Write a reply..."
                  }
                  className="w-full resize-none rounded-lg border border-nmcn-border bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-nmcn-muted/50 focus:border-nmcn-blue focus:outline-none"
                />
                {replyErr && <p className="mt-1 text-xs text-red-400">{replyErr}</p>}
                {notice && <p className="mt-1 text-xs text-green-400">{notice}</p>}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-nmcn-muted">
                    {ticket.status === "resolved"
                      ? "Closed tickets can be reopened by replying."
                      : "Replies reach our team instantly."}
                  </p>
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="btn-gold flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Reply
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link href="/academy" className="text-nmcn-muted hover:text-nmcn-blue transition">
                ← Back to Academy
              </Link>
              <Link href="/" className="text-nmcn-muted hover:text-nmcn-blue transition">
                Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
