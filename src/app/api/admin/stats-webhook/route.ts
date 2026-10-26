import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import {
  listStatsHooks, parseHookId, saveStatsHookList, statsHookUrls,
  isValidWebhookUrl, maskWebhook, HOOK_PURPOSES, type HookPurpose,
  getReminderSchedule, saveReminderSchedule, REMINDER_TIMEZONES,
} from "@/lib/stats-webhook";
import { getTeamNames, saveTeamNames, sendStatsUploadedCard, hasSentFirstCard } from "@/lib/stats-notify";

export const runtime = "nodejs";

// Owner-only dashboard control for the stats Discord webhooks, Exchange-style:
// one URL box, a "what's this for" dropdown, and a list you can edit or remove.
//   reminders → managers channel, daily overdue-team cron
//   notify    → creators channel(s), auto "summary uploaded" cards (multi-URL)
// Plus: editable team names used in the cards, and a manual "Send now" for
// when stats were uploaded before the cards existed.
// CRON_SECRET still lives in Vercel (Vercel signs cron requests with it before any of our code runs).
async function requireOwner(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (staff.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { staff };
}

/** Normalise a submitted URL. `bad` is echoed back so we can name it. */
function cleanUrl(raw: unknown): { url: string } | { bad: string } {
  const url = String(raw || "").trim();
  if (!url) return { bad: "" };
  return isValidWebhookUrl(url) ? { url } : { bad: url };
}

// GET → the webhook list (masked, one stable id per entry), team names,
// team leads, and the reminder schedule.
export async function GET(request: NextRequest) {
  const { error } = await requireOwner(request);
  if (error) return error;
  const [hooks, teamNames, teamLeadRows, schedule, firstCardSent] = await Promise.all([
    listStatsHooks(),
    getTeamNames(),
    // Known team leads ("Creator Network manager" emails already in the stats).
    prisma.creatorStat.groupBy({ by: ["teamLead"], _count: { _all: true } }),
    getReminderSchedule(),
    hasSentFirstCard(),
  ]);
  const teamLeads = teamLeadRows
    .map(r => r.teamLead)
    .filter((t): t is string => Boolean(t))
    .sort((a, b) => a.localeCompare(b));
  return NextResponse.json({
    // One flat, editable list: { id, purpose, url (masked), source }
    hooks: hooks.map(h => ({ ...h, url: maskWebhook(h.url) })),
    purposes: HOOK_PURPOSES,
    teamNames,
    teamLeads,
    schedule, // { enabled, day, time, timeZone }
    timezones: REMINDER_TIMEZONES,
    firstCardSent,
    cronSecretConfigured: Boolean(process.env.CRON_SECRET),
  });
}

// POST → { action: "add" | "update" | "remove" | "test" | "save_team_names"
//        | "save_schedule" | "send_now", ... }
export async function POST(request: NextRequest) {
  const { staff, error } = await requireOwner(request);
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  // Team names: { action: "save_team_names", names: { "lead@x.com": "Team X" } }
  if (action === "save_team_names") {
    const names = body.names;
    if (!names || typeof names !== "object" || Array.isArray(names)) {
      return NextResponse.json({ error: "Expected names as an object of email → team name" }, { status: 400 });
    }
    await saveTeamNames(names as Record<string, string>);
    await prisma.creatorStatAuditLog.create({
      data: { action: "team_names", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Updated Discord team names` },
    });
    return NextResponse.json({ ok: true, teamNames: await getTeamNames() });
  }

  // Reminder schedule: { action: "save_schedule", enabled, day, time, timeZone }
  if (action === "save_schedule") {
    const day = Number(body.day);
    const time = String(body.time || "").trim();
    const timeZone = String(body.timeZone || "").trim();
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json({ error: "Pick a day of the week" }, { status: 400 });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return NextResponse.json({ error: "Time must look like 09:00" }, { status: 400 });
    }
    if (!(REMINDER_TIMEZONES as readonly string[]).includes(timeZone)) {
      return NextResponse.json({ error: "Unknown timezone" }, { status: 400 });
    }
    const schedule = { enabled: Boolean(body.enabled), day, time, timeZone };
    await saveReminderSchedule(schedule);
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "reminder_schedule", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Reminder schedule ${schedule.enabled ? `enabled — ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]} ${time} ${timeZone}` : "disabled (daily overdue check)"}`,
      },
    });
    return NextResponse.json({ ok: true, schedule });
  }

  // ── Webhook list CRUD (Exchange-style) ───────────────────────────────────
  //   add    { url, purpose }         append (reminders = single slot)
  //   update { id, url }              replace one entry in place
  //   remove { id }
  if (action === "add" || action === "update" || action === "remove") {
    const hooks = await listStatsHooks();

    if (action === "remove") {
      const target = hooks.find(h => h.id === body.id);
      const ref = parseHookId(body.id);
      if (!target || !ref) return NextResponse.json({ error: "That webhook is no longer saved — reload the page" }, { status: 404 });
      await saveStatsHookList(ref.purpose, hooks.filter(h => h.purpose === ref.purpose && h.id !== target.id).map(h => h.url));
      await prisma.creatorStatAuditLog.create({
        data: {
          action: "webhook_removed", adminId: staff.id, adminEmail: staff.email,
          details: `[${staff.role}] Removed ${target.purpose} webhook ${maskWebhook(target.url)}`,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // On update the purpose is fixed — a webhook can't be moved between channels.
    const purpose = action === "add" ? body.purpose : hooks.find(h => h.id === body.id)?.purpose;
    if (purpose !== "reminders" && purpose !== "notify") {
      return NextResponse.json({ error: "Pick what the notification is for" }, { status: 400 });
    }
    const checked = cleanUrl(body.url);
    if ("bad" in checked) {
      return NextResponse.json({
        error: checked.bad
          ? `"${maskWebhook(checked.bad)}" doesn't look like a Discord webhook URL (expected https://discord.com/api/webhooks/…)`
          : "Paste a webhook URL",
      }, { status: 400 });
    }

    const forPurpose = hooks.filter(h => h.purpose === purpose).map(h => h.url);
    let next: string[];
    if (action === "add") {
      next = [...forPurpose, checked.url];
    } else {
      const ref = parseHookId(body.id);
      if (!ref || forPurpose.length <= ref.index) {
        return NextResponse.json({ error: "That webhook is no longer saved — reload the page and try again" }, { status: 404 });
      }
      next = [...forPurpose];
      next[ref.index] = checked.url;
    }
    // `reminders` collapses to one slot — see saveStatsHookList.
    const saved = await saveStatsHookList(purpose, next);
    await prisma.creatorStatAuditLog.create({
      data: {
        action: action === "add" ? "webhook_added" : "webhook_updated",
        adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] ${action === "add" ? "Added" : "Updated"} ${purpose} webhook ${maskWebhook(checked.url)}`,
      },
    });
    return NextResponse.json({
      ok: true,
      note: saved.length < next.length ? "Manager reminders only need one webhook — the new one replaced it." : undefined,
    });
  }

  if (action === "test") {
    // Test ONE saved webhook: { action: "test", id: "notify:0" }.
    // Legacy callers can still pass { channel } — that tests the first
    // webhook for that purpose.
    const ref = parseHookId(body.id);
    const purpose: HookPurpose = ref ? ref.purpose : body.channel === "notify" ? "notify" : "reminders";
    const urls = await statsHookUrls(purpose);
    const url = ref ? urls[ref.index] : urls[0];
    if (!url) return NextResponse.json({ error: "That webhook isn't saved any more — reload the page" }, { status: 400 });

    const payload =
      purpose === "notify"
        ? {
            username: "NMCN Creator Stats",
            embeds: [
              {
                title: "📊 Weekly summary uploaded",
                description: "The **Weekly summary** has been uploaded for:\n• **Team Example**",
                color: 0xd4af37,
                fields: [
                  { name: "Creators updated", value: "12", inline: true },
                  { name: "Uploaded by", value: staff.name, inline: true },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "NMCN Creator Stats" },
              },
            ],
          }
        : {
            content:
              "✅ **Stats reminders test** — sent from the nmcn dashboard. If you can read this, weekly upload reminders will land here.",
          };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Discord rejected it (HTTP ${res.status})`, detail: text.slice(0, 200) }, { status: 502 });
    }
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "webhook_test", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Sent a Discord ${purpose} test to ${maskWebhook(url)}`,
      },
    });
    return NextResponse.json({ ok: true, purpose });
  }

  // Manual card: { action: "send_now", periodType: "weekly"|"monthly",
  //                scope: "master" | <team-lead email>, creators?: number }
  if (action === "send_now") {
    const periodType = body.periodType === "monthly" ? "monthly" : "weekly";
    const isMasterFile = body.scope === "master";
    const teamLeads: string[] = isMasterFile ? [] : [String(body.scope || "").trim()].filter(Boolean);
    if (!isMasterFile && !teamLeads.length) {
      return NextResponse.json({ error: "Choose the master file or a team" }, { status: 400 });
    }
    const importedCount = Number.isInteger(body.creators) && (body.creators as number) >= 0 ? (body.creators as number) : 0;
    const result = await sendStatsUploadedCard({
      periodType,
      teamLeads,
      isMasterFile,
      importedCount,
      uploadedBy: staff.name,
    });
    await prisma.creatorStatAuditLog.create({
      data: {
        action: "notify_send_now", adminId: staff.id, adminEmail: staff.email,
        details: `[${staff.role}] Manually sent a ${periodType} stats card (${isMasterFile ? "master file" : teamLeads.join(", ")}) to ${result.sent} webhook(s)`,
      },
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.skipped || `Failed on all ${result.failed} webhooks` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sent: result.sent, failed: result.failed });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
