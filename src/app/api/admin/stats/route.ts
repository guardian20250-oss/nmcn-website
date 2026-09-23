import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenData = verifyToken(token);
  if (!tokenData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminId = tokenData.id;
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { name: true, role: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalApplications,
    pendingApplications,
    totalContacts,
    unreadContacts,
    totalTestimonials,
    pendingTestimonials,
    pendingAccounts,
    totalAccounts,
    totalIndependent,
    totalStaff,
    totalCourses,
    openTickets,
    inProgressTickets,
    resolvedTickets,
  ] = await Promise.all([
    prisma.joinApplication.count(),
    prisma.joinApplication.count({ where: { status: "pending" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { status: "pending" } }),
    prisma.creatorAccount.count({ where: { status: "pending" } }),
    prisma.creatorAccount.count(),
    prisma.creatorAccount.count({ where: { independentCreator: true } }),
    prisma.admin.count(),
    prisma.course.count(),
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "in_progress" } }),
    prisma.supportTicket.count({ where: { status: "resolved" } }),
  ]);

  return NextResponse.json({
    stats: {
      totalApplications,
      pendingApplications,
      totalContacts,
      unreadContacts,
      totalTestimonials,
      pendingTestimonials,
      role: admin.role || "admin",
      totalCreators: totalAccounts,
      totalCourses,
      pendingAccounts,
      totalAccounts,
      totalIndependent,
      totalStaff,
      openTickets,
      inProgressTickets,
      resolvedTickets,
    },
    adminName: admin.name || "Admin",
  });
}
