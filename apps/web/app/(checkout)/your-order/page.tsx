// app/(checkout)/your-order/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Clock, MapPin, Package2, Truck, Phone,
  CheckCircle2, AlertCircle, ClipboardCheck,
  ShoppingBag, ChevronRight, XCircle, Receipt,
  Building2, ArrowLeft, RefreshCw, Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { retrieveDelivery, retrieveDriver } from "@/lib/data";
import { markOrderAsCompleted } from "@/lib/actions/order-actions";


// app/(checkout)/your-order/page.tsx
// Add this import at the top

// Update the handleMarkAsCompleted function


// Types
type DeliveryStatus =
  | "pending"
  | "company_accepted"
  | "pickup_claimed"
  | "company_preparing"
  | "ready_for_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled";

interface Delivery {
  id: string;
  delivery_status: DeliveryStatus;
  delivery_fee: number;
  tax_amount: number;
  tax_rate?: number;
  subtotal?: number;
  total?: number;
  eta?: string;
  delivered_at?: string;
  driver_id?: string;
  delivery_address?: {
    address_1: string;
    address_2?: string;
    city: string;
    country_code: string;
    postal_code?: string;
  };
  delivery_instructions?: string;
  cart?: {
    items: Array<{
      id: string;
      title: string;
      thumbnail?: string;
      quantity: number;
      unit_price: number;
      tax_total?: number;
      variant?: { title: string };
    }>;
  };
  company?: {
    name: string;
    tax_id?: string;
  };
  timeline?: Array<{
    message: string;
    created_at: string;
  }>;
}

interface Driver {
  id: string;
  name: string;
  phone?: string;
}

// Status configuration with animation variants
const STATUS_CONFIG: Record<DeliveryStatus, {
  label: string;
  shortLabel: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success";
  icon: any;
  progress: number;
  color: string;
  description: string;
  pulseColor: string;
}> = {
  pending: {
    label: "Order Placed",
    shortLabel: "Placed",
    variant: "secondary",
    icon: Clock,
    progress: 0,
    color: "bg-gray-500",
    description: "Your order has been received and is awaiting confirmation",
    pulseColor: "ring-gray-500/20"
  },
  company_accepted: {
    label: "Order Confirmed",
    shortLabel: "Confirmed",
    variant: "default",
    icon: CheckCircle2,
    progress: 20,
    color: "bg-blue-500",
    description: "The store has accepted your order",
    pulseColor: "ring-blue-500/20"
  },
  pickup_claimed: {
    label: "Pickup Assigned",
    shortLabel: "Assigned",
    variant: "default",
    icon: ClipboardCheck,
    progress: 35,
    color: "bg-indigo-500",
    description: "A rider has been assigned to pick up your order",
    pulseColor: "ring-indigo-500/20"
  },
  company_preparing: {
    label: "Preparing Your Order",
    shortLabel: "Preparing",
    variant: "default",
    icon: Package2,
    progress: 50,
    color: "bg-purple-500",
    description: "The store is preparing your items",
    pulseColor: "ring-purple-500/20"
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    shortLabel: "Ready",
    variant: "default",
    icon: ShoppingBag,
    progress: 65,
    color: "bg-yellow-500",
    description: "Your order is ready and waiting for pickup",
    pulseColor: "ring-yellow-500/20"
  },
  in_transit: {
    label: "Out for Delivery",
    shortLabel: "On the Way",
    variant: "default",
    icon: Truck,
    progress: 85,
    color: "bg-orange-500",
    description: "Your order is on its way to you",
    pulseColor: "ring-orange-500/20"
  },
  delivered: {
    label: "Delivered",
    shortLabel: "Delivered",
    variant: "success",
    icon: CheckCircle2,
    progress: 100,
    color: "bg-green-500",
    description: "Your order has been delivered",
    pulseColor: "ring-green-500/20"
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    variant: "destructive",
    icon: XCircle,
    progress: 0,
    color: "bg-red-500",
    description: "Your order has been cancelled",
    pulseColor: "ring-red-500/20"
  }
};

const STATUS_STEPS: DeliveryStatus[] = [
  "pending",
  "company_accepted",
  "pickup_claimed",
  "company_preparing",
  "ready_for_pickup",
  "in_transit",
  "delivered"
];

const getNumericStatus = (status: DeliveryStatus): number => {
  const index = STATUS_STEPS.indexOf(status);
  return index === -1 ? 0 : index;
};

// API route for cookie operations
async function clearDeliveryCookie() {
  try {
    const response = await fetch('/api/cookies/clear-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to clear cookie:', error);
    return false;
  }
}

async function setModalDismissed() {
  try {
    const response = await fetch('/api/cookies/set-modal-dismissed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: new Date().toDateString() }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to set modal dismissed:', error);
    return false;
  }
}

async function shouldShowModal(): Promise<boolean> {
  try {
    const response = await fetch('/api/cookies/should-show-modal');
    const data = await response.json();
    return data.shouldShow;
  } catch (error) {
    console.error('Failed to check modal status:', error);
    return true;
  }
}

// Animated Progress Component
function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full bg-primary transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Animated Status Dot
function AnimatedStatusDot({ isActive, color, pulseColor }: { isActive: boolean; color: string; pulseColor: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-all duration-300",
          color,
          isActive && "ring-4 ring-opacity-30 animate-pulse",
          isActive && pulseColor
        )}
      />
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-6 w-6 rounded-full bg-primary/20 animate-ping" />
        </div>
      )}
    </div>
  );
}

// Tax Breakdown Component
function TaxBreakdown({ subtotal, taxAmount, taxRate, deliveryFee }: {
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  deliveryFee: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const vatAmount = taxAmount;
  const taxableAmount = subtotal + deliveryFee;
  const calculatedVatRate = taxableAmount > 0 ? (vatAmount / taxableAmount) * 100 : 0;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tax Details</span>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      {isExpanded && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable Amount</span>
            <span className="font-medium">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP"
              }).format(taxableAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT Rate</span>
            <span className="font-medium">{calculatedVatRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT Amount (12%)</span>
            <span className="font-medium text-primary">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP"
              }).format(vatAmount)}
            </span>
          </div>
          <Separator className="my-1" />
          <p className="text-xs text-muted-foreground">
            Tax is computed based on Philippine VAT regulations (12% on goods and services).
          </p>
        </div>
      )}
    </div>
  );
}

// Order Summary Component
function OrderSummary({ subtotal, deliveryFee, taxAmount, total, formatPrice }: any) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
          <Receipt className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT (12%)</span>
            <span className="font-medium text-primary">{formatPrice(taxAmount)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between pt-1">
            <span className="font-semibold">Total Amount</span>
            <span className="text-base font-bold text-primary lg:text-xl">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <TaxBreakdown
          subtotal={subtotal}
          taxAmount={taxAmount}
          taxRate={0.12}
          deliveryFee={deliveryFee}
        />
      </CardContent>
    </Card>
  );
}

// Mobile Timeline Component
function MobileTimeline({ currentStatus, progressPercentage, estimatedRemaining, deliveredAt }: any) {
  const currentConfig = STATUS_CONFIG[currentStatus as DeliveryStatus];

  return (
    <div className="space-y-4 lg:hidden">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatedStatusDot
              isActive={true}
              color={currentConfig.color}
              pulseColor={currentConfig.pulseColor}
            />
            <span className="text-sm font-medium">{currentConfig.label}</span>
          </div>
          {estimatedRemaining && !deliveredAt && (
            <span className="text-xs font-medium text-primary">{estimatedRemaining} left</span>
          )}
        </div>
        <AnimatedProgress value={progressPercentage} className="h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground">{currentConfig.description}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex min-w-max items-center gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const stepConfig = STATUS_CONFIG[step];
            const StepIcon = stepConfig.icon;
            const isCompleted = getNumericStatus(currentStatus) >= getNumericStatus(step);
            const isCurrent = currentStatus === step;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                    isCompleted ? "bg-green-500 text-white" :
                      isCurrent ? "bg-primary text-white ring-4 ring-primary/20" :
                        "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {stepConfig.shortLabel}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Desktop Timeline Component
function DesktopTimeline({ currentStatus, progressPercentage, estimatedRemaining, deliveredAt }: any) {
  const currentConfig = STATUS_CONFIG[currentStatus as DeliveryStatus];

  return (
    <div className="hidden lg:block">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {STATUS_STEPS.map(step => (
                  <span key={step}>{STATUS_CONFIG[step].shortLabel}</span>
                ))}
              </div>
              <AnimatedProgress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {STATUS_STEPS.map((step) => {
                const stepConfig = STATUS_CONFIG[step];
                const StepIcon = stepConfig.icon;
                const isCompleted = getNumericStatus(currentStatus) >= getNumericStatus(step);
                const isCurrent = currentStatus === step;

                return (
                  <div key={step} className="text-center">
                    <div className="relative mx-auto flex h-8 w-8 items-center justify-center">
                      {isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute h-10 w-10 rounded-full bg-primary/20 animate-ping" />
                        </div>
                      )}
                      <div className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                        isCompleted ? "bg-green-500 text-white" :
                          isCurrent ? "bg-primary text-white ring-4 ring-primary/20" :
                            "bg-gray-200 text-gray-500"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      "mt-2 text-xs",
                      isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
                    )}>
                      {stepConfig.shortLabel}
                    </p>
                    {isCurrent && estimatedRemaining && !deliveredAt && (
                      <p className="mt-1 text-[10px] text-primary">{estimatedRemaining}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
              {estimatedRemaining && !deliveredAt && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Estimated {estimatedRemaining} remaining
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Order Item Components
function OrderItem({ item, formatPrice, isMobile = false }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemTotal = item.quantity * item.unit_price;
  const itemTax = item.tax_total || 0;

  if (isMobile) {
    return (
      <div>
        <div className="flex gap-3 py-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package2 className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 flex-1 text-sm font-medium text-foreground">
                {item.title}
              </h3>
              <span className="whitespace-nowrap text-sm font-semibold text-primary">
                {formatPrice(itemTotal)}
              </span>
            </div>
            {item.variant?.title && (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.variant.title}</p>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Less" : "More"} details
              </Button>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="mb-3 ml-[68px] rounded-lg bg-gray-50 p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">Unit price:</span> {formatPrice(item.unit_price)}</p>
            <p><span className="text-muted-foreground">Item total:</span> {formatPrice(itemTotal)}</p>
            {itemTax > 0 && (
              <p><span className="text-muted-foreground">Tax (VAT):</span> {formatPrice(itemTax)}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-4 border-b py-3 last:border-0">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package2 className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-medium text-foreground">{item.title}</h3>
        {item.variant?.title && (
          <p className="mt-0.5 text-sm text-muted-foreground">{item.variant.title}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
            {itemTax > 0 && (
              <p className="text-xs text-muted-foreground">Tax included: {formatPrice(itemTax)}</p>
            )}
          </div>
          <span className="font-semibold text-primary">{formatPrice(itemTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// Buy Again Button Component (Desktop & Mobile)
function BuyAgainButton({ onClick, variant = "default" }: { onClick: () => void; variant?: "default" | "sticky" }) {
  if (variant === "sticky") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden">
        <Button
          onClick={onClick}
          size="lg"
          className="w-full gap-2 bg-primary text-white hover:bg-primary/90"
        >
          <ShoppingBag className="h-4 w-4" />
          Buy Again
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onClick}
      size="lg"
      className="gap-2 bg-primary text-white hover:bg-primary/90"
    >
      <ShoppingBag className="h-4 w-4" />
      Buy Again
    </Button>
  );
}

// Return to Shop Modal
function ReturnToShopModal({ isOpen, onClose, onConfirm, onDismiss }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minimize2 className="h-5 w-5 text-primary" />
            Minimize Order Tracking?
          </DialogTitle>
          <DialogDescription>
            Your order is still in progress. You can continue tracking it later from your orders page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Package2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="sm:flex-1"
          >
            Don't show again today
          </Button>
          <Button
            onClick={onConfirm}
            className="sm:flex-1"
          >
            Continue to Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrderStatusPage({ id, showMarkAsCompleted = false }: { id?: any; showMarkAsCompleted?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deliveryId = (id || searchParams.get("id")) as any;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      const deliveryData = await retrieveDelivery(deliveryId) as any;

      if (!deliveryData) {
        setError("Order not found");
        return;
      }

      setDelivery(deliveryData);

      if (deliveryData.driver_id) {
        try {
          const driverData = await retrieveDriver(deliveryData.driver_id) as any;
          setDriver(driverData);
        } catch (err) {
          console.error("Failed to fetch driver:", err);
        }
      }
    } catch (err) {
      console.error("Failed to fetch delivery:", err);
      setError("Failed to load order details");
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
      setLoading(false);
    }
  }, [deliveryId]);

  // Initial fetch and background auto-refresh
  useEffect(() => {
    fetchData(true);

    // Set up background polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

const handleMarkAsCompleted = async () => {
  setIsMarkingComplete(true);
  try {
    // Mark order as completed - this removes the delivery cookie
    await markOrderAsCompleted(deliveryId);
    
    console.log("Order marked as completed:", deliveryId);
    
    // Optional: Show success message
    // You can add a toast notification here
    
    // Optional: Redirect to orders page after completion
    // router.push("/account/orders");
    
    // Refresh the page to update the UI
    router.refresh();
  } catch (err) {
    console.error("Failed to mark as completed:", err);
  } finally {
    setIsMarkingComplete(false);
  }
};

  const handleBuyAgain = () => {
    // Navigate to store with the same items pre-filled
    router.push("/");
  };

  const handleReturnToStore = async () => {
    // Check if modal should be shown
    const showModal = await shouldShowModal();
    if (showModal) {
      setShowReturnModal(true);
    } else {
      // Direct navigation if modal was dismissed today
      router.push("/");
    }
  };

  const handleConfirmReturn = () => {
    setShowReturnModal(false);
    router.push("/");
  };

  const handleDismissModal = async () => {
    await setModalDismissed();
    setShowReturnModal(false);
    router.push("/");
  };

  const handleCloseModal = () => {
    setShowReturnModal(false);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="mx-4 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">Order Not Found</h2>
            <p className="mb-6 text-muted-foreground">{error || "Unable to find your order"}</p>
            <Link href="/account/orders">
              <Button>View All Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals with proper tax handling
  const subtotal = delivery.cart?.items?.reduce(
    (total, item) => total + item.quantity * item.unit_price,
    0
  ) || 0;

  const deliveryFee = delivery.delivery_fee || 0;

  let taxAmount = delivery.tax_amount || 0;
  let totalAmount = delivery.total || (subtotal + deliveryFee + taxAmount);

  if (taxAmount === 0 && subtotal > 0) {
    const taxableAmount = subtotal + deliveryFee;
    taxAmount = taxableAmount * 0.12;
    totalAmount = taxableAmount + taxAmount;
  }

  const currentStatus = delivery.delivery_status;
  const currentStatusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const CurrentStatusIcon = currentStatusConfig.icon;
  const progressPercentage = currentStatusConfig.progress;

  const eta = delivery.eta ? formatTime(delivery.eta) : null;
  const deliveredAt = delivery.delivered_at ? formatTime(delivery.delivered_at) : null;

  const getEstimatedRemaining = () => {
    if (delivery.delivered_at || !delivery.eta) return null;
    const etaDate = new Date(delivery.eta);
    const now = new Date();
    const diffMinutes = Math.ceil((etaDate.getTime() - now.getTime()) / (1000 * 60));
    if (diffMinutes <= 0) return "Any minute now";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
  };

  const estimatedRemaining = getEstimatedRemaining();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header with Return to Store and Mark as Completed */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReturnToStore}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Store
          </Button>

          <div className="flex items-center gap-3">
            {showMarkAsCompleted && delivery.delivery_status !== "delivered" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsCompleted}
                disabled={isMarkingComplete}
                className="gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isMarkingComplete ? "Completing..." : "Mark as Completed"}
              </Button>
            )}
            <Badge variant={currentStatusConfig.variant as any} className="text-xs">
              <CurrentStatusIcon className="mr-1 h-3 w-3" />
              {currentStatusConfig.shortLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {isRefreshing && (
        <div className="fixed right-4 top-16 z-20 flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1.5 text-xs text-white shadow-lg lg:top-20">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Updating...
        </div>
      )}

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        {/* Desktop Header */}
        <div className="mb-8 hidden lg:block">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Package2 className="h-5 w-5" />
                <span className="text-sm font-medium">Order Status</span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                Order #{delivery.id.slice(-8)}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Track your order from {delivery.company?.name || "Alayon Store"}
              </p>
            </div>
            {/* Desktop Buy Again Button */}
            <BuyAgainButton onClick={handleBuyAgain} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            <MobileTimeline
              currentStatus={currentStatus}
              progressPercentage={progressPercentage}
              estimatedRemaining={estimatedRemaining}
              deliveredAt={deliveredAt}
            />
            <DesktopTimeline
              currentStatus={currentStatus}
              progressPercentage={progressPercentage}
              estimatedRemaining={estimatedRemaining}
              deliveredAt={deliveredAt}
            />

            {/* Order Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Package2 className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
                  Order Items
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {delivery.cart?.items?.length || 0} items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 lg:space-y-4">
                <div className="space-y-2 lg:hidden">
                  {delivery.cart?.items?.map((item) => (
                    <OrderItem key={item.id} item={item} formatPrice={formatPrice} isMobile={true} />
                  ))}
                </div>
                <div className="hidden space-y-2 lg:block">
                  {delivery.cart?.items?.map((item) => (
                    <OrderItem key={item.id} item={item} formatPrice={formatPrice} isMobile={false} />
                  ))}
                </div>

                <Separator className="my-3 lg:my-4" />

                <OrderSummary
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  taxAmount={taxAmount}
                  total={totalAmount}
                  formatPrice={formatPrice}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 lg:space-y-6">
            {/* Delivery Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Truck className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eta && !deliveredAt && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                      <p className="font-semibold text-foreground">{eta}</p>
                    </div>
                    {estimatedRemaining && (
                      <Badge variant="secondary" className="text-xs">
                        {estimatedRemaining} left
                      </Badge>
                    )}
                  </div>
                )}

                {driver && (
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">Your delivery partner</p>
                      {driver.phone && (
                        <div className="mt-1 flex items-center gap-2">
                          <a href={`tel:${driver.phone}`}>
                            <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-xs">
                              <Phone className="h-3 w-3" />
                              {driver.phone}
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {delivery.delivery_address && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <MapPin className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <address className="text-sm not-italic text-muted-foreground">
                    <p>{delivery.delivery_address.address_1}</p>
                    {delivery.delivery_address.address_2 && <p>{delivery.delivery_address.address_2}</p>}
                    <p>
                      {delivery.delivery_address.city}, {delivery.delivery_address.country_code?.toUpperCase()}
                      {delivery.delivery_address.postal_code && ` ${delivery.delivery_address.postal_code}`}
                    </p>
                  </address>
                  {delivery.delivery_instructions && (
                    <div className="rounded-lg bg-gray-50 p-2 text-xs">
                      <p className="mb-0.5 font-medium text-muted-foreground">Instructions:</p>
                      <p className="text-foreground">"{delivery.delivery_instructions}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Company Info */}
            {delivery.company && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Building2 className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
                    Merchant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-medium">{delivery.company.name}</p>
                  {delivery.company.tax_id && (
                    <p className="text-xs text-muted-foreground">
                      TIN: {delivery.company.tax_id}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registered under Philippine BIR regulations. VAT invoice available upon request.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            {delivery.timeline && delivery.timeline.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Clock className="h-4 w-4 text-primary lg:h-5 lg:w-5" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {delivery.timeline.slice(0, 3).map((event, index) => (
                      <div key={index} className="flex gap-2 text-sm">
                        <div className="w-16 flex-shrink-0 text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                        <p className="text-sm text-foreground">{event.message}</p>
                      </div>
                    ))}
                    {delivery.timeline.length > 3 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-xs font-medium text-primary">
                          View {delivery.timeline.length - 3} more events
                        </summary>
                        <div className="mt-2 space-y-2">
                          {delivery.timeline.slice(3).map((event, index) => (
                            <div key={index} className="flex gap-2 border-t border-gray-100 pt-2 text-sm">
                              <div className="w-16 flex-shrink-0 text-xs text-muted-foreground">
                                {new Date(event.created_at).toLocaleTimeString("en-PH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                              <p className="text-sm text-foreground">{event.message}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-primary lg:mb-3 lg:h-10 lg:w-10" />
                  <h3 className="mb-1 text-sm font-semibold text-foreground lg:mb-2 lg:text-base">Need Help?</h3>
                  <p className="mb-3 text-xs text-muted-foreground lg:mb-4 lg:text-sm">
                    Having issues with your order? Contact our support team.
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/support?order=${delivery.id}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs lg:text-sm">
                        Contact Support
                      </Button>
                    </Link>
                    <Link href="/account/orders">
                      <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                        All Orders
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buy Again Button */}
      <BuyAgainButton onClick={handleBuyAgain} variant="sticky" />

      {/* Return to Shop Modal */}
      <ReturnToShopModal
        isOpen={showReturnModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmReturn}
        onDismiss={handleDismissModal}
      />
    </div>
  );
}