"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useMemo, useCallback } from "react"
import { resolveRange } from "@/lib/utils/resolveRange"
import { format, parse, isValid } from "date-fns"

export type FilterKey =
  | "range"
  | "segment"
  | "branch"
  | "batch"
  | "from"
  | "to"
  | "type"
  | "page"
  | "limit"

export interface Filters {
  range: string
  segment: string
  branch: string
  batch: string
  from: string
  to: string
  type: string
  page: number
  limit: number
}

export interface UseURLFiltersOptions {
  defaultRange?: string
  defaultBranch?: string
  defaultBatch?: string
  defaultSegment?: string
  defaultType?: string
  defaultPage?: number
  defaultLimit?: number
}


// Helper function to format date as YYYY-MM-DD using date-fns
function formatDateToYYYYMMDD(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Helper function to validate and format date string to YYYY-MM-DD
function formatDateString(dateString: string): string {
  if (!dateString) return ""
  
  // Try to parse the date
  const date = parse(dateString, "yyyy-MM-dd", new Date())
  
  // Check if date is valid
  if (!isValid(date)) {
    // Try alternative parsing
    const altDate = new Date(dateString)
    if (isNaN(altDate.getTime())) {
      return ""
    }
    return formatDateToYYYYMMDD(altDate)
  }
  
  return formatDateToYYYYMMDD(date)
}



export function useURLFilters(options: UseURLFiltersOptions = {}) {
  const {
    defaultRange = "30d",
    defaultBranch = "all",
    defaultBatch = "all",
    defaultSegment = "all",
    defaultType = "sale",
    defaultPage = 1,
    defaultLimit = 10,
  } = options

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // =========================
  // BUILD FILTERS FROM URL
  // =========================
  const filters = useMemo((): Filters => {
    const range = searchParams.get("range") || defaultRange
    const segment = searchParams.get("segment") || defaultSegment
    const branch = searchParams.get("branch") || defaultBranch
    const batch = searchParams.get("batch") || defaultBatch
    const type = searchParams.get("type") || defaultType

    const page = Number(searchParams.get("page") || defaultPage)
    const limit = Number(searchParams.get("limit") || defaultLimit)

    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    let from: string
    let to: string

    if (fromParam && toParam) {
      // Format existing date params to YYYY-MM-DD
      from = formatDateString(fromParam)
      to = formatDateString(toParam)
    } else {
      const resolved = resolveRange(range)
      // Ensure resolved dates are in YYYY-MM-DD format
      from = formatDateString(resolved.from)
      to = formatDateString(resolved.to)
    }

    return {
      range,
      segment,
      branch,
      batch,
      from,
      to,
      type,
      page,
      limit,
    }
  }, [searchParams, defaultRange, defaultSegment, defaultBranch, defaultBatch, defaultType, defaultPage, defaultLimit])

  // =========================
  // UPDATE FILTERS
  // =========================
  const setFilters = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        const typedKey = key as FilterKey

        // REMOVE EMPTY / DEFAULT VALUES
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === "all"
        ) {
          params.delete(typedKey)
          return
        }

        // SPECIAL: pagination reset when filters change
        if (
          ["branch", "batch", "type", "segment", "range"].includes(typedKey)
        ) {
          params.set("page", "1")
        }

        // HANDLE RANGE
        if (typedKey === "range") {
          params.set("range", String(value))

          const resolved = resolveRange(String(value))
          // Format dates to YYYY-MM-DD
          params.set("from", formatDateString(resolved.from))
          params.set("to", formatDateString(resolved.to))
          return
        }

        // HANDLE CUSTOM DATE - Format to YYYY-MM-DD
        if (typedKey === "from" || typedKey === "to") {
          const formattedDate = formatDateString(String(value))
          if (formattedDate) {
            params.set(typedKey, formattedDate)
          }
          params.delete("range") // remove preset
          return
        }

        // HANDLE NUMBERS
        if (typedKey === "page" || typedKey === "limit") {
          params.set(typedKey, String(value))
          return
        }

        // DEFAULT
        params.set(typedKey, String(value))
      })

      // ENSURE VALID DATE RANGE
      if (!params.get("from") || !params.get("to")) {
        const range = params.get("range") || defaultRange
        const resolved = resolveRange(range)
        params.set("from", formatDateString(resolved.from))
        params.set("to", formatDateString(resolved.to))
      }

      const url = `${pathname}?${params.toString()}`
      router.replace(url, { scroll: false })
    },
    [searchParams, router, pathname, defaultRange]
  )

  // =========================
  // CLEAR ALL FILTERS
  // =========================
  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  // =========================
  // CLEAR SINGLE FILTER
  // =========================
  const clearFilter = useCallback(
    (key: FilterKey) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  // =========================
  // META
  // =========================
  const hasActiveFilters = useMemo(() => {
    return (
      filters.branch !== defaultBranch ||
      filters.batch !== defaultBatch ||
      filters.segment !== defaultSegment ||
      filters.range !== defaultRange ||
      filters.type !== defaultType
    )
  }, [filters, defaultBranch, defaultBatch, defaultSegment, defaultRange, defaultType])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.branch !== defaultBranch) count++
    if (filters.batch !== defaultBatch) count++
    if (filters.segment !== defaultSegment) count++
    if (filters.range !== defaultRange) count++
    if (filters.type !== defaultType) count++
    return count
  }, [filters, defaultBranch, defaultBatch, defaultSegment, defaultRange, defaultType])

  return {
    filters,
    setFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  }
}