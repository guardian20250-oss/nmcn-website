"use client";

import { useEffect, useState } from "react";
import { Star, PenLine, Send, Loader2, CheckCircle, X } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string | null;
  quote: string;
  rating: number;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", quote: "", rating: 5 });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setTestimonials(data.testimonials);
        }
      } catch {
        // keep empty list
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", role: "", quote: "", rating: 5 });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="px-6 py-20" id="testimonials">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
              Testimonials
            </span>
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Hear From Our <span className="gold-text">Creators</span>
            </h2>
          </div>
          <button
            onClick={() => {
              setShowForm(v => !v);
              setStatus("idle");
            }}
            className="btn-gold items-center gap-2"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close Form
              </>
            ) : (
              <>
                <PenLine className="h-4 w-4" /> Leave a Testimonial
              </>
            )}
          </button>
        </div>

        {showForm && (
          <div className="mb-12">
            {status === "success" ? (
              <div className="card mx-auto max-w-2xl p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                <h3 className="mb-2 font-heading text-2xl font-bold text-white">
                  Thank You!
                </h3>
                <p className="text-nmcn-muted">
                  Your testimonial has been submitted. It will appear on this
                  page once it&apos;s approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl space-y-6 p-8">
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
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      placeholder="e.g. TikTok LIVE Creator"
                      value={form.role}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, rating: n }))}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            n <= form.rating
                              ? "fill-nmcn-gold text-nmcn-gold"
                              : "text-nmcn-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-nmcn-muted">
                    Your Testimonial *
                  </label>
                  <textarea
                    name="quote"
                    required
                    placeholder="Share your experience with NMCN..."
                    value={form.quote}
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
                      Submit Testimonial
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
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-nmcn-muted">
              No testimonials yet - be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(t => (
              <div key={t.id} className="card p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={
                        j < t.rating
                          ? "h-4 w-4 fill-nmcn-gold text-nmcn-gold"
                          : "h-4 w-4 text-nmcn-border"
                      }
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm text-nmcn-muted">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-nmcn-muted">
                    {t.role || "Creator"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
