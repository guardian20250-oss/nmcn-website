import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalApplications,
    pendingApplications,
    approvedApplications,
    totalContacts,
    unreadContacts,
    totalTestimonials,
    pendingTestimonials,
  ] = await Promise.all([
    prisma.joinApplication.count(),
    prisma.joinApplication.count({ where: { status: "pending" } }),
    prisma.joinApplication.count({ where: { status: "approved" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({
    stats: {
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalContacts,
      unreadContacts,
      totalTestimonials,
      pendingTestimonials,
    },
    adminName: "Admin",
  });
}
