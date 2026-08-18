import { NextRequest, NextResponse } from "next/server";

import { createProxyHeaders } from "@/lib/proxy-headers";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(req: NextRequest) {
  const resp = await fetch(`${backend}/auth/whatsapp/disconnect`, {
    method: "POST",
    headers: createProxyHeaders(req),
    cache: "no-store",
  });
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}
