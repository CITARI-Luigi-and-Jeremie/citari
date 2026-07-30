import { NextRequest, NextResponse } from "next/server";
import { sha256Hex, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("ADMIN_PASSWORD non configuré", { status: 500 });
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie !== (await sha256Hex(password))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
