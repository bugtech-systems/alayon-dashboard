// app/orders/page.tsx

"use client";

import { DynamicDataTable } from "@/components/DynamicDataTable";
import { ordersTableConfig } from "@/components/configData";

const ordersWidget = {
  id: "orders-table",
  webhook: {
    url: "/webhook/orders",
    method: "GET",
    queryMap: {
      from: "from",
      to: "to",
      branch: "branch",
      batch: "batch",
      type: "type",
      page: "page",
      limit: "limit",
      search: "search",
      status: "status",
      date_range_from: "date_range_from",
      date_range_to: "date_range_to",
      amount_min: "amount_min",
      amount_max: "amount_max",
    },
  },
};

export default function OrdersPage() {
  const handleRowClick = (row: any) => {
    console.log("Row clicked:", row);
    // Navigate to details or open dialog
  };

  return (
    <div className="container mx-auto py-6">
      <DynamicDataTable
        config={ordersTableConfig}
        widgetConfig={ordersWidget}
        tabsConfig={[
          { id: "sales", label: "Sales", value: "sale" },
          { id: "expenses", label: "Expenses", value: "expense" },
          { id: "advances", label: "Advances", value: "advance" },
        ]}
        onRowClick={handleRowClick}
      />
    </div>
  );
}