// components/cart/cart-drawer.tsx
"use client"

import { useCart } from "@/lib/context/cart-context"
import { checkSpendingLimit } from "@/lib/medusa/util/check-spending-limit"
import { getCheckoutStep } from "@/lib/medusa/util/get-checkout-step"
import { convertToLocale } from "@/lib/medusa/util/money"
import AppliedPromotions from "@/modules/cart/components/applied-promotions"
import ApprovalStatusBanner from "@/modules/cart/components/approval-status-banner"
import ItemsTemplate from "@/modules/cart/templates/items"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { B2BCustomer } from "@/types"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, ShoppingCart, AlertCircle, Lock, Truck, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

type CartDrawerProps = {
  customer: B2BCustomer | null
  freeShippingPrices: StoreFreeShippingPrice[]
}

const CartDrawer = ({
  customer,
  freeShippingPrices,
  ...props
}: CartDrawerProps) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const { cart } = useCart()

  const items = cart?.items || []
  const promotions = cart?.promotions || []

  const totalItems =
    items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = useMemo(() => cart?.item_subtotal ?? 0, [cart])

  const spendLimitExceeded = useMemo(
    () => checkSpendingLimit(cart, customer),
    [cart, customer]
  )

  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    if (isOpen) {
      return
    }

    open()

    // const timer = setTimeout(close, 5000)

    // setActiveTimer(timer)
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  const cancelTimer = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
  }

  useEffect(() => {
    if (
      itemRef.current !== totalItems &&
      !pathname.includes("/cart") &&
      !pathname.includes("/account")
    ) {
      timedOpen()
      return
    }
  }, [totalItems, itemRef.current, pathname])

  useEffect(() => {
    cancelTimer()
    close()
  }, [pathname])

  const checkoutStep = cart ? getCheckoutStep(cart) : undefined
  const checkoutPath = customer
    ? checkoutStep
      ? `/checkout?step=${checkoutStep}`
      : "/checkout"
    : "/account"

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          className={cn(
            "relative inline-flex w-fit items-center justify-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200",
            "hover:bg-gray-100 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
          onMouseEnter={cancelTimer}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span className="text-xs font-medium hidden sm:inline-block">
            {cart && items && items.length > 0
              ? convertToLocale({
                  amount: subtotal,
                  currency_code: cart.currency_code,
                })
              : "Cart"}
          </span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </button>
      </DrawerTrigger>
      
      {/* Wider drawer - increased max width */}
      <DrawerContent className={cn(
        "fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300",
        "w-[95vw] sm:w-[500px] md:w-[600px] lg:w-[680px] xl:w-[720px]"
      )}>
        <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
          <DrawerHeader className="p-0">
            <DrawerTitle className="text-base font-semibold">
              {totalItems > 0 ? (
                <>Cart ({totalItems})</>
              ) : (
                "Your Cart"
              )}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Your shopping cart with {totalItems} items
            </DrawerDescription>
          </DrawerHeader>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
            {/* Approval Status Banner */}
            {cart?.approvals && cart.approvals.length > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200 py-2">
                <AlertCircle className="h-3 w-3 text-yellow-600" />
                <AlertDescription className="text-xs text-yellow-800">
                  <ApprovalStatusBanner cart={cart} />
                </AlertDescription>
              </Alert>
            )}

            {/* Promotions */}
            {promotions.length > 0 && (
              <div className="bg-primary/5 rounded-md p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Percent className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">Promotions Applied</span>
                </div>
                <AppliedPromotions promotions={promotions} />
              </div>
            )}

            {/* Cart Items - Using compact variant for smaller display */}
            {cart && cart.items && cart.items.length > 0 ? (
              <>
                <ItemsTemplate
                  cart={cart}
                  showBorders={false}
                  showTotal={false}
                  variant="compact"
                />

                {/* Free Shipping Nudge */}
                {cart && freeShippingPrices && (
                  <div className="mt-2">
                    <FreeShippingPriceNudge
                      variant="inline"
                      cart={cart}
                      freeShippingPrices={freeShippingPrices}
                    />
                  </div>
                )}

                <Separator className="my-2" />

                {/* Subtotal */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-semibold">
                    {convertToLocale({
                      amount: subtotal,
                      currency_code: cart?.currency_code,
                    })}
                  </span>
                </div>

                {/* Spending Limit Warning */}
                {spendLimitExceeded && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 py-2">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <AlertDescription className="text-xs text-red-800">
                      This order exceeds your spending limit. Please contact your manager for approval.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Looks like you haven't added any items yet
                </p>
                <LocalizedClientLink href="/catalog">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    Start Shopping
                  </Button>
                </LocalizedClientLink>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Actions */}
        {cart && cart.items && cart.items.length > 0 && (
          <DrawerFooter className="border-t bg-gray-50/50 p-3 space-y-2 sticky bottom-0 bg-white">
            <div className="space-y-2">
              <LocalizedClientLink href="/cart">
                <Button variant="outline" className="w-full text-sm h-9">
                  View Cart ({totalItems})
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href={checkoutPath}>
                <Button
                  className="w-full gap-1.5 text-sm h-9"
                  disabled={totalItems === 0 || spendLimitExceeded}
                >
                  {customer ? (
                    spendLimitExceeded ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Limit Exceeded
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Checkout
                      </>
                    )
                  ) : (
                    "Log in to checkout"
                  )}
                </Button>
              </LocalizedClientLink>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export default CartDrawer