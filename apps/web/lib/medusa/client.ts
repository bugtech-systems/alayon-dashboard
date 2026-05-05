
// lib/medusa/client.ts
import Medusa from '@medusajs/medusa-js'
import type {
  MedusaProduct,
  MedusaCollection,
  MedusaCart,
  MedusaRegion,
  MedusaCustomer,
  MedusaPricedProduct,
  MedusaStorefrontCart,
} from './types'

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// Initialize Medusa client
export const medusaClient = new Medusa({
  baseUrl: backendUrl,
  publishableApiKey: publishableKey,
  maxRetries: 3,
})

// Cache configuration for React Server Components
const defaultCacheOptions: RequestCache = 'force-cache'
const noCacheOptions: RequestCache = 'no-store'

// Helper for RSC fetch with caching
async function fetchWithCache<T>(
  fetcher: () => Promise<T>,
  tags?: string[],
  cache: RequestCache = defaultCacheOptions
): Promise<T> {
  if (typeof window === 'undefined') {
    // Server-side: Use Next.js cache
    const response = await fetch('/api/medusa-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch', fetcher: fetcher?.toString() }),
      next: { tags },
    })
    return response.json()
  }
  // Client-side: Direct call
  return fetcher()
}


// ==================== Product Operations ====================

// lib/medusa/client.ts - Update getProducts function
export async function getProducts(options?: {
  limit?: number
  offset?: number
  order?: string
  collection_id?: string[]
  type_id?: string[]
  category_id?: string[]
  q?: string
}): Promise<{ products: MedusaProduct[]; count: number }> {
  let regions = await getRegions()
  let reg_id = regions.find(a => a.currency_code == 'php')?.id;
  const params: Record<string, any> = {
    fields: "variants.prices.*",
    limit: options?.limit ?? 20,
    offset: options?.offset ?? 0,
    region_id: reg_id
  }

  // if (options?.order) params.order = options.order
  if (options?.collection_id?.length) params.collection_id = options.collection_id
  if (options?.type_id?.length) params.type_id = options.type_id
  if (options?.category_id?.length) params.category_id = options.category_id
  if (options?.q) params.q = options.q

  try {
    const {products, count} = await medusaClient.products.list(params)
    return {products, count}
  } catch (error) {
    console.error('Error fetching products:', error)
    return { products: [], count: 0 }
  }
}

// Add product types helper
export async function getProductTypes(): Promise<string[]> {
  try {
    const { products } = await medusaClient.products.list({ limit: 100 })
    const types = new Set(products.map(p => p.type?.value).filter(Boolean))
    return Array.from(types) as string[]
  } catch (error) {
    console.error('Error fetching product types:', error)
    return []
  }
}

// lib/medusa/client.js

/**
 * Get product by handle
 * @param {string} handle - Product handle
 * @returns {Promise<Object|null>} Product object or null if not found
 */
export async function getProductByHandle(handle) {
  try {
    // Method 1: Using the list endpoint with handle filter (recommended)
    const { products } = await medusaClient.products.list({
      handle: handle,
      limit: 1
    })
    
    if (products && products.length > 0) {
      return products[0]
    }
    return null
    
  } catch (error) {
    console.error(`Product with handle ${handle} not found:`, error)
    return null
  }
}

export async function getProductById(id: string): Promise<MedusaProduct | null> {
  try {
    const { product } = await medusaClient.products.retrieve(id)
    return product
  } catch (error) {
    console.error(`Product with id ${id} not found:`, error)
    return null
  }
}

export async function getFeaturedProducts(limit = 8): Promise<MedusaProduct[]> {
  const { products } = await medusaClient.products.list({
    limit,
    order: 'created_at DESC',
  })
  return products
}

// ==================== Collection Operations ====================
// lib/medusa/client.ts - Fix collections
export async function getCollections(options?: {
  limit?: number
  offset?: number
}): Promise<{ collections: MedusaCollection[]; count: number }> {
  try {
    const { collections, count, limit, offset } = await medusaClient.collections.list({
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
    })
    return { collections, count }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { collections: [], count: 0 }
  }
}

export async function getCollectionByHandle(
  handle: string,
  limit = 20
): Promise<MedusaCollection | null> {
  try {
    const { collection } = await medusaClient.collections.retrieveByHandle(handle, {
      products: { limit },
    })
    return collection
  } catch (error) {
    console.error(`Collection with handle ${handle} not found:`, error)
    return null
  }
}

export async function getCollectionById(id: string): Promise<MedusaCollection | null> {
  try {
    const { collection } = await medusaClient.collections.retrieve(id, {
      products: { limit: 100 },
    })
    return collection
  } catch (error) {
    console.error(`Collection with id ${id} not found:`, error)
    return null
  }
}

// ==================== Cart Operations ====================

export async function createCart(
  regionId?: string,
  salesChannelId?: string,
  countryCode?: string
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.create({
    region_id: regionId,
    sales_channel_id: salesChannelId,
    country_code: countryCode,
  })
  return cart
}

export async function getCart(cartId: string): Promise<MedusaCart | null> {
  try {
    const { cart } = await medusaClient.carts.retrieve(cartId)
    return cart
  } catch (error) {
    console.error(`Cart with id ${cartId} not found:`, error)
    return null
  }
}

export async function addToCart(
  cartId: string,
  items: { variant_id: string; quantity: number; metadata?: Record<string, any> }[]
): Promise<MedusaCart> {
  for (const item of items) {
    await medusaClient.carts.lineItems.create(cartId, {
      variant_id: item.variant_id,
      quantity: item.quantity,
      metadata: item.metadata,
    })
  }
  
  // Return updated cart
  const { cart } = await medusaClient.carts.retrieve(cartId)
  return cart
}

export async function updateCartItem(
  cartId: string,
  lineId: string,
  quantity: number,
  metadata?: Record<string, any>
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.lineItems.update(cartId, lineId, {
    quantity,
    metadata,
  })
  return cart
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<MedusaCart> {
  for (const lineId of lineIds) {
    await medusaClient.carts.lineItems.delete(cartId, lineId)
  }
  
  // Return updated cart
  const { cart } = await medusaClient.carts.retrieve(cartId)
  return cart
}

export async function updateCartRegion(cartId: string, regionId: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.update(cartId, { region_id: regionId })
  return cart
}

export async function updateCartShippingAddress(
  cartId: string,
  address: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    country_code?: string
    province?: string
    postal_code?: string
    phone?: string
  }
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.update(cartId, { shipping_address: address })
  return cart
}

export async function updateCartBillingAddress(
  cartId: string,
  address: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    country_code?: string
    province?: string
    postal_code?: string
    phone?: string
  }
): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.update(cartId, { billing_address: address })
  return cart
}

export async function addCartShippingMethod(cartId: string, shippingMethodId: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.addShippingMethod(cartId, {
    option_id: shippingMethodId,
  })
  return cart
}

export async function applyDiscountToCart(cartId: string, discountCode: string): Promise<MedusaCart> {
  const { cart } = await medusaClient.carts.update(cartId, { discount_code: discountCode })
  return cart
}

export async function removeDiscountFromCart(cartId: string, discountCode: string): Promise<MedusaCart> {
  // Remove specific discount by updating without it
  const { cart } = await medusaClient.carts.update(cartId, { discount_code: null })
  return cart
}

// ==================== Region Operations ====================

export async function getRegions(): Promise<MedusaRegion[]> {
  const { regions } = await medusaClient.regions.list()
  return regions
}

export async function getRegionById(id: string): Promise<MedusaRegion | null> {
  try {
    const { region } = await medusaClient.regions.retrieve(id)
    return region
  } catch (error) {
    console.error(`Region with id ${id} not found:`, error)
    return null
  }
}

// ==================== Customer Operations ====================

export async function getCurrentCustomer(): Promise<MedusaCustomer | null> {
  try {
    const { customer } = await medusaClient.customers.retrieve()
    return customer
  } catch (error) {
    // Customer not logged in
    return null
  }
}

export async function createCustomer(
  email: string,
  firstName?: string,
  lastName?: string,
  password?: string,
  phone?: string
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.create({
    email,
    first_name: firstName,
    last_name: lastName,
    password,
    phone,
  })
  return customer
}

export async function updateCustomer(
  updates: {
    first_name?: string
    last_name?: string
    phone?: string
    metadata?: Record<string, any>
  }
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.update(updates)
  return customer
}

export async function createCustomerAddress(
  address: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    country_code?: string
    province?: string
    postal_code?: string
    phone?: string
  },
  isDefaultShipping = false,
  isDefaultBilling = false
): Promise<any> {
  const { customer } = await medusaClient.customers.update({
    shipping_addresses: [address],
  })
  
  // Handle default addresses
  if (isDefaultShipping || isDefaultBilling) {
    // Implementation depends on your needs
  }
  
  return customer.shipping_addresses?.[customer.shipping_addresses.length - 1]
}

export async function updateCustomerAddress(
  addressId: string,
  address: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    country_code?: string
    province?: string
    postal_code?: string
    phone?: string
  }
): Promise<any> {
  // Medusa doesn't have direct address update, so we get customer, update addresses array
  const { customer } = await medusaClient.customers.retrieve()
  const updatedAddresses = customer.shipping_addresses?.map(addr =>
    addr.id === addressId ? { ...addr, ...address } : addr
  )
  
  const { customer: updatedCustomer } = await medusaClient.customers.update({
    shipping_addresses: updatedAddresses,
  })
  
  return updatedCustomer.shipping_addresses?.find(addr => addr.id === addressId)
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  const { customer } = await medusaClient.customers.retrieve()
  const updatedAddresses = customer.shipping_addresses?.filter(addr => addr.id !== addressId)
  
  await medusaClient.customers.update({
    shipping_addresses: updatedAddresses,
  })
}

// ==================== Order Operations ====================

export async function getOrders(limit = 20, offset = 0): Promise<{ orders: any[]; count: number }> {
  try {
    const { orders, count } = await medusaClient.orders.list({
      limit,
      offset,
    })
    return { orders, count }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { orders: [], count: 0 }
  }
}

export async function getOrderById(orderId: string): Promise<any | null> {
  try {
    const { order } = await medusaClient.orders.retrieve(orderId)
    return order
  } catch (error) {
    console.error(`Order with id ${orderId} not found:`, error)
    return null
  }
}

// ==================== Shipping and Payment Operations ====================

export async function getShippingOptions(cartId?: string, regionId?: string): Promise<any[]> {
  const params: Record<string, string> = {}
  if (cartId) params.cart_id = cartId
  if (regionId) params.region_id = regionId
  
  const { shipping_options } = await medusaClient.shippingOptions.list(params)
  return shipping_options
}

export async function getPaymentProviders(cartId?: string, regionId?: string): Promise<any[]> {
  const params: Record<string, string> = {}
  if (cartId) params.cart_id = cartId
  if (regionId) params.region_id = regionId
  
  const { payment_providers } = await medusaClient.paymentProviders.list(params)
  return payment_providers
}

// ==================== Category Operations ====================

export async function getCategories(options?: {
  limit?: number
  offset?: number
  parent_category_id?: string
  include_descendants_tree?: boolean
}): Promise<{ categories: any[]; count: number }> {
  const params: Record<string, any> = {
    limit: options?.limit ?? 20,
    offset: options?.offset ?? 0,
  }
  
  if (options?.parent_category_id) params.parent_category_id = options.parent_category_id
  if (options?.include_descendants_tree) params.include_descendants_tree = options.include_descendants_tree
  
  const { product_categories, count } = await medusaClient.productCategories.list(params)
  return { categories: product_categories, count }
}

// ==================== Store Operations ====================

export async function getStore(): Promise<any> {
  const { store } = await medusaClient.store.retrieve()
  return store
}

// ==================== Auth Operations ====================

export async function customerLogin(email: string, password: string): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.auth.authenticate(email, password)
  return customer
}

export async function customerLogout(): Promise<void> {
  await medusaClient.auth.deauthenticate()
}

export async function registerCustomer(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<MedusaCustomer> {
  const { customer } = await medusaClient.customers.create({
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  })
  return customer
}