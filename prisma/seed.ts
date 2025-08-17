import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  // Super Admin: Ayush Ranjan
  const superAdmin = await prisma.user.upsert({
    where: { phoneNumber: "9876543210" },
    create: {
      phoneNumber: "9876543210",
      name: "Ayush Ranjan",
      email: "ayush.ranjan@hirenext.com",
      role: UserRole.SUPER_ADMIN,
      schoolOrCollege: "Hirenxt",
      age: 28,
      bio: "I am the super admin of Hirenxt",
    },
    update: {
      name: "Ayush Ranjan",
      email: "ayush.ranjan@hirenext.com",
      role: UserRole.SUPER_ADMIN,
      schoolOrCollege: "Hirenxt",
      age: 28,
      bio: "I am the super admin of Hirenxt",
    },
  });

  // Recruiter: Rahul Sharma
  const recruiter = await prisma.user.upsert({
    where: { phoneNumber: "9812345678" },
    create: {
      phoneNumber: "9812345678",
      name: "Rahul Sharma",
      email: "rahul.sharma@hirenext.com",
      role: UserRole.RECRUITER,
      schoolOrCollege: "Hirenxt",
      age: 27,
      bio: "I am a recruiter at Hirenxt",
    },
    update: {
      name: "Rahul Sharma",
      email: "rahul.sharma@hirenext.com",
      role: UserRole.RECRUITER,
      schoolOrCollege: "Hirenxt",
      age: 27,
      bio: "I am a recruiter at Hirenxt",
    },
  });

  console.log("✅ Seeded users:", { superAdmin, recruiter });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
