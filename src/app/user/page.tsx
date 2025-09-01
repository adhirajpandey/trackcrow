"use client";

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface UserStats {
  totalTransactions: number;
  totalSpent: number;
  categoriesUsed: number;
  accountCreated: string;
}

// Loading component
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
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Main user profile page component
export default function UserPage() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setError("Please sign in to view this page");
      setIsLoadingStats(false);
      return;
    }
    if (session?.user?.uuid) {
      fetchUserStats();
    }
  }, [status, session]);

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);
      
      const response = await fetch('/api/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }

      const data = await response.json();
      const transactions = data.transactions || [];
      
      // Calculate user statistics
      const totalTransactions = transactions.length;
      const totalSpent = transactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
      const categoriesUsed = new Set(transactions.map((t: any) => t.category).filter(Boolean)).size;
      
      setUserStats({
        totalTransactions,
        totalSpent,
        categoriesUsed,
        accountCreated: new Date().toISOString() // Fallback to current date since createdAt is not available in session
      });
    } catch (err) {
      setError('Failed to load user statistics');
      console.error('Error fetching user stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (status === "loading") {
    return <UserProfileSkeleton />;
  }

  if (status === "unauthenticated" || error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>{error || "Please sign in to view this page"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
                <img
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name || "Profile"}
                  className="w-16 h-16 rounded-full"
                />
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {session?.user?.name || "No Name"}
                </h3>
                <p className="text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  User ID: {session?.user?.id}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subscription Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session?.user?.subscription === 1 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session?.user?.subscription === 1 ? 'Premium' : 'Free'}
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
            {isLoadingStats ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : userStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{userStats.totalTransactions}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">₹{userStats.totalSpent.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Categories Used</p>
                  <p className="text-2xl font-bold">{userStats.categoriesUsed}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-sm font-semibold">
                    {formatDate(userStats.accountCreated)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Unable to load statistics</p>
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
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex-1"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
