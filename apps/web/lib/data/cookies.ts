"use server"

import "server-only"

import { cookies as nextCookies } from "next/headers"
const CACHE_ID_COOKIE_KEY = "_medusa_cache_id";

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (token) {
      return { authorization: `Bearer ${token}` }
    }

    return {}
  } catch (error) {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}


export const getCacheHeaders = async (
  tag: string
): Promise<{ next: { tags: string[] } } | {}> => {
  const cacheTag = await getCacheTag(tag);

  if (cacheTag) {
    return { next: { tags: [`${cacheTag}`] } };
  }

  return {};
};


export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()

  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()

  cookies.delete("_medusa_jwt")
}

export const getCartId = async () => {
  const cookies = await nextCookies()

  return cookies.get("_medusa_cart_id")?.value
}

// export const getCachedId = async () => {
//   const cookies = await nextCookies()

//   return cookies.get("_medusa_cache_id")?.value
// }



/**
 * Generates a unique ID without external libraries
 * Format: timestamp-randomness-counter
 */
function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const counter = performance?.now?.()?.toString(36) || Math.random().toString(36).substring(2, 8);
  
  // Combine multiple sources of entropy for uniqueness
  return `${timestamp}-${randomPart}-${counter}`;
}

/**
 * Generates a cryptographically secure random ID (if available)
 * Falls back to the basic generator if crypto is not available
 */
function generateSecureId(): string {
  // Try to use crypto.randomUUID() if available (modern browsers/Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to custom generator
  return generateUniqueId();
}

/**
 * Gets or creates a cache ID stored in cookies
 * @returns The cache ID (existing or newly generated)
 */
export const getCachedId = async (id?: any): Promise<string> => {
  const cookieStore = await nextCookies() as any;
  let cacheId = cookieStore.get(CACHE_ID_COOKIE_KEY)?.value;
  
  // If no cache ID exists, generate one
  if (!cacheId && id != cacheId) {
    cacheId = (id || generateSecureId());
    
    // Save to cookies with appropriate options
    cookieStore.set(CACHE_ID_COOKIE_KEY, cacheId, {
      httpOnly: true,  // Prevents client-side JavaScript access (more secure)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax',  // CSRF protection
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/', // Available across the entire site
    });
  } 
  
  if (!cacheId){
       cacheId = id;
    
    // Save to cookies with appropriate options
    cookieStore.set(CACHE_ID_COOKIE_KEY, cacheId, {
      httpOnly: true,  // Prevents client-side JavaScript access (more secure)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax',  // CSRF protection
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/', // Available across the entire site
    });
  }
  
  return cacheId;
};

export const setCachedId = async (id?: any) => {
  const cookieStore = await nextCookies() as any;
  
    
    // Save to cookies with appropriate options
    cookieStore.set(CACHE_ID_COOKIE_KEY, id, {
      httpOnly: true,  // Prevents client-side JavaScript access (more secure)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'lax',  // CSRF protection
      maxAge: 60 * 60 * 24, // 1 year
      path: '/', // Available across the entire site
    });
};

/**
 * Gets the cache ID without generating a new one if it doesn't exist
 * @returns The cache ID or null if not found
 */
export const getCachedIdIfExists = async (): Promise<string | null> => {
  const cookieStore = await nextCookies();
  return cookieStore.get(CACHE_ID_COOKIE_KEY)?.value || null;
};

/**
 * Regenerates a new cache ID (replaces existing one)
 * @returns The new cache ID
 */
export const regenerateCachedId = async (): Promise<string> => {
  const cookieStore = await nextCookies();
  const newCacheId = generateSecureId();
  
  cookieStore.set(CACHE_ID_COOKIE_KEY, newCacheId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  
  return newCacheId;
};

/**
 * Deletes the cache ID cookie
 */
export const deleteCachedId = async (): Promise<void> => {
  const cookieStore = await nextCookies();
  cookieStore.delete(CACHE_ID_COOKIE_KEY);
};

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()

  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const getCompanyId = async () => {
  const cookies = await nextCookies()

   return cookies.get("_medusa_company_id")?.value

}

export const setCompanyId = async (companyId: string) => {
  const cookies = await nextCookies()

  cookies.set("_medusa_company_id", companyId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()

  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}


export const getDeliveryId = async () => {
  const cookies = await nextCookies()

   return cookies.get("_medusa_delivery_id")?.value

}
