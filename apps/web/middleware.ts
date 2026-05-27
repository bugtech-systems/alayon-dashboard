// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { HttpTypes } from "@medusajs/types";

// ---------- Configuration ----------
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_COUNTRY = "ph";            // fallback country code
const DEFAULT_CURRENCY = "php";          // fallback currency

// Dynamic route prefixes – these will never be mistaken for country codes
const DYNAMIC_ROUTES = new Set([
  "store", "merchant", "user", "shop", "products", "checkout",
  "cart", "admin", "leo", "api", "auth", "your-order", "_next"
]);

// Cache for Medusa regions (in-memory, refreshed hourly)
let regionCache: {
  countryToRegion: Map<string, HttpTypes.StoreRegion>;
  regionIdToRegion: Map<string, HttpTypes.StoreRegion>;
  lastUpdated: number;
} = {
  countryToRegion: new Map(),
  regionIdToRegion: new Map(),
  lastUpdated: 0,
};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------- Helper: Fetch regions from Medusa (v2) ----------
async function fetchRegionMap(): Promise<{
  countryToRegion: Map<string, HttpTypes.StoreRegion>;
  regionIdToRegion: Map<string, HttpTypes.StoreRegion>;
}> {
  if (!BACKEND_URL) {
    throw new Error("MEDUSA_BACKEND_URL is not defined");
  }

  const response = await fetch(`${BACKEND_URL}/store/regions`, {
    headers: PUBLISHABLE_API_KEY
      ? { "x-publishable-api-key": PUBLISHABLE_API_KEY }
      : {},
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch regions: ${response.statusText}`);
  }

  const { regions }: { regions: HttpTypes.StoreRegion[] } = await response.json();

  const countryToRegion = new Map<string, HttpTypes.StoreRegion>();
  const regionIdToRegion = new Map<string, HttpTypes.StoreRegion>();

  for (const region of regions) {
    regionIdToRegion.set(region.id, region);
    for (const country of region.countries || []) {
      if (country.iso_2) {
        countryToRegion.set(country.iso_2.toLowerCase(), region);
      }
    }
  }

  return { countryToRegion, regionIdToRegion };
}

async function getRegionCache(): Promise<{
  countryToRegion: Map<string, HttpTypes.StoreRegion>;
  regionIdToRegion: Map<string, HttpTypes.StoreRegion>;
}> {
  const now = Date.now();
  if (now - regionCache.lastUpdated > CACHE_TTL_MS) {
    try {
      const fresh = await fetchRegionMap();
      regionCache = { ...fresh, lastUpdated: now };
    } catch (error) {
      console.error("Middleware: Failed to refresh region cache", error);
      // Fallback to stale cache if available
      if (regionCache.countryToRegion.size === 0) throw error;
    }
  }
  return {
    countryToRegion: regionCache.countryToRegion,
    regionIdToRegion: regionCache.regionIdToRegion,
  };
}

// ---------- Determine country code (no URL path inspection) ----------
function detectCountryCode(request: NextRequest): string {
  // 1. Cookie (previous region selection)
  const cookieRegion = request.cookies.get("medusa_region_id")?.value;
  if (cookieRegion && regionCache.regionIdToRegion.has(cookieRegion)) {
    const region = regionCache.regionIdToRegion.get(cookieRegion)!;
    const primaryCountry = region.countries?.[0]?.iso_2;
    if (primaryCountry) return primaryCountry.toLowerCase();
  }

  // 2. Vercel geolocation (if deployed on Vercel)
  const geoCountry = request.headers.get("x-vercel-ip-country")?.toLowerCase();
  if (geoCountry && regionCache.countryToRegion.has(geoCountry)) {
    return geoCountry;
  }

  // 3. Accept-Language header (first supported country)
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0].split("-")[1]?.toLowerCase();
    if (preferred && regionCache.countryToRegion.has(preferred)) {
      return preferred;
    }
  }

  // 4. Default
  return DEFAULT_COUNTRY;
}

// ---------- Middleware ----------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
    return NextResponse.next();
  }

  // Check if first path segment is a dynamic route – never treat as country
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && DYNAMIC_ROUTES.has(firstSegment)) {
    // Still set minimal headers/cookies if they don't exist (for SDK)
    const response = NextResponse.next();
    const existingRegionId = request.cookies.get("medusa_region_id")?.value;
    if (!existingRegionId) {
      // Use default fallback (PH)
      try {
        const { countryToRegion } = await getRegionCache();
        const defaultRegion = countryToRegion.get(DEFAULT_COUNTRY);
        if (defaultRegion) {
          response.cookies.set("medusa_region_id", defaultRegion.id, {
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
          response.cookies.set("medusa_currency_code", defaultRegion.currency_code, {
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        }
      } catch (err) {
        console.error("Middleware dynamic route: fallback region error", err);
      }
    }
    response.headers.set("x-medusa-region-handled", "true");
    return response;
  }

  // ---------- Normal path (root or any other) – resolve region ----------
  let response = NextResponse.next();

  try {
    const { countryToRegion, regionIdToRegion } = await getRegionCache();
    const countryCode = detectCountryCode(request);
    const region = countryToRegion.get(countryCode);

    if (!region) {
      console.warn(`No region found for country code ${countryCode}, falling back`);
      // Fallback to any region
      const fallbackRegion = regionIdToRegion.values().next().value;
      if (fallbackRegion) {
        response.cookies.set("medusa_region_id", fallbackRegion.id, {
          maxAge: 30 * 24 * 60 * 60,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        response.cookies.set("medusa_currency_code", fallbackRegion.currency_code, {
          maxAge: 30 * 24 * 60 * 60,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    } else {
      // Set region ID and currency code cookies
      response.cookies.set("medusa_region_id", region.id, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      response.cookies.set("medusa_currency_code", region.currency_code, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Also set headers for server components / API routes
    const finalRegionId = request.cookies.get("medusa_region_id")?.value || 
                          (region ? region.id : "");
    response.headers.set("x-medusa-region-id", finalRegionId);
    response.headers.set("x-medusa-region-handled", "true");
  } catch (error) {
    console.error("Middleware region resolution error:", error);
    // Don't break the request – proceed without region cookies
    response.headers.set("x-medusa-region-handled", "error");
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};