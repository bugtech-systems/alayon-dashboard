import { retrieveCompany } from "@/lib/actions";
import { getRegion } from "@/lib/actions/regions";
import { getCompanyProducts } from "@/lib/data";
import { getProductsById, listCompanyProducts, listProducts } from "@/lib/data/products";
import { getProductById } from "@/lib/medusa/client";
import CompanyProfileTemplate from "@/modules/company/templates/company-profile-template"
import { NavigationHeader } from "@/modules/layout/templates/nav";

export default async function CompanyPage({ params }: { params: { id: string; countryCode: string } }) {
  console.log(await params, 'PARRRSS')
  let {id} = await params;
  const company = await retrieveCompany(id)
  const region = await getRegion('ph')
  const ids = company?.products ? company?.products.map(a => a.id) : [];
  const products = await getProductsById({ids, regionId: region?.id});
  // const products = [];
  console.log(company, products,  ids, 'COMMPA')
  return (
    <>
     <NavigationHeader/>
    
    <CompanyProfileTemplate
      company={company}
      products={products}
      region={region}
      countryCode={params.countryCode}
    />
    </>
  )
}