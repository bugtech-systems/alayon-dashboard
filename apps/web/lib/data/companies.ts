import { n8nFetcher } from "@/hooks/useN8nQuery";
import { sdk } from "../medusa/config";
import { getAuthHeaders } from "../medusa/data/cookies";
import { getRegion } from "./regions";
import { getCacheHeaders } from "./cookies";


export async function listCompanies(
  filter?: Record<string, string>
): Promise<any[]> {
  const query = new URLSearchParams(filter).toString();
  const cacheHeaders = await getAuthHeaders();

  const { companies }: { companies: any[] } =
    await sdk.client.fetch(`/store/companies?${query}`, {
      method: "GET",
      headers: {
        ...cacheHeaders,
      },
    });

  return companies;
}

export async function retrieveCompanyByHandle(
  handle: string
): Promise<any> {
  const region = await getRegion('ph');
  console.log(region, 'REGGIONs');
  const cacheHeaders = await getCacheHeaders("companies");
  
  const { companies }: { companies: any[] } =
    await sdk.client.fetch(`/store/companies?handle=${handle}`, {
      method: "GET",
      headers: {
        ...cacheHeaders,
      },
    });

  return companies[0];
}

export async function retrieveCompany(
  companyId: string
): Promise<any> {
    const cacheHeaders = await getAuthHeaders();
  const { company }: { company: any } =
    await sdk.client.fetch(`/store/companies/${companyId}`, {
      method: "GET",
      headers: {
        ...cacheHeaders,
        ...(await getCacheHeaders("companies")),
      },
    });
   
   
  return company;
}


export async function retrieveCompanyDeliveries(
  companyId: string
): Promise<any> {
    const cacheHeaders = await getAuthHeaders();

  const company = await n8nFetcher({endpoint:
    `/webhook/get-company-deliveries?company_id=${companyId}`,
      method: "GET",
      headers: {
        ...cacheHeaders,
      }
    }
  );
   

  return company;
}