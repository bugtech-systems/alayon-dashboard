// app/checkout/page.tsx
import { CheckoutNav } from "@/components/layout/checkout-nav";
import  CheckoutForm  from "@/components/store/checkout/client-checkout-form";
import { OrderSummary } from "@/components/store/checkout/order-summary";
import { retrieveCart, listShippingMethods, getPaymentProviders, retrieveCustomer } from "@/lib/actions";
import { HttpTypes } from "@medusajs/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CheckoutPageProps {
  searchParams: Promise<{
    cart_id?: string;
    step?: string;
  }>;
}

async function CheckoutContent({ cartId }: { cartId: string }) {
  const cart = await retrieveCart(cartId);
  
  if (!cart) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cart Not Found</AlertTitle>
          <AlertDescription>
            The cart you're trying to checkout could not be found. Please add items to your cart and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Link href="/cart">
            <Button variant="outline">Return to Cart</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert>
          <ShoppingCart className="h-4 w-4" />
          <AlertTitle>Your cart is empty</AlertTitle>
          <AlertDescription>
            Please add some items to your cart before proceeding to checkout.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Link href="/catalog">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cart.completed_at) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Order Already Completed</AlertTitle>
          <AlertDescription>
            This cart has already been completed. Please start a new order.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Link href="/catalog">
            <Button>Start New Order</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch available shipping methods and payment providers for Medusa checkout flow
  const customer = await retrieveCustomer()


  return (
    <>
      {/* Mobile View (uses grid order) */}
      <div className="grid grid-cols-1 gap-8 lg:hidden">
        {/* Order Summary - Will appear first due to order-1 */}
        <div className="order-1">
          <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-2">
            <OrderSummary 
              cart={cart} 
              className="max-h-[50vh] overflow-y-auto shadow-md"
            />
          </div>
        </div>
        
        {/* Checkout Form - Will appear second */}
        <div className="order-2">
          <CheckoutForm 
            cart={cart} 
            customer={customer}
          />
        </div>
      </div>

      {/* Desktop View (uses grid-cols) */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-12">
        {/* Checkout Form - Left Column */}
        <div className="lg:col-span-2">
          <CheckoutForm 
            cart={cart} 
            customer={customer}
          />
        </div>
        
        {/* Order Summary - Right Column (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <OrderSummary 
              cart={cart} 
              showDetailedBreakdown={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="block lg:hidden mb-6">
        <Skeleton className="h-96 w-full" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </>
  );
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const cookieSession = await cookies();
  const params = await searchParams;
  const cartId = params.cart_id || cookieSession.get("_medusa_cart_id")?.value;
  
  console.log(cartId, 'Checkout Cart ID', params.cart_id);
  
  if (!cartId) {
    redirect("/cart");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutNav />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutContent cartId={cartId} />
        </Suspense>
      </div>
    </div>
  );
}