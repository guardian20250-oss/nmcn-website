import {
  Shield,
  Target,
  Heart,
  Users,
  Swords,
  BarChart3,
  GraduationCap,
  Globe,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Integrity",
    desc: "We operate with transparency and honesty. Every creator, every agency - we treat everyone like family.",
  },
  {
    icon: Target,
    title: "Excellence",
    desc: "We push our creators to be the best. Through coaching, analytics, and battle experience, we drive results.",
  },
  {
    icon: Heart,
    title: "Community",
    desc: "We're building more than a network - we're building a family. Collaboration over competition.",
  },
  {
    icon: Users,
    title: "Empowerment",
    desc: "We give creators the tools, knowledge, and platform to build their empire on their own terms.",
  },
];

const milestones = [
  {
    year: "Founded",
    title: "NMCN Established",
    desc: "Nexus Mafia Creator Network LLC founded with a vision to revolutionize the TikTok LIVE creator space.",
  },
  {
    year: "Launch",
    title: "Battle Exchange Platform",
    desc: "Launched our proprietary Battle Exchange platform for cross-agency battle coordination.",
  },
  {
    year: "Growth",
    title: "12 Agency Partners",
    desc: "Expanded to 12 partner agencies across the US and Canada with 100+ creators.",
  },
  {
    year: "Now",
    title: "Building the Future",
    desc: "Continuing to grow, innovate, and empower creators to build their empires.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24">
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            About NMCN
          </span>
          <h1 className="mb-6 font-heading text-4xl font-bold text-white md:text-5xl">
            We Build <span className="gold-text">Empires</span>
          </h1>
          <p className="text-lg text-nmcn-muted">
            Nexus Mafia Creator Network LLC is a full-service creator management
            agency dedicated to empowering TikTok LIVE creators and agencies
            across the US and Canada.
          </p>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Mission */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
                Our Mission
              </span>
              <h2 className="mb-6 font-heading text-3xl font-bold text-white">
                Revolutionizing the LIVE Space
              </h2>
              <p className="mb-4 text-nmcn-muted">
                We help creators build their empires and achieve financial
                freedom through LIVE battles, personalized management, and a
                supportive community.
              </p>
              <p className="text-nmcn-muted">
                Our Battle Exchange platform connects agencies and creators for
                competitive LIVE events, while our training programs equip
                creators with the skills they need to succeed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Swords, label: "Battle Exchange" },
                { icon: GraduationCap, label: "Creator Training" },
                { icon: BarChart3, label: "Analytics" },
                { icon: Globe, label: "US & Canada" },
              ].map((item, i) => (
                <div key={i} className="card flex flex-col items-center p-6 text-center">
                  <item.icon className="mb-3 h-8 w-8 text-nmcn-blue" />
                  <span className="text-sm font-medium text-white">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Values */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Our Values
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white">
            What We Stand For
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((v, i) => (
              <div key={i} className="card flex gap-4 p-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-nmcn-border-gold bg-nmcn-gold/10">
                  <v.icon className="h-6 w-6 text-nmcn-gold" />
                </div>
                <div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-white">
                    {v.title}
                  </h3>
                  <p className="text-sm text-nmcn-muted">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-5xl" />

      {/* Timeline */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Our Journey
          </span>
          <h2 className="mb-12 font-heading text-3xl font-bold text-white">
            How We Got Here
          </h2>
          <div className="space-y-8">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-nmcn-blue bg-nmcn-blue/10 text-xs font-bold text-nmcn-blue">
                    {i + 1}
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="mt-2 h-full w-px bg-nmcn-border" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-xs font-semibold uppercase tracking-wider text-nmcn-blue">
                    {m.year}
                  </span>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-white">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-sm text-nmcn-muted">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
