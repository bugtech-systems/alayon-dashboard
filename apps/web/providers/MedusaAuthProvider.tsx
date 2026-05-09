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


const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
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
       let token = localStorage.getItem('token');

   

      if(!token) return  router.push("/login")

      const res = await n8nFetcher({"endpoint": "/webhook/auth/session", 
        method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-publishable-api-key": PUB_KEY
          } as any})

      //   const userData = await resUser.json() as any;
        setUser(res?.user ?? null)
        fetchSession(res?.user?.id)
      
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
  const login = async (email: string, password: string, actorType: string) => {
    const res = await n8nFetcher({endpoint: "/webhook/auth", 
      method: "POST",
      body: { email, password, actorType },
    })


  console.log(res, 'DATA')
  if(res?.token){
  localStorage.setItem('token', res?.token)
  }
    // Re-fetch session (sets user state)
    await fetchAuthSession()
    await fetchSession()

    // ✅ redirect after login success
    router.push("/dashboard")
  }

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const logout = async () => {

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