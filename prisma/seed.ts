import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  // Check if SUPER_ADMIN already exists
  const existing = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existing) {
    console.log("✅ Super admin already exists:", existing.phoneNumber);
    return;
  }

  // Create SUPER_ADMIN user
  const superAdmin = await prisma.user.create({
    data: {
      phoneNumber: "9876543210", // change to your admin phone
      name: "Super Admin",
      email: "superadmin@example.com",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      hasOnboarded: true,
      skills: ["management", "administration"],
      interests: ["system setup", "user management"],
    },
  });

  console.log("🎉 Super admin created:", superAdmin);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding super admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
