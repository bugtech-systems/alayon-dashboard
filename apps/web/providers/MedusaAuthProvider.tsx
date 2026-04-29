"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiClient"

type User = {
  id: string
  email: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function MedusaAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  // ----------------------------
  // SESSION CHECK
  // ----------------------------
  const fetchSession = async () => {
    try {
      const res = await apiFetch("/auth/session", {
        method: "POST",
      })

      if (!res.ok) throw new Error("No session")

      const data = await res.json()

      const actorId = data?.user?.actor_id

      if (actorId) {
        const resUser = await apiFetch(`/admin/users/${actorId}`, {
          method: "GET",
        })

        const userData = await resUser.json()

        setUser(userData.user ?? null)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  // ----------------------------
  // LOGIN
  // ----------------------------
  const login = async (email: string, password: string) => {
    const res = await apiFetch("/auth/user/emailpass", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) throw new Error("Login failed")

    await res.json()

    // Re-fetch session (sets user state)
    await fetchSession()

    // ✅ redirect after login success
    router.push("/dashboard")
  }

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const logout = async () => {
    await apiFetch("/auth/session", {
      method: "DELETE",
    })

    setUser(null)

    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useMedusaAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useMedusaAuth must be used inside provider")
  return ctx
}