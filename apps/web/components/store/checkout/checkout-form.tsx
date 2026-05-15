"use client";

import { initiatePaymentSession, placeOrder } from "@/lib/actions";
import { useCart } from "@/lib/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { 
  Loader2, 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Banknote,
  Wallet,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import dynamic from 'next/dynamic';

// Dynamically import map component with no SSR
const MapLocationPicker = dynamic(
  () => import('@/components/map-location-picker').then(mod => mod.MapLocationPicker),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <MapPin className="h-8 w-8 text-muted-foreground/50" />
        <span className="ml-2 text-muted-foreground">Loading map...</span>
      </div>
    )
  }
);

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Place Order"
      )}
    </Button>
  );
}

// Philippine cities and municipalities data
const PHILIPPINE_CITIES = [
  { value: "quezon-city", label: "Quezon City" },
  { value: "manila", label: "Manila" },
  { value: "caloocan", label: "Caloocan" },
  { value: "davao-city", label: "Davao City" },
  { value: "cebu-city", label: "Cebu City" },
  { value: "zamboanga-city", label: "Zamboanga City" },
  { value: "taguig", label: "Taguig" },
  { value: "pasig", label: "Pasig" },
  { value: "paranaque", label: "Parañaque" },
  { value: "makati", label: "Makati" },
  { value: "mandaluyong", label: "Mandaluyong" },
  { value: "marikina", label: "Marikina" },
  { value: "muntinlupa", label: "Muntinlupa" },
  { value: "las-pinas", label: "Las Piñas" },
  { value: "pasay", label: "Pasay" },
  { value: "valenzuela", label: "Valenzuela" },
  { value: "malabon", label: "Malabon" },
  { value: "navotas", label: "Navotas" },
  { value: "san-juan", label: "San Juan" },
  { value: "pateros", label: "Pateros" },
];

// Barangays data
const BARANGAYS_BY_CITY: Record<string, Array<{ value: string; label: string }>> = {
  "quezon-city": [
    { value: "bagong-bantay", label: "Bagong Bantay" },
    { value: "bagong-silang", label: "Bagong Silang" },
    { value: "batasan-hills", label: "Batasan Hills" },
    { value: "commonwealth", label: "Commonwealth" },
    { value: "cubao", label: "Cubao" },
    { value: "diliman", label: "Diliman" },
    { value: "kamias", label: "Kamias" },
    { value: "katipunan", label: "Katipunan" },
    { value: "north-triangle", label: "North Triangle" },
    { value: "project-6", label: "Project 6" },
  ],
  "manila": [
    { value: "binondo", label: "Binondo" },
    { value: "ermita", label: "Ermita" },
    { value: "intramuros", label: "Intramuros" },
    { value: "malate", label: "Malate" },
    { value: "pac", label: "Paco" },
    { value: "pandacan", label: "Pandacan" },
    { value: "sampaloc", label: "Sampaloc" },
    { value: "san-andres", label: "San Andres" },
    { value: "san-miguel", label: "San Miguel" },
    { value: "santa-ana", label: "Santa Ana" },
  ],
};

// Payment methods
const PAYMENT_METHODS = [
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: Banknote,
    description: "Pay when you receive your order",
  },
  {
    id: "gcash",
    name: "GCash",
    icon: Smartphone,
    description: "Pay via GCash mobile wallet",
  },
  {
    id: "paymaya",
    name: "PayMaya",
    icon: Wallet,
    description: "Pay via PayMaya wallet",
  },
  {
    id: "bank-transfer",
    name: "Bank Transfer",
    icon: CreditCard,
    description: "Pay via bank transfer (BPI, BDO, Metrobank)",
  },
];

export default function CheckoutForm({ company }: any) {
  const [state, action] = useActionState(placeOrder, { message: "" });
  const { cart } = useCart();
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const [availableBarangays, setAvailableBarangays] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cod");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          const result = await initiatePaymentSession(cart, {
            provider_id: 'pp_system_default',
          });
          
          if (result) {
            setPaymentInitialized(true);
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

  // Update barangays when city changes
  useEffect(() => {
    if (selectedCity && BARANGAYS_BY_CITY[selectedCity]) {
      setAvailableBarangays(BARANGAYS_BY_CITY[selectedCity]);
    } else {
      setAvailableBarangays([]);
    }
    setSelectedBarangay("");
  }, [selectedCity]);

  if (!cart) return null;

  const cartId = cart.id;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order information</p>
        </div>

        {/* Payment Status */}
        {(isInitializingPayment || paymentInitialized) && (
          <div className={cn(
            "p-4 rounded-lg border flex items-center justify-center gap-2",
            isInitializingPayment ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
          )}>
            {isInitializingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Initializing payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Payment ready</span>
              </>
            )}
          </div>
        )}

        <form action={action} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-sm font-medium">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first-name"
                  name="first-name"
                  placeholder="John"
                  required
                  className="focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-sm font-medium">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last-name"
                  name="last-name"
                  placeholder="Doe"
                  required
                  className="focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="pl-9 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0917 123 4567"
                  required
                  className="pl-9 focus-visible:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                We'll use this to contact you about your delivery
              </p>
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Shipping Address</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="1234 Main St, Building, Unit"
                required
                className="focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City / Municipality <span className="text-destructive">*</span>
                </Label>
                <Select 
                  name="city" 
                  required 
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger className="focus-visible:ring-primary">
                    <SelectValue placeholder="Select city or municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHILIPPINE_CITIES.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barangay" className="text-sm font-medium">
                  Barangay <span className="text-destructive">*</span>
                </Label>
                <Select 
                  name="barangay" 
                  required 
                  disabled={!selectedCity}
                  value={selectedBarangay}
                  onValueChange={setSelectedBarangay}
                >
                  <SelectTrigger className="focus-visible:ring-primary">
                    <SelectValue placeholder={
                      selectedCity ? "Select barangay" : "Select city first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBarangays.map((barangay) => (
                      <SelectItem key={barangay.value} value={barangay.value}>
                        {barangay.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip" className="text-sm font-medium">
                ZIP / Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zip"
                name="zip"
                placeholder="1000"
                required
                className="focus-visible:ring-primary"
              />
            </div>

            {/* Map Location Picker - Only render on client side */}
            {isMounted && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Pin Your Location <span className="text-destructive">*</span>
                </Label>
                <MapLocationPicker
                  onLocationSelect={(location) => {
                    setSelectedLocation(location);
                  }}
                />
                <input 
                  type="hidden" 
                  name="location-coordinates" 
                  value={selectedLocation ? `${selectedLocation.lat},${selectedLocation.lng}` : ""}
                  required
                />
                <input 
                  type="hidden" 
                  name="location-address" 
                  value={selectedLocation?.address || ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Drag the marker or click on the map to set your exact delivery location
                </p>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Payment Method</h2>
            </div>

            <RadioGroup
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
              name="payment-method"
              required
              className="space-y-3"
            >
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={cn(
                      "relative flex cursor-pointer rounded-lg border p-4 transition-all",
                      selectedPaymentMethod === method.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={method.id}
                      className="flex flex-1 cursor-pointer items-start gap-4"
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        selectedPaymentMethod === method.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100 text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 transition-all",
                        selectedPaymentMethod === method.id
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      )}>
                        {selectedPaymentMethod === method.id && (
                          <div className="flex h-full w-full items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {/* GCash/PayMaya additional info */}
            {(selectedPaymentMethod === "gcash" || selectedPaymentMethod === "paymaya") && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  You will be redirected to {selectedPaymentMethod === "gcash" ? "GCash" : "PayMaya"} to complete your payment after placing the order.
                </p>
              </div>
            )}

            {/* Bank Transfer additional info */}
            {selectedPaymentMethod === "bank-transfer" && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-2">Bank Account Details:</p>
                <p className="text-sm text-blue-700">BPI: 1234 5678 9012</p>
                <p className="text-sm text-blue-700">BDO: 9876 5432 1098</p>
                <p className="text-sm text-blue-700 mt-2">Account Name: Alayon Store</p>
                <p className="text-xs text-blue-600 mt-2">
                  Please include your order number in the transaction reference.
                </p>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Additional Information</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Order Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Special instructions for delivery, landmark, etc."
                className="min-h-[100px] focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Hidden Fields */}
          <input type="hidden" name="cart-id" value={cartId} />
          <input type="hidden" name="has-payment-session" value={paymentInitialized ? "true" : "false"} />

          {/* Submit Button */}
          <div className="pt-4">
            <SubmitButton />
          </div>

          {/* Status Message */}
          {state.message && (
            <div className={cn(
              "p-4 rounded-lg border text-center",
              state.error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
            )}>
              {state.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}