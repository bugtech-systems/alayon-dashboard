import { retrieveCustomer } from "@/lib/data/customer"
import { NavigationHeader } from "@/modules/layout/templates/nav"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)
  console.log(customer, 'CUSTOMMERrr')
  return <>
  {customer ? dashboard : login}
  </>
}
