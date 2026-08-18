import { NextRequest, NextResponse } from "next/server";

import { createProxyHeaders } from "@/lib/proxy-headers";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(req: NextRequest) {
  const resp = await fetch(`${backend}/logout`, {
    method: "POST",
    headers: createProxyHeaders(req),
  });

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("token");
  return response;
}
