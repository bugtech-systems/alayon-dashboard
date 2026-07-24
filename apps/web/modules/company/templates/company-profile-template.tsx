// components/merchant-profile-template.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Award,
  Truck,
  Shield,
  Heart,
  Share2,
  Globe,
  Briefcase,
  CheckCircle,
  Star,
  Building2,
  Package,
  Store,
  ChevronRight,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { HttpTypes } from "@medusajs/types";

interface MerchantProfileProps {
  merchant: {
    id: string;
    name: string;
    description: string;
    long_description?: string;
    logo_url?: string;
    cover_image?: string;
    established_year?: number;
    employees?: string;
    location?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    social_media?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
    certifications?: string[];
    awards?: string[];
    business_hours?: {
      monday_friday?: string;
      saturday?: string;
      sunday?: string;
    };
  };
  products?: HttpTypes.StoreProduct[];
  region?: any;
  countryCode?: string;
}

export default function MerchantProfileTemplate({
  merchant,
  products = [],
  region,
}: MerchantProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  const featuredProducts = products.filter(
    (p: any) => p.metadata?.featured === "true" || p.tags?.some((t: any) => t.value === "featured")
  );
  const regularProducts = products.filter((p) => !featuredProducts.includes(p));

  const stats = [
    {
      label: "Years in Business",
      value: new Date().getFullYear() - (merchant?.established_year || 2020),
      icon: Building2,
    },
    { label: "Happy Customers", value: "10,000+", icon: Users },
    { label: "Products", value: products.length.toString(), icon: Briefcase },
    { label: "Satisfaction", value: "98%", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-white">
      {/* Cover Image */}
      <div className="relative h-60 md:h-80 w-full overflow-hidden bg-gradient-to-r from-[#0284C7]/10 to-[#0EA5E9]/10">
        {merchant?.cover_image ? (
          <Image
            src={merchant.cover_image}
            alt={`${merchant.name} cover`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="w-24 h-24 text-[#0284C7]/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Logo & Main Info */}
      <div className="container mx-auto px-4 max-w-7xl relative -mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          {/* Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
            {merchant?.logo_url ? (
              <Image
                src={merchant.logo_url}
                alt={merchant.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E0F7FA]">
                <Store className="w-10 h-10 text-[#0284C7]" />
              </div>
            )}
          </div>

          {/* Name, rating, location */}
          <div className="flex-1 pt-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {merchant?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="secondary" className="bg-[#E0F7FA] text-[#0284C7] border-0">
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#0284C7]" />
                <span className="text-sm text-gray-600">{merchant?.location || "Tacloban City"}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-600">(128 reviews)</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button
              variant={isFollowing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              className={
                isFollowing
                  ? "bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-full"
                  : "border-[#BAE6FD] text-[#0284C7] hover:bg-[#E0F7FA] rounded-full"
              }
            >
              <Heart className="h-4 w-4 mr-1" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#BAE6FD] text-[#0284C7] hover:bg-[#E0F7FA] rounded-full"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-[#BAE6FD] shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E0F7FA]">
                  <stat.icon className="h-5 w-5 text-[#0284C7]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-10">
          <TabsList className="w-full max-w-md bg-[#E0F7FA] p-1 rounded-full">
            <TabsTrigger
              value="overview"
              className={cn(
                "flex-1 rounded-full py-2 text-sm",
                activeTab === "overview" && "bg-white shadow-sm text-[#0284C7]"
              )}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className={cn(
                "flex-1 rounded-full py-2 text-sm",
                activeTab === "products" && "bg-white shadow-sm text-[#0284C7]"
              )}
            >
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className={cn(
                "flex-1 rounded-full py-2 text-sm",
                activeTab === "reviews" && "bg-white shadow-sm text-[#0284C7]"
              )}
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left column – details */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* About */}
                    <Card className="border-[#BAE6FD] shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">About {merchant?.name}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {merchant?.description}
                        </p>
                        {merchant?.long_description && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-3">
                            {merchant.long_description}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Contact */}
                    <Card className="border-[#BAE6FD] shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
                        <div className="space-y-3 text-sm">
                          {merchant?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#0284C7]" />
                              <span>{merchant.phone}</span>
                            </div>
                          )}
                          {merchant?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#0284C7]" />
                              <span>{merchant.email}</span>
                            </div>
                          )}
                          {merchant?.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#0284C7]" />
                              <span>{merchant.address}</span>
                            </div>
                          )}
                          {merchant?.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-[#0284C7]" />
                              <a
                                href={merchant.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0284C7] hover:underline"
                              >
                                {merchant.website.replace("https://", "")}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Business Hours */}
                    {merchant?.business_hours && (
                      <Card className="border-[#BAE6FD] shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#0284C7]" />
                            Business Hours
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Mon–Fri</span>
                              <span>{merchant.business_hours.monday_friday || "9:00 AM – 6:00 PM"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Saturday</span>
                              <span>{merchant.business_hours.saturday || "10:00 AM – 4:00 PM"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sunday</span>
                              <span>{merchant.business_hours.sunday || "Closed"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {(merchant?.certifications?.length || merchant?.awards?.length) && (
                      <Card className="border-[#BAE6FD] shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-4">Awards & Certs</h3>
                          {merchant.certifications?.map((cert, i) => (
                            <Badge key={i} className="mr-2 mb-2 bg-[#E0F7FA] text-[#0284C7] border-0">
                              <Award className="w-3 h-3 mr-1" /> {cert}
                            </Badge>
                          ))}
                          {merchant.awards?.map((award, i) => (
                            <Badge key={i} className="mr-2 mb-2 bg-amber-50 text-amber-700 border-0">
                              <Star className="w-3 h-3 mr-1" /> {award}
                            </Badge>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right column – Featured products & trust badges */}
                  <div className="lg:col-span-2 space-y-8">
                    {featuredProducts.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {featuredProducts.map((product, idx) => (
                            <ProductCard key={product.id} product={product} index={idx} regionId={region?.id} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trust badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Truck className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Free Shipping</p>
                          <p className="text-[10px] text-gray-500">Orders ₱1,000+</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Shield className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Secure Payment</p>
                          <p className="text-[10px] text-gray-500">100% protected</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Clock className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Fast Delivery</p>
                          <p className="text-[10px] text-gray-500">3-5 business days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Award className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Quality Guarantee</p>
                          <p className="text-[10px] text-gray-500">Authentic products</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === "products" && (
                <div>
                  {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product, idx) => (
                        <ProductCard key={product.id} product={product} index={idx} regionId={region?.id} />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-[#BAE6FD] shadow-sm">
                      <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No products yet</h3>
                        <p className="text-sm text-gray-500">Check back soon for new items.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Reviews Tab (placeholder) */}
              {activeTab === "reviews" && (
                <Card className="border-[#BAE6FD] shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer Reviews</h3>
                    <p className="text-sm text-gray-500">Reviews will be displayed here soon.</p>
                    <Button className="mt-4 bg-[#0284C7] hover:bg-[#0369A1] rounded-full">
                      Write a Review
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}