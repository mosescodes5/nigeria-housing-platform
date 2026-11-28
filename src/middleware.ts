import { NextResponse, type NextRequest } from "next/server";

// Coarse redirect only: it checks that a session cookie exists. The real authentication and
// permission checks happen server-side in src/modules/identity/guards.ts.
export function middleware(req: NextRequest) {
  if (!req.cookies.get("hp_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/portal/:path*"] };
