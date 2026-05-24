'use client'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Suspense } from "react"
import { RiderMap } from "@/components/rider/RiderMap"




export default function Page() {
  const handleRowClick = (row: any) => {
    console.log("Row clicked:", row);
    // Navigate to details or open dialog
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset"  />
      <SidebarInset>
      <Suspense>
        <SiteHeader 
            pageTitle="Rider Map"
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {/* <DashboardFiltersBar /> */}
              <div className="px-4 lg:px-6">
                   <RiderMap/>
              </div>
            </div>
          </div>
        </div>
    </Suspense>

      </SidebarInset>
    </SidebarProvider>
  )
}

