"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { MapLocationPicker } from "@/components/map-location-picker";
import { User, Mail, Phone, MapPin, Home, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckout } from "./checkout-context";

export default function Addresses() {
  const {
    formData,
    setFormField,
    selectedCity,
    setSelectedCity,
    selectedBarangay,
    setSelectedBarangay,
    selectedLocation,
    setSelectedLocation,
    cities,
    barangays,
    isLoadingCities,
    isLoadingBarangays,
    errors,
    touchedFields,
    setTouchedField,
    validateField,
  } = useCheckout();

  const cityLabel = cities.find((c) => c.value === selectedCity)?.label || "";
  const barangayLabel = barangays.find((b) => b.value === selectedBarangay)?.label || "";

  const handleBlur = (field: string) => {
    setTouchedField(field);
    // validation is already handled via context's validateField, but we need to trigger error display
  };

  return (
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
                onChange={(e) => setFormField("first_name", e.target.value)}
                onBlur={() => handleBlur("first_name")}
                className={cn(errors.first_name && touchedFields.first_name && "border-red-500")}
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
                onChange={(e) => setFormField("last_name", e.target.value)}
                onBlur={() => handleBlur("last_name")}
                className={cn(errors.last_name && touchedFields.last_name && "border-red-500")}
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
                  onChange={(e) => setFormField("email", e.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormField("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={cn(errors.phone && touchedFields.phone && "border-red-500", "pl-9")}
                  placeholder="09123456789"
                />
              </div>
              {errors.phone && touchedFields.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
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
                onChange={(e) => setFormField("address_1", e.target.value)}
                onBlur={() => handleBlur("address_1")}
                className={cn(errors.address_1 && touchedFields.address_1 && "border-red-500")}
                placeholder="House number, street, subdivision"
              />
              {errors.address_1 && touchedFields.address_1 && (
                <p className="text-xs text-red-500">{errors.address_1}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City <span className="text-red-500">*</span></Label>
                <Combobox
                  options={cities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  placeholder="Search city..."
                  isLoading={isLoadingCities}
                />
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label>Barangay <span className="text-red-500">*</span></Label>
                <Combobox
                  options={barangays}
                  value={selectedBarangay}
                  onChange={setSelectedBarangay}
                  placeholder={selectedCity ? "Search barangay..." : "Select city first"}
                  disabled={!selectedCity}
                  isLoading={isLoadingBarangays}
                />
                {errors.barangay && <p className="text-xs text-red-500">{errors.barangay}</p>}
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
              onLocationSelect={setSelectedLocation}
              initialLocation={selectedLocation || undefined}
              barangayName={barangayLabel}
              cityName={cityLabel}
            />
            {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
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
  );
}