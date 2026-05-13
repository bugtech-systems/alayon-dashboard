"use server";

import { retrieveSession } from "@/lib/data/sessions";
import {CompanyDTO, RestaurantProductDTO } from "@/lib/types";
import { promises as fs } from "fs";
import { revalidateTag } from "next/cache";
import { sdk } from "../medusa/config";
import { getAuthHeaders, getCacheTag } from "../medusa/data/cookies";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9000";
const FRONTEND_URL =
  (process.env.NEXT_PUBLIC_VERCEL_URL &&
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`) ||
  "http://localhost:3000";

export async function setCompanyStatus(
  companyId: string,
  status: boolean
): Promise<CompanyDTO | { message: string }> {
  try {
    const { company } = await sdk.client.fetch<{
      company: CompanyDTO;
    }>(`/store/companies/${companyId}/status`, {
      method: "POST",
      body: { is_open: status },
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
    });

    revalidateTag("companies", "max");

    return company;
  } catch (error) {
    return { message: "Error setting company status" };
  }
}

export async function createProduct(
  prevState: any,
  createProductData: FormData
): Promise<RestaurantProductDTO | { message: string }> {
  const token = retrieveSession();
  const restaurantId = createProductData.get("company_id") as string;
  const image = createProductData.get("image") as File;
  const fileName = image?.name;

  if (image) {
    await saveFile(image, fileName as string);
  }

  createProductData.set("thumbnail", `${FRONTEND_URL}/${fileName}`);

  createProductData.delete("image");

  const productData = {} as Record<string, any>;

  Array.from(createProductData.entries()).forEach(([key, value]) => {
    if (key === "company_id") {
      return;
    }
    productData[key] = value;
  });

  try {
    const { restaurant_product } = await sdk.client.fetch<{
      restaurant_product: RestaurantProductDTO;
    }>(`/restaurants/${restaurantId}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: productData,
    });

    revalidateTag(getCacheTag("products"));

    return restaurant_product;
  } catch (error) {
    return { message: "Error creating product" };
  }
}

async function saveFile(file: File, fileName: string) {
  const data = await file.arrayBuffer();
  await fs.appendFile(`./public/${fileName}`, Buffer.from(data));
  return;
}

export async function deleteProduct(productId: string, restaurantId: string) {
  try {
    await sdk.client.fetch(`/restaurants/${restaurantId}/products`, {
      method: "DELETE",
      body: { product_ids: [productId] },
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    revalidateTag(getCacheTag("products"));
    revalidateTag(getCacheTag("restaurants"));

    return true;
  } catch (error) {
    return false;
  }
}
