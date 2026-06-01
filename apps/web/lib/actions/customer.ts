"use server"

import { sdk } from "@/lib/medusa/config"
import medusaError from "@/lib/medusa/util/medusa-error"
import { B2BCustomer } from "@/types/global"
import { HttpTypes } from "@medusajs/types"
import { track } from "@vercel/analytics/server"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "@/lib/medusa/data/cookies"

const BASE_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://api.sharewin.pro";

const SECRET_KEY = process.env.NEXT_PUBLIC_MEDUSA_SECRET_KEY!
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!


// ----------------------------------------------------------------------
// Existing functions (retrieveCustomer, updateCustomer, signout, etc.)
// Keep them unchanged.
// ----------------------------------------------------------------------

export const retrieveCustomer = async (): Promise<B2BCustomer | null> => {
  const authHeaders = await getAuthHeaders()
  if (!authHeaders) return null
  const headers = { ...authHeaders }
  const next = { ...(await getCacheOptions("customers")) }
  return await sdk.client
    .fetch<{ customer: B2BCustomer }>(`/store/customers/me`, {
      method: "GET",
      query: { fields: "*employee, *orders" },
      headers,
      next,
    })
    .then(({ customer }) => customer as B2BCustomer)
    .catch(() => null)
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = { ...(await getAuthHeaders()) }
  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)
  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag, "max")
  return updateRes
}

export async function signout(countryCode: string, customerId: string) {
  await sdk.auth.logout()
  removeAuthToken()
  track("customer_logged_out")
  await removeCartId()
  const [authCacheTag, customerCacheTag, productsCacheTag, cartsCacheTag] =
    await Promise.all([
      getCacheTag("auth"),
      getCacheTag("customers"),
      getCacheTag("products"),
      getCacheTag("carts"),
    ])
  revalidateTag(authCacheTag, "max")
  revalidateTag(customerCacheTag, "max")
  revalidateTag(productsCacheTag, "max")
  revalidateTag(cartsCacheTag, "max")
  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()
  if (!cartId) return
  const headers = { ...(await getAuthHeaders()) }
  await sdk.store.cart.transferCart(cartId, {}, headers)
  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }
  const headers = { ...(await getAuthHeaders()) }
  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => ({ success: false, error: err.toString() }))
}

export const deleteCustomerAddress = async (addressId: string): Promise<void> => {
  const headers = { ...(await getAuthHeaders()) }
  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag, "max")
    })
    .catch((err) => console.error(err))
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }
  const headers = { ...(await getAuthHeaders()) }
  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const cacheTag = await getCacheTag("customers")
      revalidateTag(cacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => ({ success: false, error: err.toString() }))
}

// ----------------------------------------------------------------------
// NEW / REFINED FUNCTIONS for phone/email lookup and guest creation
// ----------------------------------------------------------------------

/**
 * Create a new guest customer.
 * @param customerData - Customer details (email optional, phone required)
 * @returns The created customer object or null on error.
 */
export async function createGuestCustomer(customerData: {
  email?: string;
  first_name: string;
  last_name: string;
  phone: string;
  cart_id: string;
}) {
  try {
    const payload = {
      email: customerData.email || `guest_${Date.now()}@example.com`,
      first_name: customerData.first_name,
      last_name: customerData.last_name,
      phone: customerData.phone,
      cart_id: customerData?.cart_id,
      metadata: { is_guest: true },
    };


    console.log(payload, 'CREAATE CUSTOMM')
    const response = await fetch(`${BASE_URL}/store/customers/phone`, {
      method: "POST",
      headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(response, 'RESSESES')
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log(errorData, 'ERRR')
        errorMessage = errorData.message || errorMessage;
        console.error("Medusa customer creation error details:", errorData);
        return null
      } catch (e) {
        // response body not JSON
      }
              return null
    }

    const customer = await response.json();
    const cacheTag = await getCacheTag("customers");
    revalidateTag(cacheTag, "max");
    return customer;
  } catch (error: any) {
    console.error("Error creating guest customer:", error);
    // Return a structured error object instead of null
    return { error: error.message || "Failed to create customer" };
  }
}

/**
 * Look up a customer by phone using the custom lookup endpoint.
 * @param phone - Customer phone number
 * @returns Customer object or null
 */
export async function getCustomerByPhone(phone: string) {
  try {
    const response = await fetch(`${BASE_URL}/store/customers/lookup?phone=${encodeURIComponent(phone)}`, {
      headers: {
        ...(await getAuthHeaders()),
      },
      cache: "no-store", // Always check fresh for checkout
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.customer || null;
  } catch (error) {
    console.error("Error in getCustomerByPhone:", error);
    return null;
  }
}

/**
 * Look up a customer by email using the custom lookup endpoint.
 * @param email - Customer email
 * @returns Customer object or null
 */
export async function getCustomerByEmail(email: string) {
  try {
    const response = await fetch(`${BASE_URL}/store/customers/lookup?email=${encodeURIComponent(email)}`, {
      headers: {
        ...(await getAuthHeaders()),
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.customer || null;
  } catch (error) {
    console.error("Error in getCustomerByEmail:", error);
    return null;
  }
}

/**
 * Look up a customer by phone or email. Tries phone first, then email if provided.
 * @param phone - Required phone number
 * @param email - Optional email address
 * @returns Customer object or null
 */
export async function getCustomerByPhoneOrEmail(phone: string, email?: string) {
  // First try by phone
  let customer = await getCustomerByPhone(phone);
  if (customer) return customer;

  // If phone not found and email is provided, try by email
  if (email) {
    customer = await getCustomerByEmail(email);
    if (customer) {
      // Found by email – optionally update the customer's phone number
      // to link this phone to the existing account.
      if (!customer.phone || customer.phone !== phone) {
        await updateCustomerPhone(customer.id, phone).catch((err) =>
          console.error("Failed to update customer phone:", err)
        );
      }
      return customer;
    }
  }
  return null;
}

/**
 * Update a customer's phone number.
 * @param customerId - ID of the customer
 * @param phone - New phone number
 * @returns Updated customer object
 */
export async function updateCustomerPhone(customerId: string, phone: string) {
  const headers = { ...(await getAuthHeaders()) };
  // Use the store API to update the customer (requires authentication)
  const response = await sdk.store.customer.update(
    { phone },
    {},
    headers
  );
  const updatedCustomer = response.customer;
  // Revalidate cache
  const cacheTag = await getCacheTag("customers");
  revalidateTag(cacheTag, "max");
  return updatedCustomer;
}