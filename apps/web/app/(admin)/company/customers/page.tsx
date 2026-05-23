// app/customers/page.tsx
import { Suspense } from "react";
import { SubscriberOverview } from "@/components/subscriber-overview";
import { n8n } from "@/lib/n8n-webhook-service";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  metadata: any;
  has_account: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  subscribed: number;
  newThisMonth: number;
}

// Server-side data fetching
async function getInitialData() {
  try {
    // Fetch initial customers data
    const customersResponse = await n8n.paginated<Customer>(
      "/webhook/get-company-customers",
      1,
      10,
      {}
    );
    
    // Fetch stats (optional - create a separate endpoint or calculate from customers)
    const statsResponse = await n8n.get<Stats>("/webhook/get-customers-stats");
    
    return {
      customers: customersResponse.success ? customersResponse.data?.data || [] : [],
      total: customersResponse.success ? customersResponse.data?.total || 0 : 0,
      stats: statsResponse.success ? statsResponse.data : null,
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return {
      customers: [],
      total: 0,
      stats: null,
    };
  }
}

export default async function CustomersPage() {
  const { customers, total, stats } = await getInitialData();
  

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Suspense fallback={<CustomersSkeleton />}>
        <SubscriberOverview 
          initialData={customers[0]?.id ? customers : []}
          initialTotal={total}
          initialStats={stats}
        />
      </Suspense>
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[600px]" />
    </div>
  );
}