"use server"

import { sdk } from "@/lib/config"
import medusaError from "@/lib/util/medusa-error"
import { StoreApprovalResponse } from "@/types/approval"
import { B2BCart } from "@/types/global"
import { HttpTypes, StoreCart } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCachedId,
  getCacheOptions,
  getCacheTag,
  getCartId,
  getCompanyId,
  removeCartId,
  setCartId,
  setCompanyId,
} from "@/lib/data/cookies"
import { retrieveCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"
import { DeliveryDTO } from "../types"
import { cookies as nextCookies } from "next/headers"


const CART_ID_COOKIE_KEY = "_medusa_cart_id";
const DEFAULT_CURRENCY_CODE = "php";
const DEFAULT_COUNTRY_CODE = "ph";

export async function createDelivery(cartId: string, company_id: any) {
  const { delivery } = await sdk.client.fetch<{
    delivery: DeliveryDTO;
  }>("/store/deliveries", {
    method: "POST",
    body: { cart_id: cartId, company_id },
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    }
  });

  revalidateTag("deliveries", 'max');

  return delivery;
}

export async function retrieveCart(id?: string) {
  const cartId = (id || (await getCartId()))
  if (!cartId) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      credentials: "include",
      method: "GET",
      query: {
        fields:
          "*items, *region, *items.product, *items.variant, +items.thumbnail, +items.metadata, *promotions, *company, *company.approval_settings, *customer, *approvals, +completed_at, *approval_status",
      },
      headers,
      next,
    })
    .then(({ cart }) => {
      return cart as B2BCart
    })
    .catch(() => {
      return null
    })
}

export async function retrieveCompanyCart(id?: string) {
  const cachedId = await getCachedId()

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  let company = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts?company_id=${id}&session_id=${cachedId}`, {
      credentials: "include",
      method: "GET",
      query: {
        fields:
          "*items, *region, *items.product, *items.variant, +items.thumbnail, +items.metadata, *promotions, *company, *company.approval_settings, *customer, *approvals, +completed_at, *approval_status",
      },
      headers,
      next,
    })
    .then(({ cart }) => {
      return cart as B2BCart
    })
    .catch(() => {
      return null
    })


    return company
}





// Helper to set cart ID cookie
async function setCartIdCookie(cartId: string) {
  const cookieStore = await nextCookies();
  cookieStore.set(CART_ID_COOKIE_KEY, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

// Helper to get cart ID from cookie
async function getCartIdFromCookie(): Promise<string | null> {
  const cookieStore = await nextCookies();
  return cookieStore.get(CART_ID_COOKIE_KEY)?.value || null;
}

// Helper to retrieve cart by ID
async function retrieveCartById(cartId: string) {
  const headers = await getAuthHeaders();
  
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {}, headers);
    return cart;
  } catch (error) {
    console.error('Failed to retrieve cart:', error);
    return null;
  }
}

// Helper to explicitly set cart currency to PHP
export async function setCartCurrencyToPHP(cartId: string) {
  const headers = await getAuthHeaders();
  const region = await getRegion('ph');
  try {
    const { cart } = await sdk.store.cart.update(cartId, {
      region_id: region?.id,
    }, {}, headers);
    
    const cartCacheTag = await getCacheTag("carts");
    revalidateTag(cartCacheTag, "max");
    
    return cart;
  } catch (error) {
    console.error('Failed to update cart currency:', error);
    throw error;
  }
}

// Main function to get or set cart
export async function getOrSetCart(
  countryCode: string = DEFAULT_COUNTRY_CODE, 
  companyId?: string
) {
  // Get region with PHP currency
  const region = await getRegion(countryCode);
  
  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  // Ensure region uses PHP currency
  if (region.currency_code !== DEFAULT_CURRENCY_CODE) {
    console.warn(`Region currency is ${region.currency_code}, but PHP is preferred. Overriding to PHP.`);
    // Note: You might want to handle this differently based on your business logic
  }

  const sessionId = await getCachedId();
  const headers = await getAuthHeaders();
  
  let cart = null;
  let cartId = await getCartIdFromCookie();

  // Try to retrieve existing cart by ID from cookie
  if (cartId) {
    cart = await retrieveCartById(cartId);
  }

  // If no cart found by ID, try company cart
  if (!cart && companyId) {
    cart = await retrieveCompanyCart(companyId);
    if (cart) {
      // Update cookie with found cart ID
      await setCartIdCookie(cart.id);
    }
  }

  // Create new cart if none exists
  if (!cart) {
    const body = {
      region_id: region.id,
      currency_code: DEFAULT_CURRENCY_CODE, // Force PHP currency
      metadata: {
        company_id: companyId,
        session_id: sessionId,
        created_with_currency: DEFAULT_CURRENCY_CODE,
      },
    };

    const { cart: newCart } = await sdk.store.cart.create(body, {}, headers);
    
    console.log('New cart created:', {
      cartId: newCart.id,
      currency: DEFAULT_CURRENCY_CODE,
      region: region.name,
      sessionId
    });

    // Save cart ID to cookie
    await setCartIdCookie(newCart.id);
    
    // Revalidate cart cache
    const cartCacheTag = await getCacheTag("carts");
    revalidateTag(cartCacheTag, "max");
    
    cart = newCart;
  }

  // Update cart region if it doesn't match (preserving PHP currency)
  if (cart && cart.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { 
      region_id: region.id,
      currency_code: DEFAULT_CURRENCY_CODE, // Ensure PHP currency is maintained
    }, {}, headers);
    
    console.log('Cart region updated:', {
      cartId: cart.id,
      oldRegion: cart.region_id,
      newRegion: region.id,
      currency: DEFAULT_CURRENCY_CODE
    });
    
    const cartCacheTag = await getCacheTag("carts");
    revalidateTag(cartCacheTag, "max");
  }

  return cart;
}

// Helper function to get current cart without creating a new one
export async function getCurrentCart() {
  const cartId = await getCartIdFromCookie();
  
  if (!cartId) {
    return null;
  }
  
  return await retrieveCartById(cartId);
}


export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }) => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag, "max")
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
      return cart
    })
    .catch(medusaError)
}

// export async function addToCart({
//   variantId,
//   quantity,
//   countryCode = 'ph',
// }: {
//   variantId: string
//   quantity: number
//   countryCode: string
// }) {
//   if (!variantId) {
//     throw new Error("Missing variant ID when adding to cart")
//   }
  
//   const cart = await getOrSetCart(countryCode)
//   if (!cart) {
//     throw new Error("Error retrieving or creating cart")
//   }

//   const headers = {
//     ...(await getAuthHeaders()),
//   }

//   await sdk.store.cart
//     .createLineItem(
//       cart.id,
//       {
//         variant_id: variantId,
//         quantity,
//       },
//       {},
//       headers
//     )
//     .then(async () => {
//       const fullfillmentCacheTag = await getCacheTag("fulfillment")
//       revalidateTag(fullfillmentCacheTag, "max")
//       const cartCacheTag = await getCacheTag("carts")
//       revalidateTag(cartCacheTag, "max")
//     })
//     .catch(medusaError)
// }

export async function addToCartBulk({
  lineItems,
  countryCode = 'ph',
  companyId
}: {
  lineItems: HttpTypes.StoreAddCartLineItem[]
  countryCode: string
  companyId?: string
}) {
  console.log(countryCode, lineItems, 'llssns', companyId)
  if(companyId){
  await setCompanyId(companyId)
  }
  const cart = await getOrSetCart(countryCode, companyId)
  console.log(cart, companyId, 'GETTTS SEEET')
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }
  
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
  } as Record<string, any>

  if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  }

  console.log(lineItems, countryCode, 'addding', companyId)
  await fetch(
    `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items/bulk`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ line_items: lineItems }),
    }
  )
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag, "max")
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
    })
    .catch(medusaError)
}


export async function updateLineItem({
  lineId,
  data,
  company
}: {
  lineId: string
  data: HttpTypes.StoreUpdateCartLineItem
  company?: any
}) {

  console.log(company,'UPDADATE LINE')
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }



  const cart = await getOrSetCart('ph', company?.id)
  console.log(cart, company, 'compaaanyyy iddd')

  if (!cart?.id) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await setCartId(cart?.id)
  await setCompanyId(company?.id)
  await sdk.store.cart
    .updateLineItem(cart?.id, lineId, data, {}, headers)
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag, "max")
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
  const cartId = await getCartId()
  if (!cartId) {
    await removeCartId()
    return new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag, "max")
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
    })
    .catch(medusaError)
}

export async function emptyCart() {
  const cart = await retrieveCart()
  if (!cart) {
    throw new Error("No existing cart found when emptying cart")
  }

  for (const item of cart.items || []) {
    await deleteLineItem(item.id)
  }

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: B2BCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart as StoreCart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes })
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag, "max")
      const fullfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fullfillmentCacheTag, "max")
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag(getCacheTag("carts"))
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag(getCacheTag("carts"))
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag(getCacheTag("carts"))
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setShippingAddress(formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }

    const cartId = await getCartId()
    const customer = await retrieveCustomer()

    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      // customer_id: customer?.id,
      email: customer?.email || formData.get("email"),
    } as any
    await updateCart(data)
  } catch (e: any) {
    throw new Error(e)
  }
}

export async function setBillingAddress(formData: FormData) {
  try {
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting billing address")
    }

    const data = {
      billing_address: {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      },
    } as any

    await updateCart(data)
  } catch (e: any) {
    return e.message
  }
}

export async function setContactDetails(
  currentState: unknown,
  formData: FormData
) {
  try {
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting contact details")
    }
    const data = {
      email: formData.get("email") as string,
      metadata: {
        invoice_recipient: formData.get("invoice_recipient"),
        cost_center: formData.get("cost_center"),
        requisition_number: formData.get("requisition_number"),
        door_code: formData.get("door_code"),
        notes: formData.get("notes"),
      },
    }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }
}

export async function placeOrder(
  cartId?: string, company_id?: string
): Promise<HttpTypes.StoreCompleteCartResponse> {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartsTag = await getCacheTag("carts")
  const ordersTag = await getCacheTag("orders")
  const approvalsTag = await getCacheTag("approvals")

  const response = await sdk.store.cart
    .complete(id, {}, headers)
    .catch(medusaError)

  if (response.type === "cart") {
    return response
  }

  let delivery = await createDelivery(id, company_id)

  track("order_completed", {
    order_id: response.order.id,
  })

  revalidateTag(cartsTag, "max")
  revalidateTag(ordersTag, "max")
  revalidateTag(approvalsTag, "max")

  await removeCartId()

  redirect(`/your-order?id=${delivery.id}`)
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag, "max")
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag, "max")

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag, "max")

  redirect(`/${countryCode}${currentPath}`)
}

export async function createCartApproval(cartId: string, createdBy: string) {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
  }

  const { approval } = await sdk.client
    .fetch<StoreApprovalResponse>(`/store/carts/${cartId}/approvals`, {
      method: "POST",
      headers,
      credentials: "include",
    })
    .catch((err) => {
      if (err.response?.json) {
        return err.response.json().then((body: any) => {
          throw new Error(body.message || err.message)
        })
      }
      throw err
    })

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  const approvalsCacheTag = await getCacheTag("approvals")
  revalidateTag(approvalsCacheTag, "max")

  return approval
}
