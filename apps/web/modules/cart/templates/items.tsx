"use client"

import { HttpTypes } from "@medusajs/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Package, Truck, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import Item from "../components/item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const currencyCode = cart?.currency_code

  if (!items || items.length === 0) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-6 py-12">
        <div className="rounded-full bg-muted p-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="max-w-md space-y-3 text-center">
          <h3 className="text-xl font-semibold">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground">
            Looks like you haven't added any items to your cart yet.
            Start exploring our products to find something you'll love.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Sort items by created date (newest first)
  const sortedItems = [...items].sort((a, b) => {
    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  })



  return (
    <div className="space-y-6 p-3">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Shopping Cart
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
      </div>


      {/* Desktop View - No Border Table */}
      <div className="hidden md:block">
        <ScrollArea className="max-h-[700px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[100px]">Product</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[140px] text-center">Quantity</TableHead>
                <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                <TableHead className="w-[120px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map((item, index) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={currencyCode!}
                  isLast={index === sortedItems.length - 1}
                />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Mobile View - No Border Cards */}
      <div className="space-y-4 md:hidden">
        {sortedItems.map((item) => (
          <Item
            key={item.id}
            item={item}
            currencyCode={currencyCode!}
            isMobile={true}
          />
        ))}
      </div>
    </div>
  )
}

export default ItemsTemplate