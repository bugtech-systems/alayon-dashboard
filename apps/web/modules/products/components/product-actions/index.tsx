// modules/products/components/product-actions.tsx
import { HttpTypes } from "@medusajs/types"
import ProductPrice from "../product-price"
import ProductVariantsTable from "../product-variants-table"
import { Separator } from "@/components/ui/separator"

type ProductActionsProps = {
  product: any
  region: HttpTypes.StoreRegion
  company?: any
  selectedVariantId?: string
  quantity?: number
}

export default function ProductActions({
  product,
  region,
  company,
  selectedVariantId,
  quantity = 1
}: ProductActionsProps) {
  return (
    <div className="flex flex-col gap-y-4 w-full">
      <ProductPrice product={product}/>
      <Separator />
      <ProductVariantsTable 
        product={product} 
        region={region} 
        company={company}
        selectedVariantId={selectedVariantId}
        quantity={quantity}
      />
    </div>
  )
}