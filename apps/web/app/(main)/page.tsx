import { HeroSection } from "@/components/home/hero-section"
import FeaturedProducts from "@/modules/home/components/featured-products"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Alayon Marketplace",
  description:
    "A performant ecommerce starter template.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {

  return (
    <div className="flex flex-col gap-y-2 m-2">
      <HeroSection />
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <FeaturedProducts countryCode={"ph"} />
      </Suspense>
    </div>
  )
}
