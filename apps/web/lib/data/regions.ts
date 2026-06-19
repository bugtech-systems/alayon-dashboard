"use server"

import { sdk } from "../medusa/config"
import medusaError from "../medusa/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
    })
    .then(({ regions }: { regions: HttpTypes.StoreRegion[] }) => regions)
    .catch(medusaError)
}

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

export const getRegion = async (
  countryCode: string = 'ph'
): Promise<HttpTypes.StoreRegion | null> => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode) ?? null
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("ph")

    return region ?? null
  } catch (e: any) {
    return null
  }
}


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