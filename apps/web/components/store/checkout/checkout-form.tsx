"use client";

import { placeOrder } from "@/lib/actions";
import { useCart } from "@/lib/context/cart-context";
import { Badge, Button, Heading, Input, Label, Textarea } from "@medusajs/ui";
import { useActionState } from "react";
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

export default function CheckoutForm() {
  const [state, action] = useActionState(placeOrder, { message: "" });
  const { cart, toggleCart } = useCart();

  if (!cart) return null;

  const restaurantId = cart.metadata?.restaurant_id as string;
  const cartId = cart.id; // Get cart ID from your cart context

  return (
    <div className="flex flex-col w-full gap-3">
      <Heading>Checkout</Heading>
      <form className="flex flex-col gap-2 w-full" action={action}>
        <section className="flex gap-2 w-full justify-between">
          <div className="w-1/2">
            <Label>First Name</Label>
            <Input placeholder="John" name="first-name" />
          </div>
          <div className="w-1/2">
            <Label>Last Name</Label>
            <Input placeholder="Doe" name="last-name" />
          </div>
        </section>
        <Label>Address</Label>
        <Input placeholder="1234 Main St" name="address" />
        <Label>City</Label>
        <Input placeholder="San Francisco" name="city" />
        <Label>Zip</Label>
        <Input placeholder="94105" name="zip" />
        <Label>Phone</Label>
        <Input placeholder="555-555-5555" name="phone" />
        <Label>Email</Label>
        <Input placeholder="john@doe.com" name="email" />
        <Label>Notes</Label>
        <Textarea placeholder="Leave a note for the driver" name="notes" />
        
        {/* Hidden inputs to pass data to server action */}
        {/* <input type="hidden" name="restaurant-id" value={restaurantId} /> */}
        <input type="hidden" name="cart-id" value={cartId} />
        
        <Submit />
        {state.message && (
          <Badge className="justify-center text-center">{state.message}</Badge>
        )}
      </form>
    </div>
  );
}