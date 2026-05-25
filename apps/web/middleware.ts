import { NextRequest, NextResponse } from "next/server";

// Configuration
const DEFAULT_REGION = "ph";
const DEFAULT_COUNTRY = "ph";

// Reserved paths that should NOT be treated as company handles
const RESERVED_PATHS = [
  "products",
  "store",
  "account",
  "cart",
  "checkout",
  "api",
  "admin",
  "search",
  "categories",
  "collections",
  "orders",
  "wishlist",
  "profile",
  "addresses",
  "payment-methods"
];

// Static file extensions to skip
const STATIC_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".css", ".js", ".json", ".ico", ".txt", ".xml", ".pdf",
  ".woff", ".woff2", ".ttf", ".eot"
];

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

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public") ||
    STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))
  );
}

function isReservedPath(pathname: string): boolean {
  const firstSegment = pathname.split("/")[1];
  return RESERVED_PATHS.includes(firstSegment);
}

function getCompanyHandle(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  
  // If no segments or first segment is reserved, return null
  if (segments.length === 0 || isReservedPath(pathname)) {
    return null;
  }
  
  // First segment is the company handle
  return segments[0];
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname, search } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (isStaticAsset(pathname)) {
    return response;
  }

  // Handle root path - redirect to default store or homepage
  if (pathname === "/") {
    // You can redirect to a default company or keep as homepage
    // For now, keep as homepage
    return response;
  }

  // Set the cache ID header
  const cacheId = await setCacheId(request, response);
  response.headers.set("x-medusa-cache-id", cacheId);

  // Handle region/country
  const userRegion = request.cookies.get("user_region")?.value;
  const userCountry = request.cookies.get("user_country")?.value;
  
  if (!userRegion) {
    response.cookies.set("user_region", DEFAULT_REGION, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  
  if (!userCountry) {
    response.cookies.set("user_country", DEFAULT_COUNTRY, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Add region info to headers for server components
  response.headers.set("x-user-region", userRegion || DEFAULT_REGION);
  response.headers.set("x-user-country", userCountry || DEFAULT_COUNTRY);

  // Handle company routes
  const companyHandle = getCompanyHandle(pathname);
  
  if (companyHandle && !isReservedPath(pathname)) {
    // Add company handle to headers for server components to use
    response.headers.set("x-company-handle", companyHandle);
    
    // Optional: Validate company exists by making a quick check
    // This can be done in the page component instead to avoid blocking
    
    console.log(`🏢 Company route detected: ${companyHandle}`);
  }

  // Log for debugging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Path: ${pathname}, Company: ${companyHandle || "none"}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - files with extensions (static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|ico|txt|xml|pdf|woff|woff2|ttf|eot)$).*)",
  ],
};