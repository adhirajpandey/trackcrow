"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiUrl } from "@/app/config";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [progress, setProgress] = useState(100);

  // Adds a decreasing progress bar with the error message
  useEffect(() => {
    let intervalId: number;

    if (error) {
      setProgress(100);
      intervalId = window.setInterval(() => {
        setProgress((prev) => Math.max(0, prev - 2));
      }, 40);

      const timeout = window.setTimeout(() => {
        setError("");
        setProgress(0);
        clearInterval(intervalId);
      }, 2200);

      return () => {
        clearInterval(intervalId);
        clearTimeout(timeout);
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      setProgress(100);
      return;
    }

    if (username.length < 3) {
      setError("Username must be longer");
      setProgress(100);
      return;
    }

    if (password.length < 8) {
      setError("Password too short");
      setProgress(100);
      return;
    }

    // Here you would typically make an API call to create the user
    // For this example, we'll just simulate a successful signup
    console.log("Signing up with:", { username, password });

    const response = await fetch(`${apiUrl}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Signup failed");
    }

    // Redirect to login page after successful signup
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create a new account to get started.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {/* Error Box with Progress Bar */}
            {error && (
              <div className="relative mt-4 border border-red-500 bg-red-100 text-red-700 rounded-md p-3">
                <p className="text-sm">{error}</p>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit">
              Sign Up
            </Button>
            <p className="mt-2 text-sm text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-500 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
