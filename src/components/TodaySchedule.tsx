"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Swords } from "lucide-react";

const BATTLE_EXCHANGE_URL =
  process.env.NEXT_PUBLIC_BATTLE_EXCHANGE_URL ||
  "https://nmcnbattleexchange.com";

interface PublicBattle {
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
}

interface TodayBattlesResponse {
  date: string;
  battles: PublicBattle[];
  upcoming?: PublicBattle[];
  error?: string;
}

const TIME_ZONE = "America/New_York";

function todayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function battleDayKey(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // If the input is a date-only string (YYYY-MM-DD), treat it as local date in TIME_ZONE
  // not as UTC midnight, to avoid off-by-one errors when converting to EST
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  // For full ISO timestamps, convert to EST date
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function normalizeBattleDate(battleDate: string): string {
  if (!battleDate) return "";
  // Handle various date formats from the API
  // Format 1: "2026-09-27" (date only)
  // Format 2: "2026-09-27T04:00:00.000Z" (full ISO)
  // Format 3: "2026-09-27T04:00:00Z" (ISO without ms)
  if (!battleDate) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(battleDate)) {
    return battleDate;
  }
  const d = new Date(battleDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
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
    dayKey: normalizeBattleDate(raw?.battleDate),
    timeLabel: battleClock(raw?.battleTime),
    durationMinutes: Number(raw?.durationMinutes) || 15,
    agency: raw?.agency?.name || null,
    creators,
  };
}

function msUntilNextLocalMidnight() {
  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    2,
    0
  );
  return Math.max(next.getTime() - now.getTime(), 60_000);
}

let dailyRefreshTimer: number | null = null;

export default function TodaySchedule() {
  const [data, setData] = useState<TodayBattlesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Fetch all confirmed battles from API (larger limit) and filter client-side
      // using client's correct EST date to avoid server timezone issues
      const res = await fetch(`${BATTLE_EXCHANGE_URL}/api/battles/public?status=CONFIRMED&limit=300`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as { battles?: any[] };
      const today = todayKey();
      const all = (json.battles || []).map(toPublicBattle);
      const battles = all
        .filter((b) => b.dayKey === today)
        .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
      const upcoming = all
        .filter((b) => b.dayKey > today)
        .sort((a, b) =>
          a.dayKey === b.dayKey
            ? a.timeLabel.localeCompare(b.timeLabel)
            : a.dayKey.localeCompare(b.dayKey)
        )
        .slice(0, 3);
      setData({ date: today, battles, upcoming });
    } catch {
      // Fallback to local API route
      try {
        const res = await fetch("/api/battles/today", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as TodayBattlesResponse;
        setData(json);
      } catch {
        setData((prev) =>
          prev || {
            date: todayKey(),
            battles: [],
            upcoming: [],
            error: "Battle schedule unavailable",
          }
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const hourly = window.setInterval(load, 60 * 60 * 1000);

    const scheduleDaily = () => {
      if (dailyRefreshTimer) window.clearTimeout(dailyRefreshTimer);
      dailyRefreshTimer = window.setTimeout(
        () => {
          load();
          scheduleDaily();
        },
        msUntilNextLocalMidnight()
      );
    };
    scheduleDaily();

    return () => {
      window.clearInterval(hourly);
      if (dailyRefreshTimer) window.clearTimeout(dailyRefreshTimer);
    };
  }, [load]);

  const battles = data?.battles || [];
  const displayDate = data?.date
    ? new Date(data.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <div className="mx-auto mb-10 w-full max-w-3xl rounded-2xl border border-nmcn-border bg-nmcn-black/40 px-5 py-4">
        <div className="flex items-center justify-center gap-2 text-sm text-nmcn-muted">
          <Loader2 className="h-4 w-4 animate-spin text-nmcn-blue" />
          Loading today&apos;s schedule…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-10 w-full max-w-3xl rounded-2xl border border-nmcn-gold/30 bg-nmcn-gold/5 px-5 py-4 text-left shadow-lg shadow-nmcn-gold/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-nmcn-gold/40 bg-nmcn-gold/10">
            <Swords className="h-4 w-4 text-nmcn-gold" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-nmcn-gold">
              Today&apos;s Schedule
            </p>
            {displayDate && (
              <p className="text-xs text-nmcn-muted">{displayDate}</p>
            )}
          </div>
        </div>
        <span className="badge border-nmcn-blue/40 text-nmcn-blue">
          {battles.length} {battles.length === 1 ? "battle" : "battles"}
        </span>
      </div>

      {data?.error && battles.length === 0 ? (
        <p className="text-sm text-nmcn-muted">{data.error}</p>
      ) : battles.length === 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-nmcn-border bg-nmcn-black/30 px-4 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-nmcn-muted" />
          <p className="text-sm text-nmcn-muted">
            No confirmed battles scheduled for today.
            {data?.upcoming && data.upcoming.length > 0 && (
              <>
                {" "}
                Next up:{" "}
                <span className="text-white">
                  {data.upcoming[0].title}
                </span>{" "}
                on {data.upcoming[0].dayKey}
                {data.upcoming[0].timeLabel
                  ? ` at ${data.upcoming[0].timeLabel}`
                  : ""}
                .
              </>
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {battles.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-nmcn-border bg-nmcn-black/40 px-4 py-2.5"
            >
              <span className="min-w-[4.5rem] font-mono text-sm font-semibold text-nmcn-gold">
                {b.timeLabel || "TBD"}
              </span>
              <span className="text-sm font-semibold text-white">
                {b.title}
              </span>
              {b.battleType && (
                <span className="badge border-nmcn-blue/40 text-nmcn-blue">
                  {b.battleType}
                </span>
              )}
              {b.creators.length > 0 && (
                <span className="text-xs text-nmcn-muted">
                  {b.creators.join(" vs ")}
                </span>
              )}
              {b.agency && (
                <span className="text-xs text-nmcn-muted">· {b.agency}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
