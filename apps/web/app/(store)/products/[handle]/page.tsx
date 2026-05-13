// app/products/[handle]/page.jsx
import { notFound } from 'next/navigation'
import { getProductByHandle, getProducts } from '@/lib/medusa/client'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductInfo } from '@/components/product/product-info'
import { ProductCard } from '@/components/product/product-card'
import Link from 'next/link'
import { getRegion } from '@/lib/medusa/data/regions'

export async function generateMetadata({ params }) {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  // Get the first image for OG image
  const ogImage = product.images?.[0]?.url || product.thumbnail

  return {
    title: `${product.title} | Shop`,
    description: product.description?.substring(0, 160) || `Shop ${product.title}`,
    // openGraph: {
    //   title: product.title,
    //   description: product.description?.substring(0, 160),
    //   images: ogImage ? [{ url: ogImage }] : [],
    //   type: 'product',
    //   siteName: 'Your Store',
    // },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description?.substring(0, 160),
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function ProductPage({ params }) {
  const { handle } = await params



  const product = await getProductByHandle(handle)
  if (!product) {
    notFound()
  }

  // Get related products (same collection or category)
  const { products: allProducts } = await getProducts({ limit: 20 })
  // Filter related products: same collection or category, excluding current product
  const relatedProducts = allProducts
    .filter(p => {
      // Same product - exclude
      if (p.id === product.id) return false
      
      // Same collection
      const sameCollection = product.collection?.id && 
        p.collection?.id === product.collection?.id
      
      // Same category
      const sameCategory = product.categories?.length && 
        p.categories?.some(cat => 
          product.categories.some(pCat => pCat.id === cat.id)
        )
      
      return sameCollection || sameCategory
    })
    .slice(0, 4)

  // If not enough related products, add featured products
  let finalRelatedProducts = [...relatedProducts]
  if (finalRelatedProducts.length < 4) {
    const featuredCount = 4 - finalRelatedProducts.length
    const featuredProducts = allProducts
      .filter(p => p.id !== product.id && !finalRelatedProducts.some(rp => rp.id === p.id))
      .slice(0, featuredCount)
    finalRelatedProducts = [...finalRelatedProducts, ...featuredProducts]
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/products" className="hover:text-foreground transition-colors">
              Products
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium truncate">
            {product.title}
          </li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Product Gallery Component */}
            <ProductGallery product={product} />
            
            {/* Product Info Component */}
            <ProductInfo product={product} />
          </div>
        </div>
      </section>

      {/* Product Description & Details */}
      {product.description && (
        <section className="py-12 lg:py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl tracking-wider text-foreground mb-6">
              PRODUCT DETAILS
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Description */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Description</h3>
                <div className="prose prose-invert max-w-none text-muted-foreground">
                  <p>{product.description}</p>
                </div>
              </div>

              {/* Product Specifications */}
              <div>
                <h3 className="font-medium text-foreground mb-3">Specifications</h3>
                <dl className="space-y-2">
                  {product.type?.value && (
                    <div className="flex">
                      <dt className="w-32 text-muted-foreground">Type:</dt>
                      <dd className="text-foreground">{product.type.value}</dd>
                    </div>
                  )}
                  {product.collection?.title && (
                    <div className="flex">
                      <dt className="w-32 text-muted-foreground">Collection:</dt>
                      <dd className="text-foreground">{product.collection.title}</dd>
                    </div>
                  )}
                  {product.tags?.length > 0 && (
                    <div className="flex">
                      <dt className="w-32 text-muted-foreground">Tags:</dt>
                      <dd className="text-foreground">
                        {product.tags.map(tag => tag.value).join(', ')}
                      </dd>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex">
                      <dt className="w-32 text-muted-foreground">Material:</dt>
                      <dd className="text-foreground">{product.material}</dd>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex">
                      <dt className="w-32 text-muted-foreground">Weight:</dt>
                      <dd className="text-foreground">{product.weight}g</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {finalRelatedProducts.length > 0 && (
        <section className="py-12 lg:py-16 border-t border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl tracking-wider text-foreground mb-8">
              YOU MAY ALSO LIKE
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {finalRelatedProducts.map((relatedProduct, index) => (
                <ProductCard 
                  key={relatedProduct.id} 
                  product={relatedProduct}
                  priority={index < 2}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed (Optional) - Would need client-side storage */}
    </div>
  )
}

