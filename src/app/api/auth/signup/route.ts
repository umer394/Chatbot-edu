import { NextRequest, NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const resp = await fetch(`${backend}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
