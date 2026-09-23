"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Loader2, Swords } from "lucide-react";

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
  calendarUrl: string;
  platformUrl: string;
  error?: string;
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

export default function TodayBattleBanner() {
  const [data, setData] = useState<TodayBattlesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/battles/today", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as TodayBattlesResponse;
      setData(json);
    } catch {
      setData((prev) =>
        prev || {
          date: new Date().toISOString().slice(0, 10),
          battles: [],
          upcoming: [],
          calendarUrl: "https://nmcnbattleexchange.com/calendar",
          platformUrl: "https://nmcnbattleexchange.com",
          error: "Battle schedule unavailable",
        }
      );
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
  const calendarUrl = data?.calendarUrl || "https://nmcnbattleexchange.com/calendar";
  const primary = battles[0];

  if (loading) {
    return (
      <div className="border-b border-nmcn-border/60 bg-nmcn-black/70 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs text-nmcn-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-nmcn-blue" />
          Loading today&apos;s confirmed battles…
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-nmcn-gold/30 bg-nmcn-gold/10 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-nmcn-gold/40 bg-nmcn-gold/10 sm:mt-0">
            <Swords className="h-4 w-4 text-nmcn-gold" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[2px] text-nmcn-gold">
              Today&apos;s Confirmed Battle
            </p>
            {primary ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold text-white">{primary.title}</span>
                {primary.timeLabel && (
                  <span className="text-nmcn-gold">{primary.timeLabel}</span>
                )}
                {primary.battleType && (
                  <span className="badge border-nmcn-blue/40 text-nmcn-blue">
                    {primary.battleType}
                  </span>
                )}
                {primary.agency && (
                  <span className="truncate text-nmcn-muted">
                    {primary.agency}
                  </span>
                )}
                {primary.creators.length > 0 && (
                  <span className="truncate text-nmcn-muted">
                    {primary.creators.join(" vs ")}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-nmcn-muted">
                {data?.error
                  ? data.error
                  : "No confirmed battles scheduled for today — check the calendar for what's next."}
              </p>
            )}
            {!primary && (data?.upcoming?.length ?? 0) > 0 && (
              <p className="mt-0.5 text-xs text-nmcn-muted">
                Next up:{" "}
                <span className="text-white">
                  {data!.upcoming![0].title}
                </span>{" "}
                · {data!.upcoming![0].dayKey}
                {data!.upcoming![0].timeLabel
                  ? ` · ${data!.upcoming![0].timeLabel}`
                  : ""}
              </p>
            )}
            {battles.length > 1 && (
              <p className="mt-0.5 text-xs text-nmcn-muted">
                +{battles.length - 1} more confirmed today
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline inline-flex items-center gap-1 text-xs"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Battle Calendar
          </a>
          <Link
            href="/battle-exchange"
            className="btn-gold inline-flex items-center gap-1 text-xs"
          >
            Open Exchange
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
