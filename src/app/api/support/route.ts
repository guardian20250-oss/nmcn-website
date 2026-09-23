import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCreatorAccountFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const account = await getCreatorAccountFromRequest(request);

    const where = account ? { userId: account.id } : null;
    if (!where) {
      const { searchParams } = new URL(request.url);
      const email = searchParams.get("email");
      if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const tickets = await prisma.supportTicket.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ tickets });
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("List my tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const category = String(body.category || "account");
    const email = String(body.email || "").trim();
    const name = body.name ? String(body.name).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!subject || !message || !email) {
      return NextResponse.json(
        { error: "Subject, message, and email are required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const account = await getCreatorAccountFromRequest(request);

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        message,
        category,
        email,
        name: name || account?.name || null,
        phone,
        userId: account?.id || null,
        userRole: account?.role || null,
      },
      select: { id: true, subject: true, status: true, createdAt: true },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
