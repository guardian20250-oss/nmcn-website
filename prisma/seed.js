const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nexusmafiaagency.com";
  const password = "NMCN@dm1n2024!";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name: "NMCN Admin",
    },
  });

  console.log("Admin created:", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
