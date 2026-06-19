"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { currencySymbolMap } from "@/lib/constants"

const Review = ({ cart, onPlaceOrder }: { cart: any; onPlaceOrder?: () => void }) => {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart?.shipping_methods == 0 ? true : cart.shipping_methods.length > 0 ? true : false &&
    (cart.payment_collection || paidByGiftcard)



    console.log(cart, previousStepsCompleted, 'prevvss')
  if (!isOpen || !previousStepsCompleted) {
    return null
  }

  return (
    <div className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-gray-900">
          Review Your Order
        </CardTitle>
        <CardDescription className="text-gray-500 text-sm">
          Please review your order before placing it
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {/* Terms and Conditions */}
        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-gray-700">
            By clicking the Place Order button, you confirm that you have
            read, understand and accept our{" "}
            <a href="/terms" className="text-blue-600 hover:underline font-medium">
              Terms of Use
            </a>
            ,{" "}
            <a href="/terms" className="text-blue-600 hover:underline font-medium">
              Terms of Sale
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline font-medium">
              Returns Policy
            </a>
            , and acknowledge that you have read Medusa Store's{" "}
            <a href="/privacy" className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </a>
            .
          </AlertDescription>
        </Alert>

        {/* Order Summary Preview */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-medium text-gray-900">
              {currencySymbolMap['php']}{cart?.subtotal?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Shipping</span>
            <span className="text-sm font-medium text-gray-900">
              {cart?.shipping_total === 0 ? "Free" : `$${cart?.shipping_total?.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxes</span>
            <span className="text-sm font-medium text-gray-900">
              {currencySymbolMap['php']}{cart?.tax_total?.toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-blue-600">
              {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Place Order Button */}
        <PaymentButton 
          cart={cart} 
          data-testid="submit-order-button"
          onSuccess={onPlaceOrder}
        />
      </CardContent>
    </div>
  )
}

export default Review