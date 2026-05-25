// app/page.tsx
import { FooterModern } from "@/components/footer-modern";
import { HeroSection } from "@/components/hero-section-modern";
import { NavigationHeader } from "@/modules/layout/templates/nav/index";
import { ProductList } from "@/components/product-list";
import { getRegion } from "@/lib/actions/regions";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getDeliveryId } from "@/lib/data/cookies";
import { OrderRedirectBanner } from "@/components/order-redirect-banner";
import { RedirectHandler } from "@/components/redirect-handler";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Cookie keys
const REDIRECT_COOKIE_KEY = 'order_redirect_shown';
const REDIRECT_DISMISSED_KEY = 'order_redirect_dismissed';
const REDIRECT_PERMANENT_DISMISS_KEY = 'order_redirect_permanent_dismiss';

// Helper function to check if redirect should happen (READ ONLY - allowed in Server Component)
async function shouldRedirectToOrder(): Promise<boolean> {
  const cookieStore = await cookies();
  
  // Check for permanent dismissal (never show again)
  const permanentDismiss = cookieStore.get(REDIRECT_PERMANENT_DISMISS_KEY)?.value;
  if (permanentDismiss === 'true') {
    return false;
  }
  
  // Check for temporary dismissal (don't show again today)
  const temporaryDismiss = cookieStore.get(REDIRECT_DISMISSED_KEY)?.value;
  if (temporaryDismiss === 'true') {
    return false;
  }
  
  // Check if redirect already shown in this session
  const redirectShown = cookieStore.get(REDIRECT_COOKIE_KEY)?.value;
  if (redirectShown === 'true') {
    return false;
  }
  
  // Check if there's a delivery ID to redirect to
  const deliveryId = await getDeliveryId();
  
  return !!deliveryId;
}

// Loading skeletons
function NavigationSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gray-200"></div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[500px] bg-gray-200"></div>
    </div>
  )
}

function ProductListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FooterSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200"></div>
    </div>
  )
}

// Wrapper components with Suspense
function NavigationWrapper() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationHeader />
    </Suspense>
  )
}

function HeroWrapper() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <HeroSection />
    </Suspense>
  )
}

function ProductListWrapper({ region }: { region: any }) {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductList region={region} />
    </Suspense>
  )
}

function FooterWrapper() {
  return (
    <Suspense fallback={<FooterSkeleton />}>
      <FooterModern />
    </Suspense>
  )
}

// Main content component that fetches data
async function HomeContent() {
  const region = await getRegion('ph');
  
  // Check if we should redirect to order page (READ ONLY - allowed)
  const shouldRedirect = await shouldRedirectToOrder();
  const deliveryId = await getDeliveryId();
  
  
  return (
    <>
      <NavigationWrapper />
      <HeroWrapper />
      <ProductListWrapper region={region} />
      <FooterWrapper />
      
      {/* Client-side redirect handler */}
      {shouldRedirect && deliveryId && (
        <RedirectHandler deliveryId={deliveryId} />
      )}
      
      {/* Show banner if there's an active order but redirect was dismissed */}
      {deliveryId && !shouldRedirect && (
        <OrderRedirectBanner deliveryId={deliveryId} />
      )}
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}

// Complete page skeleton for initial load
function HomeSkeleton() {
  return (
    <>
      <NavigationSkeleton />
      <HeroSkeleton />
      <ProductListSkeleton />
      <FooterSkeleton />
    </>
  )
}