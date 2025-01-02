"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { apiUrl } from "@/app/config";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

    if (username.length < 3){
      setError("Username must be longer");
      setProgress(100);
      return;
    }

    if (password.length < 8){
      setError("Password too short");
      setProgress(100);
      return;
    }

    try {
      // Here you would typically make an API call to authenticate the user
      // For this example, we'll simulate a successful login with a mock token
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      // Set the token in localStorage
      localStorage.setItem("trackcrow-token", data.result.token);

      // Redirect to tracker page after successful login
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
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
                <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit">
              Log In
            </Button>
            <p className="mt-2 text-sm text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}