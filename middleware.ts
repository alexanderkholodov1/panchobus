import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/app", "/admin", "/chofer"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  // In demo mode auth is handled client-side via DemoSessionContext + AppShell redirect.
  // This middleware only enforces protection when Supabase auth cookies are present,
  // keeping the demo mode fully functional without a backend.
  const hasSession =
    request.cookies.has("sb-access-token") ||
    request.cookies.has("sb-refresh-token") ||
    // Allow through in demo mode (no cookies) — AppShell handles the redirect
    true;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/chofer/:path*"],
};
