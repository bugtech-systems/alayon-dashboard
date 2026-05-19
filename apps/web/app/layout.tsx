// app/layout.tsx
import type { Metadata } from "next";
import "@workspace/ui/globals.css"
import { MedusaAuthProvider } from "@/providers/MedusaAuthProvider";
import { Providers } from "@/providers/queryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { LocationProvider } from '@/lib/context/LocationContext';
import { TooltipProvider } from "@/components/ui/tooltip";



export const metadata: Metadata = {
  title: "Alayon Store",
  description: "Browse our latest products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TooltipProvider>
     <LocationProvider>
        <MedusaAuthProvider>
        <Providers>
        <ThemeProvider>
          {children}
          </ThemeProvider>
        </Providers>
        </MedusaAuthProvider>
</LocationProvider>
        <Analytics />
        </TooltipProvider>

      </body>
    </html>
  );
}