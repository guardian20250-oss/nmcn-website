"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

const BATTLE_EXCHANGE_URL = "https://nmcnbattleexchange.com";

export default function JoinPage() {
  const [form, setForm] = useState({
    tiktokHandle: "",
    discordHandle: "",
    email: "",
    followerCount: "",
    avgLiveViewers: "",
    agencyExperience: "",
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
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          window.open(BATTLE_EXCHANGE_URL, "_blank", "noopener,noreferrer");
        }, 1500);
      } else {
        // Even if API fails, still redirect to TikTok
        setStatus("success");
        setTimeout(() => {
          window.open(BATTLE_EXCHANGE_URL, "_blank", "noopener,noreferrer");
        }, 1500);
      }
    } catch {
      // Even if network error, still redirect to TikTok
      setStatus("success");
      setTimeout(() => {
        window.open(BATTLE_EXCHANGE_URL, "_blank", "noopener,noreferrer");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="mb-6 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
              Join NMCN
            </span>
            <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
              Apply to <span className="gold-text">Join the Network</span>
            </h1>
            <p className="mb-8 text-nmcn-muted">
              Fill out the form below. After submitting, you&apos;ll be redirected to
              complete your application.
            </p>
          </div>

          {status === "success" ? (
            <div className="card p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-2 font-heading text-2xl font-bold text-white">
                Application Submitted!
              </h2>
              <p className="text-nmcn-muted">
                Redirecting you to complete your application...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-6 p-8">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  TikTok Handle *
                </label>
                <input
                  type="text"
                  name="tiktokHandle"
                  required
                  placeholder="@yourusername"
                  value={form.tiktokHandle}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Discord Handle *
                </label>
                <input
                  type="text"
                  name="discordHandle"
                  required
                  placeholder="username#0000"
                  value={form.discordHandle}
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

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Follower Count
                  </label>
                  <input
                    type="text"
                    name="followerCount"
                    placeholder="e.g. 50,000"
                    value={form.followerCount}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Avg LIVE Viewers
                  </label>
                  <input
                    type="text"
                    name="avgLiveViewers"
                    placeholder="e.g. 200"
                    value={form.avgLiveViewers}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                  Previous Agency Experience
                </label>
                <textarea
                  name="agencyExperience"
                  placeholder="Tell us about any previous agency experience..."
                  value={form.agencyExperience}
                  onChange={handleChange}
                  className="textarea"
                  rows={4}
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Application
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
      </section>
    </div>
  );
}
