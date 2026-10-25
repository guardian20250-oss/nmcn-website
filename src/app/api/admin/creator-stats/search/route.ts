import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStatsViewer, statsRowScope } from "@/lib/creator-stats-access";

export const runtime = "nodejs";

// GET ?q=<text> — quick creator lookup for the dashboard search bar.
//
// Searches the LATEST stat row per creator (any snapshot), by Backstage
// username, "Creator Network manager" (team lead), or the linked account's
// name/email. Scope is enforced exactly like every other stats route:
// owner → all · team lead → own team · manager → own slice.
export async function GET(request: NextRequest) {
  const viewer = await getStatsViewer(request);
  if (viewer.status !== 200) {
    return NextResponse.json({ error: viewer.status === 401 ? "Unauthorized" : "Forbidden" }, { status: viewer.status });
  }

  const q = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 60);
  if (!q) return NextResponse.json({ results: [] });

  const rows = await prisma.creatorStat.findMany({
    where: {
      AND: [
        statsRowScope(viewer.scope, viewer.access),
        {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { teamLead: { contains: q, mode: "insensitive" } },
            {
              creatorAccount: {
                is: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    orderBy: { exportedAt: "desc" },
    distinct: ["backstageCreatorId"],
    take: 25,
    select: {
      backstageCreatorId: true,
      username: true,
      teamLead: true,
      exportedAt: true,
      periodType: true,
      followers: true,
      likes: true,
      diamondsL30D: true,
      validDaysL30D: true,
      liveDurationL30D: true,
      fanClubDiamondsL30D: true,
      lastLive: true,
      graduationStatus: true,
      tierStatus: true,
      creatorAccount: {
        select: { id: true, name: true, email: true, status: true, assignedRole: true, tiktokHandle: true },
      },
    },
  });

  return NextResponse.json({
    results: rows.map(r => ({ ...r, likes: Number(r.likes) })),
  });
}
