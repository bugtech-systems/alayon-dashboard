// modules/products/templates/product-actions-wrapper.tsx
import ProductActions from "@/modules/products/components/product-actions"
import { HttpTypes } from "@medusajs/types"

type ProductActionsWrapperProps = {
  product: string
  region: HttpTypes.StoreRegion
  company?: any
  variantId?: string
  quantity?: number
}

const ProductActionsWrapper = async ({
  product,
  region,
  company,
  variantId,
  quantity = 1,
}: ProductActionsWrapperProps) => {
  // Fetch product with specific variant if needed
  // This is where you'd fetch the product with the selected variant
  console.log(company, "PRODUCT COMPANY")
  return (
    <ProductActions 
      product={product} 
      region={region} 
      company={company}
      selectedVariantId={variantId}
      quantity={quantity}
    />
  )
}

export default ProductActionsWrapper