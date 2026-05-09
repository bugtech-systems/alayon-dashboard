import { sdk } from "../medusa/config";
import { RestaurantDTO } from "../types";
import { getCacheHeaders } from "../medusa/data/cookies";
import { getRegion } from "./regions";

export async function retrieveRestaurant(
  restaurantId: string
): Promise<RestaurantDTO> {
  const cacheHeaders = await getCacheHeaders("restaurants");
  
  const { restaurant }: { restaurant: RestaurantDTO } = await sdk.client.fetch(
    `/store/restaurants/${restaurantId}`,
    {
      method: "GET",
      headers: {
        ...cacheHeaders,
      },
    }
  );

  return restaurant;
}

export async function listRestaurants(
  filter?: Record<string, string>
): Promise<RestaurantDTO[]> {
  const query = new URLSearchParams(filter).toString();
  const cacheHeaders = await getCacheHeaders("restaurants");

  const { restaurants }: { restaurants: RestaurantDTO[] } =
    await sdk.client.fetch(`/store/restaurants?${query}`, {
      method: "GET",
      headers: {
        ...cacheHeaders,
      },
    });

  return restaurants;
}

export async function retrieveRestaurantByHandle(
  handle: string
): Promise<any> {
  const region = await getRegion('ph');
  console.log(region, 'REGGIONs');
  const cacheHeaders = await getCacheHeaders("restaurants");
  
  const { restaurants }: { restaurants: RestaurantDTO[] } =
    await sdk.client.fetch(`/store/restaurants?handle=${handle}`, {
      method: "GET",
      headers: {
        ...cacheHeaders,
      },
    });

  return restaurants[0];
}