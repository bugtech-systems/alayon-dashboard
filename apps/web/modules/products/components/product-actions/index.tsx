"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPrice from "../product-price/index.jsx"
import ProductVariantsTable from "../product-variants-table/index.jsx"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ProductActions({
  product,
  region,
}: ProductActionsProps) {
  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductPrice product={product} />
        <ProductVariantsTable product={product} region={region} />
      </div>
    </>
  )
}
