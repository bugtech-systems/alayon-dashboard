// app/(company)/dashboard/company/page.tsx
import AccountBadge from "@/components/dashboard/account-badge";
import DeliveryColumn from "@/components/dashboard/delivery-column";
import RealtimeClient from "@/components/dashboard/realtime-client";
import CompanyStatus from "@/components/dashboard/company/company-status";
import { retrieveCompany,  retrieveUser } from "@/lib/data";
import { DeliveryStatus } from "@/lib/types";
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CompanyDashboardPage() {
    const authData = (await retrieveUser()) as any;
    // If no user found or user doesn't exist, remove token and redirect
    if (!authData?.user || !authData?.user.id) {
      console.log("No user found, removing auth token...");
      // redirect("/login");
    }

    let { user, company_id } = authData; 


    // Check if user is a company admin (company user)
    if (!user.id.includes("emp")) {
      console.log("Invalid user type, redirecting to login...");
      // redirect("/login");
    }

    // Check if user has a company_id
    if (!company_id) {
      console.log("User has no company_id, showing not found...");
      return notFound();
    }



      let company = await retrieveCompany(company_id)

    console.log( company, 'commmss')
    // If company doesn't exist, remove token and redirect
    if (!company) {
      console.log("Company not found, removing auth token...");
      // redirect("/login");
    }

    const { name, deliveries, is_open } = company as any;
    console.log( company, 'commmss')

    return (
      <>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <Heading level="h1" className="text-2xl">
              {name} | Company Dashboard
            </Heading>
            <Text>View and manage your company&apos;s orders.</Text>
          </div>
          <Container className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-4">
            <div className="flex flex-col justify-between gap-2">
              <Text className="font-semibold">Company Status</Text>
              <div className="flex gap-2">
                <Text>Company status: </Text>{" "}
                <StatusBadge
                  color={is_open ? "green" : "red"}
                  className="flex pl-1 pr-2 py-1 gap-1 w-fit"
                >
                  {is_open ? "Taking orders" : "Closed"}
                </StatusBadge>
                <CompanyStatus company={company} />
              </div>
              <div className="flex gap-2">
                <Text>Connection status: </Text>{" "}
                <RealtimeClient companyId={company?.id} />
              </div>
            </div>
            <div className="justify-center hidden md:flex">
              {process.env.NEXT_PUBLIC_DEMO_MODE !== "true" && (
                <div className="flex flex-col justify-between">
                  <Text className="font-semibold">Quick actions</Text>
                  <Link
                    href="/dashboard/company/menu"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm"
                  >
                    Edit menu
                  </Link>
                  <Text
                    className="text-ui-fg-disabled text-sm"
                    aria-disabled={true}
                  >
                    Edit settings
                  </Text>
                  <Text
                    className="text-ui-fg-disabled text-sm"
                    aria-disabled={true}
                  >
                    Edit profile
                  </Text>
                </div>
              )}
            </div>
            <div className="flex md:justify-end">
              <AccountBadge data={company} type="company" />
            </div>
          </Container>
        </div>

        <div className="overflow-x-auto whitespace-nowrap">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-px">
            <DeliveryColumn
              title="Incoming orders"
              deliveries={deliveries || []}
              statusFilters={[
                DeliveryStatus.PENDING,
                DeliveryStatus.COMPANY_ACCEPTED,
              ]}
              type="company"
            />
            <DeliveryColumn
              title="Ready to prepare"
              deliveries={deliveries || []}
              statusFilters={[DeliveryStatus.PICKUP_CLAIMED]}
              type="company"
            />
            <DeliveryColumn
              title="Preparing"
              deliveries={deliveries || []}
              statusFilters={[DeliveryStatus.COMPANY_PREPARING]}
              type="company"
            />
            <DeliveryColumn
              title="In transit"
              deliveries={deliveries || []}
              statusFilters={[
                DeliveryStatus.READY_FOR_PICKUP,
                DeliveryStatus.IN_TRANSIT,
              ]}
              type="company"
            />
            <DeliveryColumn
              title="Completed"
              deliveries={deliveries || []}
              statusFilters={[
                DeliveryStatus.DELIVERED,
                DeliveryStatus.COMPANY_DECLINED,
              ]}
              type="company"
            />
          </div>
        </div>
      </>
    );
  } 