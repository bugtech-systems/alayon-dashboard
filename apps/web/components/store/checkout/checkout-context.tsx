"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from "react";
import { useActionState } from "react";
import {
  initiatePaymentSession,
  placeOrder,
  updateCartShippingAddress,
} from "@/lib/actions";
import { createGuestCustomer, getCustomerByPhone, getCustomerByPhoneOrEmail } from "@/lib/actions/customer";
import { n8nFetcher } from "@/hooks/useN8nQuery";
import { isValidPhilippinePhone } from "@/lib/utils/helpers";

const REGION_CODE = "08"; // Eastern Visayas

// Types (unchanged)
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

export type CheckoutContextType = {
  cart: any;
  customerId: string | null;
  isCreatingCustomer: boolean;
  customerError: string | null;
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    notes: string;
  };
  setFormField: (field: string, value: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedBarangay: string;
  setSelectedBarangay: (barangay: string) => void;
  selectedLocation: { lat: number; lng: number; address: string } | null;
  setSelectedLocation: (loc: any) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  cities: { value: string; label: string }[];
  barangays: { value: string; label: string }[];
  isLoadingCities: boolean;
  isLoadingBarangays: boolean;
  isUpdatingCart: boolean;
  updateSuccess: boolean;
  isInitializingPayment: boolean;
  paymentInitialized: boolean;
  errors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  setTouchedField: (field: string) => void;
  validateField: (field: string, value: any) => string;
  validateForm: () => boolean;
  handleSubmit: (formDataObj: FormData) => Promise<void>;
  orderState: any;
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({
  children,
  cart,
}: {
  children: React.ReactNode;
  cart: any;
}) {
  // --- Order state ---
  const [orderState, formAction] = useActionState(placeOrder, null);

  // --- Customer state ---
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Refs to prevent duplicate creation attempts
  const creationAttemptedForPhone = useRef<string>("");
  const isCreatingRef = useRef(false);
  const creationTimeoutRef = useRef<NodeJS.Timeout>();

  // --- Form state (unchanged) ---
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_1: "",
    notes: "",
  });
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cod");

  // --- UI state (unchanged) ---
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [barangays, setBarangays] = useState<{ value: string; label: string }[]>(
    []
  );
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Other refs for debouncing updates and initial population
  const updateTimeout = useRef<NodeJS.Timeout>();
  const initialPopulateDone = useRef(false);
  const lastUpdateRef = useRef<string>("");

  // --- Helper: set a single form field ---
  const setFormField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  // --- Populate form from cart shipping address (once) ---
  useEffect(() => {
    if (!cart?.shipping_address || initialPopulateDone.current) return;
    const addr = cart.shipping_address;
    setFormData({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      email: addr?.metadata?.email || cart.email || "",
      phone: addr.phone || "",
      address_1: addr.address_1 || "",
      notes: "",
    });

    const localData = localStorage.getItem("userLocation");
    if (localData) {
      try {
        const localCity = JSON.parse(localData);
        setSelectedCity(localCity.municipalityId);
        setSelectedBarangay(localCity.barangayId);
      } catch (e) {
        console.error("Error parsing userLocation", e);
      }
    }

    if (addr.city) setSelectedCity(addr.city);
    if (addr.metadata?.barangay) setSelectedBarangay(addr.metadata.barangay);

    if (addr.metadata?.location_coordinates) {
      const [lat, lng] = addr.metadata.location_coordinates.split(",");
      setSelectedLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: addr.metadata?.location_address || "",
      });
    }

    initialPopulateDone.current = true;
  }, [cart]);

  // --- Optimized: Auto-create / link customer using phone only ---
  const autoCreateGuestCustomer = useCallback(async () => {
    // Already have a customer linked? Stop.
    if (customerId) return;

    const phone = formData.phone.trim();
    const email = formData.email.trim();
    // Validate phone format
    if (!phone || !isValidPhilippinePhone(phone)) return;

    // Prevent duplicate creation for the same phone number
    if (creationAttemptedForPhone.current === phone) return;
    // Prevent concurrent calls
    if (isCreatingRef.current) return;

    // Ensure cart exists before we attempt to link (createGuestCustomer accepts cart_id)
    if (!cart?.id) return;

    // Mark that we are attempting for this phone
    creationAttemptedForPhone.current = phone;
    isCreatingRef.current = true;
    setIsCreatingCustomer(true);
    setCustomerError(null);

    try {
      // 1. Try to find existing customer by phone
      const existingCustomer = await getCustomerByPhoneOrEmail(phone, email);
      if (existingCustomer?.id) {
        setCustomerId(existingCustomer.id);
        console.log("Customer linked by phone:", existingCustomer.id);
        return;
      }

      // 2. Create new guest customer
      const newCustomer = await createGuestCustomer({
        phone: phone,
        first_name: formData.first_name.trim() || "Guest",
        last_name: formData.last_name.trim() || "",
        cart_id: cart.id,
        email
      });

      if (newCustomer?.id) {
        setCustomerId(newCustomer.id);

        console.log("New guest customer created by phone:", newCustomer.id);
      } else if (newCustomer?.error) {
        setCustomerError(newCustomer.error);
        // If creation failed, allow retry on next phone change
        creationAttemptedForPhone.current = "";
      }
    } catch (err) {
      console.error("Customer creation error:", err);
      setCustomerError("Unable to create customer with this phone number");
      // Allow retry
      creationAttemptedForPhone.current = "";
    } finally {
      setIsCreatingCustomer(false);
      isCreatingRef.current = false;
    }
  }, [customerId, formData.phone, formData.first_name, formData.last_name, cart?.id]);

  // Debounced trigger for customer creation (when phone changes)
  useEffect(() => {
    // Clear any pending creation
    if (creationTimeoutRef.current) {
      clearTimeout(creationTimeoutRef.current);
    }

    // Only schedule if we don't have a customer yet and phone is valid
    if (!customerId && formData.phone.trim() && isValidPhilippinePhone(formData.phone.trim())) {
      creationTimeoutRef.current = setTimeout(() => {
        autoCreateGuestCustomer();
      }, 800); // Wait 800ms after user stops typing
    }

    return () => {
      if (creationTimeoutRef.current) {
        clearTimeout(creationTimeoutRef.current);
      }
    };
  }, [formData.phone, customerId, autoCreateGuestCustomer]);

  // --- Update cart shipping address automatically (debounced) ---
  const updateCartData = useCallback(async () => {
    const hasRequiredAddress =
      selectedCity && selectedBarangay && formData.address_1.trim();
    const hasRequiredPersonal = formData.phone.trim();

    if (!hasRequiredAddress || !hasRequiredPersonal || !cart?.id) return;

    const updateHash = `${formData.first_name}|${formData.last_name}|${formData.phone}|${formData.email}|${formData.address_1}|${selectedCity}|${selectedBarangay}|${selectedLocation?.lat}|${selectedLocation?.lng}`;
    if (lastUpdateRef.current === updateHash) return;
    lastUpdateRef.current = updateHash;

    setIsUpdatingCart(true);
    setUpdateSuccess(false);

    const shippingAddress: AddressFormData = {
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
        location_coordinates: selectedLocation
          ? `${selectedLocation.lat},${selectedLocation.lng}`
          : null,
        location_address: selectedLocation?.address || null,
      },
    };

    try {
      await updateCartShippingAddress(cart.id, shippingAddress);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating cart:", error);
      setErrors((prev) => ({ ...prev, cart_update: "Failed to update shipping address" }));
    } finally {
      setIsUpdatingCart(false);
    }
  }, [
    cart?.id,
    cart?.shipping_address_id,
    formData,
    selectedCity,
    selectedBarangay,
    selectedLocation,
  ]);

  // Debounced cart updates (1 second after user stops typing)
  useEffect(() => {
    if (updateTimeout.current) clearTimeout(updateTimeout.current);

    const hasRequiredData =
      formData.phone.trim() &&
      formData.address_1.trim() &&
      selectedCity &&
      selectedBarangay;

    if (hasRequiredData) {
      updateTimeout.current = setTimeout(updateCartData, 1000);
    }

    return () => {
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
    };
  }, [
    formData.phone,
    formData.address_1,
    formData.first_name,
    formData.last_name,
    formData.email,
    selectedCity,
    selectedBarangay,
    selectedLocation,
    updateCartData,
  ]);

  // --- Fetch cities on mount ---
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await n8nFetcher({
          endpoint: "/webhook/get-citymun",
          method: "GET",
          params: { regCode: REGION_CODE },
        });
        if (response && Array.isArray(response)) {
          setCities(
            response.map((city: any) => ({
              value: city.citymun_code,
              label: city.citymun_desc,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setErrors((prev) => ({ ...prev, cities: "Failed to load cities" }));
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // --- Fetch barangays when city changes ---
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!selectedCity) {
        setBarangays([]);
        return;
      }

      setIsLoadingBarangays(true);
      try {
        const response = await n8nFetcher({
          endpoint: "/webhook/get-barangays",
          method: "GET",
          params: { citymun_code: selectedCity },
        });
        if (response && Array.isArray(response)) {
          setBarangays(
            response.map((barangay: any) => ({
              value: barangay.psgc_code,
              label: barangay.barangay_desc,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching barangays:", error);
        setErrors((prev) => ({ ...prev, barangays: "Failed to load barangays" }));
        setBarangays([]);
      } finally {
        setIsLoadingBarangays(false);
      }
    };
    fetchBarangays();
  }, [selectedCity]);

  // --- Initialize payment session (COD only) ---
  useEffect(() => {
    const initPayment = async () => {
      if (!cart?.id || paymentInitialized || isInitializingPayment) return;

      setIsInitializingPayment(true);
      try {
        await initiatePaymentSession(cart, { provider_id: "pp_system_default" });
        setPaymentInitialized(true);
      } catch (error) {
        console.error("Error initializing payment:", error);
        setErrors((prev) => ({ ...prev, payment: "Failed to initialize payment" }));
      } finally {
        setIsInitializingPayment(false);
      }
    };
    initPayment();
  }, [cart, paymentInitialized, isInitializingPayment]);

  // --- Validation (phone only required) ---
  const validateField = useCallback((field: string, value: any): string => {
    switch (field) {
      case "first_name":
      case "last_name":
        return "";
      case "phone":
        if (!value?.trim()) return "Phone number is required";
        if (!isValidPhilippinePhone(value)) return "Invalid Philippine number (e.g., 09123456789)";
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

    newErrors.phone = validateField("phone", formData.phone);
    newErrors.address_1 = validateField("address_1", formData.address_1);
    newErrors.city = validateField("city", selectedCity);
    newErrors.barangay = validateField("barangay", selectedBarangay);
    newErrors.location = validateField("location", selectedLocation);

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  }, [formData, selectedCity, selectedBarangay, selectedLocation, validateField]);

  const setTouchedField = useCallback((field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  // --- Submit handler ---
// Inside CheckoutProvider component, after all validations:

const handleSubmit = useCallback(
  async (formDataObj: FormData) => {
    if (!validateForm()) {
      const allFields = ["phone", "address_1", "city", "barangay", "location"];
      allFields.forEach((field) =>
        setTouchedFields((prev) => ({ ...prev, [field]: true }))
      );
      return;
    }

    if (isUpdatingCart) {
      setErrors((prev) => ({ ...prev, form: "Please wait, updating address..." }));
      return;
    }

    if (!cart?.id) {
      setErrors((prev) => ({ ...prev, form: "Cart not found" }));
      return;
    }

    if (selectedPaymentMethod !== "cod") {
      setErrors((prev) => ({
        ...prev,
        form: "Only Cash on Delivery is available at this time",
      }));
      return;
    }

    if (!paymentInitialized && !isInitializingPayment) {
      setErrors((prev) => ({ ...prev, form: "Payment not ready, please wait..." }));
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
      formDataObj.set(
        "location_coordinates",
        `${selectedLocation.lat},${selectedLocation.lng}`
      );
      formDataObj.set("location_address", selectedLocation.address);
    }

    if (customerId) {
      formDataObj.set("customer_id", customerId);
    }

    formDataObj.set("payment_provider_id", "pp_system_default");

    // ✅ Wrap server action in startTransition
    startTransition(() => {
      formAction(formDataObj);
    });
  },
  [
    validateForm,
    isUpdatingCart,
    cart?.id,
    selectedPaymentMethod,
    paymentInitialized,
    isInitializingPayment,
    formData,
    selectedCity,
    selectedBarangay,
    selectedLocation,
    customerId,
    formAction,
  ]
);

  // --- Redirect on successful order ---
  useEffect(() => {
    if (orderState?.success) {
      if (orderState.redirect_url) {
        window.location.href = orderState.redirect_url;
      } else if (orderState.order_id) {
        window.location.href = `/order/confirmation/${orderState.order_id}`;
      }
    }
  }, [orderState]);

  const value: CheckoutContextType = {
    cart,
    customerId,
    isCreatingCustomer,
    customerError,
    formData,
    setFormField,
    selectedCity,
    setSelectedCity,
    selectedBarangay,
    setSelectedBarangay,
    selectedLocation,
    setSelectedLocation,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cities,
    barangays,
    isLoadingCities,
    isLoadingBarangays,
    isUpdatingCart,
    updateSuccess,
    isInitializingPayment,
    paymentInitialized,
    errors,
    touchedFields,
    setTouchedField,
    validateField,
    validateForm,
    handleSubmit,
    orderState,
  };

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return ctx;
}