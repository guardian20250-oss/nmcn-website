import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.creatorAccount.findMany({
    where: { email: "pstreet6666@gmail.com" },
    select: { id: true, email: true, name: true, status: true, assignedRole: true, independentCreator: true, tiktokHandle: true }
  });
  console.log(JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());