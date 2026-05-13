
"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMedusaAuth } from "@/providers/MedusaAuthProvider"

export default function HomePage() {
  const { user, loading } = useMedusaAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (user) {
        if(user.actor_type == 'company'){
                return router.replace("/dashboard/company")
        }
        if(user.actor_type == 'driver'){
            return router.replace("/dashboard/driver")
        }
        router.replace("/home")
    } else {
      router.replace("/login")
    }
  }, [user, loading])

  return null
}