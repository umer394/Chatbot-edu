import { NextRequest, NextResponse } from "next/server";

import { createProxyHeaders } from "@/lib/proxy-headers";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;

async function proxy(req: NextRequest, path: string) {
  const url = `${backend}/contacts${path}${req.nextUrl.search}`;
  const headers = createProxyHeaders(req);
  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) {
      headers.set("Content-Type", "application/json");
      init.body = body;
    }
  }

  const resp = await fetch(url, init);
  const data = await resp.json();
  return NextResponse.json(data, { status: resp.status });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const segment = path.length ? `/${path.join("/")}` : "/";
  return proxy(req, segment);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const segment = path.length ? `/${path.join("/")}` : "/";
  return proxy(req, segment);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return proxy(req, `/${path.join("/")}`);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return proxy(req, `/${path.join("/")}`);
}
