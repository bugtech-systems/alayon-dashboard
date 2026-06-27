"use client"

import { isStripeLike, paymentInfoMap } from "@/lib/constants"
import { initiatePaymentSession } from "@/lib/data/cart"
import { CheckCircle, CreditCard, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
  onNext,
}: {
  cart: any
  availablePaymentMethods: any[]
  onNext?: () => void
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )
console.log(availablePaymentMethods, activeSession, 'AVVIAALl')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

  }


console.log(selectedPaymentMethod,  'metth')


  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {

            console.log(selectedPaymentMethod, 'actiiiss')

      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod
      console.log(checkActiveSession, cart, 'actiii')
      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        if (onNext) {
          onNext()
        } else {
          router.push(pathname + "?" + createQueryString("step", "review"), {
            scroll: false,
          })
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const selectedMethodInfo = paymentInfoMap[selectedPaymentMethod]

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-baseline gap-x-2">
            <CardTitle className="text-xl font-bold text-gray-900">
              Payment
            </CardTitle>
            {!isOpen && paymentReady && (
              <div className="rounded-full bg-green-100 p-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
          {!isOpen && paymentReady && (
            <Button
              onClick={handleEdit}
              variant="link"
              className="text-blue-600 hover:text-blue-700"
              data-testid="edit-payment-button"
            >
              Edit
            </Button>
          )}
        </div>
        <CardDescription className="text-gray-500 text-sm">
          Select your preferred payment method
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {isOpen ? (
          <div className="space-y-6">
            {!paidByGiftcard && availablePaymentMethods?.length > 0 && (
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                {availablePaymentMethods.map((paymentMethod) => {
                  const info = paymentInfoMap[paymentMethod.id]
                  return (
                    <div
                      key={paymentMethod.id}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer
                        ${selectedPaymentMethod === paymentMethod.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-x-3 flex-1">
                        <RadioGroupItem
                          value={paymentMethod.id}
                          id={paymentMethod.id}
                          className="border-gray-300"
                        />
                        <Label
                          htmlFor={paymentMethod.id}
                          className="flex items-center gap-x-3 cursor-pointer flex-1"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {info?.icon || <CreditCard className="w-5 h-5 text-gray-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {info?.title || paymentMethod.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {info?.description || "Secure payment method"}
                            </p>
                          </div>
                        </Label>
                      </div>
                      {isStripeLike(paymentMethod.id) && (
                        <div className="flex items-center gap-x-2">
                          <img 
                            src="/images/visa.svg" 
                            alt="Visa" 
                            className="h-6"
                          />
                          <img 
                            src="/images/mastercard.svg" 
                            alt="Mastercard" 
                            className="h-6"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </RadioGroup>
            )}

            {paidByGiftcard && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-x-3">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Paying with Gift Card
                    </p>
                    <p className="text-xs text-green-700">
                      Your gift card balance covers the full amount
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" data-testid="payment-method-error-message">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={
                (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
                (!selectedPaymentMethod && !paidByGiftcard) ||
                isLoading
              }
              data-testid="submit-payment-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                selectedPaymentMethod && isStripeLike(selectedPaymentMethod) && !activeSession
                  ? "Enter Card Details"
                  : "Continue to Review"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {cart && paymentReady && activeSession ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Payment Method
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedMethodInfo?.title || activeSession?.provider_id}
                  </span>
                </div>
                <div className="flex items-center gap-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    {selectedMethodInfo?.icon || <CreditCard className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {isStripeLike(selectedPaymentMethod) && cardBrand
                        ? `${cardBrand} •••• ${cardBrand}`
                        : "Payment details will be processed"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Secure payment processing
                    </p>
                  </div>
                </div>
              </div>
            ) : paidByGiftcard ? (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-x-3">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Gift Card Payment
                    </p>
                    <p className="text-xs text-green-700">
                      Full amount covered by gift card
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>

      <Separator className="mt-6" />
    </Card>
  )
}

export default Payment