// modules/account/components/register.tsx
"use client"

import { useActionState, useState } from "react"
import { LOGIN_VIEW } from "@/modules/account/templates/login-template"
import ErrorMessage from "@/modules/checkout/components/error-message"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { register } from "@/lib/data/customer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  UserPlus, 
  LogIn,
  Eye, 
  EyeOff,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(register, null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: ""
  })

  // Password strength checker (minimum 6 characters)
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8 && password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.length >= 8 && password.match(/[0-9]/)) strength++
    if (password.length >= 8 && password.match(/[^a-zA-Z0-9]/)) strength++
    return Math.min(strength, 4)
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const isValidPassword = formData.password.length >= 6
  const isFormValid = formData.first_name && formData.last_name && formData.phone && isValidPassword

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[80vh] bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join us for faster checkout and exclusive offers
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Name Fields - Two Columns (Both Required) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="Juan"
                    className="pl-9"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    autoComplete="given-name"
                    data-testid="first-name-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Dela Cruz"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
            </div>

            {/* Email Field - NOT Required */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  data-testid="email-input"
                />
              </div>
            </div>

            {/* Phone Field - Required */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+63 XXX XXX XXXX"
                  className="pl-9"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  autoComplete="tel"
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your mobile number for order updates
              </p>
            </div>

            {/* Password Field - Minimum 6 characters */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  className={cn(
                    "pl-9 pr-9",
                    !isValidPassword && formData.password.length > 0 && "border-red-500 focus-visible:ring-red-500"
                  )}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
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

              {/* Password Requirements Message */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all",
                          level <= passwordStrength
                            ? level === 1
                              ? "bg-red-500"
                              : level === 2
                              ? "bg-orange-500"
                              : level === 3
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                            : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {!isValidPassword && formData.password.length > 0 && (
                      <span className="text-red-500">Password must be at least 6 characters</span>
                    )}
                    {isValidPassword && passwordStrength === 1 && "Weak password"}
                    {isValidPassword && passwordStrength === 2 && "Fair password"}
                    {isValidPassword && passwordStrength === 3 && "Good password"}
                    {isValidPassword && passwordStrength === 4 && "Strong password!"}
                  </p>
                </div>
              )}
              
              {/* Password hint */}
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Stronger passwords use a mix of letters, numbers, and symbols.
              </p>
            </div>

            {/* Error Message */}
            <ErrorMessage error={message} data-testid="register-error" />

            {/* Terms and Conditions */}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                By creating an account, you agree to our{" "}
                <LocalizedClientLink
                  href="/content/privacy-policy"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </LocalizedClientLink>{" "}
                and{" "}
                <LocalizedClientLink
                  href="/content/terms-of-use"
                  className="text-primary hover:underline"
                >
                  Terms of Use
                </LocalizedClientLink>
                .
              </p>
            </div>

            {/* Submit Button - Disabled until form is valid */}
            <SubmitButton 
              className="w-full" 
              data-testid="register-button"
              disabled={!isFormValid}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </SubmitButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to Existing Account
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span>Secure checkout • Data protected • 24/7 support</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register