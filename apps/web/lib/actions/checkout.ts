"use server";

import { UpsertAddressDTO } from "@medusajs/types";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sdk } from "../medusa/config";
import { retrieveCart } from "../data";
import { getAuthHeaders, getCacheOptions } from "../medusa/data/cookies";
import { DeliveryDTO } from "../types";

export async function updateCart(cartId: string, data: Record<string, unknown>) {
  if (!cartId) {
    throw new Error("No cart found");
  }

  const response = await sdk.store.cart.update(
    cartId,
    data,
    {},
    {
      ...getAuthHeaders(),
    }
  );

  revalidateTag(getCacheOptions("carts"));

  return response;
}

export async function completeCart(cartId: string) {
  if (!cartId) {
    throw new Error("No cart found");
  }

  const response = await sdk.store.cart.complete(
    cartId,
    {},
    {
      ...getAuthHeaders(),
    }
  );

  revalidateTag(getCacheOptions("carts"));

  return response;
}

export async function addPaymentSession(cartId: string) {
  const cart = await retrieveCart(cartId);

  const res = await sdk.store.payment.initiatePaymentSession(
    cart,
    {},
    undefined,
    {
      ...getAuthHeaders(),
    }
  );

  return res;
}

export async function createDelivery(cartId: string, restaurantId: string) {
  const { delivery } = await sdk.client.fetch<{
    delivery: DeliveryDTO;
  }>("/store/deliveries", {
    method: "POST",
    body: { cart_id: cartId, restaurant_id: restaurantId },
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  revalidateTag(getCacheOptions("deliveries"));

  return delivery;
}

export async function placeOrder(prevState: any, data: FormData) {
  // Get cart_id from FormData instead of cookies
  const cartId = data.get("cart-id")?.toString();
  
  if (!cartId) {
    return { message: "No cart found" };
  }

  const firstName = data.get("first-name")?.toString();
  const lastName = data.get("last-name")?.toString();
  const address = data.get("address")?.toString();
  const city = data.get("city")?.toString();
  const zip = data.get("zip")?.toString();
  const phone = data.get("phone")?.toString();
  const email = data.get("email")?.toString();
  const restaurantId = data.get("restaurant-id")?.toString();
  const notes = data.get("notes")?.toString();

  if (
    !firstName ||
    !lastName ||
    !address ||
    !city ||
    !zip ||
    !phone ||
    !email 
  ) {
    return { message: "Please fill in all fields" };
  }

  const shippingAddress: UpsertAddressDTO = {
    first_name: firstName,
    last_name: lastName,
    address_1: address,
    city,
    postal_code: zip,
    phone,
  };

  try {
    // Update cart with shipping address and notes
    const updatedCart = await updateCart(cartId, {
      shipping_address: shippingAddress,
      metadata: {
        notes: notes || "",
        customer_email: email,
      },
    });

    if (!updatedCart) {
      return { message: "Error updating cart" };
    }

    // Create delivery
    const delivery = await createDelivery(cartId, restaurantId);

    // Optional: Clear cart from localStorage by setting cookie (if you still use cookies)
    const cookieStore = await cookies();
    cookieStore.set("_medusa_cart_id", "", { maxAge: 0 });
    cookieStore.set("_medusa_delivery_id", delivery.id);
    
    // Return success response
    return { 
      success: true, 
      deliveryId: delivery.id,
      message: "Order placed successfully!" 
    };
    
  } catch (error) {
    console.error('Error placing order:', error);
    return { message: "Error placing order. Please try again." };
  }
}