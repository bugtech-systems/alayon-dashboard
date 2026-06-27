import { n8nFetcher } from "@/hooks/useN8nQuery";
import { getAuthHeaders, getCacheOptions } from "../data/cookies";
import { sdk } from "../config";
import { getToken } from "../actions";

export async function retrieveUser() {

  const authHeaders = await getAuthHeaders()
  if (!authHeaders) return null
  const headers = { ...authHeaders }
  const next = { ...(await getCacheOptions("customers")) }
  return await sdk.client
    .fetch<{ customer: any }>(`/store/users/me`, {
      method: "GET",
      query: { fields: "*employee, *orders" },
      headers,
      next,
    })
    .then(({ customer }) => customer as any)
    .catch(() => null)
}

export async function loginUser(data: any) {
  try {



        // Method 1: Using the list endpoint with handle filter (recommended)
       const headers = {
        ...(await getAuthHeaders()),
      }
    
      const next = {
        ...(await getCacheOptions("user")),
      }


    const user = await getToken(data);


    console.log(user, 'USSSE')
    return user;
  } catch (error) {
    console.log(error, 'errr');
    return null;
  }
}
