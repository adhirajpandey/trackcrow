import prisma from "@/lib/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
        return false;
      }
      try {
        const existingUser = await prisma.user.findUnique({
          where: {
            email: params.user.email,
          },
        });
        if (existingUser) {
          return true;
        }
        await prisma.user.create({
          data: {
            email: params.user.email,
            name: params.user.name ?? "No Name",
            image: params.user.image,
            provider: "Google",
            uuid: crypto.randomUUID(),
            updatedAt: new Date(),
          },
        });
        return true;
      } catch (error) {
        console.error("Error creating user:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (token && user?.email) {
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
        }
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
