"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { sortProducts } from "@/lib/util/sort-products"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

export const getProductsById = async ({
  ids,
  regionId,
  company
}: {
  ids: string[]
  regionId?: string
  company?: any
}) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        id: ids,
        region_id: regionId,
        fields:
          "*variants,*variants.calculated_price,*variants.inventory_quantity,*companies"
      },
      headers,
      next,
    })
    .then(({ products }) => products)
}

export const getProductByHandle = async (handle: string, regionId?: string) => {
  let region = await getRegion('ph'); 

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }
  return await sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        handle,
        region_id: region?.id,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags,*companies",
      },
      headers,
      next,
    })
    .then(({ products }) => ({...products[0], company: Array.isArray(products[0].companies) ? products[0].companies[0] : products[0].companies}))
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode = 'ph',
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = (_pageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        credentials: "include",
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region.id,
          fields: "*variants.calculated_price",
          ...queryParams,
        },
        headers,
        next,
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}



/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}




interface FeaturedProduct {
  id: number | string
  title: string
  price: number
  compareAtPrice: number | null
  image: string
  slug: string
}

interface FetchFeaturedProductsParams {
  countryCode: string
  limit?: number
  featuredTag?: string // optional tag to identify featured products
}


interface FeaturedProduct {
  id: number
  title: string
  price: number
  compareAtPrice: number | null
  image: string
  slug: string
}

interface FetchFeaturedProductsParams {
  countryCode: string
  limit?: number
  featuredCollectionId?: string // Optional: filter by collection ID
}

/**
 * Fetch featured products by filtering products that have a "featured" tag in metadata
 * Reuses the existing listProducts function
 */
export const fetchFeaturedProducts = async ({
  countryCode,
  limit = 8,
  featuredCollectionId,
}: FetchFeaturedProductsParams): Promise<FeaturedProduct[]> => {
  try {
    // Fetch more products to allow filtering for featured items
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: {
        limit: 100, // Fetch enough products to filter from
        ...(featuredCollectionId && { collection_id: [featuredCollectionId] }), // Optional collection filter
      },
      countryCode,
    })

    // Filter products that have "featured" in metadata or tags
    const featuredProductsData = response.products.filter(product => {
      // Check if product has featured metadata
      const hasFeaturedMetadata = 
        product.metadata?.featured === true || 
        product.metadata?.featured === "true" ||
        product.metadata?.is_featured === true ||
        product.metadata?.is_featured === "true"
      
      // Check if product has featured tag
      const hasFeaturedTag = product.tags?.some(tag => 
        tag.value?.toLowerCase() === "featured"
      )
      
      return hasFeaturedMetadata || hasFeaturedTag
    })

    // Take only the requested limit
    const limitedFeaturedProducts = featuredProductsData.slice(0, limit)

    // Transform to the required format
    const featuredProducts: FeaturedProduct[] = limitedFeaturedProducts.map((product, index) => {
      // Get the first variant's pricing
      const variant = product.variants?.[0]
      const calculatedPrice = variant?.calculated_price as {
        calculated_amount: number
        original_amount: number
      }

      // Get the main product image
      const mainImage = product.thumbnail || product.images?.[0]?.url

      return {
        id: index + 1,
        title: product.title,
        price: calculatedPrice?.calculated_amount || 0,
        compareAtPrice: calculatedPrice?.original_amount !== calculatedPrice?.calculated_amount 
          ? calculatedPrice?.original_amount 
          : null,
        image: mainImage || "/placeholder-image.jpg",
        slug: product.handle,
      }
    })

    return featuredProducts
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}

/**
 * Alternative: Fetch featured products from a specific collection
 * This is more performant as it filters at the API level
 */
export const fetchFeaturedProductsFromCollection = async ({
  countryCode,
  collectionId,
  limit = 8,
}: {
  countryCode: string
  collectionId: string
  limit?: number
}): Promise<FeaturedProduct[]> => {
  try {
    // Directly fetch products from the featured collection
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: {
        limit,
        collection_id: [collectionId], // This filters at API level
      },
      countryCode,
    })

    // Transform to the required format
    const featuredProducts: FeaturedProduct[] = response.products.map((product, index) => {
      const variant = product.variants?.[0]
      const calculatedPrice = variant?.calculated_price as {
        calculated_amount: number
        original_amount: number
      }

      return {
        id: index + 1,
        title: product.title,
        price: calculatedPrice?.calculated_amount || 0,
        compareAtPrice: calculatedPrice?.original_amount !== calculatedPrice?.calculated_amount 
          ? calculatedPrice?.original_amount 
          : null,
        image: product.thumbnail || "/placeholder-image.jpg",
        slug: product.handle,
      }
    })

    return featuredProducts
  } catch (error) {
    console.error("Error fetching featured products from collection:", error)
    return []
  }
}

/**
 * Fetch random featured products (good for variety)
 */
export const fetchRandomFeaturedProducts = async ({
  countryCode,
  limit = 8,
}: FetchFeaturedProductsParams): Promise<FeaturedProduct[]> => {
  try {
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: {
        limit: 50,
      },
      countryCode,
    })

    // Filter featured products
    const featuredProductsData = response.products
    // Shuffle and take limit
    const shuffled = [...featuredProductsData].sort(() => 0.5 - Math.random())
    const randomFeatured = shuffled.slice(0, limit)

    // Transform to required format
    const featuredProducts: FeaturedProduct[] = randomFeatured.map((product, index) => {
      const variant = product.variants?.[0]
      const calculatedPrice = variant?.calculated_price as {
        calculated_amount: number
        original_amount: number
      }

      return {
        id: index + 1,
        title: product.title,
        price: calculatedPrice?.calculated_amount || 0,
        compareAtPrice: calculatedPrice?.original_amount !== calculatedPrice?.calculated_amount 
          ? calculatedPrice?.original_amount 
          : null,
        image: product.thumbnail || "/placeholder-image.jpg",
        slug: product.handle,
      }
    })

    return featuredProducts
  } catch (error) {
    console.error("Error fetching random featured products:", error)
    return []
  }
}

/**
 * Using listProductsWithSort for sorted featured products
 */
export const fetchSortedFeaturedProducts = async ({
  countryCode,
  limit = 8,
  sortBy = "created_at",
}: {
  countryCode: string
  limit?: number
  sortBy?: "created_at" | "title" | "price_asc" | "price_desc"
}): Promise<FeaturedProduct[]> => {
  try {
    const { response } = await listProductsWithSort({
      page: 1,
      queryParams: {
        limit: 100,
      },
      sortBy,
      countryCode,
    })

    // Filter featured products
    const featuredProductsData = response.products.filter(product => 
      product.metadata?.featured === true || 
      product.metadata?.featured === "true" ||
      product.tags?.some(tag => tag.value?.toLowerCase() === "featured")
    )

    const limitedFeaturedProducts = featuredProductsData.slice(0, limit)

    // Transform to required format
    const featuredProducts: FeaturedProduct[] = limitedFeaturedProducts.map((product, index) => {
      const variant = product.variants?.[0]
      const calculatedPrice = variant?.calculated_price as {
        calculated_amount: number
        original_amount: number
      }

      return {
        id: index + 1,
        title: product.title,
        price: calculatedPrice?.calculated_amount || 0,
        compareAtPrice: calculatedPrice?.original_amount !== calculatedPrice?.calculated_amount 
          ? calculatedPrice?.original_amount 
          : null,
        image: product.thumbnail || "/placeholder-image.jpg",
        slug: product.handle,
      }
    })

    return featuredProducts
  } catch (error) {
    console.error("Error fetching sorted featured products:", error)
    return []
  }
}