import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (
    isLoggedIn &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const protectedPrefixes = [
    "/activities",
    "/expenses",
    "/budget",
    "/reports",
    "/notifications",
    "/profile",
  ];
  if (
    !isLoggedIn &&
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
