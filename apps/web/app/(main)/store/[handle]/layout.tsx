import { retrieveCompanyCart } from "@/lib/data/cart"
import { getCachedId, getCachedIdIfExists } from "@/lib/data/cookies"
import { retrieveCustomer } from "@/lib/data/customer"
import { getProductByHandle } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
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
  const cacheId = await getCachedIdIfExists();
    const customerData = await retrieveCustomer().catch(() => null)

    const customer_id = String(cacheId).includes('cus') ? cacheId : customerData?.id;

  const customer = await retrieveCustomer(customer_id).catch(() => null)
  let freeShippingPrices: StoreFreeShippingPrice[] = []
  const params = await props.params
  const region = await getRegion('ph')
  
  const product = await getProductByHandle(params?.handle, region?.id) as any;
  const company = product?.companies?.filter((a: any) => { return a?.id})[0];

  const cart = await retrieveCompanyCart(company?.id);
  console.log(customer, params, product, 'paaagrra', company, cart)




  return (
    <>
    <StoreNavigationHeader company={company}/>
          {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}
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
