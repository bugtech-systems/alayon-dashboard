// modules/products/components/product-variants-table.tsx
import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes, StoreProduct, StoreProductVariant } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button as ShadcnButton } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type VariantLineItem = StoreProductVariant & {
  product: StoreProduct
  quantity: number
  company?: any
}

const ProductVariantsTable = ({
  product,
  region,
  company,
  selectedVariantId,
  quantity = 1
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  company?: any
  selectedVariantId?: string
  quantity?: number
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [lineItemsMap, setLineItemsMap] = useState<Map<string, VariantLineItem>>(new Map())

  // Initialize with selected variant if provided
  useEffect(() => {
    if (selectedVariantId && !lineItemsMap.has(selectedVariantId)) {
      const variant = product.variants?.find((v) => v.id === selectedVariantId)
      if (variant) {
        setLineItemsMap((prev) => {
          const newMap = new Map(prev)
          newMap.set(selectedVariantId, {
            ...variant,
            product,
            quantity: quantity || 1,
            company,
          })
          return newMap
        })
      }
    }
  }, [selectedVariantId, quantity, product, company, lineItemsMap])

  const totalQuantity = quantity



  const handleAddToCart = useCallback(async () => {
    if (totalQuantity === 0) {
      toast.error("Please select at least one item")
      return
    }

    setIsAdding(true)

    try {
      const lineItems = Array.from(lineItemsMap.entries()).map(
        ([variantId, {company, quantity, ...variant }]) => ({
          productVariant: {
            ...variant,
          },
          quantity,
        })
      )
      addToCartEventBus.emitCartAdd({
        companyId: company?.id,
        lineItems,
        regionId: region.id,
      })

      toast.success("Items added to cart successfully!")
      
      // Clear the selection after adding to cart
      setLineItemsMap(new Map())
    } catch (error) {
      toast.error("Failed to add items to cart")
      console.error("Add to cart error:", error)
    } finally {
      setIsAdding(false)
    }
  }, [totalQuantity, lineItemsMap, company, region.id])

  const isVariantSelected = useCallback((variantId: string) => {
    return lineItemsMap.has(variantId)
  }, [lineItemsMap])

  const getVariantQuantity = useCallback((variantId: string) => {
    return lineItemsMap.get(variantId)?.quantity || 0
  }, [lineItemsMap])

  // Check if product has variants
  if (!product.variants || product.variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No variants available
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">SKU</TableHead>
              {product.options?.map((option) => {
                if (option.title === "Default option") return null
                return (
                  <TableHead key={option.id} className="min-w-[120px]">
                    {option.title}
                  </TableHead>
                )
              })}
              <TableHead className="min-w-[100px]">Price</TableHead>
              <TableHead className="min-w-[120px]">Availability</TableHead>
              <TableHead className="min-w-[140px]">Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.variants.map((variant, index) => {
              const { variantPrice } = getProductPrice({
                product,
                variantId: variant.id,
              })
              
              const isSelected = isVariantSelected(variant.id)
              const quantity = getVariantQuantity(variant.id)
              const isInStock = variant.inventory_quantity > 0 || variant.allow_backorder
              const maxQuantity = variant.inventory_quantity || 99

              return (
                <TableRow 
                  key={variant.id}
                  className={cn(
                    "transition-colors",
                    isSelected && "bg-primary/5 hover:bg-primary/10",
                    !isInStock && "opacity-60"
                  )}
                >
                  <TableCell className="font-mono text-xs">
                    {variant.sku || "—"}
                  </TableCell>
                  
                  {variant.options?.map((option, index) => {
                    if (option.value === "Default option value") return null
                    return (
                      <TableCell key={option.id}>
                        {option.value}
                      </TableCell>
                    )
                  })}
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {variantPrice?.calculated_price}
                      </span>
                      {variantPrice?.original_amount && 
                       variantPrice.calculated_amount !== variantPrice.original_amount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {variantPrice.original_price}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={isInStock ? "default" : "destructive"}
                      className={cn(
                        "capitalize",
                        isInStock && "bg-emerald-500 hover:bg-emerald-600"
                      )}
                    >
                      {isInStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                    {isInStock && variant.inventory_quantity !== undefined && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({variant.inventory_quantity} available)
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {isInStock ? (
                      <div className="flex items-center gap-2">
                        <ShadcnButton
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDecrement(variant.id)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </ShadcnButton>
                        
                        <Input
                          type="number"
                          min="0"
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val) && val >= 0 && val <= maxQuantity) {
                              handleQuantityChange(variant.id, val)
                            }
                          }}
                          className={cn(
                            "w-14 text-center",
                            quantity > 0 && "border-primary"
                          )}
                        />
                        
                        <ShadcnButton
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleIncrement(variant.id)}
                          disabled={quantity >= maxQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </ShadcnButton>
                        
                        {quantity > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {quantity}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unavailable
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div> */}

      {/* Selected Items Summary */}
      {/* {totalQuantity > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">
              {totalQuantity} item{totalQuantity > 1 ? 's' : ''} selected
            </span>
            <Badge variant="outline" className="text-xs">
              {lineItemsMap.size} variant{lineItemsMap.size > 1 ? 's' : ''}
            </Badge>
          </div>
          <ShadcnButton
            variant="outline"
            size="sm"
            onClick={() => setLineItemsMap(new Map())}
            className="text-red-500 hover:text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </ShadcnButton>
        </div>
      )} */}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        variant="primary"
        className="w-full h-12 text-base font-medium"
        isLoading={isAdding}
        disabled={totalQuantity === 0}
        data-testid="add-product-button"
      >
        <ShoppingBag
          className="text-white"
          fill={totalQuantity === 0 ? "none" : "#fff"}
        />
        {totalQuantity === 0
          ? "Select items above"
          : `Add ${totalQuantity} item${totalQuantity > 1 ? 's' : ''} to cart`}
      </Button>
    </div>
  )
}

export default ProductVariantsTable