// app/(checkout)/order-status/page.tsx
import { retrieveDelivery, retrieveDriver } from "@/lib/data";
import { Clock, MapPin, Package2, Store, Truck, Phone, Mail, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

// Cookie utility functions
const COOKIE_KEYS = {
  DELIVERY_ID: "_medusa_delivery_id",
  DELIVERY_TOKEN: "_medusa_delivery_token",
  LAST_ORDER: "_medusa_last_order",
} as const;

async function getDeliveryCookie() {
  const cookieStore = await cookies();
  const deliveryId = cookieStore.get(COOKIE_KEYS.DELIVERY_ID)?.value;
  const deliveryToken = cookieStore.get(COOKIE_KEYS.DELIVERY_TOKEN)?.value;
  return { deliveryId, deliveryToken };
}

async function clearDeliveryCookies() {
  const cookieStore = await cookies();
  Object.values(COOKIE_KEYS).forEach((key) => {
    cookieStore.delete(key);
  });
}

// Status configuration with progress percentages
const STATUS_CONFIG = {
  pending: { 
    label: "Order Placed", 
    variant: "secondary" as const, 
    icon: Clock,
    progress: 0,
    color: "bg-gray-500"
  },
  confirmed: { 
    label: "Order Confirmed", 
    variant: "default" as const, 
    icon: CheckCircle2,
    progress: 25,
    color: "bg-blue-500"
  },
  preparing: { 
    label: "Preparing", 
    variant: "default" as const, 
    icon: Package2,
    progress: 50,
    color: "bg-purple-500"
  },
  ready: { 
    label: "Ready for Pickup", 
    variant: "default" as const, 
    icon: Store,
    progress: 75,
    color: "bg-yellow-500"
  },
  picked_up: { 
    label: "Out for Delivery", 
    variant: "default" as const, 
    icon: Truck,
    progress: 85,
    color: "bg-indigo-500"
  },
  delivered: { 
    label: "Delivered", 
    variant: "success" as const, 
    icon: CheckCircle2,
    progress: 100,
    color: "bg-green-500"
  },
  cancelled: { 
    label: "Cancelled", 
    variant: "destructive" as const, 
    icon: XCircle,
    progress: 0,
    color: "bg-red-500"
  },
};

const STATUS_STEPS = ["pending", "confirmed", "preparing", "ready", "picked_up", "delivered"];

export default async function OrderStatusPage() {
  const { deliveryId, deliveryToken } = await getDeliveryCookie();

  if (!deliveryId) {
    redirect("/account/orders?error=no_order_selected");
  }

  let delivery;
  try {
    delivery = await retrieveDelivery(deliveryId, deliveryToken);
    if (!delivery) {
      await clearDeliveryCookies();
      redirect("/account/orders?error=order_not_found");
    }
  } catch (error) {
    console.error("Failed to fetch delivery:", error);
    await clearDeliveryCookies();
    redirect("/account/orders?error=order_fetch_failed");
  }

  let driver = null;
  if (delivery.driver_id) {
    try {
      driver = await retrieveDriver(delivery.driver_id);
    } catch (error) {
      console.error("Failed to fetch driver:", error);
    }
  }

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

  const subtotal = delivery.cart?.items?.reduce(
    (total: number, item: any) => total + item.quantity * item.unit_price,
    0
  ) || 0;

  const deliveryFee = delivery.delivery_fee || 0;
  const taxAmount = delivery.tax_amount || 0;
  const totalAmount = subtotal + deliveryFee + taxAmount;

  const currentStatus = STATUS_CONFIG[delivery.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const CurrentStatusIcon = currentStatus.icon;
  console.log(delivery, deliveryId, deliveryToken, 'ehehehe' )
  const currentStepIndex = STATUS_STEPS.indexOf(delivery.status);
  const progressPercentage = currentStatus.progress;

  const eta = delivery.eta ? formatTime(delivery.eta) : null;
  const deliveredAt = delivery.delivered_at ? formatTime(delivery.delivered_at) : null;
  const deliveryDate = delivery.delivered_at ? formatDate(delivery.delivered_at) : null;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Package2 className="h-5 w-5" />
                <span className="text-sm font-medium">Order Status</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                Order #{delivery.id.slice(-8)}
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your order from {delivery.company?.name || "Alayon Store"}
              </p>
            </div>
            <Badge variant={currentStatus.variant} className="w-fit text-sm py-1.5 px-4">
              <CurrentStatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {currentStatus.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Tracker */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Order Placed</span>
                    <span>Confirmed</span>
                    <span>Preparing</span>
                    <span>Ready</span>
                    <span>Out for Delivery</span>
                    <span>Delivered</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {deliveredAt ? "Delivered" : "Estimated"} {deliveredAt || eta || "Calculating..."}
                      </span>
                    </div>
                    {estimatedRemaining && !deliveredAt && (
                      <Badge variant="secondary" className="text-xs">
                        ~{estimatedRemaining} remaining
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {delivery.cart?.items?.map((item: any) => {
                  const itemTotal = item.quantity * item.unit_price;
                  return (
                    <div key={item.id} className="flex gap-4 py-3 border-b last:border-0">
                      <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package2 className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground line-clamp-2">
                          {item.title}
                        </h3>
                        {item.variant?.title && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {item.variant.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatPrice(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (12% VAT)</span>
                      <span>{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-base">Total</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            {/* Delivery Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-foreground">{currentStatus.label}</p>
                  </div>
                  {deliveryDate && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Delivered on</p>
                      <p className="font-medium text-foreground">{deliveryDate}</p>
                      <p className="text-sm text-muted-foreground">{deliveredAt}</p>
                    </div>
                  )}
                </div>

                {/* Driver Info */}
                {driver && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">Your delivery partner</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <Mail className="h-3 w-3" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address Card */}
            {delivery.delivery_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <address className="not-italic text-muted-foreground text-sm">
                    <p>{delivery.delivery_address.address_1}</p>
                    {delivery.delivery_address.address_2 && (
                      <p>{delivery.delivery_address.address_2}</p>
                    )}
                    <p>
                      {delivery.delivery_address.city}, {delivery.delivery_address.country_code?.toUpperCase()}
                      {delivery.delivery_address.postal_code && ` ${delivery.delivery_address.postal_code}`}
                    </p>
                  </address>
                  {delivery.delivery_instructions && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Instructions</p>
                      <p className="text-sm">"{delivery.delivery_instructions}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline Card */}
            {delivery.timeline && delivery.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {delivery.timeline.map((event: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2",
                            index === delivery.timeline.length - 1 ? "bg-primary" : "bg-muted-foreground/30"
                          )} />
                          {index !== delivery.timeline.length - 1 && (
                            <div className="absolute top-4 left-0 w-px h-full bg-muted-foreground/20" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-foreground">{event.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.created_at).toLocaleString("en-PH", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                                    Having issues with your order? Contact our support team.
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/support?order=${delivery.id}`} className="flex-1">
                      <Button className="w-full">Contact Support</Button>
                    </Link>
                    <Link href="/account/orders">
                      <Button variant="outline">All Orders</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}