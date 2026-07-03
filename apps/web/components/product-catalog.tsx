// components/product-catalog.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Filter, 
  X, 
  ShoppingBag,
  Grid3x3,
  List,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/medusa/client";
import { listCategories } from "@/lib/data";
import { Card, CardContent } from "./ui/card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";

// Types
interface Category {
  id: string;
  name: string;
  handle: string;
  parent_category_id: string | null;
  category_children?: Category[];
}

interface PriceRange {
  min: number;
  max: number;
}

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

// Helper to safely parse URL params
const safeParseInt = (value: string | null, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Build category tree
const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, category_children: [] });
  });

  // Second pass: build tree
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parent_category_id && categoryMap.has(cat.parent_category_id)) {
      const parent = categoryMap.get(cat.parent_category_id)!;
      if (!parent.category_children) parent.category_children = [];
      parent.category_children.push(category);
    } else {
      rootCategories.push(category);
    }
  });

  return rootCategories;
};

// Recursive category renderer
const CategoryItem = ({ 
  category, 
  selectedCategories, 
  onToggle,
  level = 0 
}: { 
  category: Category; 
  selectedCategories: string[]; 
  onToggle: (id: string) => void;
  level?: number;
}) => {
  const hasChildren = category.category_children && category.category_children.length > 0;
  const isSelected = selectedCategories.includes(category.id);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <label 
          className={cn(
            "flex items-center gap-2 cursor-pointer group flex-1",
            level > 0 && "ml-1"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(category.id)}
          />
          <span className={cn(
            "text-sm text-gray-600 group-hover:text-gray-900",
            isSelected && "font-medium text-gray-900"
          )}>
            {category.name}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-400">
              ({category.category_children?.length})
            </span>
          )}
        </label>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-6 space-y-1 border-l-2 border-gray-100 pl-3">
          {category.category_children?.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategories={selectedCategories}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ProductCatalog({ regionId }: { regionId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states - initialized from URL on mount only
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;
  
  // Refs to prevent infinite loops
  const isUpdatingFromURL = useRef(false);
  const initialLoadDone = useRef(false);
  const fetchAbortController = useRef<AbortController | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const  product_categories = await listCategories() as any;


        console.log(product_categories, 'PRODUCTSS')
        const categoryTree = buildCategoryTree(product_categories);
        setCategories(categoryTree);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize filters from URL (runs once on mount)
  useEffect(() => {
    if (initialLoadDone.current) return;
    
    const categoriesParam = searchParams.get("categories");
    if (categoriesParam) {
      setSelectedCategories(categoriesParam.split(","));
    }
    
    const sortParam = searchParams.get("sort");
    if (sortParam && sortOptions.some(opt => opt.value === sortParam)) {
      setSortBy(sortParam);
    }
    
    const inStockParam = searchParams.get("inStock");
    if (inStockParam === "true") setInStockOnly(true);
    
    const onSaleParam = searchParams.get("onSale");
    if (onSaleParam === "true") setOnSaleOnly(true);
    
    const minPrice = safeParseInt(searchParams.get("minPrice"), 0);
    const maxPrice = safeParseInt(searchParams.get("maxPrice"), 5000);
    setPriceRange({ min: minPrice, max: maxPrice });
    
    const page = safeParseInt(searchParams.get("page"), 1);
    setCurrentPage(page);
    
    initialLoadDone.current = true;
  }, [searchParams]);

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (!initialLoadDone.current || isUpdatingFromURL.current) return;
    
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (currentPage > 1) params.set("page", currentPage.toString());
      if (sortBy !== "newest") params.set("sort", sortBy);
      if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
      if (inStockOnly) params.set("inStock", "true");
      if (onSaleOnly) params.set("onSale", "true");
      if (priceRange.min > 0) params.set("minPrice", priceRange.min.toString());
      if (priceRange.max < 5000) params.set("maxPrice", priceRange.max.toString());
      
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      
      router.replace(url, { scroll: false });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, sortBy, selectedCategories, inStockOnly, onSaleOnly, priceRange, router, pathname]);

  // Get all category IDs including children
  const getAllCategoryIds = useCallback((categories: Category[]): string[] => {
    let ids: string[] = [];
    categories.forEach(cat => {
      ids.push(cat.id);
      if (cat.category_children) {
        ids = ids.concat(getAllCategoryIds(cat.category_children));
      }
    });
    return ids;
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    // Cancel previous request
    if (fetchAbortController.current) {
      fetchAbortController.current.abort();
    }
    
    fetchAbortController.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    const offset = (currentPage - 1) * limit;
    const params: any = {
      limit,
      offset,
      fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.allow_backorder,+variants.manage_inventory",
    };

    // Add sorting
    switch (sortBy) {
      case "price-asc":
        params.order = "variants.calculated_price.calculated_amount ASC";
        break;
      case "price-desc":
        params.order = "variants.calculated_price.calculated_amount DESC";
        break;
      case "name-asc":
        params.order = "title ASC";
        break;
      case "name-desc":
        params.order = "title DESC";
        break;
      case "newest":
        params.order = "created_at DESC";
        break;
      default:
        params.order = "created_at DESC";
    }

    // Add category filter - include selected categories and their children
    if (selectedCategories.length > 0 && categories.length > 0) {
      // Get all category IDs including children of selected categories
      const allCategoryIds = getAllCategoryIds(categories);
      const selectedWithChildren = new Set<string>();
      
      selectedCategories.forEach(selectedId => {
        selectedWithChildren.add(selectedId);
        // Find all descendants
        const findDescendants = (catList: Category[]) => {
          catList.forEach(cat => {
            if (cat.id === selectedId || selectedWithChildren.has(cat.id)) {
              if (cat.category_children) {
                cat.category_children.forEach(child => {
                  selectedWithChildren.add(child.id);
                  findDescendants([child]);
                });
              }
            } else if (cat.category_children) {
              findDescendants(cat.category_children);
            }
          });
        };
        findDescendants(categories);
      });

      params.category_id = Array.from(selectedWithChildren);
    }

    try {
      const { products: fetchedProducts, count } = await getProducts(params);
      
      // Process products - only use data from Medusa
      const processedProducts = fetchedProducts.map((product: any) => {
        // Calculate if product has any variant on sale
        const hasSaleVariant = product.variants?.some((variant: any) => 
          variant.calculated_price?.calculated_amount < variant.calculated_price?.original_amount
        );
        
        // Calculate if product is in stock
        const isInStock = product.variants?.some((variant: any) => {
          if (!variant.manage_inventory) return true;
          if (variant.allow_backorder) return true;
          return variant.inventory_quantity && variant.inventory_quantity > 0;
        });
        
        // Get lowest price
        let lowestPrice = Infinity;
        product.variants?.forEach((variant: any) => {
          const price = variant.calculated_price?.calculated_amount || 0;
          if (price < lowestPrice) lowestPrice = price;
        });
        
        return {
          ...product,
          hasSale: hasSaleVariant,
          inStock: isInStock,
          lowestPrice: lowestPrice === Infinity ? 0 : lowestPrice,
        };
      });
      
      // Apply client-side filters
      let filtered = [...processedProducts];
      
      if (inStockOnly) {
        filtered = filtered.filter((product: any) => product.inStock);
      }
      
      if (onSaleOnly) {
        filtered = filtered.filter((product: any) => product.hasSale);
      }
      
      if (priceRange.min > 0 || priceRange.max < 5000) {
        filtered = filtered.filter((product: any) => {
          return product.lowestPrice >= priceRange.min && product.lowestPrice <= priceRange.max;
        });
      }
      
      setProducts(filtered);
      setTotalCount(filtered.length);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [currentPage, limit, sortBy, selectedCategories, inStockOnly, onSaleOnly, priceRange, categories, getAllCategoryIds]);

  // Fetch products when dependencies change
  useEffect(() => {
    if (!initialLoadDone.current || categories.length === 0) return;
    fetchProducts();
    
    return () => {
      if (fetchAbortController.current) {
        fetchAbortController.current.abort();
      }
    };
  }, [fetchProducts, categories]);

  // Reset page when filters change
  useEffect(() => {
    if (!initialLoadDone.current || isUpdatingFromURL.current) return;
    setCurrentPage(1);
  }, [sortBy, selectedCategories, inStockOnly, onSaleOnly, priceRange.min, priceRange.max]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handlePageChange = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 5000 });
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
    if (priceRange.min > 0 || priceRange.max < 5000) count++;
    return count;
  }, [selectedCategories.length, inStockOnly, onSaleOnly, priceRange.min, priceRange.max]);

  const getCategoryName = useCallback((categoryId: string): string => {
    const findCategory = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.category_children) {
          const found = findCategory(cat.category_children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories) || categoryId;
  }, [categories]);

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        {isCategoriesLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                selectedCategories={selectedCategories}
                onToggle={(id) => {
                  setSelectedCategories(prev =>
                    prev.includes(id)
                      ? prev.filter(c => c !== id)
                      : [...prev, id]
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No categories found</p>
        )}
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range (₱)</h3>
        <div className="space-y-4">
          <Slider
            value={[priceRange.min, priceRange.max]}
            min={0}
            max={5000}
            step={50}
            onValueChange={(value) => setPriceRange({ min: value[0], max: value[1] })}
            className="w-full"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm text-gray-500">₱</span>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setPriceRange({ ...priceRange, min: Math.min(val, priceRange.max) });
                }}
                className="w-full px-2 py-1 text-sm border rounded-md"
                min={0}
                max={priceRange.max}
              />
            </div>
            <span className="text-gray-400">to</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm text-gray-500">₱</span>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5000;
                  setPriceRange({ ...priceRange, max: Math.max(val, priceRange.min) });
                }}
                className="w-full px-2 py-1 text-sm border rounded-md"
                min={priceRange.min}
                max={5000}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={inStockOnly} 
              onCheckedChange={(checked) => setInStockOnly(checked === true)} 
            />
            <span className="text-sm text-gray-600">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={onSaleOnly} 
              onCheckedChange={(checked) => setOnSaleOnly(checked === true)} 
            />
            <span className="text-sm text-gray-600">On Sale</span>
          </label>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t">
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all filters ({activeFilterCount})
          </button>
        </div>
      )}
    </div>
  );

  // Loading skeleton
  if (isInitialLoad && isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:block w-64 shrink-0">
          <div className="space-y-6">
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded mt-2 w-3/4" />
                <div className="h-4 bg-gray-200 rounded mt-1 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24">
          <FilterSidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 pb-20">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            {/* Results count */}
            <div className="text-sm text-gray-500">
              Showing {products.length} of {totalCount} products
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-primary text-white" : "hover:bg-gray-100"
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-primary text-white" : "hover:bg-gray-100"
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategories.map((catId) => (
              <span key={catId} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full">
                {getCategoryName(catId)}
                <button
                  onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== catId))}
                  className="hover:text-red-500"
                  aria-label={`Remove category filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full">
                In Stock
                <button onClick={() => setInStockOnly(false)} className="hover:text-red-500" aria-label="Remove in stock filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onSaleOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full">
                On Sale
                <button onClick={() => setOnSaleOnly(false)} className="hover:text-red-500" aria-label="Remove on sale filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(priceRange.min > 0 || priceRange.max < 5000) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded-full">
                ₱{priceRange.min} - ₱{priceRange.max}
                <button onClick={() => setPriceRange({ min: 0, max: 5000 })} className="hover:text-red-500" aria-label="Clear price filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-red-50 rounded-lg">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchProducts()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !isInitialLoad && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

{!isLoading && !error && (
  <>
    {/* Product Grid/List View */}
    <div className={cn(
      viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" 
        : "space-y-4"
    )}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} regionId={regionId} />
      ))}
    </div>

    {/* Empty State */}
    {products.length === 0 && (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Try adjusting your filters or search criteria to find what you're looking for.
          </p>
          <Button 
            onClick={clearAllFilters} 
            variant="outline"
          >
            Clear all filters
          </Button>
        </CardContent>
      </Card>
    )}

    {/* Pagination */}
    {totalPages > 1 && products.length > 0 && (
      <div className="mt-8 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "cursor-pointer",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => handlePageChange(totalPages)}
                  className="cursor-pointer"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )}
  </>
)}
      </div>
    </div>
  );
}