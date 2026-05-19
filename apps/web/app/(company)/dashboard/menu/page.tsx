import { MenuActions } from "@/components/dashboard/menu/menu-actions";
import { MenuProductActions } from "@/components/dashboard/menu/menu-product-actions";
import {
  listCategories,
  retrieveCompany,
  retrieveUser,
} from "@/lib/data";
import { RestaurantAdminDTO } from "@/lib/types";
import { ProductDTO, ProductVariantDTO } from "@medusajs/types";
import { Heading, Table, Text } from "@medusajs/ui";
import Image from "next/image";
import { Suspense } from "react";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Loading skeleton
function MenuPageSkeleton() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Wrapper for MenuActions with Suspense
function MenuActionsWrapper({ company, categories }: { company: any; categories: any }) {
  return (
    <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>}>
      <MenuActions company={company} categories={categories} />
    </Suspense>
  )
}

// Wrapper for MenuProductActions with Suspense
function MenuProductActionsWrapper({ product, company }: { product: ProductDTO; company: any }) {
  return (
    <Suspense fallback={<div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>}>
      <MenuProductActions product={product} company={company} />
    </Suspense>
  )
}

// Main content component that fetches data
async function MenuContent() {
  const authData = (await retrieveUser()) as any;
  const companyId = authData?.company?.id;

  if (!companyId) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[400px]">
        <Heading level="h1" className="text-2xl text-red-600">
          Access Denied
        </Heading>
        <Text>You don't have permission to view this page.</Text>
      </div>
    )
  }

  const company = await retrieveCompany(companyId) as any;
  const categories = await listCategories();

  if (!company) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[400px]">
        <Heading level="h1" className="text-2xl text-red-600">
          Company Not Found
        </Heading>
        <Text>Unable to find your company information.</Text>
      </div>
    )
  }

  const categoryProductMap = new Map();

  company?.products?.forEach((product: any) => {
    if (product.categories && product.categories.length > 0) {
      product.categories.forEach((category: any) => {
        if (categoryProductMap.has(category.id)) {
          categoryProductMap.get(category.id).products.push(product);
        } else {
          categoryProductMap.set(category.id, {
            category_name: category.name,
            products: [product],
          });
        }
      });
    } else {
      // Handle products without categories
      const uncategorizedId = "uncategorized"
      if (categoryProductMap.has(uncategorizedId)) {
        categoryProductMap.get(uncategorizedId).products.push(product);
      } else {
        categoryProductMap.set(uncategorizedId, {
          category_name: "Uncategorized",
          products: [product],
        });
      }
    }
  });

  if (categoryProductMap.size === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Heading level="h1" className="text-2xl">
              {company.name} | Dashboard
            </Heading>
            <Text>View and manage your company&apos;s products</Text>
          </div>
          <MenuActionsWrapper company={company} categories={categories} />
        </div>
        <div className="flex flex-col gap-4 items-center justify-center min-h-[300px] border rounded-lg">
          <Text className="text-muted-foreground">No products found</Text>
          <Text className="text-sm text-muted-foreground">Add your first product to get started</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <Heading level="h1" className="text-2xl">
            {company.name} | Dashboard
          </Heading>
          <Text>View and manage your company&apos;s products</Text>
        </div>
        <MenuActionsWrapper company={company} categories={categories} />
      </div>
      {Array.from(categoryProductMap).map(([categoryId, category]) => (
        <div key={categoryId} className="flex flex-col gap-4">
          <Heading level="h2" className="text-xl">
            {category.category_name}
          </Heading>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <Table.Header>
                <Table.Row className="bg-gray-50">
                  <Table.HeaderCell className="w-20">Thumbnail</Table.HeaderCell>
                  <Table.HeaderCell className="w-48">Name</Table.HeaderCell>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                  <Table.HeaderCell className="w-24">Price</Table.HeaderCell>
                  <Table.HeaderCell className="w-24">Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {category.products?.map((product: ProductDTO) => {
                  const variants = product.variants as any;
                  
                  let thumbnail = product.thumbnail;
                  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && thumbnail) {
                    thumbnail = thumbnail.replace(
                      "http://localhost:3000",
                      "https://medusa-eats.vercel.app"
                    );
                  }

                  // Safely get price
                  const price = variants?.[0]?.price?.calculated_amount || 
                               variants?.[0]?.calculated_price?.calculated_amount || 
                               0;

                  return (
                    <Table.Row key={product.id} className="hover:bg-gray-50">
                      <Table.Cell>
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            className="h-12 w-12 rounded-md object-cover"
                            width={48}
                            height={48}
                            alt={`Thumbnail for ${product.title}`}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No img</span>
                          </div>
                        )}
                      </Table.Cell>
                      <Table.Cell className="font-medium">{product.title}</Table.Cell>
                      <Table.Cell className="max-w-md">
                        <p className="truncate">{product.description || "No description"}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-semibold text-primary">
                          ₱{typeof price === 'number' ? price.toLocaleString() : price}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <MenuProductActionsWrapper product={product} company={company} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuPageSkeleton />}>
      <MenuContent />
    </Suspense>
  )
}