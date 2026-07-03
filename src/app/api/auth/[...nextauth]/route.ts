import { authOptions } from "@/lib/auth";
import { withRouteLogging } from "@/server/api/logging";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);
export const GET = withRouteLogging(handler);
export const POST = withRouteLogging(handler);
