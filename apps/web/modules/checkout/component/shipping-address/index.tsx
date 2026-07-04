"use client"

import { HttpTypes } from "@medusajs/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listBarangays, listMunicipalities } from "@/lib/data/regions"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Search, MapPin, ChevronDown } from "lucide-react"
import { SubmitButton } from "../submit-button"
import ErrorMessage from "../error-message"

interface Municipality {
  citymun_code: string
  citymun_desc: string
  prov_code: string
  prov_desc: string
  reg_code: string
  reg_desc: string
}

interface Barangay {
  psgc_code: string
  name: string
  citymun_code: string
}

interface UserLocation {
  municipality: string
  municipalityId: string
  municipalityCode: string
  barangay: string
  barangayId: string
  barangayCode: string
  address: string
  fullAddress: string
  coordinates: {
    lat: number
    lng: number
  }
  mapAddress: string
  fullName: string
  first_name: string
  last_name: string
  phone: string
  email: string
  timestamp: number
}

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  formAction,
  message,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  formAction?: (payload: FormData) => void
  message?: any
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": "",
    "shipping_address.last_name": "",
    "shipping_address.address_1": "",
    "shipping_address.company": "",
    "shipping_address.postal_code": "",
    "shipping_address.city": "",
    "shipping_address.country_code": "ph",
    "shipping_address.province": "",
    "shipping_address.phone": "",
    email: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState<string>("")
  const [selectedBarangayCode, setSelectedBarangayCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [searchMunicipality, setSearchMunicipality] = useState("")
  const [searchBarangay, setSearchBarangay] = useState("")
  const [isMunicipalityOpen, setIsMunicipalityOpen] = useState(false)
  const [isBarangayOpen, setIsBarangayOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")

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

  // Priority: Cart first, then localStorage
  const populateFormData = (cartData?: any, locationData?: UserLocation) => {
    const newFormData: Record<string, any> = {}

    // First priority: Cart data
    if (cartData) {
      newFormData["shipping_address.first_name"] = cartData.first_name || ""
      newFormData["shipping_address.last_name"] = cartData.last_name || ""
      newFormData["shipping_address.address_1"] = cartData.address_1 || ""
      newFormData["shipping_address.city"] = cartData.city || ""
      newFormData["shipping_address.province"] = cartData.province || ""
      newFormData["shipping_address.phone"] = cartData.phone || ""
      newFormData["shipping_address.company"] = cartData.company || ""
      newFormData["shipping_address.postal_code"] = cartData.postal_code || ""
      newFormData["shipping_address.country_code"] = cartData.country_code || "ph"
      newFormData.email = cartData.email || ""
    }

    // Second priority: localStorage (only fill empty fields)
    if (locationData) {
      const nameParts = locationData.fullName?.split(' ') || []
      const firstName = locationData.first_name || nameParts[0] || ''
      const lastName = locationData.last_name || nameParts.slice(1).join(' ') || ''

      Object.assign(newFormData, {
        "shipping_address.first_name": newFormData["shipping_address.first_name"] || firstName,
        "shipping_address.last_name": newFormData["shipping_address.last_name"] || lastName,
        "shipping_address.address_1": newFormData["shipping_address.address_1"] || locationData.address || locationData.fullAddress,
        "shipping_address.city": newFormData["shipping_address.city"] || locationData.municipality,
        "shipping_address.province": newFormData["shipping_address.province"] || "Leyte",
        "shipping_address.phone": newFormData["shipping_address.phone"] || locationData.phone,
        email: newFormData["email"] || locationData.email,
      })
    }

    setFormData((prev) => ({ ...prev, ...newFormData }))

    // Set municipality and barangay selections
    if (locationData?.municipalityCode) {
      const matchedMunicipality = municipalities.find(
        m => m.citymun_code === locationData.municipalityCode
      )
      if (matchedMunicipality) {
        setSelectedMunicipalityCode(matchedMunicipality.citymun_code)
        
        if (locationData.barangayCode) {
          const matchedBarangay = barangays.find(
            (b: any) => b.psgc_code === locationData.barangayCode
          )
          if (matchedBarangay) {
            setSelectedBarangayCode(matchedBarangay.psgc_code)
          }
        }
      }
    }
  }

  // Load from cart and localStorage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Get cart data
        const cartData = cart?.shipping_address ? {
          first_name: cart.shipping_address.first_name,
          last_name: cart.shipping_address.last_name,
          address_1: cart.shipping_address.address_1,
          city: cart.shipping_address.city,
          province: cart.shipping_address.province,
          phone: cart.shipping_address.phone,
          company: cart.shipping_address.company,
          postal_code: cart.shipping_address.postal_code,
          country_code: cart.shipping_address.country_code,
          email: cart?.email,
        } : null

        // Get localStorage data
        let locationData: UserLocation | null = null
        try {
          const storedLocation = localStorage.getItem('userLocation')
          if (storedLocation) {
            const parsed = JSON.parse(storedLocation)
            locationData = parsed
          }
        } catch (error) {
          console.error('Error loading from localStorage:', error)
        }

        // Populate with priority: Cart > localStorage
        populateFormData(cartData, locationData)
      } catch (error) {
        console.error('Error loading address data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (municipalities.length > 0) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [cart, municipalities, barangays])

  // Load municipalities
  useEffect(() => {
    const loadMunicipalities = async () => {
      setLoadingMunicipalities(true)
      setError('')
      
      try {
        const response = await listMunicipalities()
        let municipalitiesData: any[] = []
        if (Array.isArray(response)) {
          municipalitiesData = response
        } else if (response && typeof response === 'object' && 'data' in response) {
          municipalitiesData = (response as any).data
        } else if (response && typeof response === 'object' && 'municipalities' in response) {
          municipalitiesData = (response as any).municipalities
        }
        setMunicipalities(municipalitiesData)
      } catch (err) {
        setError('Failed to load municipalities. Please try again.')
        console.error('Error loading municipalities:', err)
      } finally {
        setLoadingMunicipalities(false)
      }
    }

    loadMunicipalities()
  }, [])

  // Load barangays when municipality changes
  useEffect(() => {
    if (selectedMunicipalityCode) {
      const loadBarangays = async () => {
        setLoadingBarangays(true)
        setError('')
        setSelectedBarangayCode("")
        
        try {
          const response = await listBarangays(selectedMunicipalityCode)
          let barangaysData: any[] = []
          if (Array.isArray(response)) {
            barangaysData = response
          } else if (response && typeof response === 'object' && 'data' in response) {
            barangaysData = (response as any).data
          } else if (response && typeof response === 'object' && 'barangays' in response) {
            barangaysData = (response as any).barangays
          }
          setBarangays(barangaysData)
          
          const selectedMunicipality = municipalities.find(
            m => m.citymun_code === selectedMunicipalityCode
          )
          if (selectedMunicipality) {
            setFormData((prev) => ({
              ...prev,
              "shipping_address.city": selectedMunicipality.citymun_desc,
              "shipping_address.province": selectedMunicipality.prov_desc,
            }))
          }
        } catch (err) {
          setError('Failed to load barangays. Please try again.')
          console.error('Error loading barangays:', err)
        } finally {
          setLoadingBarangays(false)
        }
      }

      loadBarangays()
    } else {
      setBarangays([])
      setSelectedBarangayCode("")
    }
  }, [selectedMunicipalityCode, municipalities])

  // Handle municipality change
  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipalityCode(value)
    setSearchMunicipality("")
    setFormData((prev) => ({
      ...prev,
      "shipping_address.city": "",
      "shipping_address.province": "",
    }))
  }

  // Handle barangay change
  const handleBarangayChange = (value: string) => {
    setSelectedBarangayCode(value)
    setSearchBarangay("")
    const selectedBarangay = barangays.find(b => b.psgc_code === value)
    if (selectedBarangay) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.address_1": prev["shipping_address.address_1"] || selectedBarangay.name,
      }))
    }
  }

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
        "shipping_address.province": address?.province || "",
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

  // Filter municipalities based on search
  const filteredMunicipalities = municipalities.filter(m =>
    m.citymun_desc.toLowerCase().includes(searchMunicipality.toLowerCase())
  )

  // Filter barangays based on search
  const filteredBarangays = barangays.filter(b =>
    b.name.toLowerCase().includes(searchBarangay.toLowerCase())
  )

  // Custom Select with search for mobile
  const SearchableSelect = ({
    value,
    onValueChange,
    placeholder,
    items,
    searchValue,
    onSearchChange,
    loading,
    disabled,
    labelKey,
    valueKey,
    open,
    onOpenChange,
    isMobile,
  }: any) => {
    if (isMobile) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <button
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled || loading}
            >
              <span className={value ? "text-gray-900" : "text-gray-400"}>
                {value ? items.find((i: any) => i[valueKey] === value)?.[labelKey] : placeholder}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No results found</div>
              ) : (
                items.map((item: any) => (
                  <button
                    key={item[valueKey]}
                    className={`w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors ${
                      value === item[valueKey] ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    onClick={() => {
                      onValueChange(item[valueKey])
                      onOpenChange(false)
                    }}
                  >
                    {item[labelKey]}
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item: any) => (
            <SelectItem key={item[valueKey]} value={item[valueKey]}>
              {item[labelKey]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Show loading state
  if (isLoading || loadingMunicipalities) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="col-span-1 md:col-span-2 h-10 bg-gray-200 rounded"></div>
          <div className="col-span-1 md:col-span-2 h-10 bg-gray-200 rounded"></div>
          <div className="col-span-1 md:col-span-2 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction}>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100">
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
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="col-span-1 md:col-span-2">
          <Label htmlFor="shipping_address.address_1" className="text-sm font-medium text-gray-700 mb-1 block">
            House / Building / Street *
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
            placeholder="e.g. 123 Main St, Building A"
          />
        </div>

        {/* Municipality and Barangay in single row */}
        <div className="col-span-1 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipality" className="text-sm font-medium text-gray-700 mb-1 block">
                Municipality / City *
              </Label>
              <SearchableSelect
                value={selectedMunicipalityCode}
                onValueChange={handleMunicipalityChange}
                placeholder="Select municipality"
                items={searchMunicipality ? filteredMunicipalities : municipalities}
                searchValue={searchMunicipality}
                onSearchChange={setSearchMunicipality}
                loading={loadingMunicipalities}
                disabled={loadingMunicipalities}
                labelKey="citymun_desc"
                valueKey="citymun_code"
                open={isMunicipalityOpen}
                onOpenChange={setIsMunicipalityOpen}
                isMobile={isMobile}
              />
              {!selectedMunicipalityCode && municipalities.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {municipalities.length} municipalities available
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="barangay" className="text-sm font-medium text-gray-700 mb-1 block">
                Barangay *
              </Label>
              <SearchableSelect
                value={selectedBarangayCode}
                onValueChange={handleBarangayChange}
                placeholder={
                  loadingBarangays 
                    ? "Loading barangays..." 
                    : !selectedMunicipalityCode 
                      ? "Select municipality first" 
                      : "Select barangay"
                }
                items={searchBarangay ? filteredBarangays : barangays}
                searchValue={searchBarangay}
                onSearchChange={setSearchBarangay}
                loading={loadingBarangays}
                disabled={!selectedMunicipalityCode || loadingBarangays}
                labelKey="name"
                valueKey="psgc_code"
                open={isBarangayOpen}
                onOpenChange={setIsBarangayOpen}
                isMobile={isMobile}
              />
              {selectedMunicipalityCode && barangays.length === 0 && !loadingBarangays && (
                <p className="text-xs text-yellow-600 mt-1">
                  No barangays found for this municipality
                </p>
              )}
              {selectedMunicipalityCode && barangays.length > 0 && !loadingBarangays && (
                <p className="text-xs text-gray-400 mt-1">
                  {barangays.length} barangays available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gradient-to-br from-gray-50 to-white rounded-md border border-gray-200">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            <span className="font-medium">Address Preview:</span>{" "}
            {[
              formData["shipping_address.address_1"],
              formData["shipping_address.city"],
              formData["shipping_address.province"]
            ].filter(Boolean).join(", ") || "No address entered"}
          </p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            Phone *
          </Label>
          <Input
            id="shipping_address.phone"
            name="shipping_address.phone"
            type="tel"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            required
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
            data-testid="shipping-phone-input"
            placeholder="e.g. 09774461641"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter your mobile number for delivery updates
          </p>
        </div>
      </div>

      {/* Continue to Delivery Button */}
      <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
        <SubmitButton 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium shadow-lg shadow-blue-600/20 transition-all duration-200 hover:shadow-blue-600/30"
          data-testid="submit-address-button"
        >
          Continue to Delivery
        </SubmitButton>
        <ErrorMessage error={message} data-testid="address-error-message" />
      </div>
    </form>
  )
}

export default ShippingAddress