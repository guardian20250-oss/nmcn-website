import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStatsWebhook, getReminderSchedule, getReminderLastSent, setReminderLastSent, zonedNow, timeToMinutes } from "@/lib/stats-webhook";

export const dynamic = "force-dynamic";

// A team is overdue when its newest export row is older than this.
const STALE_DAYS = 7;
// Discord hard limit is 2000 chars; keep the list well under it.
const MAX_MENTIONS = 20;

/**
 * GET /api/cron/stats-reminders
 *
 * Called by Vercel's cron (see `crons` in vercel.json). Checks every team in
 * the uploaded stats: if a team's newest Backstage export is older than
 * STALE_DAYS, a Discord webhook message goes out so nobody has to remember
 * to upload.
 *
 * Config:
 *   CRON_SECRET            — Vercel cron sends it as `Authorization: Bearer …`
 *                            (must stay a Vercel env var — see stats-webhook.ts)
 *   Discord webhook        — saved on the admin dashboard (SiteSetting), with
 *                            DISCORD_STATS_WEBHOOK as env fallback; unset = disabled
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url: webhook } = await getStatsWebhook();
  if (!webhook) return NextResponse.json({ disabled: true, reason: "No Discord webhook configured (dashboard or env)" });

  // Schedule gate: the cron fires daily (vercel.json), but the dashboard can
  // restrict posting to one weekly slot (day + time + timezone). Enabled =
  // send on the first daily run at/after the chosen time, once per slot.
  const schedule = await getReminderSchedule();
  if (schedule.enabled) {
    const now = zonedNow(schedule.timeZone);
    if (!now) return NextResponse.json({ ok: true, skipped: "bad-timezone" });
    const due = now.weekday === schedule.day && now.minutes >= timeToMinutes(schedule.time);
    if (!due) return NextResponse.json({ ok: true, skipped: "not-due", day: schedule.day, time: schedule.time });
    const lastSent = await getReminderLastSent();
    if (lastSent === now.dateKey) return NextResponse.json({ ok: true, skipped: "already-sent" });
  }

  // Latest export date per team ("Creator Network manager" column).
  const rows = await prisma.creatorStat.groupBy({
    by: ["teamLead"],
    _max: { exportedAt: true },
  });

  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const overdue = rows
    .filter((r): r is { teamLead: string; _max: { exportedAt: Date | null } } => Boolean(r.teamLead))
    .map((r) => ({ email: r.teamLead, last: r._max.exportedAt ? new Date(r._max.exportedAt) : null }))
    .filter((r) => !r.last || r.last.getTime() < cutoff)
    .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0));

  if (!overdue.length) return NextResponse.json({ ok: true, overdue: 0 });

  const lines = overdue.slice(0, MAX_MENTIONS).map((r) => {
    const days = r.last
      ? Math.floor((Date.now() - r.last.getTime()) / (24 * 60 * 60 * 1000))
      : null;
    return `• \`${r.email}\` — ${days === null ? "never uploaded" : `last upload ${days} days ago`}`;
  });
  if (overdue.length > MAX_MENTIONS) lines.push(`…and ${overdue.length - MAX_MENTIONS} more teams`);

  const content =
    `📊 **Creator stats upload overdue**\n` +
    `No Backstage export on file for ${STALE_DAYS}+ days for:\n` +
    lines.join("\n") +
    `\nUpload on the Creator Stats page: ${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/creator-stats`;

  // No retry loop needed: if this fails, tomorrow's run catches it anyway.
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, status: res.status, detail: text.slice(0, 300) }, { status: 502 });
  }

  // Record the slot so a same-day retry can't double-post.
  if (schedule.enabled) {
    const now = zonedNow(schedule.timeZone);
    if (now) await setReminderLastSent(now.dateKey);
  }

  return NextResponse.json({ ok: true, overdue: overdue.length });
}
