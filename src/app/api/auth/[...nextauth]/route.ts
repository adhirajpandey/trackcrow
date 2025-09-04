import prisma from "@/lib/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
  const defaultCategories = [
    { name: "Food", subcategories: ["Breakfast", "Lunch", "Dinner", "Snacks"] },
    { name: "Essentials", subcategories: ["Household", "Groceries", "Utilities", "Others"] },
    { name: "Transport", subcategories: ["Cab", "Auto", "Bike", "Others"] },
    { name: "Shopping", subcategories: ["Apparel", "Gadgets", "Gifts", "Others"] },
  ];

  for (const cat of defaultCategories) {
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

        await createDefaultCategoriesAndSubcategories(user.uuid);

        return true;
      } catch (error) {
        console.error("Error creating user:", error);
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
