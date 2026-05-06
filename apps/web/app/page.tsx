
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
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [user, loading])

  return null
}