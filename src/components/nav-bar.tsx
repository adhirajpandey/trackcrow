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
    <nav className="bg-black text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">Trackcrow</div>
        <div>
          <ul className="flex space-x-4 items-center">
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => (window.location.href = "/user")}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 hover:text-red-800"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  className="border-white bg-black text-white hover:bg-white hover:text-black"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                >
                  Sign in / Sign up
                </Button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
