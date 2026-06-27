import { retrieveCustomer } from "@/lib/actions"
import { LocationProvider } from "@/lib/context/LocationContext"
import { retrieveCart } from "@/lib/data/cart"
import { getCachedIdIfExists } from "@/lib/data/cookies"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getBaseURL } from "@/lib/util/env"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { StoreCart } from "@medusajs/types"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const cart = await retrieveCart();
  const cachedId = await getCachedIdIfExists();
  const customer = await retrieveCustomer();

  let freeShippingPrices: StoreFreeShippingPrice[] = []

  if (cart) {
    freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  }
console.log(!cachedId, 'cahcehd', !!cachedId, cachedId, customer)
  return (
    <>
    <LocationProvider isOpen={!cachedId && !customer}>

      {props.children}
      {/* <Footer /> */}
      {cart && freeShippingPrices && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart as StoreCart}
          freeShippingPrices={freeShippingPrices}
        />
      )}
      </LocationProvider>
    </>
  )
}
