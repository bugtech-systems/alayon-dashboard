"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useCheckout } from "./checkout-context";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
        </>
      ) : (
        <>
          Place Order <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export default function Review() {
  const { formData, setFormField, handleSubmit, orderState, cart } = useCheckout();

  // This form is submitted via the main form action. We'll wrap the submit button
  // inside a <form> that uses the handleSubmit from context.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formDataObj = new FormData(event.currentTarget);
    await handleSubmit(formDataObj);
  };

  // Calculate cart totals (simplified – replace with actual totals)
  const subtotal = cart.items?.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0) || 0;
  const total = subtotal; // add shipping/taxes if any

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Order Summary & Notes
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6 space-y-6">
        {/* Order Items Preview */}
        <div>
          <h3 className="font-medium mb-2">Your Items</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity} × {item.product_title}
                </span>
                <span>₱{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Special Instructions */}
        <div>
          <h3 className="font-medium mb-2">Special Instructions</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormField("notes", e.target.value)}
            placeholder="Examples: Landmark near your location, gate color, preferred delivery time, etc."
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            This helps our rider locate you accurately
          </p>
        </div>

        <form onSubmit={onSubmit}>
          {/* Hidden fields needed for server action */}
          <input type="hidden" name="cart_id" value={cart.id} />
          <input type="hidden" name="city_name" value="" /> {/* you can compute these from context */}
          <input type="hidden" name="barangay_name" value="" />
          <input type="hidden" name="payment_provider_id" value="pp_system_default" />

          <SubmitButton />
        </form>

        {orderState?.error && (
          <div className="p-3 bg-red-50 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {orderState.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}