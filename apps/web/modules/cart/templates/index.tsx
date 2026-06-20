import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShoppingBag, ArrowRight, Lock } from "lucide-react"
import { getCheckoutStep } from "@/lib/medusa/util/get-checkout-step"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  if (!cart?.items?.length) {
    return (
      <div className=" mx-auto px-4 py-16 md:py-24">
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-12">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <EmptyCartMessage />
          </CardContent>
        </Card>
      </div>
    )
  }

  const checkoutStep = cart?.id ? getCheckoutStep(cart) : undefined
  const checkoutPath = checkoutStep
      ? `/check?step=${checkoutStep}&cart_id=${cart?.id}`
      : `/check?cart_id=${cart?.id}`

  return (

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart Items Section - Left Column */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden  shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-xl font-semibold">
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {/* Sign In Prompt */}
                {!customer && (
                  <>
                    <div className="p-6">
                      <SignInPrompt />
                    </div>
                    <Separator />
                  </>
                )}
                
                {/* Scrollable Items List */}
                <ScrollArea className="max-h-[600px]">
                  <div className="divide-y">
                    <ItemsTemplate cart={cart} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Section - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-xl font-semibold">
                    Order Summary
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6 p-6">
                  {cart && cart.region && (
                    <Summary cart={cart as any} />
                  )}
                  
                  <Separator />
                  
                  {/* Secure Checkout Note */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                  
                  {/* Continue to Checkout Button */}
                  <Button 
                    className="w-full gap-2"
                    size="lg"
                    asChild
                  >
                    <a href={checkoutPath}>
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  
                  {/* Continue Shopping Link */}
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-sm"
                      asChild
                    >
                      <a href="/products">
                        Continue Shopping
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
  )
}

export default CartTemplate