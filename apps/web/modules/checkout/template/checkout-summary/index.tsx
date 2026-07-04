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
import { ShoppingBag, ChevronUp, Store, Mail, Phone, MapPin, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"

import ItemsPreviewTemplate from "@/modules/cart/templates/preview"
import DiscountCode from "@/modules/checkout/components/discount-code"
import CartTotals from "@/modules/common/components/cart-check-totals"
import { currencySymbolMap } from "@/lib/constants"
import Image from "next/image"

interface CompanyDetails {
  id: string
  name: string
  handle?: string | null
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  logo_url?: string | null
  banner_url?: string | null
  is_open: boolean
  metadata?: any
}

interface CheckoutSummaryProps {
  cart: any
  company?: CompanyDetails | any
  isSticky?: boolean
}

const CheckoutSummary = ({ 
  cart, 
  company, 
  isSticky = true 
}: CheckoutSummaryProps) => {
  const [showMobileSummary, setShowMobileSummary] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const sheetContentRef = useRef<HTMLDivElement>(null)
  
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

  const CompanyInfo = ({ compact = false }: { compact?: boolean }) => {
    if (!company) return null

    return (
      <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex items-center gap-3">
          {company.logo_url && (
            <div className={`relative rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <Image
                src={company.logo_url}
                alt={company.name}
                fill
                className="object-cover"
                sizes={compact ? "40px" : "48px"}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'} truncate`}>
              {company.name}
            </h4>
            {!compact && (
              <Badge 
                variant={company.is_open ? "success" : "secondary"}
                className="mt-1 text-xs"
              >
                {company.is_open ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
        </div>

        {!compact && (
          <div className="space-y-1.5 text-sm text-gray-600">
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{company.phone}</span>
              </div>
            )}
            {(company.address || company.city || company.state) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {[company.address, company.city, company.state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const SectionHeader = ({ title, icon: Icon, badge }: { title: string; icon?: any; badge?: string }) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        {title}
      </h3>
      {badge && <span className="text-xs text-gray-400">{badge}</span>}
    </div>
  )

  const DesktopContent = () => (
    <div className="space-y-6">
      {/* Company Details */}
      {company && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100">
          <SectionHeader title="Store Information" icon={Store} />
          <CompanyInfo />
        </div>
      )}

      {/* Payment Details */}
      <div>
        <SectionHeader title="Payment Details" />
        <CartTotals totals={cart} />
      </div>

      {/* Promo Code */}
      <div>
        <SectionHeader title="Voucher / Promo Code" />
        <DiscountCode cart={cart} />
      </div>

      {/* Products */}
      <div>
        <SectionHeader 
          title="Items Ordered" 
          badge={`${itemCount} ${itemCount === 1 ? 'product' : 'products'}`} 
        />
        <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <ItemsPreviewTemplate cart={cart} />
        </div>
      </div>
    </div>
  )

  const MobileContent = () => (
    <div className="space-y-6 pb-4">
      {/* Company Details - Mobile */}
      {company && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-3">
            <Store className="w-4 h-4" />
            Store Information
          </div>
          <CompanyInfo compact />
        </div>
      )}

      {/* Products List */}
      <div>
        <SectionHeader 
          title="Items" 
          badge={`${itemCount} items`}
        />
        <div className="max-h-[200px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <ItemsPreviewTemplate cart={cart} />
        </div>
      </div>

      {/* Promo Code */}
      <div>
        <SectionHeader title="Voucher / Promo Code" />
        <DiscountCode cart={cart} />
      </div>

      {/* Payment Details */}
      <div>
        <SectionHeader title="Payment Details" />
        <CartTotals totals={cart} />
      </div>
    </div>
  )

  // Desktop version with sticky positioning
  if (isSticky) {
    return (
      <div className="sticky top-6">
        <Card className="border border-gray-200 shadow-sm bg-white h-full">
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

          <CardContent className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <DesktopContent />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mobile version with sheet drawer
  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg lg:hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {company?.logo_url && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <Image
                    src={company.logo_url}
                    alt={company.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
                </p>
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg shadow-blue-600/20"
              onClick={() => setShowMobileSummary(true)}
              size="lg"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Review Order
              <ChevronUp className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Summary Sheet */}
      <Sheet open={showMobileSummary} onOpenChange={setShowMobileSummary}>
        <SheetTrigger asChild>
          <div className="hidden" />
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl border-t-4 border-blue-500">
          {/* Sheet Header */}
          <SheetHeader className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  Order Summary
                </SheetTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSummary(false)}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>
          
          {/* Scrollable Content */}
          <div 
            ref={sheetContentRef}
            className="flex-1 overflow-y-auto p-4 pb-32 h-[calc(90vh-120px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            <MobileContent />
          </div>

          {/* Sticky Bottom Button */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {currencySymbolMap['php']}{cart?.total?.toFixed(2)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-gray-100">
                {itemCount} items
              </Badge>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 shadow-lg shadow-blue-600/20"
              onClick={() => {
                setShowMobileSummary(false)
                // Scroll to continue button or next step
                const continueButton = document.querySelector('[data-testid="submit-address-button"]')
                if (continueButton) {
                  continueButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
          <CardContent className="p-4 space-y-3">
            {company && (
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                {company.logo_url && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image
                      src={company.logo_url}
                      alt={company.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {company.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge 
                      variant={company.is_open ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {company.is_open ? "Open" : "Closed"}
                    </Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 truncate">
                      {company.city || company.address}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
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