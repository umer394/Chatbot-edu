import { NextRequest, NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

function forwardCookies(req: NextRequest) {
  const cookie = req.headers.get("cookie");
  return cookie ? { cookie } : {};
}

export async function POST(req: NextRequest) {
  const resp = await fetch(`${backend}/auth/whatsapp/disconnect`, {
    method: "POST",
    headers: forwardCookies(req),
    cache: "no-store",
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
