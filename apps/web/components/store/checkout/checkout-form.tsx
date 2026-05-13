"use client";

import { initiatePaymentSession, placeOrder } from "@/lib/actions";
import { useCart } from "@/lib/context/cart-context";
import { Badge, Button, Heading, Input, Label, Textarea } from "@medusajs/ui";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

function Submit() {
  const status = useFormStatus();

  return (
    <Button
      type="submit"
      size="large"
      className="self-end mt-6"
      isLoading={status.pending}
    >
      Place Order
    </Button>
  );
}

export default function CheckoutForm({company}: any) {
  // ✅ ALL hooks must be at the top level, before any conditional returns
  const [state, action] = useActionState(placeOrder, { message: "" });
  const { cart, toggleCart } = useCart();
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  // ✅ useEffect is also at the top level
  useEffect(() => {
    const initializePayment = async () => {
      if (!cart?.id) return;
      
      if (paymentInitialized) return;

      setIsInitializingPayment(true);
      
      try {
        const activeSession = cart.payment_collection?.payment_sessions?.find(
          (paymentSession: any) => 
            paymentSession.status === "pending" || paymentSession.status === "authorized"
        );
        
        if (!activeSession) {
          console.log("Initializing manual payment session...");
          const result = await initiatePaymentSession(cart, {
            provider_id: 'pp_system_default',
          });
          
          if (result) {
            setPaymentInitialized(true);
            console.log("Payment session initialized successfully:", result);
          }
        } else {
          setPaymentInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing payment:", error);
      } finally {
        setIsInitializingPayment(false);
      }
    };

    initializePayment();
  }, [cart, paymentInitialized]);

  // ✅ Now it's safe to have conditional returns
  if (!cart) return null;

  const cartId = cart.id;
  
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => 
      paymentSession.status === "pending" || paymentSession.status === "authorized"
  );

  return (
    <div className="flex flex-col w-full gap-3">
      <Heading>Checkout</Heading>
      
      {isInitializingPayment && (
        <Badge className="justify-center text-center" variant="info">
          Initializing payment...
        </Badge>
      )}
      
      {paymentInitialized && !isInitializingPayment && (
        <Badge className="justify-center text-center" variant="success">
          ✓ Payment ready
        </Badge>
      )}
      
      <form className="flex flex-col gap-2 w-full" action={action}>
        <section className="flex gap-2 w-full justify-between">
          <div className="w-1/2">
            <Label>First Name</Label>
            <Input placeholder="John" name="first-name" required />
          </div>
          <div className="w-1/2">
            <Label>Last Name</Label>
            <Input placeholder="Doe" name="last-name" required />
          </div>
        </section>
        
        <Label>Address</Label>
        <Input placeholder="1234 Main St" name="address" required />
        
        <Label>City</Label>
        <Input placeholder="San Francisco" name="city" required />
        
        <Label>Zip</Label>
        <Input placeholder="94105" name="zip" required />
        
        <Label>Phone</Label>
        <Input placeholder="555-555-5555" name="phone" required />
        
        <Label>Email</Label>
        <Input placeholder="john@doe.com" name="email" type="email" required />
        
        <Label>Notes</Label>
        <Textarea placeholder="Leave a note for the driver" name="notes" />
        
        <input type="hidden" name="cart-id" value={cartId} />
        <input type="hidden" name="has-payment-session" value={paymentInitialized ? "true" : "false"} />
        
        <Submit />
        
        {state.message && (
          <Badge className="justify-center text-center" variant={state.error ? "error" : "info"}>
            {state.message}
          </Badge>
        )}
      </form>
    </div>
  );
}