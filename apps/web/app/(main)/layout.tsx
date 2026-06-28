import { retrieveCustomer } from "@/lib/actions"
import { LocationProvider } from "@/lib/context/LocationContext"
import { retrieveCart } from "@/lib/data/cart"
import { getCachedIdIfExists } from "@/lib/data/cookies"
import { getBaseURL } from "@/lib/util/env"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const cachedId = await getCachedIdIfExists();

  let freeShippingPrices: StoreFreeShippingPrice[] = []

  // if (cart) {
  //   freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  // }
  return (
    <>
    <LocationProvider isOpen={!cachedId}>

      {props.children}
      {/* <Footer /> */}
      {/* {cart && freeShippingPrices && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart as StoreCart}
          freeShippingPrices={freeShippingPrices}
        />
      )} */}
      </LocationProvider>
    </>
  )
}
