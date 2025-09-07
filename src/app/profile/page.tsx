import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";
import { AccountUtilities } from "./components/account-utilities";
import prisma from "@/lib/prisma";



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

  // Determine if a token exists to control revoke button initial state
  const me = await prisma.user.findUnique({
    where: { uuid: session.user.uuid },
    select: { lt_token: true },
  });
  const hasTokenInitially = Boolean(me?.lt_token);

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
        {/* Account Utilities Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Utilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create or revoke a device token to authenticate client devices.
            </p>
            <AccountUtilities hasTokenInitially={hasTokenInitially} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
