import { NextResponse } from "next/server";

export async function POST() {
  // Create a response and delete the cookie
  const response = NextResponse.json({ message: "Logged out successfully" });

  // Delete token cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  return response;
}
