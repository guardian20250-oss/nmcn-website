import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/academy/CourseCard";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  let courses: {
    id: number;
    title: string;
    slug: string;
    description: string;
    icon: string;
    lessonCount: number;
    lessonIds: number[];
  }[] = [];
  let dbError = false;

  try {
    const rows = await prisma.course.findMany({
      where: { status: "published" },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          where: { status: "published" },
          select: { id: true },
        },
      },
    });
    courses = rows.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      lessonCount: c.lessons.length,
      lessonIds: c.lessons.map((l) => l.id),
    }));
  } catch (error) {
    console.error("Academy catalog error:", error);
    dbError = true;
  }

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Creator Academy
          </span>
          <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
            Learn the Craft. <span className="gold-text">Level Up.</span>
          </h1>
          <p className="mb-6 text-nmcn-muted">
            Free training for creators — TikTok LIVE, our Battle Exchange
            platform, and Discord community ops. Knowledge checks after every
            lesson. Certificates when you finish a course.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/academy/account?mode=register" className="btn-gold text-sm">
              Create Free Account
            </Link>
            <Link href="/academy/account" className="btn-outline text-sm">
              Sign in to save progress
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          {dbError ? (
            <div className="card p-10 text-center">
              <p className="text-nmcn-muted">
                Academy content is loading soon. Check back shortly.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-nmcn-muted">
                Courses are being prepared. Explore the preview once content
                is published.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
