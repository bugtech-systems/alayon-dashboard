// components/store/checkout/order-summary.tsx
"use client";

import { useEffect, useState } from "react";
import { retrieveCompany } from "@/lib/medusa/data/companies";
import Image from "next/image";
import { useCart } from "@/lib/context/cart-context";
import { convertToLocale } from "@/lib/medusa/util/money";
import { ShoppingBag, Store, Truck, Clock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrderSummary() {
  const { cart } = useCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (cart?.metadata?.restaurant_id) {
        try {
          const restaurantData = await retrieveCompany(
            cart.metadata.restaurant_id as string
          );
          setRestaurant(restaurantData);
        } catch (error) {
          console.error("Error fetching restaurant:", error);
        }
      }
      setLoading(false);
    };

    fetchRestaurant();
  }, [cart?.metadata?.restaurant_id]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm mt-4">Loading order summary...</p>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Cart not found</h3>
          <p className="text-muted-foreground text-sm">Please add items to your cart</p>
        </div>
      </div>
    );
  }

  const subtotal = cart?.items?.reduce(
    (sum: number, item: any) => sum + (item.unit_price ?? 0) * item.quantity,
    0
  ) || 0;

  const shippingCost = 0; // Calculate based on your logic
  const tax = (subtotal * 0.1) || 0; // Example 10% tax
  const total = subtotal + shippingCost + tax;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
          <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
            {cart?.items?.length || 0} {cart?.items?.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      {restaurant && (
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <Store className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm">Sold by</h3>
              <p className="text-foreground font-medium mt-0.5">{restaurant.name}</p>
              {restaurant.address && (
                <p className="text-muted-foreground text-xs mt-1">{restaurant.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="p-6 border-b border-gray-100">
        <div className="space-y-4">
          {cart?.items?.map((item: any) => {
            const image = item.thumbnail;
            const itemTotal = (item.unit_price ?? 0) * item.quantity;
            
            return (
              <div key={item.id} className="flex gap-4">
                {/* Product Image */}
                <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  {item.variant_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.variant_title}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {convertToLocale({ 
                        amount: itemTotal, 
                        currency_code: cart.currency_code 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-6 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            {convertToLocale({ 
              amount: subtotal, 
              currency_code: cart.currency_code 
            })}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">
            {shippingCost === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              convertToLocale({ 
                amount: shippingCost, 
                currency_code: cart.currency_code 
              })
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax</span>
          <span className="text-foreground">
            {convertToLocale({ 
              amount: tax, 
              currency_code: cart.currency_code 
            })}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-2"></div>

        {/* Total */}
        <div className="flex justify-between pt-2">
          <span className="text-base font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">
            {convertToLocale({ 
              amount: total, 
              currency_code: cart.currency_code 
            })}
          </span>
        </div>

        {/* Shipping Notice */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Shipping and tax calculations are estimates and may vary based on your location.
            </p>
          </div>
        </div>

        {/* Delivery Estimate */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Clock className="h-3 w-3" />
          <span>Estimated delivery: 3-5 business days</span>
        </div>
      </div>

      {/* Secure Checkout Notice */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/30 rounded-b-lg">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="h-3 w-3" />
          <span>Secure checkout • SSL encrypted</span>
        </div>
      </div>
    </div>
  );
}