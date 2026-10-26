import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import {
  getStatsWebhook, getStatsNotifyWebhooks, isValidWebhookUrl, maskWebhook,
  getReminderSchedule, saveReminderSchedule, REMINDER_TIMEZONES,
  STATS_WEBHOOK_KEY, STATS_NOTIFY_WEBHOOK_KEY,
} from "@/lib/stats-webhook";
import { getTeamNames, saveTeamNames, sendStatsUploadedCard, hasSentFirstCard } from "@/lib/stats-notify";

export const runtime = "nodejs";

// Owner-only dashboard control for the stats Discord webhooks —
//   channel "reminders" → managers channel, daily overdue-team cron (existing)
//   channel "notify"    → creators channel(s), auto "summary uploaded" cards (new)
//                         — accepts SEVERAL URLs, one per Discord server.
// Plus: editable team names used in the cards, and a manual "Send now" for
// when stats were uploaded before the cards existed.
// CRON_SECRET still lives in Vercel (Vercel signs cron requests with it before any of our code runs).
async function requireOwner(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (staff.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { staff };
}

// GET → both webhooks (masked) + where each comes from, team names, team leads.
export async function GET(request: NextRequest) {
  const { error } = await requireOwner(request);
  if (error) return error;
  const [reminders, notify, teamNames, teamLeadRows, schedule, firstCardSent] = await Promise.all([
    getStatsWebhook(),
    getStatsNotifyWebhooks(),
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
    webhook: reminders.url ? maskWebhook(reminders.url) : "",
    source: reminders.source, // dashboard | env | unset
    notifyWebhooks: notify.urls.map(maskWebhook),
    notifySource: notify.source,
    teamNames,
    teamLeads,
    schedule, // { enabled, day, time, timeZone }
    timezones: REMINDER_TIMEZONES,
    firstCardSent,
    cronSecretConfigured: Boolean(process.env.CRON_SECRET),
  });
}

// POST → { action: "save" | "clear" | "test" | "save_team_names" | "send_now", ... }
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

  const channel = body.channel === "notify" ? "notify" : "reminders";
  const key = channel === "notify" ? STATS_NOTIFY_WEBHOOK_KEY : STATS_WEBHOOK_KEY;

  if (action === "save") {
    if (channel === "notify") {
      // Creators channel(s): newline/comma separated — one URL per server.
      const urls = String(body.url || "")
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (!urls.length) return NextResponse.json({ error: "Paste at least one webhook URL" }, { status: 400 });
      const bad = urls.find(u => !isValidWebhookUrl(u));
      if (bad) {
        return NextResponse.json({ error: `"${maskWebhook(bad)}" doesn't look like a Discord webhook URL (expected https://discord.com/api/webhooks/…)` }, { status: 400 });
      }
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(urls) },
        update: { value: JSON.stringify(urls) },
      });
      return NextResponse.json({ ok: true, notifyWebhooks: urls.map(maskWebhook), notifySource: "dashboard" });
    }
    const url = String(body.url || "").trim();
    if (!isValidWebhookUrl(url)) {
      return NextResponse.json({ error: "That doesn't look like a Discord webhook URL (expected https://discord.com/api/webhooks/…)" }, { status: 400 });
    }
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: url },
      update: { value: url },
    });
    return NextResponse.json({ ok: true, webhook: maskWebhook(url), source: "dashboard" });
  }

  if (action === "clear") {
    await prisma.siteSetting.deleteMany({ where: { key } });
    if (channel === "notify") {
      const resolved = await getStatsNotifyWebhooks();
      return NextResponse.json({ ok: true, notifyWebhooks: resolved.urls.map(maskWebhook), notifySource: resolved.source });
    }
    const resolved = await getStatsWebhook();
    return NextResponse.json({ ok: true, webhook: resolved.url ? maskWebhook(resolved.url) : "", source: resolved.source });
  }

  if (action === "test") {
    if (channel === "notify") {
      const { urls, source } = await getStatsNotifyWebhooks();
      if (!urls.length) return NextResponse.json({ error: "No creators webhook configured yet — save one first" }, { status: 400 });
      const embed = {
        title: "📊 Weekly summary uploaded",
        description: "The **Weekly summary** has been uploaded for:\n• **Team Example**",
        color: 0xd4af37,
        fields: [
          { name: "Creators updated", value: "12", inline: true },
          { name: "Uploaded by", value: staff.name, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "NMCN Creator Stats" },
      };
      const results = await Promise.all(urls.map(async url => {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "NMCN Creator Stats", embeds: [embed] }),
            signal: AbortSignal.timeout(6000),
          });
          return res.ok ? { ok: true as const } : { ok: false as const, error: `HTTP ${res.status}` };
        } catch {
          return { ok: false as const, error: "Request failed" };
        }
      }));
      const failed = results.filter(r => !r.ok);
      if (failed.length === results.length) {
        return NextResponse.json({ ok: false, error: `Discord rejected all ${results.length} webhooks` }, { status: 502 });
      }
      await prisma.creatorStatAuditLog.create({
        data: { action: "webhook_test", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Sent a Discord stats-notify test to ${results.length - failed.length}/${results.length} webhooks (${source})` },
      });
      return NextResponse.json({ ok: true, source, sent: results.length - failed.length, failed: failed.length });
    }

    const { url, source } = await getStatsWebhook();
    if (!url) return NextResponse.json({ error: "No webhook configured yet — save one first" }, { status: 400 });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `✅ **Stats reminders test** — sent from the nmcn dashboard. If you can read this, weekly upload reminders will land here.`,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Discord rejected it (HTTP ${res.status})`, detail: text.slice(0, 200) }, { status: 502 });
    }
    await prisma.creatorStatAuditLog.create({
      data: { action: "webhook_test", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Sent a Discord stats-reminders test (${source})` },
    });
    return NextResponse.json({ ok: true, source });
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
