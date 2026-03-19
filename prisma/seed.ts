import { PrismaClient } from "../src/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:1111@localhost:5434/powerinside",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // --- Owner ---
  const ownerPassword = await hash("admin123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@powerinside.app" },
    update: {},
    create: {
      email: "owner@powerinside.app",
      name: "Owner",
      passwordHash: ownerPassword,
      role: "OWNER",
      emailVerified: new Date(),
    },
  });
  console.log(`Owner created: ${owner.email} (${owner.id})`);

  // --- Admin ---
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@powerinside.app" },
    update: {},
    create: {
      email: "admin@powerinside.app",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`Admin created: ${admin.email} (${admin.id})`);

  // --- Coach ---
  const coachPassword = await hash("coach123", 12);
  const coach = await prisma.user.upsert({
    where: { email: "coach@test.com" },
    update: {},
    create: {
      email: "coach@test.com",
      name: "Test Coach",
      passwordHash: coachPassword,
      role: "COACH",
      emailVerified: new Date(),
    },
  });

  await prisma.coachProfile.upsert({
    where: { userId: coach.id },
    update: {},
    create: {
      userId: coach.id,
      status: "ACTIVE",
      whitelisted: true,
      bio: "Experienced strength & conditioning coach",
      specialization: "Strength training, periodization",
    },
  });
  console.log(`Coach created: ${coach.email} (${coach.id}) with CoachProfile`);

  // --- Athlete ---
  const athletePassword = await hash("athlete123", 12);
  const athlete = await prisma.user.upsert({
    where: { email: "athlete@test.com" },
    update: {},
    create: {
      email: "athlete@test.com",
      name: "Test Athlete",
      passwordHash: athletePassword,
      role: "ATHLETE",
      emailVerified: new Date(),
    },
  });

  await prisma.messageBalance.upsert({
    where: { userId: athlete.id },
    update: {},
    create: {
      userId: athlete.id,
      freeRemaining: 50,
      weeklyRemaining: 0,
      purchasedRemaining: 0,
    },
  });
  console.log(`Athlete created: ${athlete.email} (${athlete.id}) with MessageBalance (50 free)`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
