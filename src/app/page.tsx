import Link from "next/link";
import {
  Swords,
  Users,
  BarChart3,
  GraduationCap,
  Trophy,
  Globe,
  ChevronRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "Battle Exchange Platform",
    desc: "Cross-agency matchmaking, battle coordination, and real-time tracking for TikTok LIVE battles.",
  },
  {
    icon: Users,
    title: "Creator Management",
    desc: "Personalized management for each creator - scheduling, growth strategy, and career development.",
  },
  {
    icon: GraduationCap,
    title: "Training & Coaching",
    desc: "Learn LIVE techniques, content strategy, and audience growth from experienced creators.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    desc: "Track your performance, growth metrics, and battle statistics with real-time data.",
  },
];

const stats = [
  { num: "100+", label: "Creators" },
  { num: "12", label: "Partner Agencies" },
  { num: "500+", label: "Battles Completed" },
  { num: "2", label: "Countries" },
];

const testimonials = [
  {
    name: "Creator",
    role: "TikTok LIVE Creator",
    quote:
      "NMCN changed my LIVE game completely. The battle exchange gives me opportunities I never had before.",
  },
  {
    name: "Agency Partner",
    role: "Agency Manager",
    quote:
      "Working with NMCN has expanded our reach. The platform makes cross-agency battles seamless.",
  },
  {
    name: "Creator",
    role: "TikTok LIVE Creator",
    quote:
      "The training and support here is unmatched. They actually care about your growth as a creator.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_60%_20%,rgba(0,180,216,0.1),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl">
          <span className="mb-6 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Full-Service Creator Agency
          </span>
          <h1 className="mb-6 font-heading text-5xl font-bold leading-tight text-white md:text-7xl">
            Your Empire Starts With
            <br />
            <span className="gold-text">The Right Family</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-nmcn-muted">
            Nexus Mafia Creator Network LLC - Professional creator management,
            battle coordination, and personalized coaching for TikTok LIVE
            creators and agencies across the US &amp; Canada.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/join" className="btn-gold px-8 py-3 text-base">
              Join NMCN
            </Link>
            <Link
              href="/battle-exchange"
              className="btn-outline px-8 py-3 text-base"
            >
              Battle Exchange
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* What We Do */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            What We Do
          </span>
          <h2 className="mb-4 font-heading text-3xl font-bold text-white md:text-4xl">
            Everything You Need to{" "}
            <span className="gold-text">Dominate LIVE</span>
          </h2>
          <p className="mb-12 max-w-2xl text-nmcn-muted">
            We provide the tools, strategy, and community to help creators and
            agencies succeed in the TikTok LIVE space.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="card group p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
                  <f.icon className="h-6 w-6 text-nmcn-blue" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm text-nmcn-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Why NMCN */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Why NMCN
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white md:text-4xl">
            Built Different
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Trophy,
                title: "Battle-Hardened Platform",
                desc: "Our Battle Exchange connects agencies and creators for competitive LIVE events with real-time tracking.",
              },
              {
                icon: Users,
                title: "Family Culture",
                desc: "We're not just a network - we're a family. Every creator gets personalized attention and support.",
              },
              {
                icon: Globe,
                title: "Growing Network",
                desc: "12 partner agencies, 100+ creators across the US and Canada, and we're just getting started.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-nmcn-border-gold bg-nmcn-gold/10">
                  <item.icon className="h-6 w-6 text-nmcn-gold" />
                </div>
                <div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-nmcn-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Testimonials
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white md:text-4xl">
            Hear From Our <span className="gold-text">Creators</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 fill-nmcn-gold text-nmcn-gold"
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm text-nmcn-muted">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-nmcn-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 font-heading text-3xl font-bold text-white md:text-4xl">
            Ready to <span className="gold-text">Level Up</span>?
          </h2>
          <p className="mb-8 text-nmcn-muted">
            Join Nexus Mafia Creator Network and get access to battle
            coordination, personalized management, and a network of creators
            and agencies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/join" className="btn-gold px-8 py-3 text-base">
              Apply Now
            </Link>
            <Link
              href="/battle-exchange"
              className="btn-outline px-8 py-3 text-base"
            >
              Explore Battle Exchange
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
