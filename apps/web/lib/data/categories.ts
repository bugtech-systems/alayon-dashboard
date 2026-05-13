import { HttpTypes } from "@medusajs/types";
import { sdk } from "../medusa/config";
import { getAuthHeaders, getCacheHeaders } from "../medusa/data/cookies";

export async function listCategories(): Promise<
  HttpTypes.StoreProductCategory[]
> {
  const { product_categories } = await sdk.store.category.list(
    {},
    {
      ...(await getAuthHeaders()),
      ...(await getCacheHeaders("categories")),
    }
  );

  return product_categories as HttpTypes.StoreProductCategory[];
}
