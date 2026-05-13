import CheckoutForm from "@/components/store/checkout/checkout-form";
import { OrderSummary } from "@/components/store/checkout/order-summary";


export default async function CheckoutPage() {
 

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 mx-auto gap-4 md:gap-12 justify-center w-full">
      <div className="md:col-span-3">
        <CheckoutForm  />
      </div>
      <div className="md:col-span-2 order-first md:order-last">
        <OrderSummary  />
      </div>
    </div>
  );
}