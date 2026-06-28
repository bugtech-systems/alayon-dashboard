"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiClient"
import { retrieveCustomer } from "@/lib/actions"
import { removeAuthToken, setAuthToken, setCachedId } from "@/lib/data/cookies"

type User = {
  id: string
  email: string
  actor_type?: string
}

type AuthContextType = {
  user: User | null
  session?: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  session_id?: any
  company?: any
}


const AuthContext = createContext<AuthContextType | null>(null)

export function MedusaAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  // ----------------------------
  // SESSION CHECK
  // ----------------------------
  const fetchAuthSession = async () => {
    try {
      
  //  let res = await apiFetch(
  //     `/webhook/auth/session`, { 
  //     method: "POST",
  //     // body: { email, password, actorType },
  //   })


      const res = await retrieveCustomer() as any;
      //   const userData = await resUser.json() as any;
      console.log(res, 'RESSS')
        if(res.user || res.customer || res.company || res.driver){
          let customer = {...(res.user || res.customer || res.company || res.driver || res), actor_type: res.actor_type};
        setUser(customer)
        console.log(customer, 'CUSTOMMMSS')
        } 
        

        await setCachedId(res?.id)

        // fetchSession(res?.user?.id)
    } catch {
      setUser(null)
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
   let res = await apiFetch(
      `/auth/${actorType}/emailpass`, { 
      method: "POST",
      body: { email, password, actorType },
    })

    if(res.token){
    setAuthToken(res?.token)
    // Re-fetch session (sets user state)
    await fetchAuthSession()
    router.push("/")
    } else {
      removeAuthToken()
      localStorage.removeItem('signup_company_id')
      localStorage.removeItem('signup_user_type')

      
    }

    // ✅ redirect after login success
  }

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const logout = async () => {

    setUser(null)
    setCompany(null)
    localStorage.removeItem('session_id')
    localStorage.removeItem('token')
    removeAuthToken();
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, company }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useMedusaAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useMedusaAuth must be used inside provider")
  return ctx
}