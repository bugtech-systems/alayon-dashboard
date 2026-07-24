// app/onboarding/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  User,
  CheckCircle,
  MapPin,
  Navigation,
  ArrowRight,
  Search,
  LocateFixed,
  Loader2,
  Store,
  Clock,
  Package,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Server actions (Medusa v2 API)
import { listMunicipalities, listBarangays } from '@/lib/actions/regions';

// ---------- Simple Map Component (client only) ----------
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), { ssr: false });

// ---------- Types ----------
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

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  municipalityId: string;
  municipalityName: string;
  municipalityCode: string;
  barangayId: string;
  barangayName: string;
  barangayCode: string;
  coordinates: { lat: number; lng: number } | null;
}

interface UserLocation {
  municipality: string;
  municipalityId: string;
  municipalityCode: string;
  barangay: string;
  barangayId: string;
  barangayCode: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  fullName: string;
  phone: string;
  email: string;
  timestamp: number;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [municipalitySearchOpen, setMunicipalitySearchOpen] = useState(false);
  const [barangaySearchOpen, setBarangaySearchOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    municipalityId: '',
    municipalityName: '',
    municipalityCode: '',
    barangayId: '',
    barangayName: '',
    barangayCode: '',
    coordinates: null,
  });

  // Check for existing location in localStorage
  // useEffect(() => {
  //   const savedLocation = localStorage.getItem('userLocation');
  //   if (savedLocation) {
  //     const location: UserLocation = JSON.parse(savedLocation);
  //     const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  //     if (Date.now() - location.timestamp < thirtyDays) {
  //       router.push('/catalog');
  //     }
  //   }
  // }, [router]);

  // Fetch municipalities on mount
  useEffect(() => {
    fetchMunicipalities();
  }, []);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (formData.municipalityCode) {
      fetchBarangays(formData.municipalityCode);
    }
  }, [formData.municipalityCode]);

  const fetchMunicipalities = async () => {
    setIsLoadingMunicipalities(true);
    try {
      const response = await listMunicipalities();
      // Handle different response shapes
      let data: Municipality[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && 'data' in response) {
        data = (response as any).data;
      } else if (response && 'municipalities' in response) {
        data = (response as any).municipalities;
      }
      setMunicipalities(data);
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    } finally {
      setIsLoadingMunicipalities(false);
    }
  };

  const fetchBarangays = async (citymunCode: string) => {
    setIsLoadingBarangays(true);
    try {
      const response = await listBarangays(citymunCode);
      let data: Barangay[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && 'data' in response) {
        data = (response as any).data;
      } else if (response && 'barangays' in response) {
        data = (response as any).barangays;
      }
      setBarangays(data);
    } catch (error) {
      console.error('Error fetching barangays:', error);
    } finally {
      setIsLoadingBarangays(false);
    }
  };

  // Helper: set user location cookie (for middleware)
  const setUserLocationCookie = (location: UserLocation) => {
    document.cookie = `userLocation=${encodeURIComponent(
      JSON.stringify(location)
    )}; path=/; max-age=2592000; SameSite=Lax`;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMunicipalitySelect = (municipality: Municipality) => {
    setFormData(prev => ({
      ...prev,
      municipalityId: municipality.id,
      municipalityName: municipality.citymun_desc,   // display name
      municipalityCode: municipality.citymun_code,    // code for fetching brgy
      barangayId: '',
      barangayName: '',
      barangayCode: '',
    }));
    setMunicipalitySearchOpen(false);
  };

  const handleBarangaySelect = (barangay: Barangay) => {
    setFormData(prev => ({
      ...prev,
      barangayId: barangay.id,
      barangayName: barangay.barangay_desc,   // display name
      barangayCode: barangay.psgc_code,       // or citymun_code if needed
    }));
    setBarangaySearchOpen(false);
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please allow location access to pin your exact location';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      }
    );
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng },
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && formData.firstName && formData.lastName && formData.phone) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && formData.address && formData.municipalityId && formData.barangayId) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userLocation: UserLocation = {
      municipality: formData.municipalityName,
      municipalityId: formData.municipalityId,
      municipalityCode: formData.municipalityCode,
      barangay: formData.barangayName,
      barangayId: formData.barangayId,
      barangayCode: formData.barangayCode,
      address: formData.address,
      coordinates: formData.coordinates,
      fullName: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      email: formData.email,
      timestamp: Date.now(),
    };

    // Save to localStorage and cookie
    localStorage.setItem('userLocation', JSON.stringify(userLocation));
    setUserLocationCookie(userLocation);

    // (Optional) If you want to create a Medusa customer, call your server action here
    // await createCustomer(userLocation);

    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    // router.push('/');
  };

  const isStep1Valid = formData.firstName && formData.lastName && formData.phone;
  const isStep2Valid = formData.address && formData.municipalityId && formData.barangayId;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-sm mb-4">
            <Store className="w-4 h-4" />
            <span>Welcome to Alayon Store</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tell us about yourself
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Help us provide you with accurate product availability and personalised recommendations.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, title: 'Contact', icon: User },
                { step: 2, title: 'Address', icon: MapPin },
                { step: 3, title: 'Pin', icon: Navigation },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex-1 text-center">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        currentStep >= step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {step < 3 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                    <p className="text-xs text-gray-500 hidden sm:block">{title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">
                {currentStep === 1 && 'Contact Information'}
                {currentStep === 2 && 'Delivery Address'}
                {currentStep === 3 && 'Pin Your Exact Location'}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && 'Let us know how to reach you'}
                {currentStep === 2 && 'Where should we deliver your orders?'}
                {currentStep === 3 && 'Pin your exact location for accurate delivery'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Contact Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={e => handleInputChange('firstName', e.target.value)}
                          placeholder="Juan"
                          required
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={e => handleInputChange('lastName', e.target.value)}
                          placeholder="Dela Cruz"
                          required
                          className="bg-gray-50 border-gray-200"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        placeholder="juan@example.com"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="09123456789"
                        required
                        className="bg-gray-50 border-gray-200"
                      />
                      <p className="text-xs text-gray-400 mt-1">We'll send order updates via SMS</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Delivery Address */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="address">Street Address / Building / Unit *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={e => handleInputChange('address', e.target.value)}
                        placeholder="123 Main Street, Building, Floor, Unit"
                        required
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>

                    {/* Municipality Combobox */}
                    <div>
                      <Label>Municipality / City *</Label>
                      <Popover open={municipalitySearchOpen} onOpenChange={setMunicipalitySearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-gray-50 border-gray-200"
                          >
                            {formData.municipalityName || 'Select Municipality'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search municipality..." />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingMunicipalities ? 'Loading...' : 'No municipality found.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {municipalities.map(municipality => (
                                  <CommandItem
                                    key={municipality.id}
                                    value={municipality.citymun_desc}
                                    onSelect={() => handleMunicipalitySelect(municipality)}
                                  >
                                    <CheckCircle
                                      className={`mr-2 h-4 w-4 ${
                                        formData.municipalityId === municipality.id
                                          ? 'opacity-100 text-blue-600'
                                          : 'opacity-0'
                                      }`}
                                    />
                                    {municipality.citymun_desc}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Barangay Combobox */}
                    <div>
                      <Label>Barangay *</Label>
                      <Popover open={barangaySearchOpen} onOpenChange={setBarangaySearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between bg-gray-50 border-gray-200"
                            disabled={!formData.municipalityId}
                          >
                            {formData.barangayName ||
                              (formData.municipalityId
                                ? 'Select Barangay'
                                : 'Select Municipality first')}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search barangay..." />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingBarangays ? 'Loading...' : 'No barangay found.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {barangays.map(barangay => (
                                  <CommandItem
                                    key={barangay.id}
                                    value={barangay.barangay_desc}
                                    onSelect={() => handleBarangaySelect(barangay)}
                                  >
                                    <CheckCircle
                                      className={`mr-2 h-4 w-4 ${
                                        formData.barangayId === barangay.id
                                          ? 'opacity-100 text-blue-600'
                                          : 'opacity-0'
                                      }`}
                                    />
                                    {barangay.barangay_desc}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {formData.municipalityName && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                          {formData.municipalityName === 'TACLOBAN CITY (Capital)'
                            ? '✓ Same-day delivery available for orders before 10 AM!'
                            : 'Delivery available within 2-3 business days'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Step 3: Pin Location */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Exact Location</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={isLocating}
                          className="border-gray-200"
                        >
                          <LocateFixed className="w-4 h-4 mr-2" />
                          {isLocating ? 'Getting Location...' : 'Get My Location'}
                        </Button>
                      </div>

                      {/* Simple interactive map */}
                      <div className="rounded-lg overflow-hidden" style={{ height: '300px' }}>
                          <SimpleMap
                            autoLocate          // optional, defaults to true
                            center={
                              formData.coordinates
                                ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng }
                                : undefined
                            }
                            onLocationChange={handleLocationChange}
                          />
                      </div>

                      {locationError && (
                        <p className="text-xs text-red-600 mt-2">{locationError}</p>
                      )}

                      {formData.coordinates && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-green-800">
                              Location pinned! Lat: {formData.coordinates.lat.toFixed(5)}, Lng:{' '}
                              {formData.coordinates.lng.toFixed(5)}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-3">
                        Your exact location helps us provide accurate delivery estimates and show
                        products available in your area.
                      </p>
                    </div>

                    {/* Delivery benefits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Real-time delivery tracking</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Area-specific product availability</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex-1 border-gray-200"
                    >
                      Back
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        (currentStep === 1 && !isStep1Valid) ||
                        (currentStep === 2 && !isStep2Valid)
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Complete Registration
                          <CheckCircle className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By registering, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}