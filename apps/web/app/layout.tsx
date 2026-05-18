// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/globals.css"
import { MedusaAuthProvider } from "@/providers/MedusaAuthProvider";
import { Providers } from "@/providers/queryProvider";
import { TooltipProvider } from "@medusajs/ui";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { LocationProvider, useLocation } from '@/lib/context/LocationContext';



export const metadata: Metadata = {
  title: "My Store",
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
     <LocationProvider>
        <MedusaAuthProvider>
        <Providers>
        <TooltipProvider>
        <ThemeProvider>
          {children}
          </ThemeProvider>
        </TooltipProvider>
        </Providers>
        </MedusaAuthProvider>
</LocationProvider>
        <Analytics />

      </body>
    </html>
  );
}