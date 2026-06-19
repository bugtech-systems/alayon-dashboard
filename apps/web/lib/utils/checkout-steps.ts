// apps/web/lib/utils/checkout-steps.ts
import { B2BCart } from "@/types/global"

export type CheckoutStep = 
  | "address"
  | "delivery"
  | "payment"
  | "review"

export const STEPS: CheckoutStep[] = [
  "address",
  "delivery",
  "payment",
  "review"
]

export const STEP_NAMES: Record<CheckoutStep, string> = {
  "address": "Addresses",
  "delivery": "Delivery",
  "payment": "Payment",
  "review": "Review"
}

export const STEP_ORDER: Record<CheckoutStep, number> = {
  "address": 1,
  "delivery": 2,
  "payment": 3,
  "review": 4
}

// Get the logical next step based on cart completion
export function getCheckoutStep(cart: B2BCart): CheckoutStep | null {
  if (!cart) return "address"
  
  // Check address step (shipping + billing + email)
  const hasShippingAddress = !!cart?.shipping_address?.address_1
  const hasEmail = !!cart?.email
  const hasBillingAddress = cart?.same_as_shipping === true || !!cart?.billing_address?.address_1
  
  if (!hasShippingAddress || !hasBillingAddress) {
    return "address"
  }
  
  // Check delivery step
  if (!cart?.shipping_methods || cart.shipping_methods.length === 0) {
    return "delivery"
  }
  
  // Check payment step
  const hasPaymentSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )
  
  if (!hasPaymentSession) {
    return "payment"
  }
  
  // All steps completed
  return "review"
}

// Check if a specific step is complete
export function isStepComplete(cart: B2BCart, step: CheckoutStep): boolean {
  console.log(cart, "CAART")
   const hasShippingAddress = !!cart?.shipping_address?.address_1
      const hasEmail = !!cart?.email
      const hasBillingAddress = cart?.same_as_shipping === true || !!cart?.billing_address?.address_1
  switch (step) {
    case "address":
      return hasShippingAddress && hasBillingAddress
    case "delivery":
      return  hasShippingAddress && hasBillingAddress && cart?.shipping_methods == 0 ? true : cart.shipping_methods.length > 0 ? true : false
    case "payment":
      return !!cart.payment_collection?.payment_sessions?.find(
        (paymentSession: any) => paymentSession.status === "pending"
      )
    case "review":
      // Review is only complete if both delivery AND payment are complete
      const hasDelivery = cart?.shipping_methods == 0 ? true : cart.shipping_methods.length > 0 ? true : false && hasShippingAddress && hasBillingAddress
      const hasPayment = !!cart.payment_collection?.payment_sessions?.find(
        (paymentSession: any) => paymentSession.status === "pending"
      )
      return hasDelivery && hasPayment
    default:
      return false
  }
}

// Check if a step is accessible (can be clicked in stepper)
export function isStepAccessible(cart: B2BCart, step: CheckoutStep, currentStep: CheckoutStep): boolean {
  const stepIndex = STEPS.indexOf(step)
  const currentIndex = STEPS.indexOf(currentStep)
  
  // Always allow going back
  if (stepIndex < currentIndex) return true
  
  // Allow current step
  if (stepIndex === currentIndex) return true
  
  // For moving forward, check if the step can be accessed
  switch (step) {
    case "delivery":
      // Can access delivery if address is complete
      return isStepComplete(cart, "address")
    case "payment":
      // Can access payment if address and delivery are complete
      return isStepComplete(cart, "address") && isStepComplete(cart, "delivery")
    case "review":
      // Can only access review if address, delivery, AND payment are complete
      return isStepComplete(cart, "address") && 
             isStepComplete(cart, "delivery") && 
             isStepComplete(cart, "payment")
    default:
      return true
  }
}

// Get the next logical step
export function getNextStep(currentStep: CheckoutStep): CheckoutStep | null {
  const currentIndex = STEPS.indexOf(currentStep)
  if (currentIndex < STEPS.length - 1 && currentIndex !== -1) {
    return STEPS[currentIndex + 1]
  }
  return null
}

// Get the previous step
export function getPreviousStep(currentStep: CheckoutStep): CheckoutStep | null {
  const currentIndex = STEPS.indexOf(currentStep)
  if (currentIndex > 0) {
    return STEPS[currentIndex - 1]
  }
  return null
}

// Get allowed steps for navigation
export function getAllowedSteps(cart: B2BCart): CheckoutStep[] {
  const allowedSteps: CheckoutStep[] = ["address"]
  
  if (isStepComplete(cart, "address")) {
    allowedSteps.push("delivery")
  }
  
  if (isStepComplete(cart, "address") && isStepComplete(cart, "delivery")) {
    allowedSteps.push("payment")
  }
  
  if (isStepComplete(cart, "address") && 
      isStepComplete(cart, "delivery") && 
      isStepComplete(cart, "payment")) {
    allowedSteps.push("review")
  }
  
  return allowedSteps
}