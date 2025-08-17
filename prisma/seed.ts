import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { phoneNumber: "+919876543210" },
    create: {
      phoneNumber: "+919876543210",
      name: "Super Admin",
      email: "superadmin@hirenext.com",
      role: UserRole.SUPER_ADMIN,
      schoolOrCollege: "Hirenxt",
      age: 25,
      bio: "I am a super admin",
    },
    update: {
      phoneNumber: "+919876543210",
      name: "Super Admin",
      email: "superadmin@hirenext.com",
      role: UserRole.SUPER_ADMIN,
      schoolOrCollege: "Hirenxt",
      age: 25,
      bio: "I am a super admin",
    },
  });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding super admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
