"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("trackcrow-token"));
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("trackcrow-token");
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-black text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          TrackCrow
        </Link>
        <ul className="flex space-x-4 items-center">
          {isLoggedIn ? (
            <>
              <li>
                <Link href="/dashboard" className="hover:text-gray-300">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/tracker" className="hover:text-gray-300">
                  Tracker
                </Link>
              </li>
              <li>
                <Button onClick={handleLogout} variant="destructive">
                  Log Out
                </Button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="hover:text-gray-300">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-gray-300">
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
