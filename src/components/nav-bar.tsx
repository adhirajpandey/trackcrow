"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function NavBar() {
  const session = useSession();

  return (
    <nav className="bg-black/90 backdrop-blur-sm text-white py-3 shadow-2xl border-b border-white/10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <a href="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
            <img
              src="/trackcrow.png"
              alt="Trackcrow Logo"
              className="h-8 w-auto cursor-pointer"
            />
          </a>
        </div>
        <div>
          <ul className="flex space-x-2 items-center">
            <li>
              {session.data?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer w-8 h-8">
                      <img
                        src={session.data.user.image ?? undefined}
                        alt={session.data.user.name || "Profile"}
                        className="w-8 h-8 rounded-full"
                      />
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black/95 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-xl p-1">
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/user")}
                      className="cursor-pointer text-gray-200 hover:bg-gray-800/50 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg font-medium"
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 hover:!text-white hover:!bg-red-500/90 cursor-pointer transition-all duration-200 px-4 py-3 rounded-lg font-medium focus:!bg-red-500/90 focus:!text-white data-[highlighted]:!bg-red-500/90 data-[highlighted]:!text-white"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-2 border-border hover:bg-muted px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:border-primary/50"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="default"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
