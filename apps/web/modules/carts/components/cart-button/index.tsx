import { CartProvider } from "@/lib/context/cart-context"
import { retrieveCompanyCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { getProductByHandle } from "@/lib/data/products"
import CartDrawer from "@/modules/carts/components/cart-drawer"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"

export default async function CartButton({ company }: any) {
  const cart = await retrieveCompanyCart(company?.id).catch(() => null)
  let freeShippingPrices: StoreFreeShippingPrice[] = []




  return (
    <CartProvider cart={cart} company={company}>
      <CartDrawer freeShippingPrices={freeShippingPrices}/>
    </CartProvider>
  )
}
