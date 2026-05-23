// components/subscriber-overview.tsx
"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { n8n } from "@/lib/n8n-webhook-service";

import { RecentCustomersTable } from "./recent-customers-table/table";
import type { RecentCustomerRow } from "./recent-customers-table/schema";

interface SubscriberOverviewProps {
  initialData?: RecentCustomerRow[];
  initialTotal?: number;
  initialStats?: any;
}

export function SubscriberOverview({ 
  initialData = [], 
  initialTotal = 0,
  initialStats = null 
}: SubscriberOverviewProps) {
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Get current filters from URL
      const params: Record<string, any> = {};
      const companyId = searchParams.get("company_id");
      const search = searchParams.get("search");
      const status = searchParams.get("status");
      
      if (companyId) params.company_id = companyId;
      if (search) params.search = search;
      if (status && status !== "all") params.status = status;
      
      const response = await n8n.get("/webhook/export-customers", params);
      
      if (response.success && response.data) {
        // Create CSV blob and download
        const csvContent = convertToCSV(response.data);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `customers-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // toast({
        //   title: "Success",
        //   description: "Customers exported successfully",
        // });
      } else {
        throw new Error(response.error || "Export failed");
      }
    } catch (error) {
      console.error("Error exporting customers:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to export customers. Please try again.",
      //   variant: "destructive",
      // });
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header] || "")).join(","));
    return [headers.join(","), ...rows].join("\n");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">
          {initialTotal.toLocaleString()} Customers
        </CardTitle>
        <CardDescription>
          Recent customer records with plan, billing, status, and signup activity.
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <RecentCustomersTable initialData={initialData} initialTotal={initialTotal} />
      </CardContent>
    </Card>
  );
}