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
  Users,
  Heart,
  Share2,
  CheckCircle,
  Star,
  Package,
  Store,
  Clock,
  Truck,
  Shield,
  Award,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { HttpTypes } from "@medusajs/types";

// ---------- Real Company Type (based on your data) ----------
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
  employees?: {
    id: string;
    is_admin: boolean;
    customer: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    };
  }[];
}

interface MerchantProfileProps {
  company: Company;
  products?: HttpTypes.StoreProduct[];
  region?: any;
}

export default function MerchantProfileTemplate({
  company,
  products = [],
  region,
}: MerchantProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  // Admin employees (if needed elsewhere) but we show all team members
  const teamMembers = company.employees || [];
  const location = company.address
    ? `${company.address}${company.city ? `, ${company.city}` : ""}`
    : "Tacloban City";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] to-white">
      {/* Cover Section (gradient – no cover image in company data) */}
      <div className="relative h-60 md:h-80 w-full bg-gradient-to-r from-[#0284C7]/10 to-[#0EA5E9]/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <Store className="w-24 h-24 text-[#0284C7]/20" />
        </div>
      </div>

      {/* Logo & Main Info */}
      <div className="container mx-auto px-4 max-w-7xl relative -mt-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          {/* Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E0F7FA]">
                <Store className="w-10 h-10 text-[#0284C7]" />
              </div>
            )}
          </div>

          {/* Name, Status, Location */}
          <div className="flex-1 pt-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge
                variant="secondary"
                className="bg-[#E0F7FA] text-[#0284C7] border-0"
              >
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </Badge>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#0284C7]" />
                <span className="text-sm text-gray-600">{location}</span>
              </div>
              {company.is_open !== undefined && (
                <Badge
                  variant="outline"
                  className={
                    company.is_open
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {company.is_open ? "Open Now" : "Closed"}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
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
                  {/* Left column – Contact & Team */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Contact Card */}
                    <Card className="border-[#BAE6FD] shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Contact Information
                        </h3>
                        <div className="space-y-3 text-sm">
                          {company.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#0284C7]" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#0284C7]" />
                              <span>{company.email}</span>
                            </div>
                          )}
                          {location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-[#0284C7]" />
                              <span>{location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Members (if any) */}
                    {teamMembers.length > 0 && (
                      <Card className="border-[#BAE6FD] shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#0284C7]" />
                            Team Members ({teamMembers.length})
                          </h3>
                          <ul className="space-y-2">
                            {teamMembers.slice(0, 5).map((emp) => (
                              <li
                                key={emp.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {emp.customer.first_name}{" "}
                                  {emp.customer.last_name}
                                  {emp.is_admin && (
                                    <span className="ml-1 text-xs text-blue-600">
                                      (Admin)
                                    </span>
                                  )}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {emp.customer.email}
                                </span>
                              </li>
                            ))}
                            {teamMembers.length > 5 && (
                              <p className="text-xs text-gray-400">
                                +{teamMembers.length - 5} more
                              </p>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right column – Trust badges (static) */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Truck className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Free Shipping</p>
                          <p className="text-[10px] text-gray-500">
                            Orders ₱1,000+
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Shield className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Secure Payment</p>
                          <p className="text-[10px] text-gray-500">
                            100% protected
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Clock className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Fast Delivery</p>
                          <p className="text-[10px] text-gray-500">
                            3-5 business days
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E0F7FA]">
                        <Award className="h-4 w-4 text-[#0284C7]" />
                        <div>
                          <p className="text-xs font-medium">Quality</p>
                          <p className="text-[10px] text-gray-500">
                            Authentic products
                          </p>
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
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={idx}
                          regionId={region?.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-[#BAE6FD] shadow-sm">
                      <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          No products yet
                        </h3>
                        <p className="text-sm text-gray-500">
                          Check back soon for new items.
                        </p>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Customer Reviews
                    </h3>
                    <p className="text-sm text-gray-500">
                      Reviews will be displayed here soon.
                    </p>
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