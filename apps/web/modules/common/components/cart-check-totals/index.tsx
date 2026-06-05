"use client"

import { convertToLocale } from "@/lib/util/money"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartCheckTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div className="space-y-3">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium" data-testid="cart-subtotal">
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          {shipping_subtotal ? (
            <span className="font-medium" data-testid="cart-shipping">
              {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
            </span>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Calculated at checkout
            </Badge>
          )}
        </div>
        
        {(discount_subtotal > 0) && (
          <div className="flex justify-between text-green-600 dark:text-green-500">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Discount
            </span>
            <span className="font-medium" data-testid="cart-discount">
              -{convertToLocale({ amount: discount_subtotal ?? 0, currency_code })}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxes</span>
          <span className="font-medium" data-testid="cart-taxes">
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <span className="text-lg" data-testid="cart-total">
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
    </div>
  )
}

export default CartCheckTotals