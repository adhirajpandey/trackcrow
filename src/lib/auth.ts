import prisma from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { defaultCategoriesMap } from "@/common/utils";
import { logger } from "@/lib/logger";

// Extend the Session and User types to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id?: number;
      uuid?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      subscription?: number;
    };
  }
}

async function createDefaultCategoriesAndSubcategories(user_uuid: string) {
  logger.debug("Creating default categories and subcategories", {
    userUuid: user_uuid,
    categoryCount: defaultCategoriesMap.length
  });

  for (const cat of defaultCategoriesMap) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        user_uuid: user_uuid,
      },
    });

    await prisma.subcategory.createMany({
      data: cat.subcategories.map((sub) => ({
        name: sub,
        categoryId: category.id,
        user_uuid: user_uuid,
      })),
    });
  }

  logger.info("Default categories and subcategories created successfully", {
    userUuid: user_uuid,
    categoryCount: defaultCategoriesMap.length
  });
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn(params) {
      if (!params.user.email) {
        logger.info("Sign in attempt without email");
        return false;
      }
      
      logger.info("Sign in attempt", {
        email: params.user.email,
        name: params.user.name,
        provider: params.account?.provider
      });
      
      try {
        const existingUser = await prisma.user.findUnique({
          where: {
            email: params.user.email,
          },
        });
        if (existingUser) {
          logger.info("Existing user signed in", {
            userUuid: existingUser.uuid,
            email: existingUser.email
          });
          return true;
        }
        
        const user = await prisma.user.create({
          data: {
            email: params.user.email,
            name: params.user.name ?? "No Name",
            image: params.user.image,
            provider: "Google",
            uuid: crypto.randomUUID(),
            updatedAt: new Date(),
          },
        });

        logger.info("New user created", {
          userUuid: user.uuid,
          email: user.email,
          name: user.name
        });

        await createDefaultCategoriesAndSubcategories(user.uuid);

        return true;
      } catch (error) {
        logger.error("Sign in error", error as Error, {
          email: params.user.email
        });
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account && user.email) {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: user.email,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.uuid = dbUser.uuid;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.subscription = dbUser.subscription;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as number | undefined;
      session.user.uuid = token.uuid as string | undefined;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.subscription = token.subscription as number | undefined;
      return session;
    },
  },
};
