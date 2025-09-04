import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, transactionRead } from "@/common/schemas";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

interface UserStats {
  totalTransactions: number;
  totalSpent: number;
  categoriesUsed: number;
  accountCreated: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function UserProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function UserPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Please sign in to view this page</p>
        </div>
      </div>
    );
  }

  let transactions: Transaction[] = [];
  let userStats: UserStats | null = null;
  let error: string | null = null;

  try {
    const txns = await prisma.transaction.findMany({
      where: { user_uuid: session.user.uuid },
      orderBy: { ist_datetime: "desc" },
      select: {
        id: true,
        amount: true,
        ist_datetime: true,
        createdAt: true,
        updatedAt: true,
        Category: {
          select: {
            name: true,
          },
        },
      },
    });
    const serialized = txns.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      ist_datetime: t.ist_datetime ? t.ist_datetime.toISOString() : null,
    }));
    const validate = z.array(transactionRead).safeParse(serialized);
    if (validate.success) {
      transactions = validate.data;
      userStats = {
        totalTransactions: transactions.length,
        totalSpent: transactions.reduce((sum, t) => sum + t.amount, 0),
        categoriesUsed: new Set(
          transactions.map((t) => t.categoryId).filter(Boolean),
        ).size,
        accountCreated: new Date().toISOString(),
      };
    }
  } catch {
    error = "Failed to load user statistics";
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and view your activity
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <Image
                  src={session.user.image ?? "/default-profile.png"}
                  alt={session.user.name || "Profile"}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full"
                />
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {session.user.name || "No Name"}
                </h3>
                <p className="text-muted-foreground">{session.user.email}</p>
                <p className="text-sm text-muted-foreground">
                  User ID: {session.user.id}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subscription Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.user.subscription === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {session.user.subscription === 1 ? "Premium" : "Free"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Account Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {userStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Transactions
                  </p>
                  <p className="text-2xl font-bold">
                    {userStats.totalTransactions}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold">
                    ₹{userStats.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories Used
                  </p>
                  <p className="text-2xl font-bold">
                    {userStats.categoriesUsed}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-sm font-semibold">
                    {formatDate(userStats.accountCreated)}
                  </p>
                </div>
              </div>
            ) : (
              <UserProfileSkeleton />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Account Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <SignOutButton className="flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
