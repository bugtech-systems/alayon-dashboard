// hooks/useURLFilters.ts

"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback, useRef, useEffect } from "react";
import { resolveRange } from "@/lib/utils/resolveRange";
import { format, parse, isValid } from "date-fns";

export interface Filters {
  [key: string]: any;
  page: number;
  limit: number;
}

export interface UseURLFiltersOptions {
  defaultPage?: number;
  defaultLimit?: number;
}

function formatDateString(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

export function useURLFilters(options: UseURLFiltersOptions = {}) {
  const { defaultPage = 1, defaultLimit = 10 } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Track the last update to prevent loops
  const lastUpdateRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get current filters as a stable object
  const filters = useMemo(() => {
    const result: Filters = {
      page: Number(searchParams.get("page") || defaultPage),
      limit: Number(searchParams.get("limit") || defaultLimit),
    };
    
    // Copy all other params
    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "limit") {
        result[key] = value;
      }
    });
    
    return result;
  }, [searchParams, defaultPage, defaultLimit]);

  // Set filters with loop protection
  const setFilters = useCallback(
    (updates: Partial<Filters>) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const currentParams = new URLSearchParams(searchParams.toString());
      
      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          currentParams.delete(key);
        } else {
          currentParams.set(key, String(value));
        }
      });

      // Handle special case: when page changes, keep it
      // When other filters change, reset to page 1
      const hasPageUpdate = updates.page !== undefined;
      const hasOtherUpdates = Object.keys(updates).some(k => k !== "page" && k !== "limit");
      
      if (hasOtherUpdates && !hasPageUpdate && updates.page !== 1) {
        currentParams.set("page", "1");
      }

      const newUrl = `${pathname}?${currentParams.toString()}`;
      const currentUrl = `${pathname}?${searchParams.toString()}`;
      
      // Only update if URL actually changed
      if (newUrl !== currentUrl) {
        // Debounce the update
        timeoutRef.current = setTimeout(() => {
          router.replace(newUrl, { scroll: false });
        }, 50);
      }
    },
    [searchParams, router, pathname]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    filters,
    setFilters,
    clearFilters,
  };
}