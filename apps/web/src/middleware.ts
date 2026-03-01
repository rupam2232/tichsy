import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);
  const accessToken = request.cookies.get("accessToken")?.value;

  const protectedRoutes = [
    "/home",
    "/billing",
    "/restaurant",
    "/notifications",
    "/settings",
  ];

  const authRoutes = [
    "/signin",
    "/signup",
    "/forgot-password",
  ];

  // Redirect logic
  if (
    !accessToken &&
    protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/signin?redirect=" + request.nextUrl.pathname, request.url));
  }

  if (
    accessToken &&
    authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/signin",
    "/signup",
    "/forgot-password",
    "/home/:path*",
    "/billing/:path*",
    "/notifications/:path*",
    "/restaurant/:path*",
    "/settings/:path*",
  ]
};
