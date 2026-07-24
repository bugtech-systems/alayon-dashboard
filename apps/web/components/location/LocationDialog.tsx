// components/location/LocationDialog.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from '@/lib/context/LocationContext';
import {
  MapPin,
  Store,
  Truck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Navigation,
  Home,
  Building2,
  ArrowRight,
  Map,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listBarangays, listMunicipalities } from '@/lib/actions/regions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Separator } from '@/components/ui/separator';
import { createCustomer } from '@/lib/actions';
import { cn } from '@/lib/utils';

// ---------- Dynamic import of the improved map ----------
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), { ssr: false });

// Types (unchanged)
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

// ============================================
// STEP INDICATOR (unchanged)
// ============================================
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        return (
          <React.Fragment key={index}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isActive && 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30',
                  isCompleted && 'bg-green-500 text-white',
                  !isActive && !isCompleted && 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive && 'text-blue-600 dark:text-blue-400',
                  isCompleted && 'text-green-600 dark:text-green-400',
                  !isActive && !isCompleted && 'text-gray-400'
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('w-8 h-0.5', isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// CUSTOMER DETAILS STEP (unchanged)
// ============================================
const CustomerDetailsStep = ({
  formData,
  onChange,
  onNext,
  isValid,
}: {
  formData: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onNext: () => void;
  isValid: boolean;
}) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Local Pricing</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">Area-specific rates</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Delivery</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">Available in your area</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={formData.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="Juan"
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                autoFocus
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={formData.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Dela Cruz"
                className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="09123456789"
              className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              required
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-gray-400 text-xs">(Optional)</span>
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="juan@example.com"
              className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              We'll use your contact details to send order updates and delivery confirmations.
              Your information is secure and will only be used for order-related communications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOCATION SELECTION STEP (unchanged)
// ============================================
const LocationSelectionStep = ({
  selectedMunicipality,
  selectedBarangay,
  municipalities,
  barangays,
  formData,
  loadingMunicipalities,
  loadingBarangays,
  error,
  onMunicipalityChange,
  onBarangayChange,
  onAddressChange,
  onBack,
  onNext,
  isValid,
}: any) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100 bg-green-50/50 dark:bg-green-950/20 shadow-sm">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 dark:text-green-400">Accurate Pricing</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">Local rates applied</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/50 dark:bg-green-950/20 shadow-sm">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 dark:text-green-400">Faster Delivery</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">Quick dispatch</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Street Address / Building / Unit <span className="text-gray-400 text-xs">(Optional)</span>
        </Label>
        <div className="relative mt-1">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={formData.address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="123 Main Street, Building, Floor, Unit"
            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Municipality / City <span className="text-red-500">*</span>
        </Label>
        <SearchableSelect
          options={municipalities.map((m: any) => ({ id: m.id, name: m.citymun_desc }))}
          value={selectedMunicipality?.id || ''}
          onValueChange={onMunicipalityChange}
          placeholder="Search for municipality..."
          searchPlaceholder="Search municipality name..."
          emptyMessage={loadingMunicipalities ? 'Loading municipalities...' : 'No municipality found.'}
          disabled={loadingMunicipalities}
          loading={loadingMunicipalities}
          required
        />
      </div>

      {selectedMunicipality && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Barangay <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            options={barangays.map((b: any) => ({ id: b.id, name: b.barangay_desc }))}
            value={selectedBarangay?.id || ''}
            onValueChange={onBarangayChange}
            placeholder="Search for barangay..."
            searchPlaceholder="Search barangay name..."
            emptyMessage={
              loadingBarangays
                ? 'Loading barangays...'
                : barangays.length === 0
                ? 'No barangay found for this municipality.'
                : 'Select a barangay'
            }
            disabled={loadingBarangays || barangays.length === 0}
            loading={loadingBarangays}
            required
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedMunicipality && selectedBarangay && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Selected Location</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedBarangay.barangay_desc}, {selectedMunicipality.citymun_desc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAP PINNING STEP (REFINED – uses SimpleMap)
// ============================================
const MapPinningStep = ({
  selectedMunicipality,
  selectedBarangay,
  formData,
  onMapLocationSelect,
  onBack,
  onComplete,
  isComplete,
  isSubmitting,
}: any) => {
  const [error, setError] = useState('');

  // Callback from SimpleMap: gives us lat/lng
  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      // Simple address placeholder (could be improved with reverse geocoding)
      const address = `Dropped pin (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      onMapLocationSelect({ lat, lng, address });
      setError('');
    },
    [onMapLocationSelect]
  );

  const handleComplete = () => {
    if (!formData.coordinates) {
      setError('Please pin your exact location on the map before continuing.');
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Map className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Pin Your Delivery Location <span className="text-red-500">*</span>
          </span>
          <span className="text-xs text-red-500 ml-auto font-medium">Required</span>
        </div>

        {/* Replace MapLocationPicker with SimpleMap */}
        <div className="h-64 rounded-lg overflow-hidden border">
          <SimpleMap
            center={formData.coordinates || undefined}
            onLocationChange={handleLocationChange}
            autoLocate
          />
        </div>

        {formData.coordinates && formData.mapAddress ? (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-800 dark:text-green-300 font-medium">📍 Pinned Location</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                  {formData.mapAddress}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">Pin Your Location</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Click on the map or drag the pin to mark your exact delivery location. This is required for accurate
                  delivery.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
          <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Pinning your exact location helps our delivery riders find you faster and more accurately.
            You can drag the pin to adjust your location. This is mandatory for delivery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Truck className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Real-time tracking</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Accurate delivery</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUCCESS STEP (unchanged)
// ============================================
const SuccessStep = ({ selectedMunicipality, selectedBarangay, formData, onClose }: any) => {
  return (
    <div className="py-8 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Location Saved! 🎉</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">We'll show you products available in</p>
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 inline-block mx-auto">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {selectedBarangay?.barangay_desc}, {selectedMunicipality?.citymun_desc}
        </p>
      </div>
      {formData.coordinates && (
        <div className="mt-3">
          <p className="text-xs text-green-600 dark:text-green-400">📍 Exact location pinned for accurate delivery</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
          </p>
        </div>
      )}
      <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white" onClick={onClose} size="lg">
        Start Shopping
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT (logic unchanged)
// ============================================
export const LocationDialog: React.FC<LocationDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { setUserLocation } = useLocation();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    coordinates: null,
    mapAddress: '',
  });

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);

  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Customer', 'Location', 'Map'];

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && !success) {
        if (
          window.confirm(
            "You haven't completed setting up your location. This is required to continue. Are you sure you want to close?"
          )
        ) {
          onOpenChange(false);
        }
        return;
      }
      onOpenChange(newOpen);
    },
    [success, onOpenChange]
  );

  useEffect(() => {
    if (open) loadMunicipalities();
  }, [open]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSelectedMunicipality(null);
        setSelectedBarangay(null);
        setBarangays([]);
        setError('');
        setSuccess(false);
        setStep(0);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          coordinates: null,
          mapAddress: '',
        });
        setIsSubmitting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

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
      let data: Municipality[] = [];
      if (Array.isArray(response)) data = response;
      else if (response && typeof response === 'object' && 'data' in response) data = (response as any).data;
      else if (response && typeof response === 'object' && 'municipalities' in response)
        data = (response as any).municipalities;
      setMunicipalities(data);
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
      let data: Barangay[] = [];
      if (Array.isArray(response)) data = response;
      else if (response && typeof response === 'object' && 'data' in response) data = (response as any).data;
      else if (response && typeof response === 'object' && 'barangays' in response)
        data = (response as any).barangays;
      setBarangays(data);
    } catch (err) {
      setError('Failed to load barangays. Please try again.');
      console.error('Error loading barangays:', err);
    } finally {
      setLoadingBarangays(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMunicipalityChange = (municipalityId: string) => {
    const municipality = municipalities.find((m) => m.id === municipalityId);
    if (municipality) setSelectedMunicipality(municipality);
  };

  const handleBarangayChange = (barangayId: string) => {
    const barangay = barangays.find((b) => b.id === barangayId);
    if (barangay) setSelectedBarangay(barangay);
  };

  const handleMapLocationSelect = useCallback(
    (location: { lat: number; lng: number; address: string }) => {
      setFormData((prev) => ({
        ...prev,
        coordinates: { lat: location.lat, lng: location.lng },
        mapAddress: location.address,
      }));
    },
    []
  );

  const handleNextStep = () => {
    if (step === 0 && formData.firstName && formData.lastName && formData.phone) setStep(1);
    else if (step === 1 && selectedMunicipality && selectedBarangay) setStep(2);
  };

  const handleBackStep = () => {
    if (step > 0) setStep((prev) => (prev - 1) as 0 | 1 | 2);
  };

  const handleSubmit = async () => {
    if (!formData.coordinates) {
      setError('Please pin your exact location on the map before completing setup.');
      return;
    }
    if (!selectedMunicipality || !selectedBarangay) {
      setError('Please select your municipality and barangay.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
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
      await createCustomer(userLocation);
      setUserLocation(userLocation);
      localStorage.setItem('userLocation', JSON.stringify(userLocation));
      document.cookie = `userLocation=${encodeURIComponent(
        JSON.stringify(userLocation)
      )}; path=/; max-age=2592000; SameSite=Lax`;
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => onOpenChange(false), 2000);
    } catch (err) {
      setError('Failed to save location. Please try again.');
      console.error('Error saving location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustomerFormValid = formData.firstName && formData.lastName && formData.phone;
  const isLocationFormValid = selectedMunicipality && selectedBarangay;
  const isMapPinned = !!formData.coordinates;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogContent
          className={cn(
            'w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl',
            'max-h-[95vh] sm:max-h-[90vh]',
            'p-4 sm:p-6',
            'overflow-y-auto',
            'bg-white dark:bg-gray-900',
            'border-0 shadow-2xl',
            'rounded-xl sm:rounded-2xl',
            'transition-all duration-300'
          )}
          onInteractOutside={(e) => {
            if (!success) {
              e.preventDefault();
              if (
                window.confirm(
                  "You haven't completed setting up your location. This is required to continue. Are you sure you want to close?"
                )
              ) {
                // onOpenChange(false);
              }
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!success) {
              e.preventDefault();
              if (
                window.confirm(
                  "You haven't completed setting up your location. This is required to continue. Are you sure you want to close?"
                )
              ) {
                // onOpenChange(false);
              }
            }
          }}
        >
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {step === 0 && 'Welcome to Alayon Store'}
                {step === 1 && 'Select Your Location'}
                {step === 2 && 'Pin Your Exact Location'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {step === 0 && 'Please tell us a bit about yourself so we can serve you better.'}
              {step === 1 && 'Choose your municipality and barangay to see available products.'}
              {step === 2 && 'Pin your exact location for accurate delivery estimates.'}
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <SuccessStep
              selectedMunicipality={selectedMunicipality}
              selectedBarangay={selectedBarangay}
              formData={formData}
              onClose={() => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
              }}
            />
          ) : (
            <div className="space-y-6 py-2">
              <StepIndicator currentStep={step} steps={steps} />
              <div className="min-h-[300px] sm:min-h-[320px]">
                {step === 0 && (
                  <CustomerDetailsStep
                    formData={formData}
                    onChange={handleInputChange}
                    onNext={handleNextStep}
                    isValid={isCustomerFormValid}
                  />
                )}
                {step === 1 && (
                  <LocationSelectionStep
                    selectedMunicipality={selectedMunicipality}
                    selectedBarangay={selectedBarangay}
                    municipalities={municipalities}
                    barangays={barangays}
                    formData={formData}
                    loadingMunicipalities={loadingMunicipalities}
                    loadingBarangays={loadingBarangays}
                    error={error}
                    onMunicipalityChange={handleMunicipalityChange}
                    onBarangayChange={handleBarangayChange}
                    onAddressChange={(value: string) => handleInputChange('address', value)}
                    onBack={handleBackStep}
                    onNext={handleNextStep}
                    isValid={isLocationFormValid}
                  />
                )}
                {step === 2 && (
                  <MapPinningStep
                    selectedMunicipality={selectedMunicipality}
                    selectedBarangay={selectedBarangay}
                    formData={formData}
                    onMapLocationSelect={handleMapLocationSelect}
                    onBack={handleBackStep}
                    onComplete={handleSubmit}
                    isComplete={isMapPinned}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t dark:border-gray-800">
                {step === 0 && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleNextStep}
                    disabled={!isCustomerFormValid}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {step === 1 && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={handleBackStep}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleNextStep}
                      disabled={!isLocationFormValid || loadingBarangays}
                    >
                      Continue to Map
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={handleBackStep}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isMapPinned}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {step === 0 && '⚠️ Required: Please provide your contact details to continue'}
                {step === 1 && '⚠️ Required: Select your location to see available products'}
                {step === 2 && '⚠️ Required: Pin your exact location for accurate delivery'}
              </p>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};