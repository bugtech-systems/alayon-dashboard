import { HttpTypes } from "@medusajs/types";
import { sdk } from "../config";
import { getAuthHeaders, getCacheHeaders } from "../data/cookies";

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
  console.log(product_categories, 'PRODDS CATT')
  return product_categories as HttpTypes.StoreProductCategory[];
}
