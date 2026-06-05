import { CheckoutNav } from "@/components/layout/checkout-nav";
import { fetchRandomFeaturedProducts } from "@/lib/data/products";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let products = await fetchRandomFeaturedProducts({countryCode: 'ph'})

  return (
    <>
        <CheckoutNav />
      <main className="flex flex-col gap-4 p-4 md:p-10 transition-all duration-150 ease-in-out min-h-[calc(100vh-8rem)]">
        {children}
      </main>
    </>
  );
}
