// components/location/location-dialog-wrapper.tsx
"use client";

import { useLocation } from "@/lib/context/LocationContext";
import { LocationDialog } from "./LocationDialog";

export function LocationDialogWrapper() {
  const { showLocationDialog, setShowLocationDialog } = useLocation();
  return (
    <LocationDialog 
      open={showLocationDialog} 
      onOpenChange={setShowLocationDialog}
    />
  );
}