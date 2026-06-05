// apps/web/modules/checkout/template/checkout-form/index.tsx
"use client"

import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { 
  getCheckoutStep, 
  getNextStep, 
  getPreviousStep, 
  isStepComplete, 
  STEP_NAMES, 
  STEPS, 
  type CheckoutStep 
} from "@/lib/utils/checkout-steps"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@/modules/checkout/component/addresses"
import Payment from "@/modules/checkout/component/payment"
import Review from "@/modules/checkout/component/review"
import Shipping from "@/modules/checkout/component/shipping"
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"

export default function CheckoutForm({
  cart,
  customer,
}: {
  cart: any | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // State management
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address")
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([])
  
  // Refs to prevent multiple updates
  const isUpdatingUrl = useRef(false)
  const isInitialized = useRef(false)
  const previousCartRef = useRef(cart)
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout>()

  if (!cart) return null

  // Load shipping and payment methods
  useEffect(() => {
    const loadMethods = async () => {
      try {
        const [shipping, payment] = await Promise.all([
          listCartShippingMethods(cart.id),
          listCartPaymentMethods(cart.region?.id ?? "")
        ])
        setShippingMethods(shipping || [])
        setPaymentMethods(payment || [])
      } catch (error) {
        console.error("Error loading methods:", error)
      }
    }
    
    loadMethods()
  }, [cart.id, cart.region?.id])

  // Update completed steps based on cart data
  useEffect(() => {
    const newCompletedSteps = STEPS.filter(step => isStepComplete(cart, step))
    
    // Only update if changed
    if (JSON.stringify(newCompletedSteps) !== JSON.stringify(completedSteps)) {
      setCompletedSteps(newCompletedSteps)
    }
    
    previousCartRef.current = cart
  }, [cart, completedSteps])

  // Initialize step from URL or cart state (only once)
  useEffect(() => {
    if (!isInitialized.current) {
      const urlStep = searchParams.get("step") as CheckoutStep
      const cartStep = getCheckoutStep(cart)
      
      // Determine initial step
      let initialStep: CheckoutStep = cartStep || "address"
      
      // Check if URL step is valid and accessible
      if (urlStep && STEPS.includes(urlStep)) {
        const urlStepIndex = STEPS.indexOf(urlStep)
        const cartStepIndex = cartStep ? STEPS.indexOf(cartStep) : -1
        
        if (urlStepIndex <= cartStepIndex + 1) {
          initialStep = urlStep
        }
      }
      
      setCurrentStep(initialStep)
      isInitialized.current = true
    }
  }, [searchParams, cart])

  // Update URL when step changes (debounced to prevent multiple updates)
  const updateUrl = useCallback((step: CheckoutStep) => {
    // Clear any pending timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }
    
    // Set timeout to batch URL updates
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      const currentUrlStep = params.get("step")
      
      // Only update if step changed
      if (currentUrlStep !== step && !isUpdatingUrl.current) {
        isUpdatingUrl.current = true
        params.set("step", step)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        
        // Reset flag after update
        setTimeout(() => {
          isUpdatingUrl.current = false
        }, 100)
      }
    }, 50)
  }, [pathname, router, searchParams])

  // Handle step changes
  const handleStepChange = useCallback((newStep: CheckoutStep) => {
    if (newStep !== currentStep) {
      setCurrentStep(newStep)
      updateUrl(newStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep, updateUrl])

  const goToStep = useCallback((step: CheckoutStep) => {
    const stepIndex = STEPS.indexOf(step)
    const currentIndex = STEPS.indexOf(currentStep)
    
    // Determine if navigation is allowed
    const isAllowed = 
      completedSteps.includes(step) || // Completed steps
      stepIndex < currentIndex || // Previous steps
      (stepIndex === currentIndex + 1 && isStepComplete(cart, currentStep)) // Next step if current is complete
    
    if (isAllowed && step !== currentStep) {
      handleStepChange(step)
    }
  }, [completedSteps, currentStep, cart, handleStepChange])

  const handleNext = useCallback(() => {
    // Check if current step is complete
    if (!isStepComplete(cart, currentStep)) {
      return
    }
    
    const nextStep = getNextStep(currentStep)
    if (nextStep && nextStep !== currentStep) {
      handleStepChange(nextStep)
    }
  }, [currentStep, cart, handleStepChange])

  const handlePrevious = useCallback(() => {
    const previousStep = getPreviousStep(currentStep)
    if (previousStep && previousStep !== currentStep) {
      handleStepChange(previousStep)
    }
  }, [currentStep, handleStepChange])

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    const handleUrlSync = () => {
      const urlStep = searchParams.get("step") as CheckoutStep
      
      if (!urlStep || !STEPS.includes(urlStep)) return
      if (isUpdatingUrl.current) return
      if (urlStep === currentStep) return
      
      // Validate if step is accessible
      const stepIndex = STEPS.indexOf(urlStep)
      const currentIndex = STEPS.indexOf(currentStep)
      const cartStep = getCheckoutStep(cart)
      const cartStepIndex = cartStep ? STEPS.indexOf(cartStep) : -1
      
      const isAccessible = 
        completedSteps.includes(urlStep) ||
        stepIndex < currentIndex ||
        stepIndex <= cartStepIndex + 1
      
      if (isAccessible && urlStep !== currentStep) {
        setCurrentStep(urlStep)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    
    handleUrlSync()
  }, [searchParams, cart, completedSteps, currentStep])

  const stepComponents: Record<CheckoutStep, React.ComponentType<any>> = {
    "address": Addresses,
    "delivery": Shipping,
    "payment": Payment,
    "review": Review,
  }

  const CurrentComponent = stepComponents[currentStep]

  const totalSteps = STEPS.length
  const isCurrentStepComplete = isStepComplete(cart, currentStep)
console.log(cart, currentStep, isCurrentStepComplete, 'ccomp')
  return (
    <div id="checkout-form" className="relative">
      {/* Stepper Navigation */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex items-center justify-center min-w-max">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step)
            const isActive = currentStep === step
            const isLocked = !isCompleted && STEPS.indexOf(step) > STEPS.indexOf(getCheckoutStep(cart) || "address")
            const isAccessible = isCompleted || STEPS.indexOf(step) <= STEPS.indexOf(currentStep)
            
            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => !isLocked && isAccessible && goToStep(step)}
                  disabled={isLocked || !isAccessible}
                  className={`
                    group flex flex-col items-center relative
                    ${!isLocked && isAccessible ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                  aria-label={`Go to ${STEP_NAMES[step]} step`}
                  data-testid={`step-${step}`}
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full 
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : STEPS.indexOf(step) < STEPS.indexOf(currentStep)
                          ? 'bg-gray-400 text-white'
                          : 'bg-gray-200 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`
                    text-xs font-medium mt-2 whitespace-nowrap hidden md:block
                    ${isActive 
                      ? 'text-blue-600' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : STEPS.indexOf(step) < STEPS.indexOf(currentStep)
                          ? 'text-gray-500'
                          : 'text-gray-400'
                    }
                  `}>
                    {STEP_NAMES[step]}
                  </span>
                </button>
                
                {index < STEPS.length - 1 && (
                  <div className="w-12 md:w-20 h-0.5 bg-gray-200 mx-2 relative">
                    <div
                      className={`
                        absolute left-0 top-0 h-0.5 transition-all duration-500
                        ${isCompleted ? 'bg-green-600 w-full' : 'w-0'}
                      `}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Component */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <CurrentComponent 
          cart={cart}
          customer={customer}
          availableShippingMethods={shippingMethods}
          availablePaymentMethods={paymentMethods}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentStep={currentStep}
          currentStepNumber={STEPS.indexOf(currentStep) + 1}
          totalSteps={totalSteps}
          isComplete={isCurrentStepComplete}
        />
      </div>

      {/* Navigation Buttons */}
      {/* <div className="mt-6 flex gap-3">
        {STEPS.indexOf(currentStep) > 0 && (
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="flex-1 border-gray-200 hover:bg-gray-50"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to {STEP_NAMES[getPreviousStep(currentStep) || "addresses"]}
          </Button>
        )}
        
        {STEPS.indexOf(currentStep) < totalSteps - 1 && (
          <Button
            onClick={handleNext}
            disabled={!isCurrentStepComplete}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Continue to {STEP_NAMES[getNextStep(currentStep) || "review"]}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div> */}

      {/* Mobile Bottom Padding */}
      <div className="h-4 lg:h-0" />
    </div>
  )
}