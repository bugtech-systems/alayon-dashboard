import { CheckoutNav } from "@/components/layout/checkout-nav";
import { NavigationHeader } from "@/components/layout/templates/nav";
import { Suspense } from "react";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

// Remove unused imports
// import { useN8nQuery } from "@/hooks/useN8nQuery";
// import { retrieveCart } from "@/lib/actions";

// Loading fallback for Suspense
function MainContentSkeleton() {
  return (
    <main className="flex flex-col gap-4 p-4 md:p-10 transition-all duration-150 ease-in-out min-h-[calc(100vh-8rem)]">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    </main>
  );
}

// Client wrapper for children that might use client hooks
function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MainContentSkeleton />}>
      {children}
    </Suspense>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <>
        <CheckoutNav />
        <ClientWrapper>
          <main className="flex flex-col transition-all duration-150 ease-in-out min-h-[calc(100vh-8rem)]">
            {children}
          </main>
        </ClientWrapper>
      </>
    </TooltipProvider>
  );
}