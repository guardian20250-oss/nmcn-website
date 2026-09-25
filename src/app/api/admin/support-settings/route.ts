import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canViewAllTickets } from "@/lib/auth";
import {
  CARRIER_GATEWAYS,
  getSupportSettings,
  sendDiscordWebhook,
  sendSms,
} from "@/lib/support-notify";

async function requireAdmin(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!canViewAllTickets(staff.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { staff };
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    const settings = await getSupportSettings();
    return NextResponse.json({ settings, carriers: CARRIER_GATEWAYS });
  } catch (err) {
    console.error("Load support settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    const body = await request.json();
    const discordWebhookUrl = String(body.discordWebhookUrl || "").trim();
    const notifyPhone = String(body.notifyPhone || "").trim();
    const notifyCarrier = String(body.notifyCarrier || "").trim();
    const notifyEmail = String(body.notifyEmail || "").trim();

    if (
      discordWebhookUrl &&
      !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")
    ) {
      return NextResponse.json(
        { error: "Discord webhook must be a https://discord.com/api/webhooks/... URL" },
        { status: 400 }
      );
    }
    if (notifyPhone) {
      const digits = notifyPhone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        return NextResponse.json({ error: "Phone number looks invalid" }, { status: 400 });
      }
    }
    if (notifyCarrier && !CARRIER_GATEWAYS[notifyCarrier]) {
      return NextResponse.json({ error: "Unknown carrier" }, { status: 400 });
    }
    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
      return NextResponse.json({ error: "Invalid notification email" }, { status: 400 });
    }

    const data = {
      discordWebhookUrl,
      notifyPhone,
      notifyCarrier,
      notifyEmail: notifyEmail || "nexusmafiacreatornetworkllc@outlook.com",
    };

    await prisma.supportSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });

    return NextResponse.json({ settings: data });
  } catch (err) {
    console.error("Save support settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    const body = await request.json();
    if (body.action !== "test") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const settings = await getSupportSettings();
    const results: {
      webhook: { ok: boolean; error?: string };
      sms: { ok: boolean; error?: string };
    } = {
      webhook: { ok: false, error: "No webhook configured" },
      sms: { ok: false, error: "SMS not configured" },
    };

    if (settings.discordWebhookUrl) {
      results.webhook = await sendDiscordWebhook(settings, {
        title: "Test notification",
        description:
          "Your NMCN support notifications are wired up correctly. New tickets will appear here.",
        url: "https://nexusmafiaagency.com/admin/tickets",
      });
    }
    if (settings.notifyPhone && settings.notifyCarrier) {
      results.sms = await sendSms(settings, "NMCN test SMS — support notifications are working.");
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Test notifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
