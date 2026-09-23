import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { slug: { contains: 'tikfinity' } },
        { title: { contains: 'Tikfinity' } },
      ],
    },
    select: { id: true, title: true, slug: true, status: true, _count: { select: { lessons: true } } },
  });
  console.log(JSON.stringify(courses, null, 2));
}

main().finally(() => prisma.$disconnect());