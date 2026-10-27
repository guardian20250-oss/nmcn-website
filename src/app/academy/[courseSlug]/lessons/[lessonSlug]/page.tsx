import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCreatorAccountByToken } from "@/lib/auth";
import LessonPlayer from "@/components/academy/LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;

  // Academy requires an account: guests and pending accounts go back to
  // the academy landing, which shows the create-account / sign-in prompts.
  let account: Awaited<ReturnType<typeof getCreatorAccountByToken>> = null;
  try {
    const cookieStore = await cookies();
    account = await getCreatorAccountByToken(cookieStore.get("creator-token")?.value);
  } catch {
    account = null;
  }
  if (!account || account.status === "pending") redirect("/academy");

  let lesson;
  try {
    lesson = await prisma.lesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "published",
        course: { slug: courseSlug, status: "published" },
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Lesson page error:", error);
    notFound();
  }

  if (!lesson) notFound();

  return (
    <div className="min-h-screen pt-16">
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <LessonPlayer lessonId={lesson.id} />
        </div>
      </section>
    </div>
  );
}
