// app/page.tsx
import { FooterModern } from "@/components/footer-modern";
import { HeroSection } from "@/components/hero-section-modern";
import { NavigationHeader } from "@/modules/layout/templates/nav/index";
import { MerchantList } from "@/components/merchant-list"; // new partner list
import { getRegion } from "@/lib/actions/regions";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getDeliveryId } from "@/lib/data/cookies";
import { OrderRedirectBanner } from "@/components/order-redirect-banner";
import { RedirectHandler } from "@/components/redirect-handler";
import { Footer } from "@/components/modern-footer";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Cookie keys (unchanged)
const REDIRECT_COOKIE_KEY = 'order_redirect_shown';
const REDIRECT_DISMISSED_KEY = 'order_redirect_dismissed';
const REDIRECT_PERMANENT_DISMISS_KEY = 'order_redirect_permanent_dismiss';

// Helper function to check if redirect should happen (READ ONLY)
async function shouldRedirectToOrder(): Promise<boolean> {
  const cookieStore = await cookies();
  
  const permanentDismiss = cookieStore.get(REDIRECT_PERMANENT_DISMISS_KEY)?.value;
  if (permanentDismiss === 'true') return false;
  
  const temporaryDismiss = cookieStore.get(REDIRECT_DISMISSED_KEY)?.value;
  if (temporaryDismiss === 'true') return false;
  
  const redirectShown = cookieStore.get(REDIRECT_COOKIE_KEY)?.value;
  if (redirectShown === 'true') return false;
  
  const deliveryId = await getDeliveryId();
  return !!deliveryId;
}

// ---------- Loading Skeletons (responsive) ----------
function NavigationSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gray-200 w-full"></div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[60vh] md:h-[500px] bg-gray-200 w-full"></div>
    </div>
  )
}

function PartnerListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-40 bg-gray-200 rounded-2xl"></div>
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
      <div className="h-64 bg-gray-200 w-full"></div>
    </div>
  )
}

// ---------- Wrappers with Suspense ----------
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

function PartnerListWrapper({ region }: { region: any }) {
  return (
    <Suspense fallback={<PartnerListSkeleton />}>
      <MerchantList region={region} />
    </Suspense>
  )
}

function FooterWrapper() {
  return (
    <Suspense fallback={<FooterSkeleton />}>
      <Footer />
    </Suspense>
  )
}

// ---------- Main Content (async, fetches data) ----------
async function HomeContent() {
  const region = await getRegion('ph');
  const shouldRedirect = await shouldRedirectToOrder();
  const deliveryId = await getDeliveryId();

  return (
    <>
      <NavigationWrapper />
      <HeroWrapper />
      <PartnerListWrapper region={region} />
      <FooterWrapper />
      
      {shouldRedirect && deliveryId && (
        <RedirectHandler deliveryId={deliveryId} />
      )}
      
      {deliveryId && !shouldRedirect && (
        <OrderRedirectBanner deliveryId={deliveryId} />
      )}
    </>
  )
}

// ---------- Page Component ----------
export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}

// Full‑page skeleton for initial load (mobile friendly)
function HomeSkeleton() {
  return (
    <>
      <NavigationSkeleton />
      <HeroSkeleton />
      <PartnerListSkeleton />
      <FooterSkeleton />
    </>
  )
}