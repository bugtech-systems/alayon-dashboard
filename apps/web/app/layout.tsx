// app/layout.tsx
import type { Metadata } from "next";
import { MedusaAuthProvider } from "@/providers/MedusaAuthProvider";
import { Providers } from "@/providers/queryProvider";
import { Analytics } from "@vercel/analytics/next";
import { LocationProvider } from '@/lib/context/LocationContext';
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import "@workspace/ui/globals.css"
import { AuthProvider } from "@/contexts/AuthContext";
import { fontVars } from "@/lib/fonts/registry";
import { getCachedIdIfExists } from "@/lib/data/cookies";


export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
      const cachedId = await getCachedIdIfExists();
    
    const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;

    console.log(cachedId, 'CACHED')
  return (
    <html  
      lang="en"
      // data-theme-mode={theme_mode}
      // data-theme-preset={theme_preset}
      // data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning>
        <head>
                  {/* <ThemeBootScript /> */}
        </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          
     <LocationProvider isOpen={!cachedId}>
        <MedusaAuthProvider>
        <Providers>
            <AuthProvider>
 
          {children}
          </AuthProvider>
        </Providers>
        </MedusaAuthProvider>
</LocationProvider>
        <Analytics />
        </TooltipProvider>

      </body>
    </html>
  );
}