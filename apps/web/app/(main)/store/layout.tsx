import { LocationProvider } from "@/lib/context/LocationContext"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocationProvider>
        {children}
    </LocationProvider>
  )
}
