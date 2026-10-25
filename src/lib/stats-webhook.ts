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

export type WebhookSource = "dashboard" | "env" | "unset";

export async function getStatsWebhook(): Promise<{ url: string | null; source: WebhookSource }> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STATS_WEBHOOK_KEY } });
    const saved = (row?.value || "").trim();
    if (saved) return { url: saved, source: "dashboard" };
  } catch {
    /* DB unreachable — fall through to env */
  }
  const env = (process.env.DISCORD_STATS_WEBHOOK || "").trim();
  if (env) return { url: env, source: "env" };
  return { url: null, source: "unset" };
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
