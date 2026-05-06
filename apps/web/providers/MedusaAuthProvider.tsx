"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiClient"
import { n8nFetcher } from "@/hooks/useN8nQuery"

type User = {
  id: string
  email: string
}

type AuthContextType = {
  user: User | null
  session?: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  session_id?: any
}

const AuthContext = createContext<AuthContextType | null>(null)

export function MedusaAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  // ----------------------------
  // SESSION CHECK
  // ----------------------------
  const fetchAuthSession = async () => {
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

        const userData = await resUser.json() as any;
        setUser(userData.user ?? null)
        fetchSession(userData?.user?.id)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchSession = async (id?: any) => {
    try {
      let session_id = localStorage.getItem('session_id');
      const res = await n8nFetcher({
        endpoint: "/webhook/session",
        method: "POST",
        body: {...(session_id ? {id: session_id} : {}), auth_id: id }
      })

      if (!res.ok) throw new Error("No session")

      const data = await res.json()
      console.log(data, 'SESSS')
  
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }
  

  useEffect(() => {
    fetchAuthSession()
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

    let data = await res.json()
  console.log(data, 'DATA')
  if(data?.token){
  localStorage.setItem('token', data?.token)
  }
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
    localStorage.removeItem('session_id')
    localStorage.removeItem('token')
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