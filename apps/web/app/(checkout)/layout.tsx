import { ProfileBadge } from "@/components/common/profile-badge";
import { CartProvider } from "@/lib/context/cart-context";
import { FlyingBox } from "@medusajs/icons";
import Link from "next/link";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  return (
    <>
  <CartProvider>
      <nav className="flex px-4 md:px-10 py-4 h-16 bg-ui-fg-base text-ui-fg-on-inverted justify-between items-center sticky top-0 z-40">
        <Link
          href="/store"
          className="flex gap-2 items-center text-xl font-semibold hover:text-ui-bg-base-hover"
        >
          <FlyingBox /> Alayon
        </Link>
       
        <div className="flex gap-2 items-center">
       <ProfileBadge />
        </div>
      </nav>
      <main className="flex flex-col gap-4 p-4 md:p-10 transition-all duration-150 ease-in-out min-h-[calc(100vh-8rem)]">
        {children}
      </main>
      </CartProvider>
    </>
  );
}
