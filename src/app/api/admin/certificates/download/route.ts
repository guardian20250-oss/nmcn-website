import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificatePdf";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { code },
      include: {
        course: { select: { title: true, slug: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const pdfBuffer = await generateCertificatePdf({
      code: certificate.code,
      learnerName: certificate.learnerName,
      courseTitle: certificate.course.title,
      issuedAt: certificate.completedAt,
      verifyUrl: `https://nexusmafiaagency.com/admin/certificates?code=${certificate.code}`,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${code}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Certificate download error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  }
