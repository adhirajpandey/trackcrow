import { PrismaClient } from "../generated/prisma";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ||
  (process.env.DATABASE_URL
    ? new PrismaClient()
    : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma as PrismaClient;
