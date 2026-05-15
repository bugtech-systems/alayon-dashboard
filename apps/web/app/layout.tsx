// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/globals.css"
import {  AppSidebar } from "@/components/app-sidebar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/lib/context/cart-context";
import { MedusaAuthProvider } from "@/providers/MedusaAuthProvider";
import { Providers } from "@/providers/queryProvider";
import { TooltipProvider } from "@medusajs/ui";
import { ThemeProvider } from "@/components/theme-provider";


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
    <html lang="en">
      <body>
       <CartProvider>
        <MedusaAuthProvider>
        <Providers>
        <TooltipProvider>
        <ThemeProvider>{children}</ThemeProvider>
        </TooltipProvider>
        </Providers>
        </MedusaAuthProvider>
</CartProvider>
      </body>
    </html>
  );
}