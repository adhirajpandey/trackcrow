import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  console.log("Session:", session);
  return NextResponse.json({ message: "Hello, world!", session });
}
