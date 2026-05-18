// app/checkout/page.tsx
import {CheckoutForm} from "@/components/store/checkout/checkout-form";
import { OrderSummary } from "@/components/store/checkout/order-summary";
import { retrieveCart } from "@/lib/actions";
import { HttpTypes } from "@medusajs/types";
import { cookies } from "next/headers";

export default async function CheckoutPage() {
  const coockie = await cookies();
  const cartId = coockie.get("_medusa_cart_id")?.value;

 const cart = await retrieveCart(cartId)
  

console.log(cart, 'ccurrt')


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
              <CheckoutForm  cart={cart}/>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary cart={cart}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 