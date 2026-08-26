import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/prisma/seed";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
