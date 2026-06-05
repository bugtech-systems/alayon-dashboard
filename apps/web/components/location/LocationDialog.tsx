// components/location/LocationDialog.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from '@/lib/context/LocationContext';
import { MapPin, Store, Truck, Loader2, CheckCircle, AlertCircle, Navigation, Home, Building2, ArrowRight, Map } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listBarangays, listMunicipalities } from '@/lib/actions/regions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { MapLocationPicker } from '@/components/map-location-picker';
import { createCustomer } from '@/lib/actions';

// Types
interface Municipality {
  id: string;
  psgc_code: string;
  name: string;
  citymun_desc: string;
  reg_desc: string;
  prov_code: string;
  citymun_code: string;
}

interface Barangay {
  id: string;
  psgc_code: string;
  name: string;
  barangay_desc: string;
  reg_desc: string;
  prov_code: string;
  citymun_code: string;
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  mapAddress: string;
}

export const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { setUserLocation } = useLocation();
  
  // Customer Details
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    coordinates: null,
    mapAddress: '',
  });
  
  // Location Data
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
  
  // UI States
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'customer' | 'location' | 'map'>('customer');

  // Load municipalities when dialog opens
  useEffect(() => {
    if (open) {
      loadMunicipalities();
    }
  }, [open]);

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMunicipality(null);
      setSelectedBarangay(null);
      setBarangays([]);
      setError('');
      setSuccess(false);
      setStep('customer');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        coordinates: null,
        mapAddress: '',
      });
    }
  }, [open]);

  // Load barangays when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      loadBarangays(selectedMunicipality.citymun_code);
    } else {
      setBarangays([]);
      setSelectedBarangay(null);
    }
  }, [selectedMunicipality]);

  const loadMunicipalities = async () => {
    setLoadingMunicipalities(true);
    setError('');
    
    try {
      const response = await listMunicipalities();
      console.log('Municipalities loaded:', response);
      
      let municipalitiesData: Municipality[] = [];
      if (Array.isArray(response)) {
        municipalitiesData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        municipalitiesData = (response as any).data;
      } else if (response && typeof response === 'object' && 'municipalities' in response) {
        municipalitiesData = (response as any).municipalities;
      }
      
      setMunicipalities(municipalitiesData);
    } catch (err) {
      setError('Failed to load municipalities. Please try again.');
      console.error('Error loading municipalities:', err);
    } finally {
      setLoadingMunicipalities(false);
    }
  };

  const loadBarangays = async (citymunCode: string) => {
    setLoadingBarangays(true);
    setError('');
    setSelectedBarangay(null);
    
    try {
      const response = await listBarangays(citymunCode);
      console.log('Barangays loaded:', response);
      
      let barangaysData: Barangay[] = [];
      if (Array.isArray(response)) {
        barangaysData = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        barangaysData = (response as any).data;
      } else if (response && typeof response === 'object' && 'barangays' in response) {
        barangaysData = (response as any).barangays;
      }
      
      setBarangays(barangaysData);
    } catch (err) {
      setError('Failed to load barangays. Please try again.');
      console.error('Error loading barangays:', err);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMunicipalityChange = (municipalityId: string) => {
    const municipality = municipalities.find(m => m.id === municipalityId);
    if (municipality) {
      setSelectedMunicipality(municipality);
    }
  };

  const handleBarangayChange = (barangayId: string) => {
    const barangay = barangays.find(b => b.id === barangayId);
    if (barangay) {
      setSelectedBarangay(barangay);
    }
  };

  const handleMapLocationSelect = useCallback((location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng },
      mapAddress: location.address,
    }));
  }, []);

  const handleNextStep = () => {
    if (step === 'customer' && formData.firstName && formData.lastName && formData.phone) {
      setStep('location');
    } else if (step === 'location' && selectedMunicipality && selectedBarangay) {
      setStep('map');
    }
  };

  const handleBackStep = () => {
    if (step === 'location') {
      setStep('customer');
    } else if (step === 'map') {
      setStep('location');
    }
  };

  const handleSubmit = async () => {
    if (selectedMunicipality && selectedBarangay) {
      setError('');
      
      // Save to local storage and context
      const userLocation = {
        municipality: selectedMunicipality.citymun_desc,
        municipalityId: selectedMunicipality.id,
        municipalityCode: selectedMunicipality.citymun_code,
        barangay: selectedBarangay.barangay_desc,
        barangayId: selectedBarangay.id,
        barangayCode: selectedBarangay.psgc_code,
        address: formData.address,
        fullAddress: `${formData.address}, ${selectedBarangay.barangay_desc}, ${selectedMunicipality.citymun_desc}`,
        coordinates: formData.coordinates,
        mapAddress: formData.mapAddress,
        fullName: `${formData.firstName} ${formData.lastName}`,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        timestamp: Date.now(),
      };
      
      let customer = await createCustomer(userLocation)
      

      console.log(userLocation, customer, 'CUSTOM')

      setUserLocation(userLocation);
      setSuccess(true);
      

      // Save to localStorage
      localStorage.setItem('userLocation', JSON.stringify(userLocation));
      
      // Set cookie for middleware
      document.cookie = `userLocation=${encodeURIComponent(JSON.stringify(userLocation))}; path=/; max-age=2592000; SameSite=Lax`;
      
      // Close dialog after showing success state
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }
  };

  const isCustomerFormValid = formData.firstName && formData.lastName && formData.phone;
  const isLocationFormValid = selectedMunicipality && selectedBarangay;

  // Transform municipalities for searchable select
  const municipalityOptions = municipalities.map(m => ({
    id: m.id,
    name: m.citymun_desc,
  }));

  // Transform barangays for searchable select
  const barangayOptions = barangays.map(b => ({
    id: b.id,
    name: b.barangay_desc,
  }));

  // Get barangay name for map
  const getBarangayName = () => {
    return selectedBarangay?.barangay_desc || '';
  };

  // Get city name for map
  const getCityName = () => {
    return selectedMunicipality?.citymun_desc || 'Tacloban City';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {step === 'customer' && 'Welcome to Alayon Store'}
              {step === 'location' && 'Select Your Location'}
              {step === 'map' && 'Pin Your Exact Location'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-gray-500">
            {step === 'customer' && 'Please tell us a bit about yourself so we can serve you better.'}
            {step === 'location' && 'Choose your municipality and barangay to see available products.'}
            {step === 'map' && 'Pin your exact location for accurate delivery estimates.'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Saved!</h3>
            <p className="text-sm text-gray-500">
              We'll show you products available in {selectedBarangay?.barangay_desc}, {selectedMunicipality?.citymun_desc}
            </p>
            {formData.coordinates && (
              <p className="text-xs text-gray-400 mt-2">
                📍 Exact location pinned for accurate delivery
              </p>
            )}
            <Button 
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
              }}
            >
              Start Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Step 1: Customer Details */}
            {step === 'customer' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-gray-100 shadow-sm">
                    <CardContent className="pt-4 pb-3 px-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500">Local Pricing</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">Area-specific rates</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-100 shadow-sm">
                    <CardContent className="pt-4 pb-3 px-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500">Delivery</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">Available in your area</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Juan"
                        className="mt-1 bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Dela Cruz"
                        className="mt-1 bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone Number *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="09123456789"
                      className="mt-1 bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email (Optional)</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="juan@example.com"
                      className="mt-1 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-800">
                        We'll use your contact details to send order updates and delivery confirmations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {step === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-gray-100 shadow-sm">
                    <CardContent className="pt-4 pb-3 px-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500">Local Pricing</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">Area-specific rates</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-100 shadow-sm">
                    <CardContent className="pt-4 pb-3 px-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-500">Delivery</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">Available in your area</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Street Address */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Street Address / Building / Unit</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street, Building, Floor, Unit"
                    className="mt-1 bg-gray-50 border-gray-200"
                  />
                </div>

                <Separator className="my-2" />

                {/* Municipality Searchable Select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Municipality / City *
                  </Label>
                  <SearchableSelect
                    options={municipalityOptions}
                    value={selectedMunicipality?.id || ''}
                    onValueChange={handleMunicipalityChange}
                    placeholder="Search for municipality..."
                    searchPlaceholder="Search municipality name..."
                    emptyMessage={loadingMunicipalities ? "Loading municipalities..." : "No municipality found."}
                    disabled={loadingMunicipalities}
                    loading={loadingMunicipalities}
                  />
                </div>

                {/* Barangay Searchable Select */}
                {selectedMunicipality && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Barangay *
                    </Label>
                    <SearchableSelect
                      options={barangayOptions}
                      value={selectedBarangay?.id || ''}
                      onValueChange={handleBarangayChange}
                      placeholder="Search for barangay..."
                      searchPlaceholder="Search barangay name..."
                      emptyMessage={
                        loadingBarangays 
                          ? "Loading barangays..." 
                          : barangays.length === 0 
                            ? "No barangay found for this municipality."
                            : "Select a barangay"
                      }
                      disabled={loadingBarangays || barangays.length === 0}
                      loading={loadingBarangays}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Selected Location Preview */}
                {selectedMunicipality && selectedBarangay && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-700 mb-1">Selected Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBarangay.barangay_desc}, {selectedMunicipality.citymun_desc}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Map Location Pinning */}
            {step === 'map' && selectedMunicipality && selectedBarangay && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Map className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Pin Your Delivery Location</span>
                  </div>

                  <MapLocationPicker
                    onLocationSelect={handleMapLocationSelect}
                    initialLocation={formData.coordinates || undefined}
                    barangayName={selectedBarangay.barangay_desc}
                    cityName={selectedMunicipality.citymun_desc}
                    placeholder="Search for a location..."
                  />

                  {formData.coordinates && formData.mapAddress && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-green-800 font-medium">Delivery Address</p>
                          <p className="text-sm text-gray-700 mt-1">{formData.mapAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <Navigation className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      Pinning your exact location helps our delivery riders find you faster and more accurately.
                      You can drag the pin to adjust your location.
                    </p>
                  </div>
                </div>

                {/* Delivery Benefits */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Real-time tracking</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Faster delivery</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {step === 'customer' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:bg-gray-50"
                    onClick={() => onOpenChange(false)}
                  >
                    Later
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleNextStep}
                    disabled={!isCustomerFormValid}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {step === 'location' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:bg-gray-50"
                    onClick={handleBackStep}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleNextStep}
                    disabled={!isLocationFormValid || loadingBarangays}
                  >
                    Continue to Map
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              {step === 'map' && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:bg-gray-50"
                    onClick={handleBackStep}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubmit}
                  >
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              {step === 'customer' && 'Your information helps us provide better service and order updates'}
              {step === 'location' && 'We\'ll use this to show you accurate pricing and delivery options'}
              {step === 'map' && 'Pin location is optional but recommended for faster delivery'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};