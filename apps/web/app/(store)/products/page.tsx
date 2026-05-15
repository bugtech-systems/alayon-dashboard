// app/products/page.jsx
import { Suspense, useTransition } from 'react'
import { getProducts } from '@/lib/medusa/client'
import { ProductCard } from '@/components/product/product-card'
import { ProductFilters } from '@/components/product/product-filters'
import { Spinner } from '@/components/ui/spinner'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const metadata = {
  title: 'All Products | Shop',
  description: 'Browse our complete collection of premium products.',
}

// Helper function to get sorting parameters for Medusa
function getSortingParams(sort: any) {
  switch (sort) {
    case 'newest':
      return { order: 'DESC', orderBy: 'created_at' }
    case 'oldest':
      return { order: 'ASC', orderBy: 'created_at' }
    case 'price-asc':
      return { order: 'ASC', orderBy: 'price' }
    case 'price-desc':
      return { order: 'DESC', orderBy: 'price' }
    case 'title-asc':
      return { order: 'ASC', orderBy: 'title' }
    case 'title-desc':
      return { order: 'DESC', orderBy: 'title' }
    default:
      return { order: 'DESC', orderBy: 'created_at' }
  }
}

// Pagination Link Component (Client Component)
function PaginationLink({ page, label, isActive, currentPage, totalPages }: any) {
  'use client'
  
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams() as any

  const handleClick = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      params.set('page', page.toString())
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Don't render if it's the current page and not active (for Previous/Next)
  if (label === 'Previous' && currentPage === 1) return null
  if (label === 'Next' && currentPage === totalPages) return null

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-secondary text-foreground'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending && isActive ? <Spinner className="w-4 h-4" /> : label}
    </button>
  )
}

// Pagination Controls Component
function PaginationControls({ currentPage, totalPages }: any) {
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }
    return pages
  }

  const pages = getPageNumbers() as any

  return (
    <div className="flex items-center gap-2">
      <PaginationLink 
        page={currentPage - 1} 
        label="Previous" 
        currentPage={currentPage}
        totalPages={totalPages}
      />
      
      {pages[0] > 1 && (
        <>
          <PaginationLink 
            page={1} 
            label="1" 
            currentPage={currentPage}
            totalPages={totalPages}
          />
          {pages[0] > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map((page: any) => (
        <PaginationLink 
          key={page} 
          page={page} 
          label={page.toString()} 
          isActive={page === currentPage}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      ))}
      
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-2">...</span>}
          <PaginationLink 
            page={totalPages} 
            label={totalPages.toString()} 
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </>
      )}
      
      <PaginationLink 
        page={currentPage + 1} 
        label="Next" 
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  )
}

// Product Grid Component (Server Component)
async function ProductGrid({ 
  sort, 
  category, 
  collection,
  price_min,
  price_max,
  page = 1
}: any) {
  const limit = 24
  const offset = (page - 1) * limit

  // Build filter parameters
  const params = {
    limit,
    offset,
  } as any

  // Add sorting
  const { order, orderBy } = getSortingParams(sort) as any
  if (order && orderBy) {
    params.order = `${orderBy} ${order}`
  }

  // Add category filter
  if (category) {
    params.category_id = [category]
  }

  // Add collection filter
  if (collection) {
    params.collection_id = [collection]
  }

  try {
    const { products, count } = await getProducts(params)
    const totalPages = Math.ceil(count / limit)

    if (products.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No products found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later for new products.
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 8} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <PaginationControls currentPage={page} totalPages={totalPages} />
          </div>
        )}
      </>
    )
  } catch (error) {
    console.error('Error fetching products:', error)
    return (
      <div className="text-center py-16">
        <p className="text-red-600 dark:text-red-400 mb-4">Error loading products</p>
        <p className="text-sm text-muted-foreground">
          Please try again later or contact support if the issue persists.
        </p>
      </div>
    )
  }
}

// Main Products Page Component
export default async function ProductsPage({ searchParams }: any) {
  const { sort, category, collection, price_min, price_max, page } = await searchParams
  const currentPage = page ? parseInt(page) : 1

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 lg:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-primary font-medium tracking-widest uppercase mb-2">
            Shop
          </p>
          <h1 className="font-heading text-4xl lg:text-6xl tracking-wider text-foreground">
            ALL PRODUCTS
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Discover our complete collection of premium products curated for quality and style.
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductFilters 
            currentSort={sort} 
            // currentCategory={category}
            // currentCollection={collection}
          />

          <Suspense
            key={`products-${sort}-${category}-${collection}-${page}`}
            fallback={
              <div className="flex items-center justify-center py-16">
                <Spinner className="w-8 h-8 text-primary" />
              </div>
            }
          >
            <ProductGrid 
              sort={sort}
              category={category}
              collection={collection}
              price_min={price_min}
              price_max={price_max}
              page={currentPage}
            />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

