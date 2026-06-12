import { PrismaClient } from "../generated/prisma-rewrite";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrismaRewrite = global as unknown as {
  prismaRewrite: PrismaClient;
};

const prismaRewrite =
  globalForPrismaRewrite.prismaRewrite ||
  new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalForPrismaRewrite.prismaRewrite = prismaRewrite;
}

export default prismaRewrite;
