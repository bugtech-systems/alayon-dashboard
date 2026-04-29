// context/DashboardFilterContext.tsx

"use client"
import { createContext, useContext, useState } from "react"

const DashboardFilterContext = createContext(null)

export function DashboardFilterProvider({ children }) {
  const [filters, setFilters] = useState({
    range: "90d", // 7d | 30d | 90d
  })

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </DashboardFilterContext.Provider>
  )
}

export function useDashboardFilters() {
  return useContext(DashboardFilterContext)
}