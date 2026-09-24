import Link from "next/link";
import { cookies } from "next/headers";
import OpenLoginButton from "@/components/OpenLoginButton";
import {
  Swords,
  Calendar,
  BarChart3,
  Bell,
  Users,
  ArrowRight,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "Cross-Agency Battles",
    desc: "Challenge other agencies, accept open battles, and coordinate cross-team matchups in real-time.",
  },
  {
    icon: Calendar,
    title: "Battle Calendar",
    desc: "Monthly, weekly, and daily views of all scheduled battles. Never miss a match.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "Win rates, leaderboards, streaks, and performance charts for creators, teams, and agencies.",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    desc: "Instant notifications for battle updates, comments, and results as they happen.",
  },
  {
    icon: Users,
    title: "Agency Network",
    desc: "Connect with 12+ partner agencies across the US and Canada for cross-agency events.",
  },
];

export default async function BattleExchangePage() {
  let isLoggedIn = false;
  try {
    const cookieStore = await cookies();
    isLoggedIn = Boolean(
      cookieStore.get("creator-token")?.value || cookieStore.get("admin-token")?.value
    );
  } catch {
    isLoggedIn = false;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-24">
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-nmcn-gold bg-nmcn-gold/10">
              <Lock className="h-7 w-7 text-nmcn-gold" />
            </div>
            <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
              Battle Exchange is <span className="gold-text">Members Only</span>
            </h1>
            <p className="mb-8 text-lg text-nmcn-muted">
              Log in with your account to view the Battle Exchange platform, or
              apply to join the network.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <OpenLoginButton className="btn-gold flex items-center gap-2 px-8 py-3 text-base">
                <Lock className="h-4 w-4" />
                Log In to Continue
              </OpenLoginButton>
              <Link href="/join" className="btn-outline px-8 py-3 text-base">
                Apply Now
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-gold">
            Battle Exchange Platform
          </span>
          <h1 className="mb-6 font-heading text-4xl font-bold text-white md:text-5xl">
            The Ultimate <span className="gold-text">Battle Platform</span>
          </h1>
          <p className="mb-10 text-lg text-nmcn-muted">
            Professional battle coordination, cross-agency matchmaking, and
            real-time battle analytics for TikTok LIVE creators and agencies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://nmcnbattleexchange.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold flex items-center gap-2 px-8 py-3 text-base"
            >
              Open Battle Exchange
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/join" className="btn-outline px-8 py-3 text-base">
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-gold">
            Platform Features
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white">
            Everything You Need to Battle
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="card group p-6 transition-all hover:-translate-y-1 hover:border-nmcn-gold/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border-gold bg-nmcn-gold/10">
                  <f.icon className="h-6 w-6 text-nmcn-gold" />
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

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-gold">
            How It Works
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white">
            Battle in 4 Steps
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              "Coordinator creates battle",
              "Agency manager approves",
              "Agencies accept & confirm",
              "Battle completed & tracked",
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-nmcn-gold bg-nmcn-gold/10 font-heading text-xl font-bold text-nmcn-gold">
                  {i + 1}
                </div>
                <p className="text-sm text-nmcn-muted">{s}</p>
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
            Ready to <span className="gold-text">Battle</span>?
          </h2>
          <p className="mb-8 text-nmcn-muted">
            Apply Now to get access to the Battle Exchange platform and start
            competing with agencies across the US and Canada.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://nmcnbattleexchange.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold flex items-center gap-2 px-8 py-3 text-base"
            >
              Open Battle Exchange
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/join" className="btn-outline px-8 py-3 text-base">
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


