// modules/account/components/login.tsx
"use client"

import { login } from "@/lib/data/customer"
import { LOGIN_VIEW } from "@/modules/account/templates/login-template"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Command, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

const Login = ({ setCurrentView }: Props) => {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  const onSubmit = async (data: FormData) => {
    // Clear previous errors
    setServerError(null)
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("password", data.password)
      if (data.remember) {
        formData.append("remember_me", "true")
      }
      
      const result = await login({}, formData)
      console.log(result, 'LOGIN RESULT')
      
      // Handle different response formats
      if (result) {
        // Check if result contains error
        if (typeof result === 'string' && result.toLowerCase().includes('error')) {
          setServerError(result)
        } else if (result.error) {
          setServerError(result.error)
        } else if (result.message) {
          setServerError(result.message)
        } else if (result.success === false) {
          setServerError(result.message || "Invalid email or password. Please try again.")
        } else {
          // Successful login - redirect to home page
          router.push("/")
          router.refresh() // Refresh server components
        }
      } else {
        setServerError("Invalid email or password. Please try again.")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Handle specific error messages
      if (error.message?.toLowerCase().includes("invalid")) {
        setServerError("Invalid email or password. Please try again.")
      } else if (error.message?.toLowerCase().includes("network")) {
        setServerError("Network error. Please check your connection and try again.")
      } else {
        setServerError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Get email error message
  const getEmailError = () => {
    if (form.formState.errors.email) {
      return form.formState.errors.email.message
    }
    return null
  }

  // Get password error message
  const getPasswordError = () => {
    if (form.formState.errors.password) {
      return form.formState.errors.password.message
    }
    return null
  }

  return (
    <div className="flex h-[90vh] w-full">
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Login</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Welcome back. Enter your email and password, let&apos;s hope you remember them this time.
            </div>
          </div>
          
          <div className="space-y-4">
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className={cn(
                        "pl-9",
                        getEmailError() && "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="email"
                      disabled={isLoading}
                      {...form.register("email")}
                      aria-invalid={!!form.formState.errors.email}
                      data-testid="email-input"
                    />
                  </div>
                  {getEmailError() && (
                    <p className="text-sm text-destructive" data-testid="email-error">
                      {getEmailError()}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        // Handle forgot password - redirect to forgot password page
                        router.push("/forgot-password")
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      data-testid="forgot-password-button"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn(
                        "pl-9 pr-9",
                        getPasswordError() && "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...form.register("password")}
                      aria-invalid={!!form.formState.errors.password}
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {getPasswordError() && (
                    <p className="text-sm text-destructive" data-testid="password-error">
                      {getPasswordError()}
                    </p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="login-remember"
                    checked={form.watch("remember")}
                    onCheckedChange={(checked) => form.setValue("remember", Boolean(checked))}
                    disabled={isLoading}
                    data-testid="remember-me-checkbox"
                  />
                  <Label
                    htmlFor="login-remember"
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Server Error Message */}
                {serverError && (
                  <Alert variant="destructive" className="mt-4" data-testid="login-error-message">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                className="w-full" 
                type="submit" 
                disabled={isLoading}
                data-testid="sign-in-button"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground text-xs">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
                className="text-primary hover:underline transition-colors"
                data-testid="register-button"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">Alayon</h1>
              <p className="text-primary-foreground/80 text-xl">Login to continue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login