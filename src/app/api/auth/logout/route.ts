import { NextRequest, NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie");
  const resp = await fetch(`${backend}/logout`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("token");
  return response;
}
