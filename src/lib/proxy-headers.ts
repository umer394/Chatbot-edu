import type { NextRequest } from "next/server";

/** Build fetch headers for backend proxy routes, forwarding the session cookie when present. */
export function createProxyHeaders(req: NextRequest, extra?: Record<string, string>): Headers {
  const headers = new Headers(extra);
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return headers;
}
