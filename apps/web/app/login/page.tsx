"use client"

import { useState } from "react"
import { useMedusaAuth } from "@/providers/MedusaAuthProvider"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

export default function LoginPage() {
  const { login } = useMedusaAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-80 space-y-4">
        <Input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          onClick={() => login(email, password)}
          className="w-full"
        >
          Login
        </Button>
      </div>
    </div>
  )
}