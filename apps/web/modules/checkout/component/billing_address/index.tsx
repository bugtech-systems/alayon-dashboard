// apps/web/modules/checkout/component/billing-address-form.tsx
"use client"

import { HttpTypes } from "@medusajs/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BillingAddressForm = ({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="billing_address.first_name" className="text-sm font-medium text-gray-700 mb-1 block">
          First name *
        </Label>
        <Input
          id="billing_address.first_name"
          name="billing_address.first_name"
          defaultValue={cart?.billing_address?.first_name || ""}
          required
          className="bg-gray-50 border-gray-200"
          data-testid="billing-first-name-input"
        />
      </div>
      
      <div>
        <Label htmlFor="billing_address.last_name" className="text-sm font-medium text-gray-700 mb-1 block">
          Last name *
        </Label>
        <Input
          id="billing_address.last_name"
          name="billing_address.last_name"
          defaultValue={cart?.billing_address?.last_name || ""}
          required
          className="bg-gray-50 border-gray-200"
          data-testid="billing-last-name-input"
        />
      </div>
      
      <div className="col-span-2">
        <Label htmlFor="billing_address.address_1" className="text-sm font-medium text-gray-700 mb-1 block">
          Address *
        </Label>
        <Input
          id="billing_address.address_1"
          name="billing_address.address_1"
          defaultValue={cart?.billing_address?.address_1 || ""}
          required
          className="bg-gray-50 border-gray-200"
          data-testid="billing-address-input"
        />
      </div>
      
      <div>
        <Label htmlFor="billing_address.city" className="text-sm font-medium text-gray-700 mb-1 block">
          City *
        </Label>
        <Input
          id="billing_address.city"
          name="billing_address.city"
          defaultValue={cart?.billing_address?.city || ""}
          required
          className="bg-gray-50 border-gray-200"
          data-testid="billing-city-input"
        />
      </div>
      
      <div>
        <Label htmlFor="billing_address.postal_code" className="text-sm font-medium text-gray-700 mb-1 block">
          Postal code *
        </Label>
        <Input
          id="billing_address.postal_code"
          name="billing_address.postal_code"
          defaultValue={cart?.billing_address?.postal_code || ""}
          required
          className="bg-gray-50 border-gray-200"
          data-testid="billing-postal-code-input"
        />
      </div>
    </div>
  )
}

export default BillingAddressForm