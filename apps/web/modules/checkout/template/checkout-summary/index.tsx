"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ShoppingBag, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"

import ItemsPreviewTemplate from "@/modules/cart/templates/preview"
import DiscountCode from "@/modules/checkout/components/discount-code"
import CartTotals from "@/modules/common/components/cart-check-totals"
import { currencySymbolMap } from "@/lib/constants"

const CheckoutSummary = ({ cart, isSticky = true }: { cart: any; isSticky?: boolean }) => {
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  const itemCount = cart?.items?.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0
  ) || 0

  // Track scroll for sticky button on mobile
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const SummaryContent = () => (
    <>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Order Summary
          </CardTitle>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Review your order before payment
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 p-6">
        {/* Cart Totals */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">
            Payment Details
          </h3>
          <CartTotals totals={cart} />
        </div>

        <Separator />

        {/* Promo Code */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">
            Voucher / Promo Code
          </h3>
          <DiscountCode cart={cart} />
        </div>

        <Separator />

        {/* Products */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              Items Ordered
            </h3>
            <span className="text-xs text-gray-400">
              {itemCount} products
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
            <ItemsPreviewTemplate cart={cart} />
          </div>
        </div>
      </CardContent>
    </>
  )

  // Desktop version with sticky positioning
  if (isSticky) {
    return (
      <div className="sticky top-6">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <SummaryContent />
        </Card>
      </div>
    )
  }

  // Mobile version with sheet drawer
  return (
    <>
      {/* Floating Action Button - Bottom Right */}
      {/* {isScrolled && (
        <Button
          onClick={() => setShowMobileSummary(true)}
          className="fixed bottom-20 right-4 z-50 shadow-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3"
          size="lg"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          View Order
          <Badge className="ml-2 bg-white text-blue-600">
            {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
          </Badge>
        </Button>
      )} */}

      {/* Mobile Summary Sheet */}
      <Sheet open={showMobileSummary} onOpenChange={setShowMobileSummary}>
        <SheetTrigger asChild>
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
                  </p>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  onClick={() => setShowMobileSummary(true)}
                >
                  Review Order
                  <ChevronUp className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-xl">
          <SheetHeader className="p-4 border-b border-gray-100">
            <SheetTitle className="text-xl font-semibold text-gray-900">
              Order Summary
            </SheetTitle>
            <p className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 pb-10 h-[100px] ">
            <div className="space-y-6">
              {/* Products List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Items
                </h3>
                <ItemsPreviewTemplate cart={cart} />
              </div>

              <Separator />

              {/* Promo Code */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Voucher / Promo Code
                </h3>
                <DiscountCode cart={cart} />
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Payment Details
                </h3>
                <CartTotals totals={cart} />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Button in Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={() => {
                setShowMobileSummary(false)
                // Scroll to continue button or next step
                const continueButton = document.querySelector('[data-testid="submit-address-button"]')
                if (continueButton) {
                  continueButton.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              Continue to Checkout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Initial Summary Card for Mobile (visible above the fold) */}
      <div className="lg:hidden mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order Summary</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowMobileSummary(true)}
                className="border-gray-200 hover:bg-gray-50"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default CheckoutSummary