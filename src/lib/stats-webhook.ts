// Discord webhook for stats-reminders — dashboard-configurable like the
// Exchange's settings, with the Vercel env var as a fallback.
//
// Resolution order:
//   1. SiteSetting `stats_discord_webhook` (saved from the admin dashboard)
//   2. process.env.DISCORD_STATS_WEBHOOK (legacy/fallback)
// CRON_SECRET is NOT part of this: Vercel itself reads it from the environment
// to sign cron requests, so it must stay a Vercel env var.
import { prisma } from "./prisma";

export const STATS_WEBHOOK_KEY = "stats_discord_webhook";
/** Second webhook: creators channel — "stats uploaded" embed cards (see stats-notify.ts). */
export const STATS_NOTIFY_WEBHOOK_KEY = "stats_discord_notify_webhook";

export type WebhookSource = "dashboard" | "env" | "unset";

async function resolveWebhook(settingKey: string, envVar: string): Promise<{ url: string | null; source: WebhookSource }> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: settingKey } });
    const saved = (row?.value || "").trim();
    if (saved) return { url: saved, source: "dashboard" };
  } catch {
    /* DB unreachable — fall through to env */
  }
  const env = (process.env[envVar] || "").trim();
  if (env) return { url: env, source: "env" };
  return { url: null, source: "unset" };
}

/** Managers-channel webhook — the daily "overdue teams" reminder (cron). */
export async function getStatsWebhook(): Promise<{ url: string | null; source: WebhookSource }> {
  return resolveWebhook(STATS_WEBHOOK_KEY, "DISCORD_STATS_WEBHOOK");
}

/** Creators-channel webhooks — auto "weekly / end of month summary uploaded"
 *  cards. Stored as a JSON array so the same card can go to several servers. */
export async function getStatsNotifyWebhooks(): Promise<{ urls: string[]; source: WebhookSource }> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STATS_NOTIFY_WEBHOOK_KEY } });
    const saved = (row?.value || "").trim();
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const urls = parsed.map(String).map(s => s.trim()).filter(Boolean);
          if (urls.length) return { urls, source: "dashboard" };
        }
      } catch {
        /* not JSON — treat a single saved URL as one entry */
      }
      if (saved.startsWith("http")) return { urls: [saved], source: "dashboard" };
    }
  } catch {
    /* DB unreachable — fall through to env */
  }
  const env = (process.env.DISCORD_STATS_NOTIFY_WEBHOOK || "").trim();
  if (env) return { urls: env.split(",").map(s => s.trim()).filter(Boolean), source: "env" };
  return { urls: [], source: "unset" };
}

/** Discord webhook URLs look like https://discord.com/api/webhooks/<id>/<token>. */
export function isValidWebhookUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      (u.hostname === "discord.com" || u.hostname === "discordapp.com") &&
      u.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}

/** Show enough to recognise the webhook without leaking the token. */
export function maskWebhook(value: string): string {
  if (value.length <= 24) return value;
  return `${value.slice(0, 40)}…${value.slice(-4)}`;
}

// ── Manager reminder schedule ───────────────────────────────────────────────
// The cron itself fires daily (vercel.json — Vercel's plan limits cron to
// daily), but the route only POSTS when the configured weekly slot arrives:
//   enabled=false → old behaviour, post on every daily run when teams overdue
//   enabled=true  → post only on the chosen day, at/after the chosen time,
//                   once per slot (tracked by date key in the DB)
export const REMINDER_SCHEDULE_KEY = "stats_reminder_schedule";
export const REMINDER_LAST_SENT_KEY = "stats_reminder_last_sent";

export interface ReminderSchedule {
  enabled: boolean;
  /** 0=Sunday … 6=Saturday */
  day: number;
  /** "HH:MM" in timeZone */
  time: string;
  timeZone: string;
}

export const REMINDER_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "UTC",
] as const;

export async function getReminderSchedule(): Promise<ReminderSchedule> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REMINDER_SCHEDULE_KEY } });
    if (row?.value) {
      const p = JSON.parse(row.value);
      const day = Number(p.day);
      const time = String(p.time || "");
      const timeZone = String(p.timeZone || "");
      if (
        typeof p.enabled === "boolean" &&
        Number.isInteger(day) && day >= 0 && day <= 6 &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time) &&
        REMINDER_TIMEZONES.includes(timeZone as (typeof REMINDER_TIMEZONES)[number])
      ) {
        return { enabled: p.enabled, day, time, timeZone };
      }
    }
  } catch {
    /* fall through to default */
  }
  return { enabled: false, day: 1, time: "09:00", timeZone: "America/New_York" };
}

export async function saveReminderSchedule(s: ReminderSchedule): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: REMINDER_SCHEDULE_KEY },
    create: { key: REMINDER_SCHEDULE_KEY, value: JSON.stringify(s) },
    update: { value: JSON.stringify(s) },
  });
}

/** Current wall-clock in the given zone: weekday, minutes past midnight, date key. */
export function zonedNow(timeZone: string): { weekday: number; minutes: number; dateKey: string } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23", weekday: "short",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      weekday: weekdays[get("weekday")] ?? 0,
      minutes: Number(get("hour")) * 60 + Number(get("minute")),
      dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    };
  } catch {
    return null;
  }
}

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export async function getReminderLastSent(): Promise<string | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: REMINDER_LAST_SENT_KEY } });
    return row?.value?.trim() || null;
  } catch {
    return null;
  }
}

export async function setReminderLastSent(dateKey: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: REMINDER_LAST_SENT_KEY },
    create: { key: REMINDER_LAST_SENT_KEY, value: dateKey },
    update: { value: dateKey },
  });
}
