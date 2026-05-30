import { CheckoutNav } from "@/components/layout/checkout-nav";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  

  return (
    <>
        <CheckoutNav/>
      <main className="flex flex-col gap-4 p-4 md:p-10 transition-all duration-150 ease-in-out min-h-[calc(100vh-8rem)]">
        {children}
      </main>
    </>
  );
}
