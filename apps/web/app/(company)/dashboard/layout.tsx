import { ProfileBadge } from "@/components/common/profile-badge";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Medusa Eats",
  description: "Order food from your favorite restaurants",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  



  return (
    <>
      <nav className="flex px-4 md:px-10 py-4 h-16 bg-ui-fg-base text-ui-fg-on-inverted justify-between items-center sticky top-0 z-40">
        <Link
          href="/"
          className="flex gap-2 items-center text-xl font-semibold hover:text-ui-bg-base-hover"
        >
         Alayon
        </Link>

        <div className="flex gap-2 items-center">
          <ProfileBadge  />
        </div>
      </nav>
      <main className="flex flex-col gap-20 p-4 md:p-10 min-h-[calc(100vh-8rem)]">
        {children}
      </main>
    </>
  );
}
