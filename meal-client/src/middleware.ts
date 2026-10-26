import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("meal_session");

  let sessionUser: { id: string; role: "student" | "admin" | "chef"; email: string } | null = null;
  if (sessionCookie?.value) {
    try {
      sessionUser = JSON.parse(sessionCookie.value);
    } catch {
      sessionUser = null;
    }
  }

  // 1. Root /dashboard redirect
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (!sessionUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL(`/dashboard/${sessionUser.role}`, request.url));
  }

  // 2. Protected Role Routes under /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    if (!sessionUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard/admin") && sessionUser.role !== "admin") {
      return NextResponse.redirect(new URL(`/dashboard/${sessionUser.role}`, request.url));
    }

    if (pathname.startsWith("/dashboard/chef") && sessionUser.role !== "chef") {
      return NextResponse.redirect(new URL(`/dashboard/${sessionUser.role}`, request.url));
    }

    if (pathname.startsWith("/dashboard/student") && sessionUser.role !== "student") {
      return NextResponse.redirect(new URL(`/dashboard/${sessionUser.role}`, request.url));
    }
  }

  // 3. Prevent logged-in users from viewing the /login page
  if (pathname === "/login" && sessionUser?.role) {
    return NextResponse.redirect(new URL(`/dashboard/${sessionUser.role}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};
