// modules/products/components/related-products.tsx
import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { ProductCard } from "@/components/product-card"
import { ChevronRight } from "lucide-react"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { cache } from "react"

// Cache the related products fetch to prevent infinite loops
const getCachedRelatedProducts = cache(async (
  productId: string,
  collectionId: string | null,
  tagIds: string[],
  regionId: string,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> => {
  try {
    const usedIds = new Set<string>([productId])
    let allProducts: HttpTypes.StoreProduct[] = []
    
    // Strategy 1: Get products from same collection (highest relevance)
    if (collectionId) {
      const { response } = await listProducts({
        queryParams: {
          region_id: regionId,
          fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.allow_backorder,+variants.manage_inventory,+tags,+options,+images",
        },
        countryCode,
      })
      
      const filtered = response.products.filter(p => !usedIds.has(p.id))
      allProducts = [...filtered]
      filtered.forEach(p => usedIds.add(p.id))
    }

    // Strategy 2: Get products with same tags (moderate relevance)
    if (allProducts.length < 8 && tagIds.length > 0) {
      const { response } = await listProducts({
        queryParams: {
          region_id: regionId,
          fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.allow_backorder,+variants.manage_inventory,+tags,+options,+images",
        },
        countryCode,
      })
      
      const filtered = response.products.filter(p => !usedIds.has(p.id))
      allProducts = [...allProducts, ...filtered]
      filtered.forEach(p => usedIds.add(p.id))
    }

    // Strategy 3: Get recent products as fallback (lowest relevance)
    if (allProducts.length < 8) {
      const { response } = await listProducts({
        queryParams: {
          region_id: regionId,
          limit: 12 - allProducts.length,
          fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.allow_backorder,+variants.manage_inventory,+tags,+options,+images",
        },
        countryCode,
      })
      
      const filtered = response.products.filter(p => !usedIds.has(p.id))
      allProducts = [...allProducts, ...filtered]
    }

    // Remove duplicates and limit to 8
    const uniqueProducts = allProducts.filter(
      (p, index, self) => index === self.findIndex((t) => t.id === p.id)
    ).slice(0, 8)

    return uniqueProducts
  } catch (error) {
    console.error("Error fetching related products:", error)
    return []
  }
})

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  // Validate product
  if (!product || !product.id) {
    return null
  }

  // Get region with caching
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Get related products with caching - prevents infinite loop
  const displayProducts = await getCachedRelatedProducts(
    product.id,
    product.collection_id || null,
    product.tags?.map((t) => t.id).filter(Boolean) || [],
    // region.id,
    countryCode
  )

  // If no related products found, return null
  if (!displayProducts || displayProducts.length === 0) {
    return null
  }

  return (
    <div className="w-full py-8 md:py-12">
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                You May Also Like
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Complete Your Look
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Customers who bought this also enjoyed these items
            </p>
          </div>
          
          <LocalizedClientLink 
            href="/catalog" 
            className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All Products
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </LocalizedClientLink>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.slice(0, 8).map((relatedProduct, index) => (
            <div key={relatedProduct.id} className="group">
              <ProductCard 
                regionId={region?.id} 
                product={relatedProduct} 
                index={index}
              />
            </div>
          ))}
        </div>

        {/* View All Button - Mobile */}
        <div className="sm:hidden flex justify-center pt-4">
          <LocalizedClientLink href="/catalog">
            <button className="w-full max-w-xs px-6 py-3 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
              Browse All Products
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}