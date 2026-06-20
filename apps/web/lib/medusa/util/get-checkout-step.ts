import { B2BCart } from "@/types/global"

export function getCheckoutStep(cart: any) {
  if (!cart?.shipping_address?.address_1) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else if (!cart.email) {
    return "contact-information"
  } else if (
    !cart.payment_collection?.payment_sessions?.find(
      (paymentSession: any) => paymentSession.status === "pending"
    )
  ) {
    return "payment"
  } else {
    return null
  }
}
