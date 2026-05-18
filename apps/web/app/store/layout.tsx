import type { Metadata } from 'next'
import { Bebas_Neue, Jost } from 'next/font/google'
import { MedusaAuthProvider } from '@/providers/MedusaAuthProvider'
import { Providers } from '@/providers/queryProvider'
import { TooltipProvider } from '@medusajs/ui'
import { NavigationHeader } from '@/components/layout/templates/nav'
import { retrieveCart } from '@/lib/actions'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
})

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Premium Storefront',
  description: 'Shop the latest collection',
  icons: {
    icon: '/logo.png',
  },
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const cart = await retrieveCart()
  return (
<html lang="en" className={`${bebasNeue.variable} ${jost.variable} bg-background`}>
      <body className="font-sans antialiased">
          {/* <PillNav items={navItems} /> */}
                  <MedusaAuthProvider>
                  <Providers>
                  <TooltipProvider>
                   <NavigationHeader /> 
                    
          <main className="min-h-screen bg-background">{children}</main>
          {/* <Footer /> */}
        </TooltipProvider>
        </Providers>
        </MedusaAuthProvider>
      </body>
    </html>
  )
}
