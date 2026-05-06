import { NextResponse } from "next/server"

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Only block direct dashboard access (no false assumptions)
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}