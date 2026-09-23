import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true, status: true, _count: { select: { lessons: true } } },
    orderBy: { id: 'asc' },
  });
  console.log(JSON.stringify(courses, null, 2));
}

main().finally(() => prisma.$disconnect());