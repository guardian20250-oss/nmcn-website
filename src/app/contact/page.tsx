"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2, Phone, Mail } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="mb-6 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
              Contact Us
            </span>
            <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
              Get In <span className="gold-text">Touch</span>
            </h1>
            <p className="mb-12 text-nmcn-muted">
              Have questions? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-6">
              <div className="card p-6">
                <Phone className="mb-3 h-6 w-6 text-nmcn-blue" />
                <h3 className="mb-1 text-sm font-semibold text-white">Phone</h3>
                <p className="text-sm text-nmcn-muted">423-561-3080</p>
              </div>
              <div className="card p-6">
                <Mail className="mb-3 h-6 w-6 text-nmcn-blue" />
                <h3 className="mb-1 text-sm font-semibold text-white">Email</h3>
                <p className="text-sm text-nmcn-muted">
                  nmcn@nexusmafiaagency.com
                </p>
              </div>
              <div className="card p-6">
                <div className="mb-3 flex h-6 w-6 items-center justify-center text-nmcn-blue">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white">
                  Location
                </h3>
                <p className="text-sm text-nmcn-muted">US &amp; Canada</p>
              </div>
            </div>

            <div className="md:col-span-2">
              {status === "success" ? (
                <div className="card p-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                  <h2 className="mb-2 font-heading text-2xl font-bold text-white">
                    Message Sent!
                  </h2>
                  <p className="text-nmcn-muted">
                    We&apos;ll get back to you as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card space-y-6 p-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      placeholder="What's this about?"
                      value={form.subject}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      placeholder="Your message..."
                      value={form.message}
                      onChange={handleChange}
                      className="textarea"
                      rows={5}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-gold flex w-full items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </button>

                  {status === "error" && (
                    <p className="text-center text-sm text-red-400">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
