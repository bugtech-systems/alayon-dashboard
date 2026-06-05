"use client"

import { setAddresses } from "@/lib/data/cart"
import compareAddresses from "@/lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { Check, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BillingAddress from "../billing-address"
import ShippingAddress from "../shipping-address"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "shipping-address"

  const sameAsBilling = cart?.shipping_address && cart?.billing_address
    ? compareAddresses(cart?.shipping_address, cart?.billing_address)
    : true

  const handleEdit = () => {
    router.push(pathname + "?step=shipping-address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-baseline gap-x-2">
            <CardTitle className="text-2xl font-semibold">
              Shipping Address
            </CardTitle>
            {!isOpen && (
              <div className="rounded-full bg-green-100 p-0.5">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
          {!isOpen && cart?.shipping_address && (
            <Button
              onClick={handleEdit}
              variant="link"
              className="text-primary hover:text-primary/80"
              data-testid="edit-address-button"
            >
              Edit
            </Button>
          )}
        </div>
        <CardDescription>
          Enter your shipping and billing information
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {isOpen ? (
          <form action={formAction}>
            <div className="space-y-6">
              <ShippingAddress
                customer={customer}
                cart={cart}
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="same-as-billing"
                  checked={sameAsBilling}
                  onCheckedChange={() => {
                    // Handle toggle - you'll need to implement this
                    // based on your useToggleState replacement
                  }}
                />
                <Label htmlFor="same-as-billing">
                  Billing address same as shipping
                </Label>
              </div>

              {!sameAsBilling && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Billing Address
                    </h3>
                    <BillingAddress cart={cart} />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                data-testid="submit-address-button"
              >
                Continue to Delivery
              </Button>

              {message && (
                <Alert variant="destructive" data-testid="address-error-message">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {cart && cart.shipping_address ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div data-testid="shipping-address-summary">
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Shipping Address
                  </Label>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </p>
                    <p>
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </p>
                    <p>
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </p>
                    <p>
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div data-testid="shipping-contact-summary">
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Contact
                  </Label>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>{cart.shipping_address.phone}</p>
                    <p>{cart.email}</p>
                  </div>
                </div>

                <div data-testid="billing-address-summary">
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Billing Address
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {sameAsBilling ? (
                      <p>Billing and delivery address are the same.</p>
                    ) : (
                      <div className="space-y-0.5">
                        <p>
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </p>
                        <p>
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </p>
                        <p>
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </p>
                        <p>
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Separator className="mt-6" />
    </Card>
  )
}

export default Addresses