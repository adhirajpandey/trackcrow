"use client";

import { signIn, signOut, useSession } from "next-auth/react";

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
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => signOut()}
                >
                  Logout
                </button>
              ) : (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => signIn("google")}
                >
                  Sign in with Google
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
