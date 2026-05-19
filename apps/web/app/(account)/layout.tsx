import { CheckoutNav } from "@/components/layout/checkout-nav"
import { getBaseURL } from "@/lib/util/env"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {

  return (
    <>
      {props.children}
      {/* <Footer /> */}
    
    </>
  )
}
