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
    include: { lessons: { include: { questions: true } } },
  });
  console.log(JSON.stringify(courses, null, 2));
}

main().finally(() => prisma.$disconnect());