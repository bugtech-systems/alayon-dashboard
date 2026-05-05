// app/page.tsx

'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";
import { Suspense, useMemo, useCallback } from "react";
import { DynamicDataTable } from "@/components/DynamicDataTable";
import { 
  bettingsTableConfig, 
  soldoutTableConfig,
  drawsTableConfig 
} from "@/components/configData";
import { DashboardOverview } from "@/components/dashboard-overview";
import { useURLFilters } from "@/hooks/useUrlFilters";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

// Widget configurations
const dashboardCardsWidget = {
  id: "dashboard-cards",
  type: "kpi",
  webhook: {
    url: "/webhook/revs-dashboard-cards",
    method: "GET",
    queryMap: {
      range: "range",
      from: "from",
      to: "to",
      branch: "branch",
      batch: "batch"
    },
  },
};

const chartWidget = {
  id: "sales-chart",
  type: "area",
  webhook: {
    url: "/webhook/bettings-sales-chart",
    queryMap: {
      from: "from",
      to: "to",
      segment: "segment",
    },
  },
  config: {
    total: {
      label: "Total Sales"
    },
    new_can: {
      label: "New Can",
      color: "var(--primary)"
    },
    refill: {
      label: "Refill",
      color: "var(--primary)"
    }
  }
};

// Bettings Widget Configuration
const bettingsWidget = {
  id: "bettings-table",
  webhook: {
    url: "/webhook/bettings-datatable",
    method: "GET",
    queryMap: {
      page: "page",
      limit: "limit",
      sort_by: "sort_by",
      sort_order: "sort_order",
      search: "search",
      branch: "branch",
      batch: "batch",
      from: "from",
      to: "to",
      input_type: "input_type",
      is_complete: "is_complete",
      game_time: "game_time",
      collector: "collector",
      owner_id: "owner_id",
    },
  },
};

// Soldout Widget Configuration
const soldoutWidget = {
  id: "soldout-table",
  webhook: {
    url: "/webhook/soldout-datatable",
    method: "GET",
    queryMap: {
      page: "page",
      limit: "limit",
      sort_by: "sort_by",
      sort_order: "sort_order",
      search: "search",
      from: "from",
      to: "to",
      game_time: "game_time",
      total_min: "total_min",
      total_max: "total_max",
      hits_min: "hits_min",
      hits_max: "hits_max",
    },
  },
};

// Draws Widget Configuration
const drawsWidget = {
  id: "draws-table",
  webhook: {
    url: "/webhook/draws-datatable",
    method: "GET",
    queryMap: {
      page: "page",
      limit: "limit",
      sort_by: "sort_by",
      sort_order: "sort_order",
      search: "search",
      from: "from",
      to: "to",
      game_time: "game_time",
      is_win_to: "is_win_to",
      gross_min: "gross_min",
      gross_max: "gross_max",
      net_min: "net_min",
      net_max: "net_max",
    },
  },
};

// Tab configurations with full details
const TAB_CONFIGS = {
  bettings: {
    id: "bettings",
    label: "Bettings",
    value: "bettings",
    config: bettingsTableConfig,
    widget: bettingsWidget,
    defaultSort: { field: "timestamp", direction: "desc" },
  },
  soldout: {
    id: "soldout",
    label: "Sold Outs",
    value: "soldout",
    config: soldoutTableConfig,
    widget: soldoutWidget,
    defaultSort: { field: "date", direction: "desc" },
  },
  draws: {
    id: "draws",
    label: "Draws",
    value: "draws",
    config: drawsTableConfig,
    widget: drawsWidget,
    defaultSort: { field: "created_at", direction: "desc" },
  },
};

export default function Page() {
  const { filters, setFilters } = useURLFilters({ defaultPage: 1, defaultLimit: 10 });
  
  // Get current tab from URL, default to 'bettings'
  const currentTab = filters.dataTab || "bettings";
  
  // Get current configuration based on selected tab
  const currentConfig = TAB_CONFIGS[currentTab as keyof typeof TAB_CONFIGS] || TAB_CONFIGS.bettings;

  // Memoize dashboard filters
  const dashboardFilters = useMemo(() => ({
    from: filters.from,
    to: filters.to,
    branch: filters.branch,
    batch: filters.batch,
    segment: filters.segment || "all",
  }), [filters.from, filters.to, filters.branch, filters.batch, filters.segment]);

  // Handle tab change
  const handleTabChange = useCallback((tabValue: string) => {
    // Reset to first page and clear table-specific filters when changing tabs
    setFilters({ 
      dataTab: tabValue, 
      page: 1,
      // Preserve global filters
      from: filters.from,
      to: filters.to,
      branch: filters.branch,
      batch: filters.batch,
    });
  }, [setFilters, filters.from, filters.to, filters.branch, filters.batch]);

  const handleRowClick = (row: any) => {
    console.log(`${currentTab} row clicked:`, row);
    // You can add navigation or modal logic here based on the tab
    // Example: router.push(`/${currentTab}/${row.id}`)
  };

  // Prepare tabs for the DynamicDataTable
  const tabsConfig = [
    { id: "bettings", label: "Bettings", value: "bettings" },
    { id: "soldout", label: "Sold Outs", value: "soldout" },
    { id: "draws", label: "Draws", value: "draws" },
  ];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
          <SiteHeader pageTitle="Dashboard" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Dashboard Overview - Passes filters */}
                <DashboardOverview filters={dashboardFilters} />
                
                {/* Section Cards */}
                <SectionCards widget={dashboardCardsWidget} />
                
                {/* Chart Area */}
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive widget={chartWidget} />
                </div>
                
                {/* Data Table Section with Tabs */}
                <div className="px-4 lg:px-6">
                  {/* Custom Tab Bar for better control */}
                  {/* <div className="mb-4">
                    <Tabs value={currentTab} onValueChange={handleTabChange}>
                      <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="bettings" className="flex-1 sm:flex-initial">
                          Bettings
                        </TabsTrigger>
                        <TabsTrigger value="soldout" className="flex-1 sm:flex-initial">
                          Sold Outs
                        </TabsTrigger>
                        <TabsTrigger value="draws" className="flex-1 sm:flex-initial">
                          Draws
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div> */}
                  
                  {/* Dynamic Data Table - Key changes force re-render when tab changes */}
                  <DynamicDataTable
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
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}