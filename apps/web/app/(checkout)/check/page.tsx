// app/checkout/page.tsx
import { retrieveCart } from "@/lib/data/cart"
import { getCachedId, getCachedIdIfExists } from "@/lib/data/cookies"
import { retrieveCustomer } from "@/lib/data/customer"
import PaymentWrapper from "@/modules/checkout/components/payment-wrapper"
import CheckoutForm from "@/modules/checkout/template/checkout-form"
import CheckoutSummary from "@/modules/checkout/template/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cachedId = await getCachedIdIfExists(); 
  const customerData = await retrieveCustomer();

  const customer_id = String(cachedId).includes('cus') ? cachedId : customerData?.id;
  const customer = await retrieveCustomer(customer_id);
  const cart = await retrieveCart()
console.log(customerData, cachedId, 'customer customer')
  if (!cart) {
    return notFound()
  }



  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="flex flex-col lg:flex-row lg:gap-x-12">
          {/* Mobile Summary */}
          <div className="lg:hidden mb-8">
            <CheckoutSummary cart={cart} isSticky={false} />
          </div>

          {/* Checkout Form */}
          <div className="flex-1 lg:pr-4">
            <PaymentWrapper cart={cart}>
              <CheckoutForm 
                cart={cart} 
                customer={customer}
              />
            </PaymentWrapper>
          </div>

          {/* Desktop Summary */}
          <div className="hidden lg:block lg:w-[400px] xl:w-[480px]">
            <CheckoutSummary cart={cart} isSticky={true} />
          </div>
        </div>
      </div>
    </div>
  )
}