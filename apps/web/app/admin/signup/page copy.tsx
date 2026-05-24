// app/signup/signup-client.tsx (Client Component)
'use client'

import { useState } from "react"
import { useMedusaAuth } from "@/providers/MedusaAuthProvider"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Store, Truck, User, Building2, Mail, Lock, UserPlus, Phone } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

type UserType = "customer" | "company" | "driver" | "user"

interface SignupFormData {
  email: string
  phone: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  userType: UserType
  companyId?: string
}

interface SignupPageClientProps {
  companies?: Array<{ id: string; name: string }>
}

export default function SignupPageClient({ companies = [] }: SignupPageClientProps) {
  const { register } = useMedusaAuth() as any
  
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    userType: "company",
    companyId: ""
  })
  const [errors, setErrors] = useState<Partial<SignupFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const userTypes = [
    { value: "company", label: "Merchant", icon: Store, color: "green", requiresCompany: false },
    { value: "driver", label: "Driver", icon: Truck, color: "orange", requiresCompany: true },
    { value: "user", label: "Admin", icon: Building2, color: "purple", requiresCompany: true },
  ]

  // Phone number validation (basic: at least 10 digits)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
    return phoneRegex.test(phone) || phone.replace(/\D/g, '').length >= 10
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupFormData> = {}
    
    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = "First name is required"
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }
    
    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required"
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }
    
    // Phone validation (required)
    if (!formData.phone) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (at least 10 digits)"
    }
    
    // Email validation (optional but validate format if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    // Password validation (only minimum length requirement)
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    
    // User type validation
    if (!formData.userType) {
      newErrors.userType = "Please select an account type"
    }
    
    // Company validation for drivers and admins
    const selectedType = userTypes.find(t => t.value === formData.userType)
    if (selectedType?.requiresCompany && !formData.companyId) {
      newErrors.companyId = "Please select a company"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setGeneralError(null)
    
    try {
      // Prepare registration data based on user type
      const registrationData = {
        email: formData.email || undefined, // Only include if provided
        phone: formData.phone,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        userType: formData.userType,
        ...(formData.companyId && { company_id: formData.companyId })
      }
      
      await register(registrationData)
    } catch (error: any) {
      console.error("Signup error:", error)
      setGeneralError(
        error?.message || "Registration failed. Please try again with different credentials."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = isSubmitting
  const selectedUserType = userTypes.find(type => type.value === formData.userType)
  const SelectedIcon = selectedUserType?.icon || User
  const showCompanySelect = selectedUserType?.requiresCompany

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="mb-8 text-center">
          <Link href="/products">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join Medusa Eats and start ordering today
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Type Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  I want to sign up as
                </label>
                <Select
                  value={formData.userType}
                  onValueChange={(value) => handleInputChange("userType", value as UserType)}
                  disabled={isLoading}
                >
                  <SelectTrigger className={cn(
                    "w-full",
                    errors.userType && "border-red-500 ring-red-500"
                  )}>
                    <SelectValue placeholder="Select account type">
                      {selectedUserType && (
                        <div className="flex items-center gap-2">
                          <SelectedIcon className="h-4 w-4" />
                          <span>{selectedUserType.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn(
                              "h-4 w-4",
                              type.color === "blue" && "text-blue-600",
                              type.color === "green" && "text-green-600",
                              type.color === "orange" && "text-orange-600",
                              type.color === "purple" && "text-purple-600"
                            )} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {errors.userType && (
                  <p className="text-xs text-red-500">{errors.userType}</p>
                )}
              </div>

              {/* Name Fields - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    disabled={isLoading}
                    className={cn(errors.firstName && "border-red-500 focus:ring-red-500")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    disabled={isLoading}
                    className={cn(errors.lastName && "border-red-500 focus:ring-red-500")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Phone Input - Required */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "pl-9",
                      errors.phone && "border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
                {!errors.phone && formData.phone && (
                  <p className="text-xs text-green-500">✓ Valid phone number</p>
                )}
              </div>

              {/* Email Input - Optional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "pl-9",
                      errors.email && "border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
                <p className="text-xs text-gray-500">
                  We'll send order confirmations to this email if provided
                </p>
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "pl-9",
                      errors.password && "border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
                {!errors.password && formData.password && (
                  <p className="text-xs text-green-500">✓ Password strength: {formData.password.length >= 8 ? "Strong" : formData.password.length >= 6 ? "Good" : "Weak"}</p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      "pl-9",
                      errors.confirmPassword && "border-red-500 focus:ring-red-500"
                    )}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
                {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-500">✓ Passwords match</p>
                )}
              </div>

              {/* Company Selection (for drivers and admins) */}
              {showCompanySelect && companies.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Company *
                  </label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => handleInputChange("companyId", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={cn(
                      "w-full",
                      errors.companyId && "border-red-500 ring-red-500"
                    )}>
                      <SelectValue placeholder="Choose a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span>{company.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.companyId && (
                    <p className="text-xs text-red-500">{errors.companyId}</p>
                  )}
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="rounded border-gray-300"
                  disabled={isLoading}
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* General Error Alert */}
              {generalError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/admin/auth/login">
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign in instead
                </button>
              </Link>
            </p>
          </div>
        </div>

        {/* Form Requirements Hint (Optional - remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">Registration Requirements:</p>
            <div className="mt-2 space-y-1 text-xs text-blue-700">
              <p>• <strong>Required:</strong> First name, Last name, Phone number, Password</p>
              <p>• <strong>Optional:</strong> Email address</p>
              <p>• Password must be at least 6 characters (no uppercase or number requirements)</p>
              <p>• Example: password123 or mypassword</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}