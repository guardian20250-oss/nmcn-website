import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CourseProgressClient from "@/components/academy/CourseProgressClient";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  let course;
  try {
    course = await prisma.course.findFirst({
      where: { slug: courseSlug, status: "published" },
      include: {
        lessons: {
          where: { status: "published" },
          orderBy: { order: "asc" },
          select: { id: true, title: true, slug: true, summary: true, order: true },
        },
      },
    });
  } catch (error) {
    console.error("Course page error:", error);
    notFound();
  }

  if (!course) notFound();

  const lessonIds = course.lessons.map((l) => l.id);

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/academy"
            className="mb-6 inline-flex items-center gap-1 text-sm text-nmcn-muted hover:text-nmcn-blue"
          >
            <ArrowLeft className="h-4 w-4" /> All Courses
          </Link>

          <div className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="badge border-nmcn-border-gold text-nmcn-gold">
                Coming Soon
              </span>
              <span className="badge">
                <BookOpen className="mr-1 h-3 w-3" /> {course.lessons.length} lessons
              </span>
              <span className="badge">
                <Target className="mr-1 h-3 w-3" /> {course.passingScore}% to pass
              </span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-nmcn-muted">{course.description}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="card p-6">
              <h2 className="mb-4 font-heading text-xl font-semibold text-white">
                What you&apos;ll learn
              </h2>
              <ol className="space-y-3">
                {course.lessons.map((lesson, i) => (
                  <li key={lesson.id} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-nmcn-border bg-nmcn-blue/10 text-xs font-bold text-nmcn-blue">
                      {i + 1}
                    </span>
                    <div>
                      <a
                        href={`/academy/${course.slug}/lessons/${lesson.slug}`}
                        className="font-medium text-white hover:text-nmcn-blue"
                      >
                        {lesson.title}
                      </a>
                      {lesson.summary && (
                        <p className="text-sm text-nmcn-muted">{lesson.summary}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <CourseProgressClient
              courseSlug={course.slug}
              courseTitle={course.title}
              lessonIds={lessonIds}
              lessons={course.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                slug: l.slug,
                summary: l.summary,
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
