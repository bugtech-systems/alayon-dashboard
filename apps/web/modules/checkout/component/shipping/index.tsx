"use client"

import { setShippingMethod } from "@/lib/data/cart"
import { calculatePriceForShippingOption } from "@/lib/data/fulfillment"
import { convertToLocale } from "@/lib/util/money"
import { CheckCircle, Loader2, Truck, MapPin, ChevronLeft, ChevronRight, Navigation } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapLocationPicker } from "@/components/map-location-picker"
import { Badge } from "@workspace/ui/components/badge"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
  onNext?: () => void
  onPrevious?: () => void
  currentStep?: number
  totalSteps?: number
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

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) return ""
  
  const parts = []
  if (address.address_1) parts.push(address.address_1)
  if (address.address_2) parts.push(address.address_2)
  if (address.postal_code && address.city) parts.push(`${address.postal_code} ${address.city}`)
  if (address.country_code) parts.push(address.country_code.toUpperCase())
  
  return parts.join(", ")
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
  onNext,
  onPrevious,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [showPickupOptions, setShowPickupOptions] = useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  // Get address details from cart
  const shippingAddress = cart?.shipping_address
  const barangayName = shippingAddress?.address_2 || shippingAddress?.city || ""
  const cityName = shippingAddress?.city || "Tacloban City"

  // Auto-populate map location from cart or localStorage
  useEffect(() => {
    const initializeMapLocation = async () => {
      let locationData: { lat: number; lng: number; address: string } | null = null

      // Priority 1: Check cart shipping address for coordinates
      if (cart?.shipping_address?.metadata?.coordinates) {
        try {
          const coords = cart.shipping_address.metadata.coordinates
          if (coords?.lat && coords?.lng) {
            locationData = {
              lat: coords.lat,
              lng: coords.lng,
              address: cart.shipping_address.address_1 || 
                       `${barangayName}, ${cityName}` ||
                       `${coords.lat}, ${coords.lng}`
            }
          }
        } catch (e) {
          console.error('Error parsing cart coordinates:', e)
        }
      }

      // Priority 2: Check localStorage for user location
      if (!locationData) {
        try {
          const storedLocation = localStorage.getItem('userLocation')
          if (storedLocation) {
            const parsed: UserLocation = JSON.parse(storedLocation)
            // Check if location is recent (within 1 hour)
            const isRecent = Date.now() - parsed.timestamp < 3600000
            
            if (parsed.coordinates?.lat && parsed.coordinates?.lng) {
              locationData = {
                lat: parsed.coordinates.lat,
                lng: parsed.coordinates.lng,
                address: parsed.mapAddress || parsed.fullAddress || 
                         `${parsed.address}, ${parsed.barangay}, ${parsed.municipality}`
              }
            }
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e)
        }
      }

      // Priority 3: Use cart address to geocode (fallback)
      if (!locationData && cart?.shipping_address?.address_1 && cart?.shipping_address?.city) {
        // Try to geocode the address
        try {
          const addressString = `${cart.shipping_address.address_1}, ${cart.shipping_address.city}, ${cart.shipping_address.province || ''}`.trim()
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'AlayonStore/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data && data.length > 0) {
              locationData = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                address: data[0].display_name || addressString
              }
            }
          }
        } catch (e) {
          console.error('Error geocoding address:', e)
        }
      }

      // Set the location if found
      if (locationData) {
        setMapLocation(locationData)
        setShowMapPicker(true)
      }

      setIsInitializing(false)
    }

    initializeMapLocation()
  }, [cart, barangayName, cityName])

  // Save map location to cart metadata when it changes
  useEffect(() => {
    if (mapLocation && !isInitializing) {
      // You can optionally save to cart metadata here
      // This would require an API call to update cart metadata
      console.log('Map location updated:', mapLocation)
    }
  }, [mapLocation, isInitializing])

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    console.log(location, 'LOCAAA')
    setMapLocation(location)
    setShowMapPicker(true)
  }

  const handleSubmit = () => {
    if (onNext) {
      onNext()
    }
  }

  const isShippingComplete = () => {
    return cart.shipping_methods?.length == 0 ? true : cart?.shipping_methods?.length > 0 ? true : false
  }

  const selectedMethod = _shippingMethods?.find(m => m.id === shippingMethodId) ||
                         _pickupMethods?.find(m => m.id === shippingMethodId)

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Card className="border-0 shadow-none p-3">
        <CardContent className="px-0 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading delivery options...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none p-3">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-baseline gap-x-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              Delivery
            </CardTitle>
            {isShippingComplete() && (
              <div className="rounded-full bg-green-100 p-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-500 text-sm">
          Choose how you want your order delivered
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <div className="space-y-6">
          {/* Map Picker Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Delivery Location</h3>
                <p className="text-sm text-gray-500">Pin your exact delivery location</p>
              </div>
              {mapLocation && (
                <Badge variant="link" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
            </div>

            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={mapLocation || undefined}
              barangayName={barangayName}
              cityName={cityName}
              disabled={false}
              placeholder="Search for a location..."
            />

            {mapLocation && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Pinned Location:</span> {mapLocation.address}
                  </span>
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Shipping Methods */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Shipping method
              </h3>
              <p className="text-sm text-gray-500">
                How would you like your order delivered
              </p>
            </div>

            <div className="space-y-3" data-testid="delivery-options-container">
              {/* Pickup Option Toggle */}
              {hasPickupOptions && (
                <div
                  className={`
                    flex items-center justify-between p-4 border rounded-lg cursor-pointer
                    ${showPickupOptions === PICKUP_OPTION_ON 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => {
                    const id = _pickupMethods.find(
                      (option) => !option.insufficient_inventory
                    )?.id
                    if (id) {
                      handleSetShippingMethod(id, "pickup")
                    }
                  }}
                >
                  <div className="flex items-center gap-x-3">
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${showPickupOptions === PICKUP_OPTION_ON 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {showPickupOptions === PICKUP_OPTION_ON && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pick up your order
                      </p>
                      <p className="text-xs text-gray-500">
                        Collect from our store
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">-</span>
                </div>
              )}

              {/* Shipping Options */}
              <RadioGroup
                value={shippingMethodId || ""}
                onValueChange={(v) => {
                  if (v) handleSetShippingMethod(v, "shipping")
                }}
                className="space-y-3"
              >
                {_shippingMethods?.map((option) => {
                  const isDisabled =
                    option.price_type === "calculated" &&
                    !isLoadingPrices &&
                    typeof calculatedPricesMap[option.id] !== "number"
                  
                  const price = option.price_type === "flat"
                    ? convertToLocale({ amount: option.amount!, currency_code: cart?.currency_code })
                    : calculatedPricesMap[option.id]
                      ? convertToLocale({ amount: calculatedPricesMap[option.id], currency_code: cart?.currency_code })
                      : null

                  return (
                    <div
                      key={option.id}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg
                        ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                        ${option.id === shippingMethodId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-center gap-x-3 flex-1">
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          disabled={isDisabled}
                          className="border-gray-300"
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex items-center gap-x-2 cursor-pointer flex-1"
                        >
                          <Truck className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {option.name}
                            </p>
                            {option.service_zone?.fulfillment_set?.location?.address && (
                              <p className="text-xs text-gray-500">
                                {formatAddress(option.service_zone.fulfillment_set.location.address)}
                              </p>
                            )}
                          </div>
                        </Label>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {isDisabled ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : price ? (
                          price
                        ) : isLoadingPrices ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          "-"
                        )}
                      </span>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          </div>

          {/* Pickup Locations */}
          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Store Location
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a store near you
                </p>
              </div>

              <RadioGroup
                value={shippingMethodId || ""}
                onValueChange={(v) => {
                  if (v) handleSetShippingMethod(v, "pickup")
                }}
                className="space-y-3"
              >
                {_pickupMethods?.map((option) => (
                  <div
                    key={option.id}
                    className={`
                      flex items-start justify-between p-4 border rounded-lg cursor-pointer
                      ${option.id === shippingMethodId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      ${option.insufficient_inventory ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-start gap-x-3 flex-1">
                      <RadioGroupItem
                        value={option.id}
                        id={option.id}
                        disabled={option.insufficient_inventory}
                        className="border-gray-300 mt-0.5"
                      />
                      <Label
                        htmlFor={option.id}
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex items-start gap-x-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {option.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatAddress(
                                option.service_zone?.fulfillment_set?.location?.address
                              )}
                            </p>
                            {option.insufficient_inventory && (
                              <p className="text-xs text-red-600 mt-1">
                                Out of stock at this location
                              </p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {error && (
            <Alert variant="destructive" data-testid="delivery-option-error-message">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {onPrevious && (
              <Button
                type="button"
                onClick={onPrevious}
                variant="outline"
                className="flex-1 border-gray-200"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Address
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!isShippingComplete() || isLoading || !mapLocation}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="submit-delivery-option-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Payment
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      <Separator className="mt-6" />
    </Card>
  )
}

export default Shipping