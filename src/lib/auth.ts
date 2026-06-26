import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { ensureUserBootstrap } from "@/server/modules/users/service";

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

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    uuid?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    subscription?: number;
  }
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
        logger.info("signIn - Missing user email");
        return false;
      }

      const bootstrap = await ensureUserBootstrap({
        email: params.user.email,
        name: params.user.name ?? "No Name",
        image: params.user.image ?? null,
        provider: params.account?.provider ?? "google",
      });

      if (!bootstrap.ok) {
        logger.error("signIn - Failed to bootstrap user", undefined, {
          email: params.user.email,
        });
        return false;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      const shouldHydrateFromDb =
        Boolean(user?.email) ||
        Boolean(token.email && (!token.uuid || !token.name || token.image == null));

      if (shouldHydrateFromDb) {
        const email = user?.email ?? token.email;

        if (!email) {
          return token;
        }

        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            uuid: true,
            email: true,
            name: true,
            image: true,
            subscription: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.uuid = dbUser.uuid;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = user?.image ?? dbUser.image ?? token.image ?? null;
          token.subscription = dbUser.subscription;
        }
      } else if (account && user?.image) {
        token.image = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.uuid = token.uuid;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.image ?? null;
      session.user.subscription = token.subscription;
      return session;
    },
  },
};
