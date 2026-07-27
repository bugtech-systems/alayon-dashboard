// components/merchant-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Grid3X3,
  List,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface Company {
  id: string;
  name: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  handle: string;
  is_open?: boolean;
  metadata?: {
    category?: string;
  };
}

interface MerchantListProps {
  region?: any;
  companies?: Company[];
}

// ---------- Category icon mapping (optional) ----------
const categoryIcons: Record<string, React.ReactNode> = {
  restaurant: <Building2 className="w-4 h-4" />,
  water: <Building2 className="w-4 h-4" />,
  gas: <Building2 className="w-4 h-4" />,
  laundry: <Building2 className="w-4 h-4" />,
  salon: <Building2 className="w-4 h-4" />,
  repair: <Building2 className="w-4 h-4" />,
  gifts: <Building2 className="w-4 h-4" />,
  cafe: <Building2 className="w-4 h-4" />,
};

// ---------- Simplified PartnerCard ----------
function PartnerCard({ company, index }: { company: Company; index: number }) {
  const location = company.address || company.city || "Tacloban City";
  console.log(company, 'cOMP')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="group bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="p-5">
        {/* Logo / Icon & Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                width={56}
                height={56}
                className="object-cover"
              />
            ) : (
              <Store className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
              {company.name}
            </h3>
            {company.metadata?.category && (
              <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700 border-0 text-xs">
                {categoryIcons[company.metadata.category] || <Building2 className="w-3 h-3 mr-1" />}
                {company.metadata.category}
              </Badge>
            )}
            {company.is_open !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-xs border",
                  company.is_open
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}
              >
                {company.is_open ? "Open" : "Closed"}
              </Badge>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>

        {/* Contact details */}
        {company.phone && (
          <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span>{company.phone}</span>
          </div>
        )}
        {company.email && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{company.email}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          asChild
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full mt-2"
          disabled={!company?.is_open}
        >
        {company?.is_open ?   <Link href={`/${company.handle}`}>Visit Store</Link>  : <Link href="#" className="opacity-50">Store Close</Link> }
        </Button>
      </div>
    </motion.div>
  );
}

// ---------- Loading Skeleton ----------
function PartnerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-2xl p-5">
          <div className="flex gap-4 mb-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-9 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ---------- Main MerchantList ----------
export function MerchantList({ region, companies = [] }: MerchantListProps) {
  const [filteredPartners, setFilteredPartners] = useState<Company[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate async (real data comes from props)
      await new Promise((r) => setTimeout(r, 300));
      const filtered =
        activeCategory === "all"
          ? companies
          : companies.filter(
              (c: any) => c.metadata?.category === activeCategory
            );
      setFilteredPartners(filtered);
    } catch (err) {
      setError("Failed to load partners. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, companies]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Categories from metadata (or static)
  const categories = [
    { key: "all", label: "All" },
    ...Array.from(new Set(companies.map((c: any) => c.metadata?.category).filter(Boolean))).map(
      (cat) => ({ key: cat, label: cat })
    ),
  ];

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

        {/* Category Tabs (dynamic) */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 capitalize",
                  activeCategory === cat.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-blue-100"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-3 border border-blue-50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredPartners.length}</span> partners
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
            {filteredPartners.map((company, index) => (
              <PartnerCard key={company.id} company={company} index={index} />
            ))}
            {filteredPartners.length === 0 && (
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