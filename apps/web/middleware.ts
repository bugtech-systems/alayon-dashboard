import { NextRequest, NextResponse } from "next/server";

// Your default region (Philippines)
const DEFAULT_REGION = "ph";

async function setCacheId(request: NextRequest, response: NextResponse) {
  const cacheId = request.cookies.get("_medusa_cache_id")?.value;

  if (cacheId) {
    return cacheId;
  }

  const newCacheId = crypto.randomUUID();
  response.cookies.set("_medusa_cache_id", newCacheId, {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return newCacheId;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Skip files with extensions
  ) {
    return response;
  }

  // Set the cache ID header
  const cacheId = await setCacheId(request, response);
  response.headers.set("x-medusa-cache-id", cacheId);

  // Ensure the region is set to PH (Philippines)
  // You can store this in a cookie for persistent region preference
  const userRegion = request.cookies.get("user_region")?.value;
  
  if (!userRegion) {
    // Set PH as the default region for first-time visitors
    response.cookies.set("user_region", DEFAULT_REGION, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Optional: Add region info to headers for server components
  response.headers.set("x-user-region", userRegion || DEFAULT_REGION);

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
};