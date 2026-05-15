'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingCart, CreditCard, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/context/cart-context'
import { formatPrice } from '@/lib/shopify/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NumberFlow from '@number-flow/react'

export function CartDrawer() {
  const {
    cart,
    isOpen,
    isLoading,
    cartItems: cartLines,
    totalQuantity,
    closeCart,
    updateCart,
    removeFromCart,
  } = useCart()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeCart])

  const subtotal = cart?.subtotal
    ? parseFloat(cart?.subtotal)
    : 0

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeCart}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-md z-50',
              'flex flex-col',
              'bg-white shadow-2xl'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Shopping Cart
                </h2>
                <AnimatePresence mode="wait">
                  {totalQuantity > 0 && (
                    <motion.span
                      key={totalQuantity}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full"
                    >
                      {totalQuantity}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCart}
                className="h-8 w-8 hover:bg-gray-100"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartLines.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ShoppingCart className="w-20 h-20 text-muted-foreground/30 mb-6" />
                  </motion.div>
                  <p className="text-muted-foreground text-base mb-6">Your cart is empty</p>
                  <Button onClick={closeCart} asChild>
                    <Link href="/catalog">
                      Continue Shopping
                    </Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.ul layout className="space-y-4">
                  <AnimatePresence initial={false} mode="popLayout">
                    {cartLines.map((line) => (
                      <motion.li
                        key={line.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, x: 20 }}
                        transition={{
                          opacity: { duration: 0.2 },
                          layout: { duration: 0.25 },
                        }}
                        className="flex gap-4 py-4 border-b border-gray-100"
                      >
                        {/* Product Image */}
                        <Link
                          href={`/product/${line.product_handle}`}
                          onClick={closeCart}
                          className={cn(
                            'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0',
                            'bg-gray-100',
                            'transition-transform duration-200 hover:scale-105'
                          )}
                        >
                          {line.thumbnail ? (
                            <Image
                              src={line.thumbnail}
                              alt={line.product_handle || line.product_title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${line.product_handle}`}
                              onClick={closeCart}
                              className="block flex-1"
                            >
                              <h3 className="font-medium text-foreground text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
                                {line.product_title}
                              </h3>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(line.id)}
                              disabled={isLoading}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  updateCart(line.id, Math.max(0, line.quantity - 1))
                                }
                                disabled={isLoading}
                                className="h-7 w-7"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <motion.span
                                layout
                                className="w-8 text-center text-sm font-medium"
                              >
                                {line.quantity}
                              </motion.span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateCart(line.id, line.quantity + 1)}
                                disabled={isLoading}
                                className="h-7 w-7"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Price */}
                            <motion.span
                              layout
                              className="text-sm font-semibold text-primary"
                            >
                              {formatPrice({
                                amount: String(
                                  parseFloat(line.unit_price) * line.quantity
                                ),
                                currencyCode: cart?.currency_code || 'USD',
                              })}
                            </motion.span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {cartLines.length > 0 && cart && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-6 border-t border-gray-100 space-y-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-xl font-semibold text-foreground">
                      <NumberFlow
                        value={subtotal}
                        format={{
                          style: 'currency',
                          currency: cart.currency_code,
                        }}
                      />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <Button
                    asChild
                    className="w-full"
                    size="lg"
                  >
                    <Link href="/checkout">
                      Checkout
                    </Link>
                  </Button>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}