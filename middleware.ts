import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico") {
    return NextResponse.next()
  }

  const isPublicPath =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup")

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: "__Secure-authjs.session-token",
  })

  const isAuthenticated = !!token

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}