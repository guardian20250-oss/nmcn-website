import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({
    where: { slug: 'tikfinity' },
    include: {
      lessons: {
        include: { questions: true },
        orderBy: { order: 'asc' },
      },
    },
  });
  console.log(JSON.stringify(course, null, 2));
}

main().finally(() => prisma.$disconnect());