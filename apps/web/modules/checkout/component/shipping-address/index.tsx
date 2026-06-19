"use client"

import { HttpTypes } from "@medusajs/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "ph",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "ph",
        "shipping_address.province": address?.province || "leyte",
        "shipping_address.phone": address?.phone || "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Card className="mb-6 bg-gray-50 border border-gray-100">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600 mb-4">
              {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
            </p>
            <AddressSelect
              addresses={customer.addresses}
              addressInput={
                mapKeys(formData, (_, key) =>
                  key.replace("shipping_address.", "")
                ) as HttpTypes.StoreCartAddress
              }
              onSelect={setFormAddress}
            />
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="shipping_address.first_name" className="text-sm font-medium text-gray-700 mb-1 block">
            First name *
          </Label>
          <Input
            id="shipping_address.first_name"
            name="shipping_address.first_name"
            autoComplete="given-name"
            value={formData["shipping_address.first_name"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-first-name-input"
          />
        </div>
        
        <div>
          <Label htmlFor="shipping_address.last_name" className="text-sm font-medium text-gray-700 mb-1 block">
            Last name *
          </Label>
          <Input
            id="shipping_address.last_name"
            name="shipping_address.last_name"
            autoComplete="family-name"
            value={formData["shipping_address.last_name"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-last-name-input"
          />
        </div>
        
        <div className="col-span-2">
          <Label htmlFor="shipping_address.address_1" className="text-sm font-medium text-gray-700 mb-1 block">
            Address *
          </Label>
          <Input
            id="shipping_address.address_1"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-address-input"
          />
        </div>
{/*         
        <div>
          <Label htmlFor="shipping_address.company" className="text-sm font-medium text-gray-700 mb-1 block">
            Company
          </Label>
          <Input
            id="shipping_address.company"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-company-input"
          />
        </div>
         */}
        {/* <div>
          <Label htmlFor="shipping_address.postal_code" className="text-sm font-medium text-gray-700 mb-1 block">
            Postal code *
          </Label>
          <Input
            id="shipping_address.postal_code"
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-postal-code-input"
          />
        </div> */}
        
        <div>
          <Label htmlFor="shipping_address.city" className="text-sm font-medium text-gray-700 mb-1 block">
            City *
          </Label>
          <Input
            id="shipping_address.city"
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-city-input"
          />
        </div>
        
        {/* <div>
          <Label htmlFor="shipping_address.country_code" className="text-sm font-medium text-gray-700 mb-1 block">
            Country *
          </Label>
          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-country-select"
          />
        </div> */}
        
        <div>
          <Label htmlFor="shipping_address.province" className="text-sm font-medium text-gray-700 mb-1 block">
            State / Province
          </Label>
          <Input
            id="shipping_address.province"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-province-input"
          />
        </div>
      </div>
      
      <div className="my-8 flex items-center space-x-2">
        <Checkbox
          id="same_as_billing"
          name="same_as_billing"
          checked={checked}
          onCheckedChange={onChange}
          data-testid="billing-address-checkbox"
        />
        <Label
          htmlFor="same_as_billing"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Billing address same as shipping address
        </Label>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-email-input"
          />
        </div>
        
        <div>
          <Label htmlFor="shipping_address.phone" className="text-sm font-medium text-gray-700 mb-1 block">
            Phone
          </Label>
          <Input
            id="shipping_address.phone"
            name="shipping_address.phone"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-phone-input"
          />
        </div>
      </div>
    </>
  )
}

export default ShippingAddress