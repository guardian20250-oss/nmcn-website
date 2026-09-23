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
    role: string;
  }[] = [];
  let dbError = false;
  let user: { id: number; role: string; status: string; independentCreator: boolean } | null = null;

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
      role: c.role,
    }));
  } catch (error) {
    console.error("Academy catalog error:", error);
    dbError = true;
  }

  try {
    const res = await fetch("/api/academy/auth");
    const data = await res.json();
    if (data.user && data.user.id) {
      user = data.user;
    }
  } catch {
    // auth fetch failed, user stays null
  }

  const isLoggedIn = user && user.id;
  const isPending = user && user.status === "pending";
  const userRole = user?.role || "";
  const userIndependent = user?.independentCreator || false;

  let visibleCourses = courses;
  if (isLoggedIn && !isPending) {
    if (userIndependent) {
      visibleCourses = courses.filter((c) => c.role === "creator");
    } else if (userRole === "creator") {
      visibleCourses = courses.filter((c) => c.role === "creator");
    } else if (userRole === "team_lead") {
      visibleCourses = courses.filter((c) => c.role === "team_lead");
    } else if (userRole === "manager") {
      visibleCourses = courses.filter((c) => c.role === "manager");
    } else if (userRole === "scout") {
      visibleCourses = courses.filter((c) => c.role === "scout");
    } else if (userRole === "battle_coordinator") {
      visibleCourses = courses.filter((c) => c.role === "battle_coordinator");
    } else {
      visibleCourses = courses.filter((c) => c.role === "creator");
    }
  }

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-6 inline-block rounded-full border border-nmcn-border px-4 py-1.5 text-xs font-semibold uppercase tracking-[3px] text-nmcn-blue">
            Creator & Staff Academy
          </span>
          <h1 className="mb-4 font-heading text-4xl font-bold text-white md:text-5xl">
            Learn the Craft. <span className="gold-text">Level Up.</span>
          </h1>
          <p className="mb-6 text-nmcn-muted">
            Free training for creators and staff — TikTok LIVE, our Battle Exchange
            platform, Discord community ops, and role-based staff training.
            Knowledge checks after every lesson. Certificates when you finish a course.
          </p>

          {!isLoggedIn && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/academy/account?mode=register" className="btn-gold text-sm">
                Create Free Account
              </Link>
              <Link href="/academy/account" className="btn-outline text-sm">
                Sign in to save progress
              </Link>
            </div>
          )}

          {isPending && (
            <div className="mt-6 card p-6 text-center">
              <p className="text-nmcn-muted">
                Your account is pending approval. Please wait for an admin to assign
                your role and activate your account.
              </p>
            </div>
          )}
        </div>
      </section>

      {isLoggedIn && !isPending && visibleCourses.length > 0 && (
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-white">
                {userRole === "creator" && userIndependent
                  ? "Independent Creator Courses"
                  : `${userRole === "creator"
                      ? "Creator"
                      : userRole === "team_lead"
                      ? "Team Lead"
                      : userRole === "manager"
                      ? "Manager"
                      : userRole === "scout"
                      ? "Scout"
                      : userRole === "battle_coordinator"
                      ? "Battle Coordinator"
                      : "Academy"} Courses`}
              </h2>
              <span className="text-sm text-nmcn-muted">
                {visibleCourses.length} course{visibleCourses.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {visibleCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {isLoggedIn && !isPending && visibleCourses.length === 0 && (
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="card p-10 text-center">
              <p className="text-nmcn-muted">
                No courses available for your role yet. Check back soon.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
