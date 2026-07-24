// components/SimpleMap.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle } from 'lucide-react';

// ----------------------------------------------------------------------
// Fix Leaflet default icons
// ----------------------------------------------------------------------
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface SimpleMapProps {
  center?: { lat: number; lng: number };
  autoLocate?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

// ----------------------------------------------------------------------
// Center updater – pans the map to the current pin
// ----------------------------------------------------------------------
function CenterUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom(), { duration: 0.5 });
  }, [map, position]);
  return null;
}

// ----------------------------------------------------------------------
// Click handler
// ----------------------------------------------------------------------
function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SimpleMap({
  center,
  autoLocate = true,
  onLocationChange,
}: SimpleMapProps) {
  const defaultFallback: [number, number] = [11.2426, 125.0000]; // Tacloban City (better default)
  // If you prefer a different fallback, change these coordinates.

  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<[number, number]>(defaultFallback);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showAccuracyWarning, setShowAccuracyWarning] = useState(false);

  const watchId = useRef<number | null>(null);

  // Mount guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ------ High‑accuracy auto‑locate using watchPosition ------
  useEffect(() => {
    if (!isMounted || !autoLocate) return;

    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setLocateError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,   // wait up to 20 seconds for a good fix
      maximumAge: 0,     // always get a fresh position
    };

    // Use watchPosition to continuously try until accuracy is good enough
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition([latitude, longitude]);
        setAccuracy(accuracy);

        // If accuracy is better than 50 meters, we can stop watching
        if (accuracy <= 50) {
          if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
          setLocating(false);
          setShowAccuracyWarning(false);
        } else {
          // Low accuracy – warn user but keep watching
          setShowAccuracyWarning(true);
        }

        // Always inform parent of the latest position
        onLocationChange?.(latitude, longitude);
      },
      (err) => {
        let msg = 'Unable to get your exact location';
        if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied – please enable it or pin manually';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable';
        if (err.code === err.TIMEOUT) msg = 'Location request timed out – try again or pin manually';
        setLocateError(msg);
        setLocating(false);
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      },
      options
    );

    // Fallback: if after 10 seconds we still have low accuracy, stop watching and warn
    const fallbackTimer = setTimeout(() => {
      if (locating && accuracy && accuracy > 100) {
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
        setLocating(false);
        setShowAccuracyWarning(true);
      }
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isMounted, autoLocate]);

  // ------ Sync from parent `center` prop (e.g. manual "Get My Location" button) ------
  useEffect(() => {
    if (!center || !isMounted) return;
    const cur = position[0].toFixed(6) + ',' + position[1].toFixed(6);
    const next = center.lat.toFixed(6) + ',' + center.lng.toFixed(6);
    if (cur === next) return;
    setPosition([center.lat, center.lng]);
    // If parent provides a manual location, we can stop auto‑locating
    setLocating(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, [center, isMounted, position]);

  // ------ Marker drag ------
  const handleDragEnd = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker;
      const latlng = marker.getLatLng();
      const lat = latlng.lat;
      const lng = latlng.lng;
      setPosition([lat, lng]);
      onLocationChange?.(lat, lng);
    },
    [onLocationChange]
  );

  // ------ Map click ------
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      onLocationChange?.(lat, lng);
    },
    [onLocationChange]
  );

  return (
    <div className="relative w-full h-full">
      {/* Locating overlay */}
      {locating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Finding your exact location…</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {locateError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-xs shadow-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{locateError}</span>
        </div>
      )}

      {/* Low accuracy warning */}
      {showAccuracyWarning && !locating && !locateError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-xs shadow-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            GPS accuracy is low (±{accuracy ? Math.round(accuracy) : '?'}m). Please drag the pin to your exact delivery location.
          </span>
        </div>
      )}

      {/* Map */}
      {isMounted ? (
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CenterUpdater position={position} />
          {/* Accuracy circle */}
          {accuracy && accuracy > 0 && (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.1,
              }}
            />
          )}
          <Marker
            position={position}
            draggable
            eventHandlers={{ dragend: handleDragEnd }}
          />
          <MapClickHandler onLocationChange={handleMapClick} />
        </MapContainer>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-sm">
          Loading map…
        </div>
      )}
    </div>
  );
}