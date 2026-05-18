// apps/web/components/ui/map-location-picker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Type definitions for Leaflet (to avoid importing directly)
type LeafletMap = any;
type LatLngExpression = [number, number];

interface MapLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
}

export function MapLocationPicker({ onLocationSelect, initialLocation }: MapLocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const defaultCenter: LatLngExpression = initialLocation 
    ? [initialLocation.lat, initialLocation.lng]
    : [11.2433, 125.0047]; // Default to Manila
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Leaflet only on client side
    const loadLeaflet = async () => {
      try {
        // Import Leaflet dynamically
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        
        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (mapContainerRef.current && !map) {
          // Initialize map
          const mapInstance = L.map(mapContainerRef.current).setView(defaultCenter, 13);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance);
          
          // Add marker on click
          let marker: any = null;
          mapInstance.on('click', async (e: any) => {
            const { lat, lng } = e.latlng;
            
            // Remove existing marker
            if (marker) {
              mapInstance.removeLayer(marker);
            }
            
            // Add new marker
            marker = L.marker([lat, lng]).addTo(mapInstance);
            
            // Reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              const address = data.display_name || `${lat}, ${lng}`;
              onLocationSelect({ lat, lng, address });
            } catch (error) {
              console.error("Error getting address:", error);
              onLocationSelect({ lat, lng, address: `${lat}, ${lng}` });
            }
          });
          
          setMap(mapInstance);
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };
    
    loadLeaflet();
    
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (typeof window !== 'undefined' && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.setView([latitude, longitude], 15);
            
            // Add marker at current location
            let marker: any = null;
            // Remove existing marker
            map.eachLayer((layer: any) => {
              if (layer instanceof (window as any).L.Marker) {
                map.removeLayer(layer);
              }
            });
            
            const L = await import('leaflet');
            marker = L.marker([latitude, longitude]).addTo(map);
            
            // Reverse geocoding
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              const address = data.display_name || `${latitude}, ${longitude}`;
              onLocationSelect({ lat: latitude, lng: longitude, address });
            } catch (error) {
              console.error("Error getting address:", error);
              onLocationSelect({ lat: latitude, lng: longitude, address: `${latitude}, ${longitude}` });
            }
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert("Unable to get your location. Please allow location access.");
        }
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by your browser");
    }
  };

  if (!isClient) {
    return (
      <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <MapPin className="h-8 w-8 text-muted-foreground/50" />
        <span className="ml-2 text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainerRef} 
        className="relative h-[300px] w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="shadow-md"
        >
          <Navigation className={cn("h-4 w-4 mr-2", isLocating && "animate-spin")} />
          {isLocating ? "Getting location..." : "Use my current location"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Click on the map to set your exact delivery location
      </p>
    </div>
  );
}