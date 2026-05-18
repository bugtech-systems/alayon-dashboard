// app/[countryCode]/(main)/company/[id]/page.tsx
import { retrieveCompany } from "@/lib/actions";
import { getRegion } from "@/lib/actions/regions";
import { listProducts } from "@/lib/data/products";
import CompanyProfileTemplate from "@/modules/company/templates/company-profile-template"

export default async function CompanyPage({ params }: { params: { id: string; countryCode: string } }) {
  const company = await retrieveCompany(params?.id)
  const region = await getRegion('ph')
  const products = [];
  console.log(company, 'COMMPA')
  return (
    <CompanyProfileTemplate
      company={company}
      products={products}
      region={region}
      countryCode={params.countryCode}
    />
  )
}