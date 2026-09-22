"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Circle, Lock, Award } from "lucide-react";
import CertificateDownload from "./CertificateDownload";
import {
  coursePercent,
  readLocalProgress,
  writeLocalProgress,
  type LocalProgress,
} from "@/lib/academy";

interface CourseProgressClientProps {
  courseSlug: string;
  courseTitle: string;
  lessonIds: number[];
  lessons: { id: number; title: string; slug: string; summary: string | null }[];
}

export default function CourseProgressClient({
  courseSlug,
  courseTitle,
  lessonIds,
  lessons,
}: CourseProgressClientProps) {
  const [progress, setProgress] = useState<LocalProgress>({});
  const [serverPassed, setServerPassed] = useState<Set<number>>(new Set());
  const [ready, setReady] = useState(false);
  const [showCert, setShowCert] = useState(false);

  const merge = useCallback(
    (local: LocalProgress, server: number[] = []) => {
      const merged: LocalProgress = { ...local };
      for (const id of server) {
        const key = String(id);
        const existing = merged[key];
        merged[key] = {
          score: existing?.score ?? 100,
          passed: true,
        };
      }
      setProgress(merged);
      setServerPassed(new Set(server));
      writeLocalProgress(merged);
    },
    []
  );

  useEffect(() => {
    const local = readLocalProgress();
    let cancelled = false;

    (async () => {
      let serverIds: number[] = [];
      try {
        const res = await fetch("/api/academy/progress");
        if (res.ok) {
          const data = await res.json();
          serverIds = (data.progress || [])
            .filter((p: { passed: boolean }) => p.passed)
            .map((p: { lessonId: number }) => p.lessonId);
        }
      } catch {
        // offline / not signed in
      }
      if (!cancelled) {
        merge(local, serverIds);
        setReady(true);
      }
    })();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "nmcn-academy-progress") merge(readLocalProgress(), [...serverPassed]);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [merge, serverPassed]);

  const isPassed = (id: number) =>
    Boolean(progress[String(id)]?.passed) || serverPassed.has(id);
  const percent = coursePercent(lessonIds, progress);
  const complete = percent === 100 && lessonIds.length > 0;

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">
            Course Progress
          </h2>
          <p className="text-sm text-nmcn-muted">
            {lessonIds.filter(isPassed).length} of {lessonIds.length} lessons passed
          </p>
        </div>
        <span className="font-heading text-3xl font-bold gold-text">{percent}%</span>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-nmcn-panel">
        <div
          className="h-full rounded-full bg-gradient-to-r from-nmcn-gold to-nmcn-gold-light transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="space-y-2">
        {lessons.map((lesson, index) => {
          const passed = ready && isPassed(lesson.id);
          const unlocked =
            index === 0 ||
            !ready ||
            isPassed(lessons[index - 1].id) ||
            isPassed(lesson.id) ||
            true;

          return (
            <li key={lesson.id}>
              <a
                href={`/academy/${courseSlug}/lessons/${lesson.slug}`}
                className="flex items-start gap-3 rounded-lg border border-nmcn-border/60 bg-nmcn-black/40 p-3 transition hover:border-nmcn-blue/50"
              >
                {passed ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                ) : unlocked ? (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-nmcn-muted" />
                ) : (
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-nmcn-muted" />
                )}
                <span className="flex-1">
                  <span className="block text-sm font-medium text-white">
                    {index + 1}. {lesson.title}
                  </span>
                  {lesson.summary && (
                    <span className="mt-0.5 block text-xs text-nmcn-muted">
                      {lesson.summary}
                    </span>
                  )}
                </span>
                {passed && (
                  <span className="badge border-green-500/40 text-green-400">
                    Passed
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        {complete ? (
          <button type="button" onClick={() => setShowCert(true)} className="btn-gold w-full">
            <Award className="mr-2 h-4 w-4" />
            Download Certificate
          </button>
        ) : (
          <p className="text-center text-xs text-nmcn-muted">
            Pass every lesson quiz ({percent}%) to unlock your certificate.
          </p>
        )}
      </div>

      {showCert && complete && (
        <CertificateDownload
          courseSlug={courseSlug}
          courseTitle={courseTitle}
          lessonIds={lessonIds}
          progress={progress}
          onClose={() => setShowCert(false)}
        />
      )}
    </div>
  );
}
