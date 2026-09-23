import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    where: { status: 'draft' },
    select: { id: true, title: true, slug: true, status: true },
  });
  console.log(JSON.stringify(courses, null, 2));
}

main().finally(() => prisma.$disconnect());