import AccountBadge from "@/components/dashboard/account-badge";
import RealtimeClient from "@/components/dashboard/realtime-client";
import OrderStatus from "@/components/store/order/order-status";
import { retrieveDelivery, retrieveDriver } from "@/lib/data";
import { Clock, MapPin } from "@medusajs/icons";
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui";
import { Package2, StoreIcon } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

// Cookie utility functions
const COOKIE_KEYS = {
  DELIVERY_ID: "_medusa_delivery_id",
  DELIVERY_TOKEN: "_medusa_delivery_token",
  LAST_ORDER: "_medusa_last_order",
} as const;

const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// Helper to get and validate cookie
async function getDeliveryCookie() {
  const cookieStore = await cookies();
  const deliveryId = cookieStore.get(COOKIE_KEYS.DELIVERY_ID)?.value;
  const deliveryToken = cookieStore.get(COOKIE_KEYS.DELIVERY_TOKEN)?.value;
  
  return { deliveryId, deliveryToken };
}

// Helper to clear delivery cookies
async function clearDeliveryCookies() {
  const cookieStore = await cookies();
  
  Object.values(COOKIE_KEYS).forEach((key) => {
    cookieStore.delete(key);
  });
}

export default async function YourOrderPage() {
  const { deliveryId, deliveryToken } = await getDeliveryCookie();

  // Validate required cookie
  if (!deliveryId) {
    // Redirect to orders page instead of 404 for better UX
    redirect("/account/orders?error=no_order_selected");
  }

  // Fetch delivery with token validation
  let delivery;
  try {
    delivery = await retrieveDelivery(deliveryId, deliveryToken);
    
    if (!delivery) {
      // Clear invalid cookies and redirect
      await clearDeliveryCookies();
      redirect("/account/orders?error=order_not_found");
    }
  } catch (error) {
    console.error("Failed to fetch delivery:", error);
    await clearDeliveryCookies();
    redirect("/account/orders?error=order_fetch_failed");
  }

  // Fetch driver if assigned
  let driver = null;
  if (delivery.driver_id) {
    try {
      driver = await retrieveDriver(delivery.driver_id);
    } catch (error) {
      console.error("Failed to fetch driver:", error);
      // Don't fail the whole page if driver info is missing
    }
  }

  // Formatting utilities
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate order totals
  const subtotal = delivery.cart?.items?.reduce(
    (total: number, item: any) => total + item.quantity * item.unit_price,
    0
  ) || 0;

  const deliveryFee = delivery.delivery_fee || 0;
  const taxAmount = delivery.tax_amount || 0;
  const totalAmount = subtotal + deliveryFee + taxAmount;

  // Time calculations
  const eta = delivery.eta ? formatTime(delivery.eta) : null;
  const deliveredAt = delivery.delivered_at ? formatTime(delivery.delivered_at) : null;
  const deliveryDate = delivery.delivered_at ? formatDate(delivery.delivered_at) : null;
  
  // Estimated remaining time (if not delivered)
  const getEstimatedRemaining = () => {
    if (delivery.delivered_at || !delivery.eta) return null;
    
    const etaDate = new Date(delivery.eta);
    const now = new Date();
    const diffMinutes = Math.ceil((etaDate.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Any minute now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} hour${hours !== 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} min` : ""}`;
  };

  const estimatedRemaining = getEstimatedRemaining();

  // Order status configuration
  const statusConfig = {
    pending: { variant: "orange" as const, text: "Pending Confirmation", icon: "⏳" },
    confirmed: { variant: "blue" as const, text: "Confirmed", icon: "✅" },
    preparing: { variant: "purple" as const, text: "Preparing", icon: "👨‍🍳" },
    ready: { variant: "green" as const, text: "Ready for Pickup", icon: "📦" },
    picked_up: { variant: "blue" as const, text: "On the Way", icon: "🚚" },
    delivered: { variant: "green" as const, text: "Delivered", icon: "🏠" },
    cancelled: { variant: "red" as const, text: "Cancelled", icon: "❌" },
  };

  const currentStatus = statusConfig[delivery.status as keyof typeof statusConfig] || 
    { variant: "neutral" as const, text: delivery.status, icon: "📋" };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8  mx-auto">
      {/* Header Section */}
      <Container className="flex justify-between p-6 flex-col md:flex-row gap-4 bg-gradient-to-r from-ui-bg-base to-ui-bg-subtle">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <StoreIcon className="text-ui-fg-subtle" />
            <Heading level="h1" className="text-2xl md:text-3xl">
              Order from {delivery.restaurant?.name || "Restaurant"}
            </Heading>
          </div>
          <Text className="text-ui-fg-subtle">
            Track your order in real-time • Order #{delivery.id.slice(-8)}
          </Text>
          <div className="mt-2">
            <RealtimeClient deliveryId={delivery.id} />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start md:items-center">
          {driver && <AccountBadge data={driver} type="driver" />}
          
          <Container className="flex gap-3 items-center w-full sm:w-auto bg-ui-bg-base shadow-sm">
            <div className="p-2 bg-ui-bg-subtle rounded-full">
              <Clock className="text-ui-fg-subtle" />
            </div>
            <div className="flex flex-col">
              <Text className="text-xs text-ui-fg-subtle">
                {deliveredAt ? "Delivered at" : "Estimated delivery"}
              </Text>
              <Text className="text-xl font-semibold">
                {deliveredAt || eta || "Calculating..."}
              </Text>
              {estimatedRemaining && !deliveredAt && (
                <Text className="text-xs text-ui-fg-subtle">
                  ~{estimatedRemaining} remaining
                </Text>
              )}
              {deliveryDate && (
                <Text className="text-xs text-ui-fg-subtle">{deliveryDate}</Text>
              )}
            </div>
          </Container>
        </div>
      </Container>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Order Items Section */}
        <Container className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Package2 className="text-ui-fg-subtle" />
              <Heading level="h2" className="text-xl">
                Order Items
              </Heading>
            </div>
            <Badge variant={currentStatus.variant}>
              <span className="mr-1">{currentStatus.icon}</span>
              {currentStatus.text}
            </Badge>
          </div>

          <div className="flex flex-col gap-4">
            {delivery.cart?.items?.map((item: any) => {
              const thumbnail = item.thumbnail;
              const itemTotal = item.quantity * item.unit_price;
              
              return (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-ui-bg-subtle transition-colors"
                >
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={item.title}
                        className="object-cover rounded-md"
                        fill
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full bg-ui-bg-subtle rounded-md flex items-center justify-center">
                        <Package className="text-ui-fg-subtle" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Text className="font-medium">{item.title}</Text>
                    {item.variant?.title && (
                      <Text className="text-sm text-ui-fg-subtle">
                        {item.variant.title}
                      </Text>
                    )}
                  </div>
                  <div className="text-right">
                    <Text className="font-medium">{formatPrice(itemTotal)}</Text>
                    <Text className="text-sm text-ui-fg-subtle">
                      {item.quantity} x {formatPrice(item.unit_price)}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-ui-fg-subtle">Subtotal</Text>
              <Text>{formatPrice(subtotal)}</Text>
            </div>
            <div className="flex justify-between items-center mb-2">
              <Text className="text-ui-fg-subtle">Delivery Fee</Text>
              <Text>{formatPrice(deliveryFee)}</Text>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <Text className="text-ui-fg-subtle">Tax (12% VAT)</Text>
                <Text>{formatPrice(taxAmount)}</Text>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-ui-border-base">
              <Text className="font-semibold text-lg">Total</Text>
              <Text className="font-bold text-xl text-ui-fg-base">
                {formatPrice(totalAmount)}
              </Text>
            </div>
          </div>
        </Container>

        {/* Order Status Section */}
        <div className="lg:w-96">
          <OrderStatus delivery={delivery} />
          
          {/* Delivery Address */}
          {delivery.delivery_address && (
            <Container className="mt-4 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-ui-fg-subtle" />
                <Heading level="h3" className="text-base">
                  Delivery Address
                </Heading>
              </div>
              <Text className="text-ui-fg-subtle">
                {delivery.delivery_address.address_1}
                {delivery.delivery_address.address_2 && `, ${delivery.delivery_address.address_2}`}
                <br />
                {delivery.delivery_address.city}, {delivery.delivery_address.country_code?.toUpperCase()}
                {delivery.delivery_address.postal_code && ` ${delivery.delivery_address.postal_code}`}
              </Text>
              
              {delivery.delivery_instructions && (
                <div className="mt-4 pt-4 border-t">
                  <Text className="text-sm font-medium mb-1">Delivery Instructions</Text>
                  <Text className="text-sm text-ui-fg-subtle italic">
                    "{delivery.delivery_instructions}"
                  </Text>
                </div>
              )}
            </Container>
          )}

          {/* Order Timeline */}
          {delivery.timeline && delivery.timeline.length > 0 && (
            <Container className="mt-4 p-6">
              <Heading level="h3" className="text-base mb-4">
                Order Timeline
              </Heading>
              <div className="space-y-3">
                {delivery.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <div className="w-20 text-ui-fg-subtle">
                      {new Date(event.created_at).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex-1">
                      <Text>{event.message}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          )}

          {/* Help Section */}
          <Container className="mt-4 p-6 bg-ui-bg-subtle">
            <Heading level="h3" className="text-base mb-2">
              Need Help?
            </Heading>
            <Text className="text-sm text-ui-fg-subtle mb-4">
              Having issues with your order? Contact our support team.
            </Text>
            <div className="flex gap-2">
              <Link href={`/support?order=${delivery.id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  Contact Support
                </Button>
              </Link>
              <Link href="/account/orders">
                <Button variant="transparent">
                  View All Orders
                </Button>
              </Link>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}