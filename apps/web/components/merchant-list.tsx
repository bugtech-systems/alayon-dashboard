// components/merchant-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  Star,
  MapPin,
  Clock,
  Loader2,
  UtensilsCrossed,
  Droplets,
  Flame,
  Sparkles,
  Scissors,
  Wrench,
  Coffee,
  Gift,
  ShieldCheck,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface Partner {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  deliveryTime?: string;
  minOrder?: string;
  tags: string[];
  description: string;
  isOpen?: boolean;
}

// ---------- Sample Data ----------
const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "1",
    name: "Mang Juan's Kitchen",
    slug: "mang-juans-kitchen",
    category: "restaurant",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop&crop=center",
    coverImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=400&fit=crop",
    rating: 4.5,
    reviewCount: 127,
    distance: 1.2,
    deliveryTime: "25-35 min",
    minOrder: "₱150",
    tags: ["open-now", "best-seller"],
    description: "Authentic Filipino comfort food. Bulk orders for parties.",
    isOpen: true,
  },
  {
    id: "2",
    name: "QuickWash Laundry",
    slug: "quickwash-laundry",
    category: "laundry",
    logo: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 89,
    distance: 0.8,
    deliveryTime: "2-3 hrs pickup",
    minOrder: "₱100",
    tags: ["express", "eco-friendly"],
    description: "Wash & fold, dry cleaning, with free pickup.",
    isOpen: true,
  },
  {
    id: "3",
    name: "PureDrop Water Refilling",
    slug: "puredrop-water",
    category: "water",
    logo: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 203,
    distance: 2.5,
    deliveryTime: "Same day",
    minOrder: "1 gallon",
    tags: ["wholesale", "retail"],
    description: "Alkaline & mineral water. Gallon delivery.",
    isOpen: true,
  },
  {
    id: "4",
    name: "GasMo LPG Center",
    slug: "gasmo-lpg",
    category: "gas",
    logo: "https://images.unsplash.com/photo-1583863788434-e45cdb0e53a3?w=200&h=200&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1519219788971-8d9797e0928e?w=800&h=400&fit=crop",
    rating: 4.3,
    reviewCount: 45,
    distance: 3.1,
    deliveryTime: "1-2 hours",
    minOrder: "1 cylinder",
    tags: ["bulk", "refill"],
    description: "LPG tanks & refill. Delivery within Tacloban.",
    isOpen: true,
  },
  {
    id: "5",
    name: "Sizzling Plate Restaurant",
    slug: "sizzling-plate",
    category: "restaurant",
    logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop",
    rating: 4.7,
    reviewCount: 312,
    distance: 0.5,
    deliveryTime: "20-30 min",
    minOrder: "₱200",
    tags: ["popular", "reservation"],
    description: "Sizzling steak, seafood, and Filipino favorites.",
    isOpen: false,
  },
  {
    id: "6",
    name: "EcoBubbles Laundry",
    slug: "ecobubbles-laundry",
    category: "laundry",
    logo: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop",
    rating: 4.4,
    reviewCount: 67,
    distance: 1.8,
    deliveryTime: "24 hrs",
    tags: ["eco-friendly", "pickup"],
    description: "Eco-friendly laundry with natural detergents.",
    isOpen: true,
  },
  {
    id: "7",
    name: "Café Buzo",
    slug: "cafe-buzo",
    category: "cafe",
    logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop",
    rating: 4.9,
    reviewCount: 89,
    distance: 0.3,
    deliveryTime: "15-25 min",
    minOrder: "₱100",
    tags: ["reservation", "coffee"],
    description: "Specialty coffee & pastries. Reserve your table.",
    isOpen: true,
  },
  {
    id: "8",
    name: "Style & Cut Salon",
    slug: "style-cut-salon",
    category: "salon",
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
    rating: 4.2,
    reviewCount: 54,
    distance: 1.4,
    tags: ["reservation"],
    description: "Haircut, coloring, and grooming. Book an appointment.",
    isOpen: true,
  },
  {
    id: "9",
    name: "FixIt Repair Shop",
    slug: "fixit-repair",
    category: "repair",
    logo: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&h=200&fit=crop",
    rating: 4.0,
    reviewCount: 23,
    distance: 2.1,
    tags: ["reservation"],
    description: "Appliance repair & maintenance. Same-day service.",
    isOpen: false,
  },
  {
    id: "10",
    name: "GiftBox Express",
    slug: "giftbox-express",
    category: "gifts",
    logo: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop",
    rating: 4.8,
    reviewCount: 178,
    distance: 0.9,
    deliveryTime: "Same day",
    tags: ["popular", "gift"],
    description: "Curated gift boxes for any occasion. Same-day delivery.",
    isOpen: true,
  },
];

// ---------- Category icon mapping ----------
const categoryIcons: Record<string, React.ReactNode> = {
  restaurant: <UtensilsCrossed className="w-4 h-4" />,
  laundry: <Sparkles className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  gas: <Flame className="w-4 h-4" />,
  cafe: <Coffee className="w-4 h-4" />,
  salon: <Scissors className="w-4 h-4" />,
  repair: <Wrench className="w-4 h-4" />,
  gifts: <Gift className="w-4 h-4" />,
};

const categories = [
  { key: "all", label: "All Partners" },
  { key: "restaurant", label: "Restaurants" },
  { key: "laundry", label: "Laundry" },
  { key: "water", label: "Water" },
  { key: "gas", label: "Gas" },
  { key: "cafe", label: "Cafés" },
  { key: "salon", label: "Salon" },
  { key: "repair", label: "Repair" },
  { key: "gifts", label: "Gifts" },
];

// ---------- PartnerCard Component ----------
function PartnerCard({ partner, index }: { partner: Partner; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {partner.coverImage && (
        <div className="relative h-32 sm:h-40 overflow-hidden">
          <Image
            src={partner.coverImage}
            alt={partner.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden">
              {partner.logo ? (
                <Image src={partner.logo} alt={partner.name} width={48} height={48} className="object-cover" />
              ) : (
                <Store className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{partner.name}</h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {partner.distance ? `${partner.distance.toFixed(1)} km away` : "Nearby"}
              </p>
            </div>
          </div>
        </div>
      )}
      {!partner.coverImage && (
        <div className="flex items-center gap-3 p-4 pb-0">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            {partner.logo ? (
              <Image src={partner.logo} alt={partner.name} width={56} height={56} className="rounded-xl object-cover" />
            ) : (
              <Store className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{partner.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {partner.distance ? `${partner.distance.toFixed(1)} km` : "Nearby"}
            </p>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-xs">
            {categoryIcons[partner.category] || <Store className="w-3 h-3 mr-1" />}
            <span className="ml-1 capitalize">{partner.category}</span>
          </Badge>
          {partner.isOpen !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs border",
                partner.isOpen
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {partner.isOpen ? "Open" : "Closed"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{partner.description}</p>
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{partner.rating}</span>
            <span className="text-gray-500">({partner.reviewCount})</span>
          </div>
          {partner.deliveryTime && (
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{partner.deliveryTime}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {partner.category === "restaurant" || partner.category === "cafe" ? (
            <>
              <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                <Link href={`/order/${partner.slug}`}>Order Now</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Link href={`/reserve/${partner.slug}`}>Reserve</Link>
              </Button>
            </>
          ) : partner.category === "salon" || partner.category === "repair" ? (
            <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              <Link href={`/reserve/${partner.slug}`}>Book Now</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              <Link href={`/order/${partner.slug}`}>Order Now</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Loading Skeleton ----------
function PartnerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl p-4">
          <div className="h-32 bg-gray-200 rounded-xl mb-4" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ---------- Main MerchantList Component ----------
export function MerchantList({ region }: { region?: any }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const filtered =
        activeCategory === "all"
          ? SAMPLE_PARTNERS
          : SAMPLE_PARTNERS.filter((p) => p.category === activeCategory);
      setPartners(filtered);
    } catch (err) {
      setError("Failed to load partners. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600" />
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Local Partners
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Discover Nearby Businesses
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Order food, book services, and support your community.
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                activeCategory === cat.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-blue-100"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3 border border-blue-50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{partners.length}</span> partners
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Verified Partners
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Based on your location
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Real-time availability
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading && <PartnerGridSkeleton />}
        {error && (
          <div className="text-center py-16 bg-white rounded-xl">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPartners} variant="outline" className="border-blue-200 text-blue-600">
              Try Again
            </Button>
          </div>
        )}
        {!isLoading && !error && (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                : "space-y-3"
            )}
          >
            {partners.map((partner, index) => (
              <PartnerCard key={partner.id} partner={partner} index={index} />
            ))}
            {partners.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-xl">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No partners found</h3>
                <p className="text-gray-500">Try a different category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}