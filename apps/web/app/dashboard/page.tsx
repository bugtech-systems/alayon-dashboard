'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

import { AnalyticsOverview } from "@/components/dashboard-overview"
import { Suspense, useMemo } from "react"
import { ProposalSectionsTable } from "@/components/dashboard/proposal-sections-table/table"
import data from "@/components/dashboard/proposal-sections-table/data.json"
import { useURLFilters } from "@/hooks/useUrlFilters"
import { batchTableConfig, transactionsTableConfig } from "@/components/configData"



const dashboardCardsWidget = {
  id: "dashboard-cards",
  type: "kpi",

  webhook: {
    url: "/webhook/dashboard-cards",
    method: "GET",

    queryMap: {
      range: "range",
      from: "from",
      to: "to",
      branch: "branch",
      batch: "batch",
      peddler: "peddler"
    },
  },
}


const chartWidget = {
  id: "sales-chart",
  type: "area",

  webhook: {
  url: "/webhook/sales-chart",
  queryMap: {
    from: "from",
    to: "to",
    peddler: "peddler",
    branch: "branch"
  },
},
  config: {
    "total": {
        "label": "Total Sales"
    },
    "new_can": {
        "label": "New Can",
        "color": "var(--primary)"
    },
    "refill": {
        "label": "Refill",
        "color": "var(--primary)"
    }
  }
}

const transactionWidget = {
  id: "transaction-table",
  webhook: {
    url: "/webhook/get-tansactions",
    method: "GET",
    queryMap: {
      page: "page",
      limit: "limit",
      sort_by: "sort_by",
      sort_order: "sort_order",
      from: "from",
      batch: "batch",
      branch: "branch",
      type: "type",
      status: "status",
      to: "to",
      peddler: "peddler"
    },
  },
};

const batchesWidget = {
  id: "batches-table",
  webhook: {
    url: "/webhook/get-batches-datatable",
    method: "GET",
    queryMap: {
      page: "page",
      limit: "limit",
      sort_by: "sort_by",
      sort_order: "sort_order",
      from: "from",
      batch: "batch",
      branch: "branch",
      type: "type",
      status: "status",
      to: "to",
      peddler: "peddler"
    },
  },
};

// Tab configurations
const TAB_CONFIGS = {
  transactions: {
    id: "transactions",
    label: "Transactions",
    value: "transactions",
    config: transactionsTableConfig,
    widget: transactionWidget,
  },
   batches: {
    id: "batches",
    label: "Batches",
    value: "batches",
    config: batchTableConfig,
    widget: batchesWidget,
  },
};

export default function Page() {
 const { filters, setFilters } = useURLFilters({ defaultPage: 1, defaultLimit: 10 });
  
  // Get current tab from URL
  const currentTab = filters.tab || "transactions";
  
  // Get current configuration based on selected tab
  const currentConfig = TAB_CONFIGS[currentTab as keyof typeof TAB_CONFIGS] || TAB_CONFIGS.transactions;


  const handleRowClick = (row: any) => {
    console.log("Row clicked:", row);
    // You can add navigation or modal logic here
    // Example: router.push(`/draws/${row.id}`)
  };

  // Tab configuration for the DynamicDataTable
  const tabsConfig = [
    { id: "transactions", label: "Sales", value: "transactions" },
    { id: "batches", label: "Purchases", value: "batches" }
  ];


  return (
      <Suspense>
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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {/* <DashboardFiltersBar /> */}
              <AnalyticsOverview/>
               <SectionCards
                widget={dashboardCardsWidget}
              
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive widget={chartWidget}/>
              </div>
                            <div className="px-4 lg:px-6">
              {/* <DataTable /> */}
                    <ProposalSectionsTable 
                     key={currentTab} // Force re-render when tab changes
                               config={currentConfig.config}
                               widgetConfig={currentConfig.widget}
                               tabsConfig={tabsConfig}
                               onRowClick={handleRowClick}
                    />
                                  </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </Suspense>
  )
}

