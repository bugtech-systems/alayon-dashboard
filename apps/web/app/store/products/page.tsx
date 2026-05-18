// app/products/page.tsx (Server Component)
import { Suspense } from 'react'
import { getProducts } from '@/lib/medusa/client'
import { ProductCard } from '@/components/product/product-card'
import { ProductFilters } from '@/components/product/product-filters'
import { Spinner } from '@/components/ui/spinner'
import { ProductsProvider } from '@/components/product/products-provider'
import { ProductFiltersWrapper } from '@/components/product/product-filter'

// Helper function to get sorting parameters for Medusa
function getSortingParams(sort: string | null) {
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

// Product Grid Component (Server Component)
async function ProductGrid({ 
  sort, 
  category, 
  collection,
  page = 1
}: {
  sort?: string | null;
  category?: string | null;
  collection?: string | null;
  page?: number;
}) {
  const limit = 24
  const offset = (page - 1) * limit

  // Build filter parameters
  const params: any = {
    limit,
    offset,
  }

  // Add sorting
  const { order, orderBy } = getSortingParams(sort || null)
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
          <PaginationControls currentPage={page} totalPages={totalPages} sort={sort} category={category} collection={collection} />
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

// Main Products Page Component (Server Component)
export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams || {}
  const sort = typeof params.sort === 'string' ? params.sort : undefined
  const category = typeof params.category === 'string' ? params.category : undefined
  const collection = typeof params.collection === 'string' ? params.collection : undefined
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100 py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-primary font-medium tracking-widest uppercase mb-2 text-sm">
              Shop
            </p>
            <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-4">
              All Products
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our complete collection of premium products curated for quality and style.
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductsProvider>
            <ProductFiltersWrapper
              currentSort={sort}
              currentCategory={category}
              currentCollection={collection}
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
                page={page}
              />
            </Suspense>
          </ProductsProvider>
        </div>
      </section>
    </div>
  )
}