import { PrismaClient } from "../generated/prisma-rewrite";

const globalForPrismaRewrite = global as unknown as {
  prismaRewrite: PrismaClient;
};

const prismaRewrite = globalForPrismaRewrite.prismaRewrite || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaRewrite.prismaRewrite = prismaRewrite;
}

export default prismaRewrite;
