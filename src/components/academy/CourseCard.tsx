"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  KeyRound,
  MessagesSquare,
  Swords,
  Video,
} from "lucide-react";
import { coursePercent, readLocalProgress } from "@/lib/academy";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Video,
  Swords,
  MessagesSquare,
  BookOpen,
  KeyRound,
};

interface CourseSummary {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  lessonCount: number;
  lessonIds: number[];
}

export default function CourseCard({ course }: { course: CourseSummary }) {
  const Icon = ICONS[course.icon] || GraduationCap;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const update = () => setPercent(coursePercent(course.lessonIds, readLocalProgress()));
    update();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nmcn-academy-progress") update();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [course.lessonIds]);

  return (
    <Link
      href={`/academy/${course.slug}`}
      className="card group flex h-full flex-col p-6 transition-all hover:-translate-y-1 hover:border-nmcn-blue/50"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-nmcn-border bg-nmcn-blue/10">
          <Icon className="h-6 w-6 text-nmcn-blue" />
        </div>
      </div>
      <h3 className="font-heading text-xl font-semibold text-white group-hover:text-nmcn-blue">
        {course.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-nmcn-muted">{course.description}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-nmcn-muted">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {course.lessonCount} lessons
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-nmcn-panel">
          <div
            className="h-full rounded-full bg-gradient-to-r from-nmcn-gold to-nmcn-gold-light transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-nmcn-blue">
        {percent > 0 ? "Continue" : "Start course"}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
