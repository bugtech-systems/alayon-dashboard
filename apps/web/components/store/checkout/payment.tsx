"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckout } from "./checkout-context";

const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: Banknote, description: "Pay when you receive your order", enabled: true },
  { id: "gcash", name: "GCash", icon: CreditCard, description: "Pay via GCash wallet", enabled: false, comingSoon: true },
  { id: "maya", name: "Maya", icon: Building2, description: "Pay via Maya wallet", enabled: false, comingSoon: true },
];

export default function Payment() {
  const { selectedPaymentMethod, setSelectedPaymentMethod, errors } = useCheckout();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Method
        </CardTitle>
        <p className="text-sm text-muted-foreground">Choose how you want to pay</p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-3">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isDisabled = !method.enabled;
            return (
              <div
                key={method.id}
                className={cn(
                  "relative rounded-lg border p-4 transition-all",
                  method.enabled
                    ? selectedPaymentMethod === method.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    : "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
                )}
                onClick={() => method.enabled && setSelectedPaymentMethod(method.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      method.enabled && selectedPaymentMethod === method.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500",
                      !method.enabled && "bg-gray-200 text-gray-400"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{method.name}</p>
                      {method.comingSoon && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Coming Soon</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  {method.enabled && (
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                        selectedPaymentMethod === method.id ? "border-primary bg-primary" : "border-gray-300"
                      )}
                    >
                      {selectedPaymentMethod === method.id && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <Banknote className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Pay in cash when your order arrives. Please prepare exact amount if possible for faster delivery.</span>
          </p>
        </div>

        {errors.payment && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">{errors.payment}</div>
        )}
      </CardContent>
    </Card>
  );
}