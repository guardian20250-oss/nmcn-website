import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendEmail, rejectionEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.joinApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const status =
      body.status !== undefined && body.status !== null
        ? String(body.status).trim()
        : undefined;
    const notes =
      body.notes !== undefined
        ? body.notes === null
          ? null
          : String(body.notes)
        : undefined;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "status or notes is required" },
        { status: 400 }
      );
    }
    if (status !== undefined && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const data: { status?: string; notes?: string | null } = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.joinApplication.update({
      where: { id },
      data,
    });

    if (status === "rejected") {
      try {
        await sendEmail(
          rejectionEmail({
            tiktokHandle: updated.tiktokHandle,
            email: updated.email,
            note: updated.notes || "",
          })
        );
      } catch (emailError) {
        console.error("Rejection email failed:", emailError);
      }
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
