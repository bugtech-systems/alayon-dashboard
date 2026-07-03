// modules/products/templates/product-template.tsx
"use client";

import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import React, { Suspense, useState, useMemo, useCallback, useEffect } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductFacts from "../components/product-facts"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Home,
  Package,
  Shield,
  Truck,
  RotateCcw,
  Building2,
  MapPin,
  Clock,
  Star,
  Award,
  Mail,
  ExternalLink,
  ExternalLinkIcon,
  CheckCircle,
  Sparkles,
  Users,
  Heart,
  Share2,
  ChevronUp,
  Minus,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct | any
  region: HttpTypes.StoreRegion
  countryCode: string
}

// Variant Selector Component
const VariantSelector = ({
  variants,
  selectedVariant,
  onVariantChange,
}: {
  variants: any[]
  selectedVariant: any
  onVariantChange: (variant: any) => void
}) => {
  // Group variants by option values
  const variantOptions = useMemo(() => {
    if (!variants || variants.length === 0) return {}

    const options: { [key: string]: { optionId: string; values: any[] } } = {}

    variants.forEach((variant) => {
      if (variant.options) {
        variant.options.forEach((option: any) => {
          const optionId = option.option_id
          if (!options[optionId]) {
            options[optionId] = {
              optionId,
              values: [],
            }
          }
          if (!options[optionId].values.find((o: any) => o.value === option.value)) {
            // Check if this combination is available
            const isAvailable = variants.some((v: any) =>
              v.options?.some((opt: any) => opt.value === option.value) &&
              (v.inventory_quantity > 0 || v.allow_backorder)
            )
            options[optionId].values.push({
              value: option.value,
              variant_id: variant.id,
              isAvailable,
            })
          }
        })
      }
    })

    return options
  }, [variants])

  // Get option names from product
  const optionNames = useMemo(() => {
    if (!variants || variants.length === 0 || !variants[0].options) return []
    return variants[0].options.map((opt: any) => ({
      id: opt.option_id,
      title: opt.option?.title || "Option",
    }))
  }, [variants])

  if (!variants || variants.length <= 1) {
    return null
  }

  return (
    <div className="space-y-4">
      {optionNames.map((option) => {
        const optionData = variantOptions[option.id]
        if (!optionData) return null

        return (
          <div key={option.id} className="space-y-2">
            <Label className="text-sm font-medium">{option.title}</Label>
            {optionData.values.length <= 4 ? (
              // Use Radio Group for fewer options
              <RadioGroup
                value={selectedVariant?.options?.find((o: any) => o.option_id === option.id)?.value}
                onValueChange={(value) => {
                  const variant = variants.find((v: any) =>
                    v.options?.some((opt: any) => opt.value === value)
                  )
                  if (variant) onVariantChange(variant)
                }}
                className="flex flex-wrap gap-2"
              >
                {optionData.values.map((opt: any) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`${option.id}-${opt.value}`}
                      disabled={!opt.isAvailable}
                    />
                    <Label
                      htmlFor={`${option.id}-${opt.value}`}
                      className={cn(
                        "text-sm cursor-pointer",
                        !opt.isAvailable && "text-muted-foreground line-through"
                      )}
                    >
                      {opt.value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              // Use Select for many options
              <Select
                value={selectedVariant?.options?.find((o: any) => o.option_id === option.id)?.value}
                onValueChange={(value) => {
                  const variant = variants.find((v: any) =>
                    v.options?.some((opt: any) => opt.value === value)
                  )
                  if (variant) onVariantChange(variant)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${option.title}`} />
                </SelectTrigger>
                <SelectContent>
                  {optionData.values.map((opt: any) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={!opt.isAvailable}
                    >
                      {opt.value}
                      {!opt.isAvailable && " (Out of Stock)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Quantity Selector Component
const QuantitySelector = ({
  quantity,
  onQuantityChange,
  maxQuantity = 99,
}: {
  quantity: number
  onQuantityChange: (value: number) => void
  maxQuantity?: number
}) => {
  const handleDecrease = useCallback(() => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }, [quantity, onQuantityChange])

  const handleIncrease = useCallback(() => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1)
    }
  }, [quantity, maxQuantity, onQuantityChange])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value)
      if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
        onQuantityChange(value)
      }
    },
    [maxQuantity, onQuantityChange]
  )

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrease}
        disabled={quantity <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <input
        type="number"
        min="1"
        max={maxQuantity}
        value={quantity}
        onChange={handleInputChange}
        className="w-14 text-center border rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrease}
        disabled={quantity >= maxQuantity}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Back to Top Button
const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (!isVisible) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover:bg-primary hover:text-white border-gray-200 hover:border-primary"
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}

// Share Button
const ShareButton = ({ productTitle }: { productTitle: string }) => {
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productTitle,
          text: `Check out ${productTitle}`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard!")
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Failed to share")
      }
    }
  }, [productTitle])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share this product</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Wishlist Button
const WishlistButton = ({ productId }: { productId: string }) => {
  const [isWishlisted, setIsWishlisted] = useState(false)

  const handleWishlist = useCallback(() => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist")
  }, [isWishlisted])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={handleWishlist}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isWishlisted && "fill-red-500 text-red-500"
              )}
            />
            <span className="text-sm">Wishlist</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isWishlisted ? "Remove from" : "Add to"} wishlist</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Trust Badges
const TrustBadges = () => {
  const badges = [
    { icon: Truck, label: "Free Shipping ₱1,000+" },
    { icon: Shield, label: "Secure Payment" },
    { icon: RotateCcw, label: "30-Day Returns" },
    { icon: Package, label: "Bulk Orders" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <badge.icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-gray-700">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}

// Product Badges
const ProductBadges = ({
  isNew,
  isOnSale,
  tags,
}: {
  isNew: boolean
  isOnSale: boolean
  tags?: any[]
}) => {
  const badges = [
    {
      show: isNew,
      label: "New Arrival",
      variant: "default" as const,
      className: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      show: isOnSale,
      label: "On Sale",
      variant: "default" as const,
      className: "bg-red-500 hover:bg-red-600",
    },
    ...(tags?.map((tag) => ({
      show: true,
      label: tag.value,
      variant: "secondary" as const,
      className: "bg-primary/10 text-primary hover:bg-primary/20",
    })) || []),
  ]

  if (!badges.some((b) => b.show)) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {badges.map(
        (badge, index) =>
          badge.show && (
            <Badge key={index} variant={badge.variant} className={badge.className}>
              {badge.label}
            </Badge>
          )
      )}
    </div>
  )
}

// Main Component
const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product: initialProduct,
  region,
  countryCode,
}) => {
  // Memoize product to prevent unnecessary re-renders
  const product = useMemo(() => initialProduct, [initialProduct])

  if (!product || !product.id) {
    notFound()
  }

  let company = product?.companies?.filter((a: any) => a?.id)[0];

  console.log(product, 'prodducts')
  // Variant selection state
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  // Set initial variant
  useEffect(() => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      // Find first available variant
      const availableVariant = product.variants.find(
        (v: any) => v.inventory_quantity > 0 || v.allow_backorder || !v.manage_inventory
      ) || product.variants[0]
      setSelectedVariant(availableVariant)
    }
  }, [product.variants, selectedVariant])

  // Memoize computed values
  const isOnSale = useMemo(() => {
    return product.variants?.some(
      (variant: any) =>
        variant.calculated_price?.calculated_amount <
        variant.calculated_price?.original_amount
    )
  }, [product.variants])

  const isNew = useMemo(() => {
    return product.created_at
      ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : false
  }, [product.created_at])

  // Check if selected variant is in stock
  const isInStock = useMemo(() => {
    if (!selectedVariant) return false
    return (
      selectedVariant.inventory_quantity > 0 ||
      selectedVariant.allow_backorder ||
      !selectedVariant.manage_inventory
    )
  }, [selectedVariant])

  // Get max quantity based on inventory
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 99
    if (selectedVariant.allow_backorder || !selectedVariant.manage_inventory)
      return 99
    return Math.min(selectedVariant.inventory_quantity || 99, 99)
  }, [selectedVariant])

  // Handle variant change
  const handleVariantChange = useCallback((variant: any) => {
    setSelectedVariant(variant)
    setQuantity(1) // Reset quantity when variant changes
  }, [])

  // Handle quantity change
  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(value)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-3 w-3" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/catalog">Catalog</BreadcrumbLink>
            </BreadcrumbItem>
            {company && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/catalog?company=${company.handle}`}>
                    {company.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
                {product.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Badges */}
        <ProductBadges isNew={isNew} isOnSale={isOnSale} tags={product.tags} />

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-10">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery product={product} />
          </div>

          {/* Product Info Card */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 md:p-8">
                {/* Product Info */}
                <ProductInfo product={product} />

                <Separator className="my-6" />

                {/* Variant Selector */}
                {product.variants && product.variants.length > 1 && (
                  <>
                    <VariantSelector
                      variants={product.variants}
                      selectedVariant={selectedVariant}
                      onVariantChange={handleVariantChange}
                    />
                    <Separator className="my-6" />
                  </>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium">Quantity:</span>
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={handleQuantityChange}
                    maxQuantity={maxQuantity}
                  />
                  {selectedVariant && (
                    <span className="text-xs text-muted-foreground">
                      {selectedVariant.allow_backorder || !selectedVariant.manage_inventory
                        ? "In Stock"
                        : `${selectedVariant.inventory_quantity || 0} available`}
                    </span>
                  )}
                </div>

                {/* Product Actions */}
                <div className="space-y-6">
                  <Suspense
                    fallback={<ProductActions product={product} region={region} />}
                  >
                    <ProductActionsWrapper
                      product={product}
                      region={region}
                      company={company}
                      variantId={selectedVariant?.id}
                      quantity={quantity}
                    />
                  </Suspense>

                  {/* Product Facts */}
                  <ProductFacts product={product} />
                </div>

                {/* Social Share & Wishlist */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <WishlistButton productId={product.id} />
                    <ShareButton productTitle={product.title} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle
                      className={cn(
                        "h-3 w-3",
                        isInStock ? "text-emerald-500" : "text-red-500"
                      )}
                    />
                    <span>{isInStock ? "In Stock" : "Out of Stock"}</span>
                    <span className="w-px h-3 bg-gray-300 mx-2" />
                    <span>{product.variants?.length || 0} variants</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <TrustBadges />
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mb-10">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-4 mb-6">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                </TabsList>
                <TabsContent value="description">
                  <ProductTabs product={product} />
                </TabsContent>
                <TabsContent value="specifications">
                  <div className="py-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Product Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.metadata?.specifications &&
                        Object.entries(product.metadata.specifications).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            >
                              <span className="text-sm font-medium text-muted-foreground capitalize">
                                {String(key).replace(/_/g, " ")}
                              </span>
                              <span className="text-sm">{String(value)}</span>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews">
                  <div className="py-4 text-center text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">
                      Customer Reviews
                    </h3>
                    <p>Be the first to review this product</p>
                    <Button variant="outline" className="mt-4">
                      Write a Review
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="shipping">
                  <div className="py-4 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <Truck className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Shipping Information</h4>
                        <p className="text-sm text-muted-foreground">
                          Free shipping on orders over ₱1,000. Estimated
                          delivery: 3-5 business days.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <RotateCcw className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Return Policy</h4>
                        <p className="text-sm text-muted-foreground">
                          30-day return policy. Items must be in original
                          condition with tags attached.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Company Info Section */}
        {company && (
          <div className="mb-10">
            <Link href={`/${company.handle}`}>
              <Card className="border-2 border-primary/20 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {company.coverImage && (
                  <div className="relative h-40 md:h-48 bg-gradient-to-r from-primary/20 to-purple-500/20">
                    <Image
                      src={company.coverImage}
                      alt={`${company.name} cover`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className="relative -mt-12 shrink-0">
                      <div className="h-20 w-20 rounded-xl bg-white shadow-lg border-2 border-white overflow-hidden">
                        {company.logo ? (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 pt-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                          {company.name}
                        </h3>
                        {company.isVerified && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700"
                          >
                            <Award className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3.5 w-3.5",
                                i < Math.floor(company.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : i < (company.rating || 0)
                                  ? "fill-yellow-400 text-yellow-400 opacity-50"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {company.rating || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({company.totalReviews?.toLocaleString() || 0} reviews)
                        </span>
                      </div>

                      {company.badges && company.badges.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {company.badges.map((badge: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {company.location || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Since {company.foundedYear || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {company.productsCount || 0} Products
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {company.email || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary group-hover:bg-primary/10"
                      asChild
                    >
                      <Link href={`/${company.handle}`}>
                        View Company Profile
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Related Products Section */}


        {/* Wholesale Banner */}
       {!product.metadata?.wholesale_only && company && (
          <div className="mt-10 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Interested in bulk orders?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contact {company.name} directly for wholesale pricing and bulk
                    discounts
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${company.handle}#contact`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Merchant
                  </Link>
                </Button>
                <Button size="sm" variant="default" asChild>
                  <Link href={`/${company.handle}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View Store
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Product Tags Section */}
      {product.tags && product.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Related Tags:
            </span>
            {product.tags.map((tag: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Link href={`/catalog?tag=${tag.value}`} className="hover:text-primary">
                  #{tag.value}
                </Link>
              </Badge>
            ))}
          </div>
        )} 

        {/* Back to Top Button */}
        <BackToTopButton />
      </div>
    </div>
  )
}

export default ProductTemplate