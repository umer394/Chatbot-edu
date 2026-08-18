import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login", "/sign-up", "/verify-success"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (token && (pathname === "/login" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", req.url));
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|@vite).*)"],
};
