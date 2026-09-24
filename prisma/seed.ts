import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nexusmafiaagency.com";
  const defaultPassword = "Nexus2026!";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: "NMCN Admin",
      },
    });
    console.log("Admin created:", email);
  } else {
    console.log("Admin already exists");
  }

  // One-time reset path: set RESET_ADMIN_PASSWORD in Vercel to force
  // all role="admin" accounts to a known password on the next deploy.
  if (process.env.RESET_ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.RESET_ADMIN_PASSWORD, 12);
    const result = await prisma.admin.updateMany({
      where: { role: "admin" },
      data: { password: hash, mustChangePassword: false },
    });
    console.log(`Admin passwords reset for ${result.count} account(s)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
