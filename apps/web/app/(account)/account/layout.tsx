import { retrieveCustomer } from "@/lib/data/customer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import { Suspense } from "react"

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Loading component
function AccountLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}

// Client component wrapper for login/dashboard
function AccountContent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AccountLayoutSkeleton />}>
      {children}
    </Suspense>
  )
}

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)
  console.log(customer, 'CUSTOMER')

  const content = customer ? dashboard : login

  return (
    <>
      {/* <NavigationHeader /> */}
      <AccountContent>
        {content}
      </AccountContent>
    </>
  )
}