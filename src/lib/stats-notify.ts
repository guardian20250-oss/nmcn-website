// Discord "stats uploaded" cards — posted to the creators-channel webhook(s)
// whenever an import is confirmed on /admin/creator-stats.
//
//   • Team lead / manager import → one card naming their team(s) + period.
//   • Owner / co-owner import (scope "all" = the master file) → ONE combined
//     card, no per-team spam.
//   • Manual send (dashboard "Send now") → same card, for when stats were
//     uploaded before this feature existed or a card needs re-sending.
//
// Several webhook URLs can be saved (one per Discord server) — every card
// goes to all of them.
//
// Team names: the Backstage export only has the team lead's email, so names
// are editable in the dashboard (SiteSetting `stats_team_names`, JSON map of
// email → display name). Fallbacks: staff account name → raw email.
//
// This webhook is separate from the reminder one (stats-webhook.ts) so the
// cards land in a creators channel while reminders stay with managers.
import { prisma } from "./prisma";
import { getStatsNotifyWebhooks } from "./stats-webhook";
import { periodLabel } from "./creator-stats";

export const TEAM_NAMES_KEY = "stats_team_names";
/** Set once the first card has gone out — the dashboard retires "Send now" then. */
export const FIRST_SENT_KEY = "stats_notify_first_sent";

export async function markFirstCardSent(): Promise<void> {
  try {
    const existing = await prisma.siteSetting.findUnique({ where: { key: FIRST_SENT_KEY } });
    if (existing) return;
    await prisma.siteSetting.upsert({
      where: { key: FIRST_SENT_KEY },
      create: { key: FIRST_SENT_KEY, value: new Date().toISOString() },
      update: {},
    });
  } catch {
    /* non-critical */
  }
}

/** Editable display name per team-lead email (lowercased key). */
export async function getTeamNames(): Promise<Record<string, string>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: TEAM_NAMES_KEY } });
    const parsed = row?.value ? JSON.parse(row.value) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([k, v]) => [k.trim().toLowerCase(), String(v).trim()] as [string, string])
          .filter(([k, v]) => k && v)
      );
    }
  } catch {
    /* ignore corrupt JSON / DB down — empty map */
  }
  return {};
}

export async function saveTeamNames(names: Record<string, string>): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(names)
      .map(([k, v]) => [k.trim().toLowerCase(), String(v).trim()])
      .filter(([k, v]) => k && v)
  );
  await prisma.siteSetting.upsert({
    where: { key: TEAM_NAMES_KEY },
    create: { key: TEAM_NAMES_KEY, value: JSON.stringify(cleaned) },
    update: { value: JSON.stringify(cleaned) },
  });
}

/** Team display name: dashboard name → staff account name → raw email. */
export async function resolveTeamName(teamLeadEmail: string | null): Promise<string> {
  if (!teamLeadEmail) return "Unassigned team";
  const key = teamLeadEmail.trim().toLowerCase();
  const names = await getTeamNames();
  if (names[key]) return names[key];
  const staff = await prisma.admin.findFirst({
    where: { email: { equals: teamLeadEmail, mode: "insensitive" } },
    select: { name: true },
  });
  return staff?.name || teamLeadEmail;
}

// Gold matches --color-nmcn-gold on the site.
const EMBED_COLOR = 0xd4af37;

export interface StatsUploadedPayload {
  periodType: "weekly" | "monthly";
  /** Team-lead emails covered by this import (from the imported rows). */
  teamLeads: string[];
  /** True for owner/co-owner imports — one combined card, no team list. */
  isMasterFile: boolean;
  importedCount: number;
  uploadedBy: string;
}

/** Build the embed card (exported so the manual "Send now" can reuse it). */
export async function buildStatsUploadedEmbed(payload: StatsUploadedPayload) {
  const label = periodLabel(payload.periodType); // "Weekly" | "Monthly"
  const periodText = payload.periodType === "monthly" ? "End of month summary" : "Weekly summary";

  let title: string;
  let description: string;
  if (payload.isMasterFile) {
    title = `${label} summary stats uploaded`;
    description = `The **${periodText}** has been uploaded — all teams are now up to date.`;
  } else {
    const teams = await Promise.all(payload.teamLeads.map(resolveTeamName));
    const unique = [...new Set(teams)];
    title = `${label} summary uploaded`;
    description =
      `The **${periodText}** has been uploaded for:\n` +
      unique.map(t => `• **${t}**`).join("\n");
  }

  return {
    title: `📊 ${title}`,
    description,
    color: EMBED_COLOR,
    fields: [
      { name: "Creators updated", value: String(payload.importedCount), inline: true },
      { name: "Uploaded by", value: payload.uploadedBy, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "NMCN Creator Stats" },
  };
}

/**
 * Send the card to EVERY saved creators-channel webhook. Fire-and-forget
 * semantics per URL: one dead server never blocks the others, and a Discord
 * hiccup never fails an import that already committed.
 */
export async function sendStatsUploadedCard(
  payload: StatsUploadedPayload
): Promise<{ ok: boolean; sent: number; failed: number; skipped?: string; errors?: string[] }> {
  const { urls } = await getStatsNotifyWebhooks();
  if (!urls.length) return { ok: false, sent: 0, failed: 0, skipped: "No creators-channel webhook configured" };

  const embed = await buildStatsUploadedEmbed(payload);
  const errors: string[] = [];
  let sent = 0;

  await Promise.all(
    urls.map(async url => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "NMCN Creator Stats",
            embeds: [embed],
          }),
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) sent++;
        else errors.push(`Discord responded ${res.status}`);
      } catch {
        errors.push("Request failed");
      }
    })
  );

  // First card out = "Send now" retires itself on the dashboard.
  if (sent > 0) await markFirstCardSent();

  return { ok: sent > 0, sent, failed: urls.length - sent, errors: errors.length ? errors : undefined };
}

/** True once any card (auto or manual) has gone out — hides "Send now". */
export async function hasSentFirstCard(): Promise<boolean> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: FIRST_SENT_KEY } });
    return Boolean(row?.value);
  } catch {
    return false;
  }
}
