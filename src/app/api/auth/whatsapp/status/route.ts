import { NextRequest, NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

function forwardCookies(req: NextRequest) {
  const cookie = req.headers.get("cookie");
  return cookie ? { cookie } : {};
}

export async function GET(req: NextRequest) {
  const resp = await fetch(`${backend}/auth/whatsapp/status`, {
    method: "GET",
    headers: forwardCookies(req),
    cache: "no-store",
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
