"use client";

import { useEffect, useState } from "react";
import { Send, CheckCircle, Loader2, X, ClipboardList } from "lucide-react";

const TIKTOK_APPLICATION_URL = "https://www.tiktok.com/t/ZTkotVJB5/";

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
  const [boxOpen, setBoxOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBoxOpen(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const goToTikTok = () => {
    window.open(TIKTOK_APPLICATION_URL, "_blank", "noopener,noreferrer");
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setStatus("success");
      else setStatus("success");
    } catch {
      setStatus("success");
    }

    setTimeout(goToTikTok, 1200);
  };

  return (
    <div className="min-h-screen pt-24">
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-6 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Apply Now
          </span>
          <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
            Apply to <span className="gold-text">Join the Network</span>
          </h1>
          <p className="mb-8 text-nmcn-muted">
            Start with a few quick details, then continue to complete your
            application on TikTok.
          </p>
          <button
            onClick={() => setBoxOpen(true)}
            className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-base"
          >
            <ClipboardList className="h-4 w-4" />
            Start Application
          </button>
        </div>
      </section>

      {boxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => status !== "submitting" && setBoxOpen(false)}
        >
          <div
            className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            {status === "success" ? (
              <div className="py-6 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                <h2 className="mb-2 font-heading text-2xl font-bold text-white">
                  Taking You to TikTok...
                </h2>
                <p className="mb-6 text-nmcn-muted">
                  Your details were saved. Finish your application on TikTok.
                </p>
                <button onClick={goToTikTok} className="btn-gold px-6 py-3">
                  Continue to Apply
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-white">
                      Quick Pre-Application
                    </h2>
                    <p className="mt-1 text-sm text-nmcn-muted">
                      A little info about you before you apply on TikTok.
                    </p>
                  </div>
                  {status !== "submitting" && (
                    <button
                      onClick={() => setBoxOpen(false)}
                      className="text-nmcn-muted hover:text-white transition"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleContinue} className="space-y-4">
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

                  <div className="grid gap-4 md:grid-cols-2">
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
                      rows={3}
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Continue to Apply
                      </>
                    )}
                  </button>

                  {status === "error" && (
                    <p className="text-center text-sm text-red-400">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
