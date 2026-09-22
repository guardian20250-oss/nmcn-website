"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import KnowledgeCheck from "./KnowledgeCheck";
import { readLocalProgress, type LessonSection, type LocalProgress } from "@/lib/academy";

interface LessonData {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  sections: LessonSection[];
  course: { id: number; title: string; slug: string; passingScore: number };
  questions: { id: number; prompt: string; type: string; options: string[]; order: number }[];
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  siblingLessonIds: number[];
}

function SectionRenderer({ section }: { section: LessonSection }) {
  switch (section.type) {
    case "heading":
      return (
        <h2 className="mb-3 mt-8 font-heading text-2xl font-semibold text-white">
          {section.text}
        </h2>
      );
    case "paragraph":
      return <p className="mb-4 leading-relaxed text-nmcn-muted">{section.text}</p>;
    case "image":
      return section.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={section.src}
          alt={section.alt || ""}
          className="mb-4 w-full rounded-lg border border-nmcn-border"
        />
      ) : null;
    case "list":
      return (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-nmcn-muted">
          {(section.items || []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="mb-4 flex gap-3 rounded-lg border border-nmcn-gold/30 bg-nmcn-gold/10 p-4 text-sm text-nmcn-muted">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-nmcn-gold" />
          <p>{section.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function LessonPlayer({ lessonId }: { lessonId: number }) {
  const [data, setData] = useState<LessonData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<LocalProgress>({});
  const [passedRefresh, setPassedRefresh] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(readLocalProgress());
    (async () => {
      try {
        const res = await fetch(`/api/academy/lessons/${lessonId}`);
        if (!res.ok) throw new Error("not found");
        const json = await res.json();
        setData(json.lesson);
      } catch {
        setError("Lesson not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-nmcn-blue" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-10 text-center">
        <p className="text-nmcn-muted">{error || "Lesson unavailable."}</p>
        <Link href="/academy" className="btn-outline mt-4 inline-flex">
          Back to Academy
        </Link>
      </div>
    );
  }

  const passedLocal = Boolean(progress[String(data.id)]?.passed);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/academy/${data.course.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-nmcn-muted hover:text-nmcn-blue"
        >
          <ArrowLeft className="h-4 w-4" /> {data.course.title}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">
              {data.title}
            </h1>
            {data.summary && (
              <p className="mt-1 text-nmcn-muted">{data.summary}</p>
            )}
          </div>
          {passedLocal && (
            <span className="badge border-green-500/40 text-green-400">
              <CheckCircle className="mr-1 h-3 w-3" /> Passed
            </span>
          )}
        </div>
      </div>

      <article className="card p-6 md:p-8">
        {data.sections.length === 0 ? (
          <p className="text-nmcn-muted">Lesson content coming soon.</p>
        ) : (
          data.sections.map((section, i) => (
            <SectionRenderer key={i} section={section} />
          ))
        )}
      </article>

      <KnowledgeCheck
        key={`${data.id}-${passedRefresh}`}
        questions={data.questions}
        passingScore={data.course.passingScore}
        lessonId={data.id}
        courseSlug={data.course.slug}
        courseTitle={data.course.title}
        siblingLessonIds={data.siblingLessonIds}
        progress={progress}
        onPassed={() => {
          setProgress(readLocalProgress());
          setPassedRefresh((n) => n + 1);
        }}
      />

      <div className="flex flex-wrap justify-between gap-3">
        {data.prev ? (
          <Link
            href={`/academy/${data.course.slug}/lessons/${data.prev.slug}`}
            className="btn-outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Link>
        ) : (
          <span />
        )}
        {data.next ? (
          <Link
            href={`/academy/${data.course.slug}/lessons/${data.next.slug}`}
            className="btn-gold"
          >
            Next Lesson <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <Link href={`/academy/${data.course.slug}`} className="btn-gold">
            Finish Course
          </Link>
        )}
      </div>
    </div>
  );
}
