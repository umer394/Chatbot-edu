// app/api/send-email/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;
    const cookie = req.headers.get("cookie") ?? "";
    const body = await req.text();

    const resp = await fetch(`${backend}/send-email/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body,
    });

    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: resp.status });
    } catch {
      return NextResponse.json({ error: text }, { status: resp.status });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
