import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // console.log(`[Middleware] Processing request for: ${pathname}`);
  // console.log(`[Middleware] Token present: ${!!token}`);

  // Define unprotected routes that are accessible without authentication
  const unprotectedRoutes = ["/", "/login", "/sign-up"];
  
  // Check if current path is an unprotected route
  const isUnprotectedRoute = unprotectedRoutes.includes(pathname);
  
  // If user is authenticated and tries to access auth pages → redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/sign-up")) {
    // console.log(`[Middleware] Authenticated user accessing auth page, redirecting to dashboard`);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow access to unprotected routes without authentication
  if (isUnprotectedRoute) {
    // console.log(`[Middleware] Allowing access to unprotected route: ${pathname}`);
    return NextResponse.next();
  }

  // Protect all other routes - require authentication
  if (!token) {
    // console.log(`[Middleware] No token found, redirecting to login`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify JWT token for protected routes using jose library (Edge Runtime compatible)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    await jwtVerify(token, secret);
    // console.log(`[Middleware] Token verification successful for ${pathname}`);
    return NextResponse.next();
  } catch (err) {
    // console.error(`[Middleware] JWT verification failed:`, err);
    // console.log(`[Middleware] Invalid token, redirecting to login`);
    
    // Clear the invalid token cookie
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|@vite).*)",
  ],
}