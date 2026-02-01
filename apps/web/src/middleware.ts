import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", request.nextUrl.pathname);
  const accessToken = request.cookies.get("accessToken")?.value;

  const protectedRoutes = [
    "/home",
    "/billing",
  ];

  // Redirect logic
  if (
    !accessToken &&
    (protectedRoutes.includes(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith("/restaurant"))
  ) {
    return NextResponse.redirect(new URL("/signin?redirect=" + request.nextUrl.pathname, request.url));
  }

  if (
    accessToken &&
    (request.nextUrl.pathname.startsWith("/signin") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname.startsWith("/forgot-password"))
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
    "/restaurant/:path*",
  ]
};
