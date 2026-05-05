import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

import { AnalyticsOverview } from "@/components/analytics-overview"
import { Suspense } from "react"


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {





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

     {children}
    </Suspense>

      </SidebarInset>
    </SidebarProvider>
  )
}



export const metadata = {
      generator: 'v0.app'
    };
