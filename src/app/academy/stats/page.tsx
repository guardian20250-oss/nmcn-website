import { cookies } from "next/headers";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getCreatorAccountByToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREATOR_SAFE_SELECT, STATS_CONFIG, isPeriodType, periodLabel } from "@/lib/creator-stats";
import OpenLoginButton from "@/components/OpenLoginButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Stats | Nexus Mafia Creator Network" };

// Creator-facing "My Stats" (layout per creator-dashboard-v1 mockup).
// Shows ONLY the approved fields from the creator's latest stat row:
//   manager/team lead, tier status, days since joining, Diamonds L30D,
//   valid go-LIVE days L30D, LIVE duration L30D, Star Creator achieved + days.
// Met / not-met badges vs 8 days and 20 hours; Tier 5 = 500,000 ◆ note.
// Battle panels are stubs. No progress bars.

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
function hours(h: number) {
  const whole = Math.floor(Math.max(0, h));
  return `${whole}h ${Math.round((Math.max(0, h) - whole) * 60)}m`;
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">{title}</h3>
      {children}
    </div>
  );
}

function GoalTag({ met, goal }: { met: boolean; goal: string }) {
  return (
    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${met ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
      {met ? "Goal met" : "Goal not met"} · {goal}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="my-1.5 flex justify-between text-sm">
      <span className="text-nmcn-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function TrendChart({ points }: { points: { label: string; value: number }[] }) {
  if (points.length < 2) {
    return <p className="py-12 text-center text-sm text-nmcn-muted">Your history appears once there is more than one upload of this type.</p>;
  }
  const W = 560, H = 170, L = 40, R = 550, T = 20, B = 130;
  const max = Math.max(...points.map(p => p.value), 1);
  const x = (i: number) => L + ((R - L) * i) / (points.length - 1);
  const y = (v: number) => B - ((B - T) * v) / max;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Diamonds across uploads">
      {[T, (T + B) / 2, B].map(gy => <line key={gy} x1={L} x2={R} y1={gy} y2={gy} stroke="#22304a" />)}
      <text x={2} y={T + 4} fill="#8b97aa" fontSize="10">{fmt(max)}</text>
      <text x={2} y={B + 4} fill="#8b97aa" fontSize="10">0</text>
      <polyline fill="none" stroke="#D4AF37" strokeWidth="3" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill="#D4AF37" />
          <text x={x(i)} y={H - 10} fill="#8b97aa" fontSize="11" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default async function MyStatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const cookieStore = await cookies();
  const account = await getCreatorAccountByToken(cookieStore.get("creator-token")?.value).catch(() => null);

  if (!account || account.status !== "active") {
    return (
      <div className="min-h-screen px-6 pt-28">
        <div className="card mx-auto max-w-md p-8 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-nmcn-gold" />
          <h1 className="font-heading text-2xl font-bold text-white">My Stats</h1>
          <p className="mt-2 text-sm text-nmcn-muted">
            {account ? "Your account is pending approval." : "Log in with your creator account to see your LIVE stats."}
          </p>
          {!account && <OpenLoginButton className="btn-gold mt-5 text-sm">Log In</OpenLoginButton>}
        </div>
      </div>
    );
  }

  // SECURITY: only rows linked to the logged-in account, approved fields only.
  const history = await prisma.creatorStat.findMany({
    where: { creatorAccountId: account.id },
    select: CREATOR_SAFE_SELECT,
    orderBy: [{ exportedAt: "desc" }, { id: "desc" }],
    take: 60,
  });
  const latest = history[0];
  const own = await prisma.creatorAccount.findUnique({ where: { id: account.id }, select: { tiktokHandle: true } });
  const handle = own?.tiktokHandle ? `@${own.tiktokHandle.trim().replace(/^@+/, "")}` : account.name;

  if (!latest) {
    return (
      <div className="min-h-screen px-6 pt-28">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-nmcn-gold" />
          <h1 className="font-heading text-2xl font-bold text-white">No stats yet</h1>
          <p className="mt-2 text-sm text-nmcn-muted">
            Your stats show up after your team&apos;s next Backstage upload. Make sure your TikTok handle is saved on{" "}
            <Link href="/academy/account" className="text-nmcn-blue hover:underline">your account</Link> exactly as it appears on TikTok.
          </p>
        </div>
      </div>
    );
  }

  // Manager / team lead: friendly staff name if the export value matches a staff email.
  let managerLabel = latest.teamLead;
  if (latest.teamLead) {
    const staffMatch = await prisma.admin.findFirst({
      where: { email: { equals: latest.teamLead.trim(), mode: "insensitive" } },
      select: { name: true },
    });
    if (staffMatch?.name) managerLabel = staffMatch.name;
  }

  const goals = STATS_CONFIG;
  // History filter: explicit ?period, else the latest row's type, unless only the other type has history.
  const countOf = (t: string) => history.filter(h => h.periodType === t).length;
  const otherType = latest.periodType === "monthly" ? "weekly" : "monthly";
  const trendType = isPeriodType(period) ? period : countOf(latest.periodType) < 2 && countOf(otherType) >= 2 ? otherType : latest.periodType;
  const prev = history.find(h => h.id !== latest.id && h.periodType === latest.periodType && h.exportedAt < latest.exportedAt);
  const diamondsDelta = prev ? latest.diamondsL30D - prev.diamondsL30D : null;
  const trend = history.filter(h => h.periodType === trendType).slice(0, 12).reverse()
    .map(h => ({ label: fmtShort(h.exportedAt), value: h.diamondsL30D }));
  const tierMaintained = latest.tierStatus ? /^maintained/i.test(latest.tierStatus) : null;

  return (
    <div className="min-h-screen px-6 pb-16 pt-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <h1 className="font-heading text-3xl font-bold text-white">Welcome back, <span className="gold-text">{handle}</span></h1>
        <div className="mb-6 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-nmcn-muted">
          <span className="font-semibold text-nmcn-gold">Stats as of {fmtDate(latest.exportedAt)}</span>
          <span>· {periodLabel(latest.periodType)}</span>
          {managerLabel && <span>· Manager: <span className="text-nmcn-text">{managerLabel}</span></span>}
          {latest.tierStatus && (
            <span className={`ml-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tierMaintained === false ? "border-amber-400/60 text-amber-300" : "border-nmcn-gold text-nmcn-gold"}`}>
              {latest.tierStatus}
            </span>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Diamonds (L30D)">
            <p className="text-3xl font-bold text-white">{fmt(latest.diamondsL30D)}</p>
            {diamondsDelta !== null && diamondsDelta !== 0 && (
              <p className={`mt-1 text-xs font-semibold ${diamondsDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {diamondsDelta > 0 ? "▲" : "▼"} {fmt(Math.abs(diamondsDelta))} vs previous {periodLabel(latest.periodType).toLowerCase()}
              </p>
            )}
          </Card>
          <Card title="Valid LIVE Days (L30D)">
            <p className="text-3xl font-bold text-white">{latest.validDaysL30D}</p>
            <GoalTag met={latest.validDaysL30D >= goals.validDaysGoal} goal={`${goals.validDaysGoal} days`} />
          </Card>
          <Card title="LIVE Duration (L30D)">
            <p className="text-3xl font-bold text-white">{hours(latest.liveDurationL30D)}</p>
            <GoalTag met={latest.liveDurationL30D >= goals.liveHoursGoal} goal={`${goals.liveHoursGoal} hrs`} />
          </Card>
          <Card title="Days Since Joining">
            <p className="text-3xl font-bold text-white">{latest.daysSinceJoining ?? "—"}</p>
          </Card>
        </div>

        {/* Trend + tier / star creator */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Diamonds across uploads</h3>
              <div className="flex gap-1 text-xs">
                {(["weekly", "monthly"] as const).map(t => (
                  <Link key={t} href={`/academy/stats?period=${t}`} scroll={false}
                    className={`rounded-full border px-3 py-0.5 ${trendType === t ? "border-nmcn-gold text-nmcn-gold" : "border-nmcn-border text-nmcn-muted hover:text-white"}`}>
                    {periodLabel(t)}
                  </Link>
                ))}
              </div>
            </div>
            <TrendChart points={trend} />
          </div>
          <div className="card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Tier</h3>
            <Row label="Current" value={<span className={tierMaintained === false ? "text-amber-300" : ""}>{latest.tierStatus || "—"}</span>} />
            <Row label="Top tier" value={`Tier 5 · ${fmt(goals.tierTargets[5])} ◆`} />
            <hr className="my-4 border-nmcn-border" />
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Star Creator</h3>
            <Row label="Achieved" value={latest.achievedStarCreator ? "Yes ⭐" : "Not yet"} />
            <Row label="Days this month" value={latest.starCreatorDaysThisMonth} />
          </div>
        </div>

        {/* Battle (stubs) + academy */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* TODO: battle panels are stubs; wire to the Battle Exchange later via a server-to-server API. */}
          <Card title="Battle Record">
            <p className="text-3xl font-bold text-white">—</p>
            <p className="mt-1 text-sm text-nmcn-muted">Coming soon</p>
          </Card>
          <Card title="Next Battle">
            <p className="text-sm text-nmcn-muted">Your upcoming battles will show here.</p>
            <Link href="/battle-exchange" className="btn-gold mt-3 inline-block text-sm">View Battle Exchange</Link>
          </Card>
          <Card title="Academy">
            <p className="text-sm text-nmcn-muted">Keep leveling up with lessons built for LIVE creators.</p>
            <Link href="/academy" className="btn-gold mt-3 inline-block text-sm">Continue Lesson</Link>
          </Card>
        </div>

        <div className="card mt-4 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-nmcn-muted">Recent Battles</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nmcn-border text-left text-nmcn-muted">
                <th className="px-1.5 py-2 font-semibold">Date</th><th className="px-1.5 py-2 font-semibold">Opponent</th>
                <th className="px-1.5 py-2 font-semibold">Type</th><th className="px-1.5 py-2 font-semibold">Agency</th><th className="px-1.5 py-2 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={5} className="px-1.5 py-6 text-center text-nmcn-muted">Battle history will appear here once it&apos;s connected to the Battle Exchange.</td></tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs text-nmcn-muted">Only you and NMCN staff can see these stats. Numbers come from TikTok LIVE Backstage.</p>
      </div>
    </div>
  );
}
