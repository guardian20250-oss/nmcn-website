import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffFromRequest, canViewAllTickets } from "@/lib/auth";
import {
  SITE_SETTING_FIELDS,
  getSiteSettings,
  validateSiteSettings,
} from "@/lib/site-settings";

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
    const settings = await getSiteSettings();
    return NextResponse.json({ settings, fields: SITE_SETTING_FIELDS });
  } catch (err) {
    console.error("Load site settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    const body = await request.json();
    const { data, error: validationError } = validateSiteSettings(body || {});
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    for (const [key, value] of Object.entries(data)) {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as string },
        update: { value: value as string },
      });
    }

    return NextResponse.json({ settings: await getSiteSettings() });
  } catch (err) {
    console.error("Save site settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
