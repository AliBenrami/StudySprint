import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("Middleware running for path:", req.nextUrl.pathname);

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("Session status in middleware:", session ? "Found" : "Not found");
  if (error) {
    console.error("Error in middleware:", error);
  }

  // If there's no session and the user is trying to access a protected route
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("No session, redirecting to signin");
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/signin";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith("/signin")) {
    console.log("Session found, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/dashboard/:path*", "/signin"],
};
