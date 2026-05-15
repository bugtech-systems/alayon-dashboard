import { Geist, Geist_Mono, Roboto, Public_Sans } from "next/font/google"
import "@workspace/ui/globals.css"
import { CartProvider } from "@/lib/context/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/providers/queryProvider"
import { cn } from "@workspace/ui/lib/utils";
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { MedusaAuthProvider } from "@/providers/MedusaAuthProvider"

const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", roboto.variable, publicSansHeading.variable)}
    >
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
  )
}
