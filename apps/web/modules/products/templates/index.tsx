// modules/products/templates/product-template.tsx
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductFacts from "../components/product-facts"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Home, Package, Tag, Shield, Truck, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // Check if product is on sale
  const isOnSale = product.variants?.some(variant => 
    variant.calculated_price?.calculated_amount < variant.calculated_price?.original_amount
  )

  // Check if product is new (e.g., within last 30 days)
  const isNew = product.created_at 
    ? new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : false

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="d-flex w-full">
                <Home className="h-3 w-3 mr-1" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/catalog">Catalog</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
                {product.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {isNew && (
              <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                New Arrival
              </span>
            )}
            {isOnSale && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                On Sale
              </span>
            )}
            {product.tags?.map((tag, index) => (
              <span key={index} className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                {tag.value}
              </span>
            ))}
          </div>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-10">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery product={product} />
          </div>

          {/* Product Info Card */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-6 md:p-8">
                {/* Product Info */}
                <ProductInfo product={product} />
                
                <Separator className="my-6" />
                
                {/* Product Actions */}
                <div className="space-y-6">
                  <Suspense
                    fallback={<ProductActions product={product} region={region} />}
                  >
                    <ProductActionsWrapper id={product.id} region={region} />
                  </Suspense>
                  
                  {/* Product Facts */}
                  <ProductFacts product={product} />
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">Free Shipping ₱1,000+</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">30-Day Returns</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium">Bulk Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mb-10">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <ProductTabs product={product} />
            </CardContent>
          </Card>
        </div>

        {/* Related Products Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">You May Also Like</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customers who bought this also enjoyed these items
              </p>
            </div>
            <div className="h-px flex-1 bg-gray-200 ml-4 hidden md:block" />
          </div>
          
          <div data-testid="related-products-container">
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </div>

        {/* Wholesale Banner for Retail Customers */}
        {!product.metadata?.wholesale_only && (
          <div className="mt-10 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Interested in bulk orders?</p>
                  <p className="text-xs text-muted-foreground">Get wholesale pricing for large quantities</p>
                </div>
              </div>
              <button className="text-sm text-primary font-medium hover:underline whitespace-nowrap">
                Contact Sales →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductTemplate