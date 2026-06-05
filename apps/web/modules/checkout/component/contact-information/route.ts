// apps/web/modules/checkout/component/contact-information.tsx
"use client"

import { updateCart } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ContactInformation = ({
  cart,
  onNext,
  onPrevious,
}: {
  cart: HttpTypes.StoreCart | null
  onNext?: () => void
  onPrevious?: () => void
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState(cart?.email || "")
  const [phone, setPhone] = useState(cart?.shipping_address?.phone || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Update cart with contact information
      await updateCart(cart!.id, {
        email,
        shipping_address: {
          ...cart?.shipping_address,
          phone,
        }
      })
      
      if (onNext) {
        onNext()
      }
    } catch (err: any) {
      setError(err.message || "Failed to update contact information")
    } finally {
      setIsLoading(false)
    }
  }

  const isComplete = () => {
    return email && phone
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-baseline gap-x-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              Contact Information
            </CardTitle>
            {isComplete() && (
              <div className="rounded-full bg-green-100 p-0.5">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-500 text-sm">
          How can we reach you?
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1 block">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-gray-50 border-gray-200"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1 block">
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
                className="bg-gray-50 border-gray-200"
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              {onPrevious && (
                <Button
                  type="button"
                  onClick={onPrevious}
                  variant="outline"
                  className="flex-1 border-gray-200"
                  disabled={isLoading}
                >
                  Back to Delivery
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isComplete() || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>

      <Separator className="mt-6" />
    </Card>
  )
}

export default ContactInformation