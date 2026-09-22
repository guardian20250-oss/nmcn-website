"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, MailOpen } from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/contacts");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      setMessages(msgs =>
        msgs.map(msg => (msg.id === id ? { ...msg, read: true } : msg))
      );
    } catch (error) {
      console.error("Update failed:", error);
    }
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
            <h1 className="font-heading text-3xl font-bold text-white">Contact Messages</h1>
            <p className="text-nmcn-muted">{messages.filter(m => !m.read).length} unread</p>
          </div>
          <a href="/admin" className="text-sm text-nmcn-muted hover:text-nmcn-blue transition">← Back to Dashboard</a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-nmcn-muted">No messages yet.</p>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => { setSelected(msg); if (!msg.read) markRead(msg.id); }}
                  className={`card w-full p-4 text-left transition-all hover:-translate-y-0.5 ${
                    selected?.id === msg.id ? "border-nmcn-blue/50" : ""
                  } ${!msg.read ? "border-nmcn-gold/50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {msg.read ? (
                      <MailOpen className="h-4 w-4 text-nmcn-muted flex-shrink-0" />
                    ) : (
                      <Mail className="h-4 w-4 text-nmcn-gold flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{msg.subject}</p>
                      <p className="text-xs text-nmcn-muted">From: {msg.name}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div>
            {selected ? (
              <div className="card p-6">
                <h2 className="font-heading text-xl font-bold text-white mb-4">{selected.subject}</h2>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <span className="text-nmcn-muted">From: </span>
                    <span className="text-white">{selected.name}</span>
                  </div>
                  <div>
                    <span className="text-nmcn-muted">Email: </span>
                    <span className="text-white">{selected.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-nmcn-muted">Date: </span>
                    <span className="text-white">{new Date(selected.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="section-divider mb-4" />
                <p className="text-nmcn-text whitespace-pre-wrap">{selected.message}</p>
                <div className="section-divider mt-4 mb-4" />
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                  className="btn-outline text-sm"
                >
                  Reply via Email
                </a>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <p className="text-nmcn-muted">Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
