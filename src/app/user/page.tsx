"use client";

import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";


export default function UserProfile() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Not signed in</h2>
        <p className="text-gray-400 text-center">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-16 md:pt-24 bg-neutral-900 text-white px-2 sm:px-4">
      <div className="backdrop-blur-lg bg-black/60 rounded-2xl md:rounded-3xl shadow-2xl p-5 sm:p-10 w-full max-w-md md:max-w-xl flex flex-col items-center border border-gray-800/40">
        <div className="relative mb-4 md:mb-6">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/30 shadow-xl">
            <img
              src={user.image ?? undefined}
              alt={user.name || "Profile"}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
            />
          </Avatar>
          <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-gradient-to-tr from-green-400 to-green-600 border-2 border-white/40 rounded-full w-4 h-4 md:w-5 md:h-5 shadow" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-1 md:mb-2 text-white drop-shadow-xl tracking-tight text-center">
          {user.name}
        </h2>
        <p className="text-base md:text-lg text-gray-300 mb-4 md:mb-8 font-medium text-center">{user.email}</p>
        <div className="w-full">
          <div className="rounded-xl p-4 md:p-7 bg-black/40 border border-gray-700 shadow-lg">
            <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-5 border-b border-gray-700 pb-2 md:pb-3 text-gray-200 tracking-wide text-center md:text-left">
              Profile Details
            </h3>
            <div className="space-y-4 md:space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                <span className="font-medium text-gray-400">Name</span>
                <span className="text-gray-100 font-semibold md:text-right">{user.name}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                <span className="font-medium text-gray-400">Email</span>
                <span className="text-gray-100 font-semibold md:text-right">{user.email}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1 md:gap-0">
                <span className="font-medium text-gray-400">Subscription</span>
                <span className="text-gray-100 font-semibold md:text-right">
                    {session.user.subscription === 0 ? "Free" : "Premium"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
