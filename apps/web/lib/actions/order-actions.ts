// app/actions/order-actions.ts
'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuthHeaders } from "../data/cookies";
import { sdk } from "../config";

const REDIRECT_COOKIE_KEY = 'order_redirect_shown';
const REDIRECT_DISMISSED_KEY = 'order_redirect_dismissed';
const REDIRECT_PERMANENT_DISMISS_KEY = 'order_redirect_permanent_dismiss';
const MEDUSA_DELIVERY_ID_KEY = '_medusa_delivery_id';

// Mark that redirect has been shown - can be called from Server Action
export async function markRedirectShown() {
  const cookieStore = await cookies();
  
  cookieStore.set(REDIRECT_COOKIE_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  return { success: true };
}

// Temporary dismiss (1 day) - DOES NOT remove delivery cookie
export async function dismissOrderRedirectTemporary() {
  const cookieStore = await cookies();
  
  // Set temporary dismissal (1 day)
  cookieStore.set(REDIRECT_DISMISSED_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });
  
  // Also mark as shown to prevent redirect
  cookieStore.set(REDIRECT_COOKIE_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  revalidatePath('/');
  return { success: true };
}

// Permanent dismiss - REMOVES the delivery cookie
export async function dismissOrderRedirectPermanent() {
  const cookieStore = await cookies();
  
  // Set permanent dismissal (90 days)
  cookieStore.set(REDIRECT_PERMANENT_DISMISS_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days (3 months)
  });
  
  // Also mark as shown to prevent redirect
  cookieStore.set(REDIRECT_COOKIE_KEY, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90,
  });
  
  // REMOVE the Medusa delivery cookie
  cookieStore.delete(MEDUSA_DELIVERY_ID_KEY);
  
  revalidatePath('/');
  return { success: true };
}

// Mark as completed - REMOVES the delivery cookie only
export async function markOrderAsCompleted(orderId: string) {
  const cookieStore = await cookies();
  
  // Remove the Medusa delivery cookie
  cookieStore.delete(MEDUSA_DELIVERY_ID_KEY);
  
  // Optionally, you can also mark the order as completed in your database
  // await updateOrderStatus(orderId, 'completed');
  
  revalidatePath('/');
  revalidatePath(`/your-order?id=${orderId}`);
  return { success: true };
}

// Remove delivery cookie only (for cleanup)
export async function removeMedusaDeliveryCookie() {
  const cookieStore = await cookies();
  
  // Delete the Medusa delivery cookie
  cookieStore.delete(MEDUSA_DELIVERY_ID_KEY);
  
  revalidatePath('/');
  return { success: true };
}

export async function clearRedirectPreferences() {
  const cookieStore = await cookies();
  
  // Clear all redirect-related cookies
  cookieStore.delete(REDIRECT_COOKIE_KEY);
  cookieStore.delete(REDIRECT_DISMISSED_KEY);
  cookieStore.delete(REDIRECT_PERMANENT_DISMISS_KEY);
  
  revalidatePath('/');
  return { success: true };
}

export async function getRedirectStatus() {
  const cookieStore = await cookies();
  const permanentDismiss = cookieStore.get(REDIRECT_PERMANENT_DISMISS_KEY)?.value;
  const temporaryDismiss = cookieStore.get(REDIRECT_DISMISSED_KEY)?.value;
  const redirectShown = cookieStore.get(REDIRECT_COOKIE_KEY)?.value;
  const medusaDeliveryId = cookieStore.get(MEDUSA_DELIVERY_ID_KEY)?.value;
  
  return {
    shouldRedirect: !permanentDismiss && !temporaryDismiss && !redirectShown,
    permanentDismiss: permanentDismiss === 'true',
    temporaryDismiss: temporaryDismiss === 'true',
    redirectShown: redirectShown === 'true',
    hasMedusaDeliveryId: !!medusaDeliveryId,
    medusaDeliveryId: medusaDeliveryId || null,
  };
}

// lib/actions.ts

export async function listShippingMethods(regionId: string) {
  const headers = await getAuthHeaders();
  try {
    const { shipping_options } = await sdk.client.fetch(
      `/admin/shipping-options?region_id=${regionId}`,
      { method: 'GET', headers }
    ) as any;
    return shipping_options || [];
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return [];
  }
}

export async function getPaymentProviders(regionId: string) {
  const headers = await getAuthHeaders();
  try {
    const { payment_providers } = await sdk.client.fetch(
      `/store/payment-providers?region_id=${regionId}`,
      { method: 'GET', headers }
    ) as any;
    return payment_providers || [];
  } catch (error) {
    console.error('Error fetching payment providers:', error);
    return [];
  }
}