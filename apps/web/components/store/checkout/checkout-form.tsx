"use client";

import { initiatePaymentSession, placeOrder, updateCartShippingAddress, createGuestCustomer } from "@/lib/actions";
import { useCart } from "@/lib/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionState, useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  AlertCircle,
  ArrowRight,
  Building2,
  Home,
  Landmark,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import dynamic from 'next/dynamic';
import { n8nFetcher } from "@/hooks/useN8nQuery";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Dynamically import map component with no SSR
const MapLocationPicker = dynamic(
  () => import('@/components/map-location-picker').then(mod => mod.MapLocationPicker),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" /> }
);

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2" disabled={pending}>
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <>Place Order <ArrowRight className="h-4 w-4" /></>}
    </Button>
  );
}

// Payment Methods - Only COD enabled
const PAYMENT_METHODS = [
  { id: "cod", name: "Cash on Delivery", icon: Banknote, description: "Pay when you receive your order", enabled: true },
  { id: "gcash", name: "GCash", icon: CreditCard, description: "Pay via GCash wallet", enabled: false, comingSoon: true },
  { id: "maya", name: "Maya", icon: Building2, description: "Pay via Maya wallet", enabled: false, comingSoon: true }
];

const REGION_CODE = "08"; // Eastern Visayas

// Types
interface AddressFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  address_1: string;
  city: string;
  postal_code?: string;
  country_code: string;
  province: string;
  metadata: {
    barangay?: string;
    location_coordinates?: string | null;
    location_address?: string | null;
  };
}

interface CheckoutFormProps {
  cart: any;
}

export function CheckoutForm({ cart: cartProp }: CheckoutFormProps) {
  const cart = cartProp;
  
  const [state, formAction] = useActionState(placeOrder, null);
  
  // Customer state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: "", 
    last_name: "", 
    email: "", 
    phone: "", 
    address_1: "", 
    notes: ""
  });
  
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");
  
  // UI state
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [barangays, setBarangays] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const updateTimeout = useRef<NodeJS.Timeout>();
  const initialPopulateDone = useRef(false);
  const lastUpdateRef = useRef<string>("");

  // Populate form from cart data
  useEffect(() => {
    if (!cart?.shipping_address || initialPopulateDone.current) return;
    
    const addr = cart.shipping_address;
    setFormData({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      email: addr?.metadata.email || cart.email || "",
      phone: addr.phone || "",
      address_1: addr.address_1 || "",
      notes: ""
    });
    
    if (addr.city) setSelectedCity(addr.city);
    if (addr.metadata?.barangay) setSelectedBarangay(addr.metadata.barangay);
    
    if (addr.metadata?.location_coordinates) {
      const [lat, lng] = addr.metadata.location_coordinates.split(',');
      setSelectedLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: addr.metadata?.location_address || ""
      });
    }
    
    initialPopulateDone.current = true;
  }, [cart]);

  // Auto-create guest customer when personal info is complete
  const autoCreateGuestCustomer = useCallback(async () => {
    if (customerId || isCreatingCustomer || customerError) return;
    
    const hasRequiredPersonal = formData.first_name.trim() && formData.last_name.trim() && formData.phone.trim();
    
    if (!hasRequiredPersonal) return;
    
    setIsCreatingCustomer(true);
    setCustomerError(null);
    
    try {
      const customer = await createGuestCustomer({
        email: formData.email || undefined,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      });
      
      if (customer?.id) {
        setCustomerId(customer.id);
        console.log("Guest customer created:", customer.id);
      } else if (customer?.error) {
        setCustomerError(customer.error);
      }
    } catch (error: any) {
      console.error("Error creating guest customer:", error);
      setCustomerError(error.message || "Failed to create customer");
    } finally {
      setIsCreatingCustomer(false);
    }
  }, [formData.first_name, formData.last_name, formData.phone, formData.email, customerId, isCreatingCustomer, customerError]);

  // Trigger customer creation when personal info is complete (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoCreateGuestCustomer();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [formData.first_name, formData.last_name, formData.phone, autoCreateGuestCustomer]);

  // Update cart shipping address automatically
  const updateCartData = useCallback(async () => {
    const hasRequiredAddress = selectedCity && selectedBarangay && formData.address_1.trim();
    const hasRequiredPersonal = formData.first_name.trim() && formData.last_name.trim() && formData.phone.trim();
    
    if (!hasRequiredAddress || !hasRequiredPersonal || !cart?.id) return;

    // Create a unique hash of current data to prevent duplicate updates
    const updateHash = `${formData.first_name}|${formData.last_name}|${formData.phone}|${formData.address_1}|${selectedCity}|${selectedBarangay}|${selectedLocation?.lat}|${selectedLocation?.lng}`;
    if (lastUpdateRef.current === updateHash) return;
    lastUpdateRef.current = updateHash;

    setIsUpdatingCart(true);
    setUpdateSuccess(false);

    const shippingAddress: AddressFormData | any = {
      id: cart?.shipping_address_id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      address_1: formData.address_1.trim(),
      city: selectedCity,
      postal_code: "",
      country_code: "ph",
      province: REGION_CODE,
      email: formData.email || undefined,
      phone: formData.phone.trim(),
      metadata: {
        email: formData.email || undefined,
        barangay: selectedBarangay,
        location_coordinates: selectedLocation ? `${selectedLocation.lat},${selectedLocation.lng}` : null,
        location_address: selectedLocation?.address || null
      }
    };

    try {
      await updateCartShippingAddress(cart.id, shippingAddress);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating cart:", error);
      setErrors(prev => ({ ...prev, cart_update: "Failed to update shipping address" }));
    } finally {
      setIsUpdatingCart(false);
    }
  }, [cart?.id, formData, selectedCity, selectedBarangay, selectedLocation]);

  // Debounced cart updates (1 second after user stops typing)
  useEffect(() => {
    if (updateTimeout.current) clearTimeout(updateTimeout.current);
    
    const hasRequiredData = formData.first_name.trim() && formData.last_name.trim() && formData.phone.trim() && 
                           formData.address_1.trim() && selectedCity && selectedBarangay;
    
    if (hasRequiredData) {
      updateTimeout.current = setTimeout(updateCartData, 1000);
    }
    
    return () => {
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
    };
  }, [formData, selectedCity, selectedBarangay, selectedLocation, updateCartData]);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await n8nFetcher({
          endpoint: '/webhook/get-citymun',
          method: "GET",
          params: { regCode: REGION_CODE }
        });
        if (response && Array.isArray(response)) {
          setCities(response.map((city: any) => ({
            value: city.citymun_code,
            label: city.citymun_desc
          })));
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setErrors(prev => ({ ...prev, cities: "Failed to load cities" }));
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch barangays when city changes
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!selectedCity) {
        setBarangays([]);
        setSelectedBarangay("");
        return;
      }
      
      setIsLoadingBarangays(true);
      try {
        const response = await n8nFetcher({
          endpoint: '/webhook/get-barangays',
          method: "GET",
          params: { citymun_code: selectedCity }
        });
        if (response && Array.isArray(response)) {
          setBarangays(response.map((barangay: any) => ({
            value: barangay.psgc_code,
            label: barangay.barangay_desc
          })));
        }
      } catch (error) {
        console.error("Error fetching barangays:", error);
        setErrors(prev => ({ ...prev, barangays: "Failed to load barangays" }));
        setBarangays([]);
      } finally {
        setIsLoadingBarangays(false);
      }
    };
    fetchBarangays();
  }, [selectedCity]);

  // Initialize payment session (COD only)
  useEffect(() => {
    const initPayment = async () => {
      if (!cart?.id || paymentInitialized || isInitializingPayment) return;
      
      setIsInitializingPayment(true);
      try {
        const method = PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod);
        if (method && method.enabled) {
          await initiatePaymentSession(cart, { provider_id: "pp_system_default" });
          setPaymentInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing payment:", error);
        setErrors(prev => ({ ...prev, payment: "Failed to initialize payment" }));
      } finally {
        setIsInitializingPayment(false);
      }
    };
    
    initPayment();
  }, [cart, paymentInitialized, selectedPaymentMethod, isInitializingPayment]);

  // Validation with field tracking
  const validateField = useCallback((field: string, value: any): string => {
    switch (field) {
      case "first_name":
        return !value?.trim() ? "First name is required" : "";
      case "last_name":
        return !value?.trim() ? "Last name is required" : "";
      case "phone":
        if (!value?.trim()) return "Phone number is required";
        if (!/^(09|\+639)\d{9}$/.test(value.replace(/\s/g, ''))) return "Invalid Philippine number (e.g., 09123456789)";
        return "";
      case "address_1":
        return !value?.trim() ? "Street address is required" : "";
      case "city":
        return !value ? "Please select a city" : "";
      case "barangay":
        return !value ? "Please select a barangay" : "";
      case "location":
        return !value ? "Please pin your exact location on the map" : "";
      default:
        return "";
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    newErrors.first_name = validateField("first_name", formData.first_name);
    newErrors.last_name = validateField("last_name", formData.last_name);
    newErrors.phone = validateField("phone", formData.phone);
    newErrors.address_1 = validateField("address_1", formData.address_1);
    newErrors.city = validateField("city", selectedCity);
    newErrors.barangay = validateField("barangay", selectedBarangay);
    newErrors.location = validateField("location", selectedLocation);
    
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === "");
  }, [formData, selectedCity, selectedBarangay, selectedLocation, validateField]);

  // Handle input changes with validation
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, field === "city" ? selectedCity : field === "barangay" ? selectedBarangay : field === "location" ? selectedLocation : formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedBarangay("");
    if (errors.city) setErrors(prev => ({ ...prev, city: "" }));
  };

  const handleBarangayChange = (value: string) => {
    setSelectedBarangay(value);
    if (errors.barangay) setErrors(prev => ({ ...prev, barangay: "" }));
  };

  const handleLocationSelect = useCallback((location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location);
    if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async (formDataObj: FormData) => {
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allFields = ["first_name", "last_name", "phone", "address_1", "city", "barangay", "location"];
      allFields.forEach(field => setTouchedFields(prev => ({ ...prev, [field]: true })));
      return;
    }
    
    if (isUpdatingCart) {
      setErrors(prev => ({ ...prev, form: "Please wait, updating address..." }));
      return;
    }
    
    if (!cart?.id) {
      setErrors(prev => ({ ...prev, form: "Cart not found" }));
      return;
    }
    
    if (selectedPaymentMethod !== "cod") {
      setErrors(prev => ({ ...prev, form: "Only Cash on Delivery is available at this time" }));
      return;
    }
    
    if (!paymentInitialized && !isInitializingPayment) {
      setErrors(prev => ({ ...prev, form: "Payment not ready, please wait..." }));
      return;
    }
    
    formDataObj.set("cart_id", cart.id);
    formDataObj.set("first_name", formData.first_name.trim());
    formDataObj.set("last_name", formData.last_name.trim());
    if (formData.email) formDataObj.set("email", formData.email);
    formDataObj.set("phone", formData.phone.trim());
    formDataObj.set("address_1", formData.address_1.trim());
    if (formData.notes) formDataObj.set("notes", formData.notes);
    formDataObj.set("city_code", selectedCity);
    formDataObj.set("barangay_code", selectedBarangay);
    formDataObj.set("payment_method", selectedPaymentMethod);
    
    if (selectedLocation) {
      formDataObj.set("location_coordinates", `${selectedLocation.lat},${selectedLocation.lng}`);
      formDataObj.set("location_address", selectedLocation.address);
    }
    
    if (customerId) {
      formDataObj.set("customer_id", customerId);
    }
    
    formDataObj.set("payment_provider_id", "pp_system_default");
    
    formAction(formDataObj);
  }, [validateForm, isUpdatingCart, cart?.id, selectedPaymentMethod, paymentInitialized, isInitializingPayment, formData, selectedCity, selectedBarangay, selectedLocation, customerId, formAction]);

  // Handle successful order
  useEffect(() => {
    if (state?.success) {
      if (state.redirect_url) {
        window.location.href = state.redirect_url;
      } else if (state.order_id) {
        window.location.href = `/order/confirmation/${state.order_id}`;
      }
    }
  }, [state]);

  if (!cart) return null;

  const hasItems = cart.items && cart.items.length > 0;
  if (!hasItems) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-4">Please add items to your cart before checking out.</p>
              <Button onClick={() => window.location.href = '/shop'} variant="outline">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityLabel = cities.find(c => c.value === selectedCity)?.label || "";
  const barangayLabel = barangays.find(b => b.value === selectedBarangay)?.label || "";

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your order information</p>
      </div>

      {/* Status Indicators */}
      {isUpdatingCart && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-700">
            Saving your shipping information...
          </AlertDescription>
        </Alert>
      )}

      {updateSuccess && !isUpdatingCart && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Shipping address saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {isCreatingCustomer && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-700">
            Setting up your account...
          </AlertDescription>
        </Alert>
      )}

      {customerId && !isCreatingCustomer && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Account ready! You can now place your order.
          </AlertDescription>
        </Alert>
      )}

      {customerError && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {customerError}
          </AlertDescription>
        </Alert>
      )}

      {errors.form && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {errors.form}
          </AlertDescription>
        </Alert>
      )}

      <form action={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN - Customer Information & Shipping Address */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Delivery Information
                </CardTitle>
                <p className="text-sm text-muted-foreground">Tell us where to deliver your order</p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.first_name} 
                        onChange={(e) => handleChange("first_name", e.target.value)} 
                        onBlur={() => handleBlur("first_name")}
                        className={cn(errors.first_name && touchedFields.first_name && "border-red-500 focus-visible:ring-red-500")} 
                        placeholder="John"
                      />
                      {errors.first_name && touchedFields.first_name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.first_name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.last_name} 
                        onChange={(e) => handleChange("last_name", e.target.value)} 
                        onBlur={() => handleBlur("last_name")}
                        className={cn(errors.last_name && touchedFields.last_name && "border-red-500 focus-visible:ring-red-500")} 
                        placeholder="Doe"
                      />
                      {errors.last_name && touchedFields.last_name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Email <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          value={formData.email} 
                          onChange={(e) => handleChange("email", e.target.value)} 
                          className="pl-9" 
                          placeholder="you@example.com"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">For order updates (optional)</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Phone <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={(e) => handleChange("phone", e.target.value)} 
                          onBlur={() => handleBlur("phone")}
                          className={cn(errors.phone && touchedFields.phone && "border-red-500 focus-visible:ring-red-500", "pl-9")} 
                          placeholder="09123456789"
                        />
                      </div>
                      {errors.phone && touchedFields.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Delivery Address
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Street Address <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.address_1} 
                        onChange={(e) => handleChange("address_1", e.target.value)} 
                        onBlur={() => handleBlur("address_1")}
                        className={cn(errors.address_1 && touchedFields.address_1 && "border-red-500 focus-visible:ring-red-500")} 
                        placeholder="House number, street, subdivision"
                      />
                      {errors.address_1 && touchedFields.address_1 && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {errors.address_1}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City <span className="text-red-500">*</span></Label>
                        <Combobox 
                          options={cities} 
                          value={selectedCity} 
                          onChange={handleCityChange} 
                          placeholder="Search city..." 
                          isLoading={isLoadingCities} 
                        />
                        {errors.city && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.city}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Barangay <span className="text-red-500">*</span></Label>
                        <Combobox 
                          options={barangays} 
                          value={selectedBarangay} 
                          onChange={handleBarangayChange} 
                          placeholder={selectedCity ? "Search barangay..." : "Select city first"} 
                          disabled={!selectedCity} 
                          isLoading={isLoadingBarangays} 
                        />
                        {errors.barangay && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {errors.barangay}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Map Location Picker */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Home className="h-3 w-3" />
                    Exact Pin Location <span className="text-red-500">*</span>
                  </h3>
                  <div className={cn("space-y-3", errors.location && "border-red-500 rounded-lg")}>
                    <MapLocationPicker 
                      onLocationSelect={handleLocationSelect}
                      initialLocation={selectedLocation || undefined}
                      barangayName={barangayLabel}
                      cityName={cityLabel}
                    />
                    {errors.location && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.location}
                      </p>
                    )}
                    {selectedLocation && !errors.location && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" /> Delivery location pinned successfully
                        </p>
                        <p className="text-xs text-green-600 mt-1 truncate">{selectedLocation.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Order Notes & Payment Method */}
          <div className="space-y-6">
            {/* Order Notes */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  Special Instructions
                </CardTitle>
                <p className="text-sm text-muted-foreground">Help our rider find you faster</p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Textarea 
                  value={formData.notes} 
                  onChange={(e) => handleChange("notes", e.target.value)} 
                  placeholder="Examples: Landmark near your location, gate color, preferred delivery time, etc." 
                  className="min-h-[150px] resize-none" 
                />
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  This helps our rider locate you accurately
                </p>
              </CardContent>
            </Card>

            {/* Payment Method */}
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
                          <div className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            method.enabled && selectedPaymentMethod === method.id ? "bg-primary text-white" : "bg-gray-100 text-gray-500",
                            !method.enabled && "bg-gray-200 text-gray-400"
                          )}>
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
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                              selectedPaymentMethod === method.id ? "border-primary bg-primary" : "border-gray-300"
                            )}>
                              {selectedPaymentMethod === method.id && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>

                {/* COD Info */}
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <Banknote className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Pay in cash when your order arrives. Please prepare exact amount if possible for faster delivery.</span>
                  </p>
                </div>

                {errors.payment && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                    {errors.payment}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <input type="hidden" name="cart_id" value={cart.id} />
        <input type="hidden" name="city_name" value={cityLabel} />
        <input type="hidden" name="barangay_name" value={barangayLabel} />
        <input type="hidden" name="payment_provider_id" value="pp_system_default" />
        
        <SubmitButton />

        {state?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}