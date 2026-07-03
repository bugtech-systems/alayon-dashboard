"use server"

import { sdk } from "../medusa/config"
import medusaError from "../medusa/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { cache } from "react"

export const listRegions = cache(async () => {
  try {
    const { regions } = await sdk.store.region.list(
      {},
      { next: { tags: ["regions"] } }
    )
    return regions || []
  } catch (error) {
    console.error("Failed to fetch regions:", error)
    return []
  }
})

export const retrieveRegion = async (
  id: string
): Promise<HttpTypes.StoreRegion> => {
  const next = {
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
    })
    .then(({ region }: { region: HttpTypes.StoreRegion }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()



export const getRegion = cache(async (countryCode: string) => {
  if (!countryCode) return null

  try {
    const regions = await listRegions()
    
    if (!regions || regions.length === 0) {
      return null
    }

    // Find region by country code
    const region = regions.find((r) =>
      r.countries?.some((c) => c.iso_2 === countryCode.toLowerCase())
    )

    return region || regions[0] // Fallback to first region
  } catch (error) {
    console.error(
      `Failed to get region for country ${countryCode}:`,
      error instanceof Error ? error.message : "Unknown error"
    )
    return null
  }
})


export const listMunicipalities = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions("municipalities")),
  }

  return sdk.client
    .fetch<{ municipalities: HttpTypes.StoreRegion[] }>(`/dashboard/locations/municipalities`, {
      method: "GET",
      next,
    })
    .then(({ municipalities }: { municipalities: HttpTypes.StoreRegion[] }) => municipalities)
    .catch(medusaError)
}


export const listBarangays = async (code: any): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions("barangays")),
  }

  return sdk.client
    .fetch<{ barangays: HttpTypes.StoreRegion[] }>(`/dashboard/locations/barangays?citymun_code=${code}`, {
      method: "GET",
      next,
    })
    .then(({ barangays }: { barangays: HttpTypes.StoreRegion[] }) => barangays)
    .catch(medusaError)
}