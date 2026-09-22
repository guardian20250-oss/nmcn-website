"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { markLocalLessonPassed, type LocalProgress } from "@/lib/academy";
import CertificateDownload from "./CertificateDownload";

interface Question {
  id: number;
  prompt: string;
  type: string;
  options: string[];
}

interface ResultItem {
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
}

interface Props {
  questions: Question[];
  passingScore: number;
  lessonId: number;
  courseSlug: string;
  courseTitle: string;
  siblingLessonIds: number[];
  progress: LocalProgress;
  onPassed?: (score: number) => void;
}

export default function KnowledgeCheck({
  questions,
  passingScore,
  lessonId,
  courseSlug,
  courseTitle,
  siblingLessonIds,
  progress,
  onPassed,
}: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    questions.map(() => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    results: ResultItem[];
  } | null>(null);
  const [error, setError] = useState("");
  const [showCert, setShowCert] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const courseComplete =
    result?.passed &&
    siblingLessonIds.length > 0 &&
    siblingLessonIds.every((id) => {
      if (id === lessonId) return true;
      return Boolean(progress[String(id)]?.passed);
    });

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/academy/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not grade quiz");
        return;
      }
      setResult(data);
      if (data.passed) {
        markLocalLessonPassed(lessonId, data.score);
        onPassed?.(data.score);
        try {
          await fetch("/api/academy/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              progress: [{ lessonId, score: data.score, passed: true }],
            }),
          });
        } catch {
          // only works when signed in
        }
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers(questions.map(() => null));
  };

  if (questions.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-nmcn-muted">
        Knowledge check coming soon for this lesson.
      </div>
    );
  }

  if (result) {
    return (
      <div className="card p-6">
        <div
          className={`mb-4 rounded-lg border p-4 text-center ${
            result.passed
              ? "border-green-500/40 bg-green-500/10"
              : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <p className="font-heading text-2xl font-bold text-white">
            {result.passed ? "Lesson Passed!" : "Not Quite There"}
          </p>
          <p className="mt-1 text-sm text-nmcn-muted">
            Score: <span className="font-semibold text-white">{result.score}%</span>
            {" · "}Pass mark: {passingScore}%
          </p>
        </div>

        <ol className="space-y-3">
          {questions.map((q, i) => {
            const r = result.results[i];
            const chosen = answers[i];
            return (
              <li
                key={q.id}
                className={`rounded-lg border p-4 ${
                  r?.correct
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <p className="mb-2 text-sm font-medium text-white">
                  {i + 1}. {q.prompt}
                </p>
                <ul className="space-y-1 text-sm">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === r?.correctIndex;
                    const isChosen = oi === chosen;
                    return (
                      <li
                        key={oi}
                        className={
                          isCorrect
                            ? "text-green-400"
                            : isChosen
                              ? "text-red-400"
                              : "text-nmcn-muted"
                        }
                      >
                        {isCorrect ? "✓ " : isChosen ? "✗ " : "· "}
                        {opt}
                      </li>
                    );
                  })}
                </ul>
                {r?.explanation && (
                  <p className="mt-2 text-xs text-nmcn-muted">{r.explanation}</p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap gap-3">
          {!result.passed && (
            <button type="button" onClick={retake} className="btn-gold">
              Retake Quiz
            </button>
          )}
          {result.passed && courseComplete && (
            <button type="button" onClick={() => setShowCert(true)} className="btn-gold">
              Download Certificate
            </button>
          )}
        </div>

        {showCert && result.passed && courseComplete && (
          <CertificateDownload
            courseSlug={courseSlug}
            courseTitle={courseTitle}
            lessonIds={siblingLessonIds}
            progress={progress}
            onClose={() => setShowCert(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="font-heading text-xl font-semibold text-white">
          Knowledge Check
        </h2>
        <p className="text-sm text-nmcn-muted">
          Answer every question · {passingScore}% to pass · unlimited retakes
        </p>
      </div>

      <ol className="space-y-5">
        {questions.map((q, qi) => (
          <li key={q.id}>
            <p className="mb-2 text-sm font-medium text-white">
              {qi + 1}. {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      })
                    }
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                      selected
                        ? "border-nmcn-blue/60 bg-nmcn-blue/10 text-white"
                        : "border-nmcn-border text-nmcn-muted hover:border-nmcn-blue/40 hover:text-white"
                    }`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                      {selected ? "●" : ""}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="btn-gold mt-5 w-full disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Submit Answers
      </button>
      {!allAnswered && (
        <p className="mt-2 text-center text-xs text-nmcn-muted">
          Answer all questions to submit.
        </p>
      )}
    </div>
  );
}
