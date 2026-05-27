"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck } from "lucide-react";

export default function Shipping() {
  // In a real implementation, you would fetch available shipping methods
  // and let the user choose. For now, just show a static message.
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Truck className="h-5 w-5 text-primary" />
          Shipping Method
        </CardTitle>
        <p className="text-sm text-muted-foreground">How your order will be delivered</p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="rounded-lg border p-4 bg-gray-50">
          <p className="font-medium">Standard Delivery</p>
          <p className="text-sm text-muted-foreground mt-1">
            Estimated delivery: 1-2 business days
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your exact location will be used by our rider to find you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}