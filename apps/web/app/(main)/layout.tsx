import { LocationProvider } from "@/lib/context/LocationContext"
import { getCachedIdIfExists } from "@/lib/data/cookies"
import { getBaseURL } from "@/lib/util/env"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const cachedId = await getCachedIdIfExists();


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
