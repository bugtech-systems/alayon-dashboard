// app/account/client-page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { sdk } from "@/lib/config"
import { useAuth } from "@/contexts/AuthContext"

export default function AccountClientPage() {
  const router = useRouter()
  const { user } = useAuth();
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  console.log(user, "USSER")
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Attempt to get the current customer session
        const { customer } = await sdk.store.customer.retrieve();
        console.log(customer, "CUSTTOMS")
        setCustomer(customer)
      } catch (error) {
        // Not authenticated - redirect to login
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!customer) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Welcome back, {customer.email}!</p>
        <button
          onClick={async () => {
            await medusa.auth.logout()
            router.push("/login")
          }}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}