// components/hero-section.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Store,
  Truck,
  Droplets,
  Flame,
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  Users,
  Zap,
  UtensilsCrossed,
  Scissors,
  Wrench,
  Coffee,
  Gift,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "@/lib/context/LocationContext";
import { LocationDialog } from "@/components/location/LocationDialog";
import { useState } from "react";

export const HeroSection = () => {
  const { userLocation } = useLocation();
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const locationLabel = userLocation
    ? `${userLocation.barangay}, ${userLocation.municipality}`
    : "Set your location";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#E0F7FA] via-white to-[#F0F9FF]">
      {/* Decorative Emoji (subtle) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl">💧</div>
        <div className="absolute bottom-20 right-20 text-7xl">🫧</div>
        <div className="absolute top-1/3 right-1/4 text-5xl">🧺</div>
      </div>

      {/* Animated blobs – blue only */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BAE6FD] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#7DD3FC] rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-[#BAE6FD] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column – Text */}
          <div className="text-center lg:text-left">
            {/* Location Badge */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setLocationDialogOpen(true)}
              className="inline-flex items-center rounded-full bg-white/80 border border-[#BAE6FD] backdrop-blur-sm px-3 py-1.5 text-sm mb-6 hover:shadow-md transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#0284C7]" />
              <span className="text-[#0284C7] font-medium">{locationLabel}</span>
              <ArrowRight className="w-3 h-3 ml-1.5 text-[#0284C7]" />
            </motion.button>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] bg-clip-text text-transparent">
                Order & Reserve
              </span>
              <br />
              <span className="text-gray-900">from Local Partners</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-gray-600 max-w-xl lg:mx-0 mx-auto"
            >
              Discover the best local shops in your area. Order everyday essentials,
              book services, or reserve a table – all in one place. Fast delivery, instant confirmations.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/catalog">
                <Button
                  size="lg"
                  className="group bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#">
                <Button
                  disabled
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-6 text-base font-semibold border-2 border-[#BAE6FD] text-[#0284C7] hover:bg-[#E0F7FA] transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Become a Partner
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                <span>Verified Partners</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Zap className="w-4 h-4 text-[#0EA5E9]" />
                <span>Instant Reservations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Truck className="w-4 h-4 text-[#0284C7]" />
                <span>Same‑Day Delivery</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column – Category Cards (all blue-themed) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Restaurant */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-[#BAE6FD] hover:shadow-xl transition-shadow group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E0F7FA] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-[#0284C7]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Restaurants</h3>
                <p className="text-xs text-gray-500 mt-1">Order food • Reserve table</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-[#0284C7]">Order</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs font-medium text-[#0EA5E9]">Reserve</span>
                </div>
              </div>

              {/* Laundry */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-[#BAE6FD] hover:shadow-xl transition-shadow group cursor-pointer mt-4 sm:mt-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E0F7FA] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#0284C7]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Laundry</h3>
                <p className="text-xs text-gray-500 mt-1">Wash & Fold • Dry Clean</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-[#0284C7]">Order</span>
                </div>
              </div>

              {/* Water */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-[#BAE6FD] hover:shadow-xl transition-shadow group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E0F7FA] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-[#0284C7]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Water Refill</h3>
                <p className="text-xs text-gray-500 mt-1">Gallon • Bottles</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-[#0284C7]">Order</span>
                </div>
              </div>

              {/* Gas */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-[#BAE6FD] hover:shadow-xl transition-shadow group cursor-pointer mt-4 sm:mt-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E0F7FA] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#0284C7]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Gas</h3>
                <p className="text-xs text-gray-500 mt-1">LPG • Tank Refill</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs font-medium text-[#0284C7]">Order</span>
                </div>
              </div>
            </div>

            {/* Additional categories */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-100">
                <Coffee className="w-5 h-5 mx-auto text-[#0284C7]" />
                <p className="text-xs text-gray-600 mt-1">Café</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-100">
                <Scissors className="w-5 h-5 mx-auto text-[#0284C7]" />
                <p className="text-xs text-gray-600 mt-1">Salon</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-100">
                <Wrench className="w-5 h-5 mx-auto text-[#0284C7]" />
                <p className="text-xs text-gray-600 mt-1">Repair</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-100">
                <Gift className="w-5 h-5 mx-auto text-[#0284C7]" />
                <p className="text-xs text-gray-600 mt-1">Gifts</p>
              </div>
            </div>

            {/* Floating blobs */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#BAE6FD] rounded-full opacity-20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#7DD3FC] rounded-full opacity-20 blur-2xl" />
          </motion.div>
        </div>

        {/* Promise Banner – blue gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-[#BAE6FD]"
        >
          <div className="bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Same‑Day Delivery & Instant Reservations</h3>
                  <p className="text-sm text-white/80">
                    Order before 10 AM for same‑day delivery. Reserve services with real‑time availability.
                  </p>
                </div>
              </div>
              <Link href="#">
                <Button variant="secondary" className="bg-white text-[#0284C7] hover:bg-[#E0F7FA] rounded-full">
                  How It Works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Partner benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-gray-500"
        >
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            <span>Join 200+ local partners</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
            <span>Commission‑free for first month</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            <span>Dedicated partner support</span>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onSuccess={() => setLocationDialogOpen(false)}
      />
    </section>
  );
};