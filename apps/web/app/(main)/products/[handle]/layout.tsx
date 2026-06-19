import { retrieveCart, retrieveCompanyCart } from "@/lib/data/cart"
import { getCachedId } from "@/lib/data/cookies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getProductByHandle } from "@/lib/data/products"
import { getBaseURL } from "@/lib/util/env"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import { StoreNavigationHeader } from "@/modules/layout/templates/store-nav"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { StoreCart } from "@medusajs/types"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode, params: any }) {
  const cacheId = await getCachedId();
  console.log(cacheId, 'CACHEE')
  const customer = await retrieveCustomer(cacheId).catch(() => null)
  let freeShippingPrices: StoreFreeShippingPrice[] = []
  const params = await props.params
  console.log(customer, 'CUSTTOM')
  const product = await getProductByHandle(params?.handle) as any;
  const company = product?.company;
  console.log(customer, params, product, 'paaagrra',company)

  const cart = await retrieveCompanyCart(company?.id);


  if (cart) {
    freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  }


  return (
    <>
    <StoreNavigationHeader company={company}/>
          {/* {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )} */}
      {props.children}
      {/* <Footer /> */}
      {cart && freeShippingPrices && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart as StoreCart}
          freeShippingPrices={freeShippingPrices}
        />
      )}
    </>
  )
}
