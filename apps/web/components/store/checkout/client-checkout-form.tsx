"use client";

import Addresses from "./addresses";
import Shipping from "./shipping";
import Payment from "./payment";
import Review from "./review";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useCheckout, CheckoutProvider } from "./checkout-context";

export default function ClientCheckoutForm({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
}: {
  cart: any
  customer: any
  shippingMethods: any[]
  paymentMethods: any[]
}) {
  return (
    <CheckoutProvider
      cart={cart}
      customer={customer}
      shippingMethods={shippingMethods}
      paymentMethods={paymentMethods}
    >
      <CheckoutContent />
    </CheckoutProvider>
  );
}

function CheckoutContent() {
  // Use the context to get status flags
  const {
    isUpdatingCart,
    updateSuccess,
    isCreatingCustomer,
    customerId,
    customerError,
    errors,
  } = useCheckout();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your order information</p>
      </div>

      {/* Status indicators (same as before) */}
      {isUpdatingCart && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-700">
            Saving your shipping information...
          </AlertDescription>
        </Alert>
      )}

      {updateSuccess && !isUpdatingCart && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Shipping address saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {isCreatingCustomer && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-700">
            Setting up your account...
          </AlertDescription>
        </Alert>
      )}

      {customerId && !isCreatingCustomer && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Account ready! You can now place your order.
          </AlertDescription>
        </Alert>
      )}

      {customerError && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {customerError}
          </AlertDescription>
        </Alert>
      )}

      {errors.form && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.form}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Addresses />
          <Shipping />
        </div>
        <div className="space-y-6">
          {/* <Payment /> */}
          <Review />
        </div>
      </div>
    </div>
  );
}