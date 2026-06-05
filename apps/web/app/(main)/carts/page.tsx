import { CartProvider } from "@/lib/context/cart-context"
import { retrieveCart, retrieveCompanyCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import CartTemplate from "@/modules/carts/templates"
import { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart({searchParams}: any) {
  const cookieSession = await cookies();
  const cartId = cookieSession.get("_medusa_cart_id")?.value;
  const customer = await retrieveCustomer();

  // Redirect to cart if no cartId is found
  if (!cartId) {
    notFound();
  }

  const cart = await retrieveCart(cartId);
  const company = cart?.company;
  return (
    <CartProvider cart={cart} company={company}>
      <CartTemplate customer={customer} />
    </CartProvider>
  )
}
