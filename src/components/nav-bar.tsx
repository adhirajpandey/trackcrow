"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

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
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-2xl font-bold">
            TrackCrow
          </Link>
          {isLoggedIn && (
            <ul className="flex space-x-4">
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
                <Link href="/transactions" className="hover:text-gray-300">
                  Transactions
                </Link>
              </li>
            </ul>
          )}
        </div>
        <div>
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/user">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ul className="flex space-x-4 items-center">
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
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
