// components/product-card.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Star, AlertCircle, CheckCircle, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductPrice, hasSale, getDiscountPercentage } from "@/components/product-price";
import { toast } from "sonner";
import { useCart } from "@/lib/context/cart-context";

// Types
interface VariantPrice {
  id: string;
  title: string;
  calculated_price: {
    calculated_amount: number;
    original_amount: number;
    currency_code: string;
    is_calculated_price_price_list: boolean;
  };
  inventory_quantity?: number;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  images?: Array<{ url: string; id: string; alt?: string }>;
  variants: VariantPrice[];
  rating?: number;
  reviews?: number;
  isNew?: boolean;
  tags?: string[];
  description?: string;
}

interface ProductCardProps {
  product: Product;
  index: number;
  priority?: boolean;
}

// Helper: Get default variant (first available or first in stock)
const getDefaultVariant = (product: Product): VariantPrice | null => {
  if (!product.variants || product.variants.length === 0) return null;
  
  // First try to find in-stock variant
  const inStockVariant = product.variants.find(variant => 
    variant.inventory_quantity > 0 || variant.allow_backorder
  );
  
  if (inStockVariant) return inStockVariant;
  
  // Fallback to first variant
  return product.variants[0];
};

// Helper: Get product lowest price info
const getProductPriceInfo = (product: Product) => {
  if (!product.variants?.length) {
    return { lowestPrice: 0, originalPrice: 0, hasDiscount: false, discountPercentage: 0 };
  }
  
  let lowestPrice = Infinity;
  let originalPrice = 0;
  
  for (const variant of product.variants) {
    const current = variant.calculated_price?.calculated_amount || 0;
    const original = variant.calculated_price?.original_amount || current;
    
    if (current < lowestPrice) {
      lowestPrice = current;
      originalPrice = original;
    }
  }
  
  const hasDiscount = lowestPrice < originalPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
    : 0;
  
  return { lowestPrice, originalPrice, hasDiscount, discountPercentage };
};

// Helper: Check if product is in stock
const isProductInStock = (product: Product, selectedVariantId?: string): boolean => {
  if (selectedVariantId) {
    const variant = product.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      return variant.inventory_quantity > 0 || variant.allow_backorder || !variant.manage_inventory;
    }
  }
  
  return product.variants?.some(variant => 
    variant.inventory_quantity > 0 || variant.allow_backorder || !variant.manage_inventory
  ) ?? true;
};

// Helper: Get stock status text
const getStockStatus = (product: Product, selectedVariantId?: string): { text: string; variant: "in-stock" | "low-stock" | "out-of-stock" | "pre-order" } => {
  if (selectedVariantId) {
    const variant = product.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      if (variant.allow_backorder) return { text: "Pre-order Available", variant: "pre-order" };
      if (variant.inventory_quantity > 10) return { text: "In Stock", variant: "in-stock" };
      if (variant.inventory_quantity > 0) return { text: `Only ${variant.inventory_quantity} left`, variant: "low-stock" };
      return { text: "Out of Stock", variant: "out-of-stock" };
    }
  }
  
  const anyInStock = product.variants?.some(v => v.inventory_quantity > 0);
  const anyPreOrder = product.variants?.some(v => v.allow_backorder);
  
  if (anyInStock) return { text: "In Stock", variant: "in-stock" };
  if (anyPreOrder) return { text: "Pre-order Available", variant: "pre-order" };
  return { text: "Out of Stock", variant: "out-of-stock" };
};

// Helper: Get product image
const getProductImage = (product: Product): string => {
  if (product.thumbnail) return product.thumbnail;
  if (product.images && product.images.length > 0) return product.images[0].url;
  return "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop";
};

// Helper: Get hover image
const getHoverImage = (product: Product): string | undefined => {
  if (product.images && product.images.length > 1) return product.images[1].url;
  return undefined;
};

export function ProductCard({ product, index, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(() => {
    const defaultVariant = getDefaultVariant(product);
    return defaultVariant?.id;
  });
  
  const { addToCart, isLoading: cartLoading } = useCart() as any;
  
  // Memoized values
  const productImage = useMemo(() => getProductImage(product), [product]);
  const hoverImage = useMemo(() => getHoverImage(product), [product]);
  const hasVariants = product.variants?.length > 1;
  const isInStock = useMemo(() => isProductInStock(product, selectedVariantId), [product, selectedVariantId]);
  const stockStatus = useMemo(() => getStockStatus(product, selectedVariantId), [product, selectedVariantId]);
  const { lowestPrice, originalPrice, hasDiscount, discountPercentage } = useMemo(() => getProductPriceInfo(product), [product]);
  
  // Get selected variant
  const selectedVariant = useMemo(() => {
    return product.variants?.find(v => v.id === selectedVariantId);
  }, [product, selectedVariantId]);
  
  // Handle quick add to cart
  const handleQuickAdd = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedVariant && !product.variants?.[0]) {
      toast.error("No variant available for this product");
      return;
    }
    
    const variantToAdd = selectedVariant || product.variants[0];
    
    if (!isInStock && !variantToAdd.allow_backorder) {
      toast.error("This product is currently out of stock");
      return;
    }
    
    setIsAdding(true);
    
    try {
      await addToCart(variantToAdd.id, 1);
      toast.success(`Added ${product.title} to cart`, {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, product, addToCart, isInStock]);
  
  // Handle quick view
  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Implement quick view modal logic here
    console.log("Quick view:", product.id);
  }, [product.id]);
  
  // Handle variant selection
  const handleVariantSelect = useCallback((variantId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantId(variantId);
  }, []);
  
  // Stock status color mapping
  const stockStatusColors = {
    "in-stock": "text-green-600 bg-green-50",
    "low-stock": "text-orange-600 bg-orange-50",
    "out-of-stock": "text-red-600 bg-red-50",
    "pre-order": "text-blue-600 bg-blue-50",
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50">
        <Link href={`/products/${product.handle}`} className="relative w-full h-full block">
          <Image
            src={productImage}
            alt={product.title}
            fill
            priority={priority}
            className={cn(
              "object-cover transition-all duration-700 ease-out",
              isHovered && hoverImage ? "scale-110 opacity-0" : "scale-100 opacity-100",
              !imageLoaded && "blur-sm"
            )}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={product.title}
              fill
              className={cn(
                "object-cover transition-all duration-700 ease-out",
                isHovered ? "scale-110 opacity-100" : "scale-100 opacity-0"
              )}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          )}
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && discountPercentage > 0 && (
            <div className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
              -{discountPercentage}%
            </div>
          )}
          {product.isNew && (
            <div className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
              New
            </div>
          )}
          {hasVariants && (
            <div className="bg-gray-800/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
              {product.variants.length} variants
            </div>
          )}
        </div>
        
        {/* Stock Status Badge (bottom left) */}
        {!isInStock && stockStatus.variant !== "pre-order" && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}
        
        {/* Pre-order Badge */}
        {stockStatus.variant === "pre-order" && (
          <div className="absolute bottom-3 left-3 bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Package className="w-3 h-3" />
            Pre-order
          </div>
        )}
        
        {/* Free Shipping Badge */}
        {lowestPrice > 1000 && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-green-600 text-xs font-medium px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Free Shipping
          </div>
        )}
        
        {/* Quick Actions - Appears on hover */}
        {isInStock && (
          <div className={cn(
            "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex gap-2">
              <Button 
                onClick={handleQuickAdd}
                disabled={isAdding || cartLoading}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-900 rounded-full text-sm font-medium disabled:opacity-50"
                size="sm"
              >
                {isAdding || cartLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Quick Add
                  </>
                )}
              </Button>
              {/* <Button 
                onClick={handleQuickView}
                variant="outline" 
                size="icon"
                className="bg-white/90 hover:bg-white border-none rounded-full w-9 h-9"
              >
                <Eye className="w-4 h-4" />
              </Button> */}
            </div>
          </div>
        )}
        
        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
        )}
      </div>
      
      {/* Product Info */}
      <Link href={`/product/${product.handle}`}>
        <div className="mt-4 space-y-2">
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5 fill-current",
                      i < Math.floor(product.rating!)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviews})
              </span>
            </div>
          )}
          
          {/* Product Title */}
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          
          {/* Price Display */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900">
              ₱{lowestPrice.toLocaleString()}
            </span>
            {hasDiscount && originalPrice > lowestPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₱{originalPrice.toLocaleString()}
              </span>
            )}
            {hasDiscount && discountPercentage > 0 && (
              <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Save {discountPercentage}%
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
            stockStatusColors[stockStatus.variant]
          )}>
            {stockStatus.variant === "low-stock" && <AlertCircle className="w-3 h-3" />}
            {stockStatus.variant === "in-stock" && <CheckCircle className="w-3 h-3" />}
            <span>{stockStatus.text}</span>
          </div>
          
          {/* Variant pills for quick selection */}
          {hasVariants && product.variants.length <= 3 && (
            <div className="flex gap-1 mt-2 pt-1 flex-wrap">
              {product.variants.slice(0, 3).map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => handleVariantSelect(variant.id, e)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full border transition-all",
                    selectedVariantId === variant.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {variant.title}
                </button>
              ))}
              {product.variants.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500">
                  +{product.variants.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {/* Wholesale Badge */}
          {hasVariants && product.variants.some(v => v.calculated_price?.is_calculated_price_price_list) && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Wholesale Available
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton component for loading state
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-gray-200 rounded-2xl" />
      <div className="mt-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}