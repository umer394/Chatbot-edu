import { NextRequest, NextResponse } from "next/server";

import { createProxyHeaders } from "@/lib/proxy-headers";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET(req: NextRequest) {
  const resp = await fetch(`${backend}/auth/google/url`, {
    method: "GET",
    headers: createProxyHeaders(req),
    cache: "no-store",
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
