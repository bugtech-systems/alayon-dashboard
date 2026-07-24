// components/footer-modern.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Droplets,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  X,
} from "lucide-react";
import { Facebook } from "@medusajs/icons";

export const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribe:", email);
    // Add your subscription logic here
  };

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="h-6 w-6 text-[#0EA5E9]" />
              <span className="font-bold text-xl text-white">Alayon</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one‑stop platform for ordering food, water, gas, laundry, and booking local services. Fast delivery, verified partners.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-[#0EA5E9] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>

              <a href="#" className="text-gray-400 hover:text-[#0EA5E9] transition-colors">
                <X className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-[#0EA5E9] transition-colors">
                  Browse Partners
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[#0EA5E9] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/partner/register" className="hover:text-[#0EA5E9] transition-colors">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#0EA5E9] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4">Our Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog?category=restaurant" className="hover:text-[#0EA5E9] transition-colors">
                  Food & Restaurants
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=laundry" className="hover:text-[#0EA5E9] transition-colors">
                  Laundry Services
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=water" className="hover:text-[#0EA5E9] transition-colors">
                  Water Refill
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=gas" className="hover:text-[#0EA5E9] transition-colors">
                  Gas Delivery
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=salon" className="hover:text-[#0EA5E9] transition-colors">
                  Salon & Wellness
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Subscription */}
          <div>
            <h4 className="font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe for exclusive deals, new partner launches, and delivery tips.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2 mb-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-[#0EA5E9]"
                required
              />
              <Button
                type="submit"
                size="sm"
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white"
              >
                Subscribe
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0EA5E9]" />
                <span>Tacloban City, Leyte</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0EA5E9]" />
                <span>(053) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#0EA5E9]" />
                <span>hello@alayon-store.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>© 2025 Alayon Store. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link href="/privacy" className="hover:text-[#0EA5E9] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#0EA5E9] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};