"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { updateCartItem } from "@/lib/data/cart"

interface QuantitySelectProps {
  item: any
}

const QuantitySelect = ({ item }: QuantitySelectProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [quantity, setQuantity] = useState(item.quantity)

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity === quantity) return
    
    setIsUpdating(true)
    try {
      await updateCartItem({
        cartId: item.cart_id,
        itemId: item.id,
        quantity: newQuantity,
      })
      setQuantity(newQuantity)
    } catch (error) {
      console.error("Failed to update quantity", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => updateQuantity(quantity - 1)}
        disabled={isUpdating || quantity <= 1}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={isUpdating}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default QuantitySelect