import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCreatorAccountFromRequest } from "@/lib/auth";
import { sendTicketCreatedNotifications } from "@/lib/support-notify";

const REPLY_SELECT = {
  id: true,
  ticketId: true,
  authorType: true,
  authorName: true,
  message: true,
  createdAt: true,
} as const;

async function authorizeTicketAccess(
  ticketId: number,
  account: { id: number; name: string | null; email: string } | null,
  token: string | null
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      replies: { orderBy: { createdAt: "asc" }, select: REPLY_SELECT },
      handledBy: { select: { id: true, name: true } },
    },
  });
  if (!ticket) return null;

  const isOwner = !!account && ticket.userId === account.id;
  const validToken = !!token && !!ticket.accessToken && token === ticket.accessToken;
  const isEmailMatch = !!account && account.email === ticket.email;
  if (!isOwner && !validToken && !isEmailMatch) return null;
  return ticket;
}

export async function GET(request: NextRequest) {
  try {
    const account = await getCreatorAccountFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (id) {
      const ticket = await authorizeTicketAccess(id, account, token);
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      const safeTicket = { ...ticket, accessToken: undefined };
      return NextResponse.json({ ticket: safeTicket });
    }

    const where = account ? { userId: account.id } : null;
    if (!where) {
      if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const tickets = await prisma.supportTicket.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          subject: true,
          message: true,
          category: true,
          status: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return NextResponse.json({ tickets });
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        message: true,
        category: true,
        status: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { replies: true } },
      },
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

    const account = await getCreatorAccountFromRequest(request);

    if (body.ticketId) {
      const ticketId = Number(body.ticketId);
      const message = String(body.message || "").trim();
      const token = body.token ? String(body.token) : null;

      if (!ticketId || !message) {
        return NextResponse.json({ error: "Ticket id and message are required" }, { status: 400 });
      }

      const ticket = await authorizeTicketAccess(ticketId, account, token);
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      const authorName =
        (body.name ? String(body.name).trim() : "") ||
        account?.name ||
        ticket.name ||
        ticket.email;

      const reply = await prisma.supportTicketReply.create({
        data: {
          ticketId: ticket.id,
          authorType: "user",
          authorId: account?.id ?? null,
          authorName,
          message,
        },
        select: REPLY_SELECT,
      });

      let reopened = false;
      if (ticket.status === "resolved") {
        await prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { status: "open" },
        });
        reopened = true;
      }

      return NextResponse.json({ reply, reopened }, { status: 201 });
    }

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

    const tokenHex = randomBytes(24).toString("hex");

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
        accessToken: tokenHex,
      },
      select: { id: true, subject: true, status: true, createdAt: true, accessToken: true },
    });

    try {
      await sendTicketCreatedNotifications({
        ...ticket,
        message,
        category,
        email,
        name: name || account?.name || null,
        phone,
      });
    } catch (err) {
      console.error("Ticket notifications error:", err);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
