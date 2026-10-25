import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest } from "@/lib/auth";
import { getStatsWebhook, isValidWebhookUrl, maskWebhook, STATS_WEBHOOK_KEY } from "@/lib/stats-webhook";

export const runtime = "nodejs";

// Owner-only dashboard control for the stats-reminder Discord webhook —
// the "Exchange-style" settings box. CRON_SECRET still lives in Vercel
// (Vercel signs cron requests with it before any of our code runs).
async function requireOwner(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (staff.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { staff };
}

// GET → current webhook (masked) + where it comes from.
export async function GET(request: NextRequest) {
  const { error } = await requireOwner(request);
  if (error) return error;
  const { url, source } = await getStatsWebhook();
  return NextResponse.json({
    webhook: url ? maskWebhook(url) : "",
    source, // dashboard | env | unset
    cronSecretConfigured: Boolean(process.env.CRON_SECRET),
  });
}

// POST → { action: "save" | "clear" | "test", url? }
export async function POST(request: NextRequest) {
  const { staff, error } = await requireOwner(request);
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "save") {
    const url = String(body.url || "").trim();
    if (!isValidWebhookUrl(url)) {
      return NextResponse.json({ error: "That doesn't look like a Discord webhook URL (expected https://discord.com/api/webhooks/…)" }, { status: 400 });
    }
    await prisma.siteSetting.upsert({
      where: { key: STATS_WEBHOOK_KEY },
      create: { key: STATS_WEBHOOK_KEY, value: url },
      update: { value: url },
    });
    return NextResponse.json({ ok: true, webhook: maskWebhook(url), source: "dashboard" });
  }

  if (action === "clear") {
    await prisma.siteSetting.deleteMany({ where: { key: STATS_WEBHOOK_KEY } });
    const { url, source } = await getStatsWebhook();
    return NextResponse.json({ ok: true, webhook: url ? maskWebhook(url) : "", source });
  }

  if (action === "test") {
    const { url, source } = await getStatsWebhook();
    if (!url) {
      return NextResponse.json({ error: "No webhook configured yet — save one first" }, { status: 400 });
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `✅ **Stats reminders test** — sent from the ${"nmcn"} dashboard. If you can read this, weekly upload reminders will land here.`,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Discord rejected it (HTTP ${res.status})`, detail: text.slice(0, 200) }, { status: 502 });
    }
    await prisma.creatorStatAuditLog.create({
      data: { action: "webhook_test", adminId: staff.id, adminEmail: staff.email, details: `[${staff.role}] Sent a Discord stats-webhook test (${source})` },
    });
    return NextResponse.json({ ok: true, source });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
