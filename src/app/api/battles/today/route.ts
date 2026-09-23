import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const BATTLE_EXCHANGE_URL =
  process.env.BATTLE_EXCHANGE_URL || "https://nmcnbattleexchange.com";
const BATTLE_EXCHANGE_JWT_SECRET =
  process.env.BATTLE_EXCHANGE_JWT_SECRET ||
  "nmcn-battle-exchange-secret-2024";
const TIME_ZONE = process.env.BATTLE_TIME_ZONE || "America/New_York";

const CACHE_SECONDS = 30;

function todayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function battleDayKey(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function battleClock(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

type PublicBattle = {
  id: string;
  battleNumber: string;
  title: string;
  battleType: string;
  status: string;
  dayKey: string;
  timeLabel: string;
  durationMinutes: number;
  agency: string | null;
  creators: string[];
};

function toPublicBattle(raw: any): PublicBattle {
  const participants: any[] = Array.isArray(raw?.participants)
    ? raw.participants
    : [];
  const creators = participants
    .map(
      (p) =>
        p?.creator?.tiktokUsername ||
        p?.creator?.user?.creator?.tiktokUsername ||
        p?.creator?.user?.name
    )
    .filter(Boolean)
    .slice(0, 8) as string[];

  if (!creators.length) {
    const handle = raw?.creatorUser?.creator?.tiktokUsername;
    if (handle) creators.push(handle);
  }

  return {
    id: String(raw?.id || raw?.uuid || ""),
    battleNumber: String(raw?.battleNumber || ""),
    title: String(raw?.title || "Confirmed battle"),
    battleType: String(raw?.battleType || ""),
    status: String(raw?.status || ""),
    dayKey: battleDayKey(raw?.battleDate),
    timeLabel: battleClock(raw?.battleTime),
    durationMinutes: Number(raw?.durationMinutes) || 15,
    agency: raw?.agency?.name || null,
    creators,
  };
}

async function fetchConfirmedBattles(): Promise<any[]> {
  // Prefer public endpoint (no JWT) with JWT fallback for older Battle Exchange builds
  let res: Response;
  try {
    res = await fetch(
      `${BATTLE_EXCHANGE_URL}/api/battles/public?status=CONFIRMED&limit=200`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.battles)) return data.battles;
    }
    console.error(
      `Public battles endpoint status=${res.status}, falling back to JWT`
    );
  } catch (networkErr: any) {
    console.error(
      "Public battles unreachable:",
      networkErr?.message || networkErr
    );
  }

  const token = jwt.sign(
    {
      id: "main-site",
      email: "site@nexusmafiaagency.com",
      name: "NMCN Main Site",
      role: "public",
    },
    BATTLE_EXCHANGE_JWT_SECRET,
    { expiresIn: "15m" }
  );

  try {
    res = await fetch(
      `${BATTLE_EXCHANGE_URL}/api/battles?status=CONFIRMED&limit=200`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
  } catch (networkErr: any) {
    console.error("Battle Exchange unreachable:", networkErr?.message || networkErr);
    throw new Error(`Battle Exchange unreachable: ${networkErr?.message || "network"}`);
  }

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* ignore */
    }
    console.error(
      `Battle Exchange responded ${res.status}:`,
      body.slice(0, 300)
    );
    throw new Error(`Battle Exchange responded ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.battles) ? data.battles : [];
}

export async function GET() {
  try {
    const today = todayKey();
    const battles = await fetchConfirmedBattles();
    const publicBattles = battles.map(toPublicBattle);

    const todays = publicBattles
      .filter((b) => b.dayKey === today)
      .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));

    const upcoming = publicBattles
      .filter((b) => b.dayKey > today)
      .sort((a, b) =>
        a.dayKey === b.dayKey
          ? a.timeLabel.localeCompare(b.timeLabel)
          : a.dayKey.localeCompare(b.dayKey)
      )
      .slice(0, 3);

    return NextResponse.json(
      {
        date: today,
        timeZone: TIME_ZONE,
        battles: todays,
        upcoming,
        calendarUrl: `${BATTLE_EXCHANGE_URL}/calendar`,
        platformUrl: BATTLE_EXCHANGE_URL,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      }
    );
  } catch (error: any) {
    console.error("Today battle lookup failed:", error?.message || error);
    return NextResponse.json(
      {
        date: todayKey(),
        timeZone: TIME_ZONE,
        battles: [],
        upcoming: [],
        calendarUrl: `${BATTLE_EXCHANGE_URL}/calendar`,
        platformUrl: BATTLE_EXCHANGE_URL,
        error: "Battle schedule unavailable",
        detail: String(error?.message || error),
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=30" },
      }
    );
  }
}
