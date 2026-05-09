import { sdk } from "../medusa/config";
import { getAuthHeaders, getCacheOptions } from "../medusa/data/cookies";
import { DriverDTO, RestaurantAdminDTO } from "../types";

export async function retrieveUser() {
  try {

        // Method 1: Using the list endpoint with handle filter (recommended)
       const headers = {
        ...(await getAuthHeaders()),
      }
    
      const next = {
        ...(await getCacheOptions("users")),
      }


    const { user } = await sdk.client.fetch<{
      user: RestaurantAdminDTO | DriverDTO | null;
    }>("/store/users/me", {
      headers,
      next,
    });
    console.log(user, 'USSS')
    return user;
  } catch (error) {
    console.log(error, 'errr');
    return null;
  }
}
