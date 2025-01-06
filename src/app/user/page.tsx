"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/app/config";

type UserDetails = {
  name: string;
  username: string;
  premium: boolean;
  token?: string;
  avatar?: string;
};

export default function UserDetailsPage() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserDetails();
  }, [router]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("trackcrow-token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }
      const res = await response.json();
      const data = res.result.userDetails;
      setUserDetails(data);
    } catch (err) {
      setError(
        "An error occurred while fetching user details. Please try again later."
      );
      console.error("Error fetching user details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card className="w-[350px]">
          <CardHeader>
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-4 w-[220px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={fetchUserDetails}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={userDetails.avatar || "https://github.com/shadcn.png"}
                alt={userDetails.name || "User"}
              />
              <AvatarFallback>
                {userDetails.premium ? userDetails.name.charAt(0) : "User"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{userDetails.name || "User"}</CardTitle>
              <CardDescription>User Details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={userDetails.username} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Name</Label>
              <Input id="name" value={userDetails.name || "User"} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                value={
                  userDetails.token ||
                  localStorage.getItem("trackcrow-token") ||
                  ""
                }
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Input
                id="plan"
                value={userDetails.premium ? "Premium" : "Free"}
                readOnly
              />
            </div>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
}
