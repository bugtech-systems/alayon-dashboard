import { retrieveCompany } from "@/lib/actions";
import { getRegion } from "@/lib/actions/regions";
import { getCompanyProducts } from "@/lib/data";
import CompanyProfileTemplate from "@/modules/company/templates/company-profile-template"

export default async function CompanyPage({ params }: { params: { id: string; countryCode: string } }) {
  console.log(await params, 'PARRRSS')
  let {id} = await params;
  const company = await retrieveCompany(id)
  const region = await getRegion('ph')
  const products = await getCompanyProducts(id);
  // const products = [];
  console.log(company, products, 'COMMPA')
  return (
    <CompanyProfileTemplate
      company={company}
      products={products}
      region={region}
      countryCode={params.countryCode}
    />
  )
}