"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Swords } from "lucide-react";

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
