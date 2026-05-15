// context/CartContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useReducer, useCallback } from 'react'
import { sdk } from '@/lib/medusa/config'
import type { 
  StoreCart, 
  StoreCartLineItem,
  StoreAddCartLineItem,
  StoreUpdateCartLineItem 
} from '@medusajs/types'
import { getRegion } from '../medusa/data/regions'
import { retrieveCart } from '../medusa/data/cart'
import { getCartId } from '../medusa/data/cookies'


// Types for Medusa cart
type MedusaCart = StoreCart
type MedusaCartLine = StoreCartLineItem

type CartState = {
  cart: MedusaCart | null
  isLoading: boolean
  isOpen: boolean
  isUpdating: boolean
}

type CartAction =
  | { type: 'SET_CART'; cart: MedusaCart | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_UPDATING'; isUpdating: boolean }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'TOGGLE_CART' }


  const CART_ID_KEY = 'cart_id'
const REGION_ID_KEY = 'medusa_region_id'



const initialState: CartState = {
  cart: null,
  isLoading: false,
  isOpen: false,
  isUpdating: false,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, cart: action.cart }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.isUpdating }
    case 'OPEN_CART':
      return { ...state, isOpen: true }
    case 'CLOSE_CART':
      return { ...state, isOpen: false }
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen }
    default:
      return state
  }
}

interface CartContextType {
  cart: any
  addToCart: (variantId: string, quantity: number) => Promise<void>
  updateCart: (lineId: string, quantity: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
  isLoading: boolean
  isOpen?: any
  closeCart?: any
  cartLines?: any
  totalQuantity?: any
  openCart?: any
  toggleCart?: any
  cartItems?: any
  subtotal?: any
  total?: any
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children, regionId: initialRegionId = 'reg_default',
  countryCode = 'ph'}: any) {
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const cartItems = state.cart?.items ?? []
  const totalQuantity = state.cart?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) ?? 0
  const subtotal = state.cart?.subtotal ?? 0
  const total = state.cart?.total ?? 0


  // Helper for API calls
  const medusaFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    const response = await fetch(`${baseUrl}/store${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // ...options.headers,
        'x-publishable-api-key': pubKey
      } as any,
      credentials: 'include',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch')
    }
    
    return response.json()
  }, [])

    // Fetch current cart
    const fetchCart = useCallback(async (cartId: string) => {
      try {
        const { cart } = await medusaFetch(`/carts/${cartId}`)

        if (cart) {
          dispatch({ type: 'SET_CART', cart })
          setCart(cart)
        } else {
          localStorage.removeItem(CART_ID_KEY)
          dispatch({ type: 'SET_CART', cart: null })
          setCart(null)
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
        localStorage.removeItem(CART_ID_KEY)
        setCart(null)
        dispatch({ type: 'SET_CART', cart: null })
      }
    }, [medusaFetch])
  
    // Create new cart with region
    const createNewCart = useCallback(async (regionId?: string, salesChannelId?: string) => {
      try {
        dispatch({ type: 'SET_LOADING', isLoading: true })
        
        const storedRegionId = localStorage.getItem(REGION_ID_KEY) || regionId || initialRegionId
        let regId = await getRegion(countryCode) || storedRegionId;

        
        const { cart } = await medusaFetch('/carts', {
          method: 'POST',
          body: JSON.stringify({
            region_id: regId?.id,
            sales_channel_id: salesChannelId,
            // country_code: countryCode,
          }),
        })
        
        if (cart) {
          localStorage.setItem(CART_ID_KEY, cart.id)
          dispatch({ type: 'SET_CART', cart })
          return cart.id
        }
      } catch (error) {
        console.error('Error creating cart:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false })
      }
      return null
    }, [medusaFetch, initialRegionId, countryCode])



  // useEffect(() => {
  //   getOrCreateCart()
  // }, [])

    // Initialize cart on mount
    useEffect(() => {
      const initCart = async () => {
        const cartId = localStorage.getItem(CART_ID_KEY)
        const storedRegionId = localStorage.getItem(REGION_ID_KEY)
        if (cartId) {
          await fetchCart(cartId)
        }
        
        // Set region if not set
        if (!storedRegionId && initialRegionId) {
          localStorage.setItem(REGION_ID_KEY, initialRegionId)
        }
      }
      
      initCart()
    }, [fetchCart, initialRegionId])
  

  const getOrCreateCart = async () => {
    try {

      let cartId = localStorage.getItem(CART_ID_KEY)

      let cart = await retrieveCart(cartId);
      console.log(cart, 'CCACARART')
      if (cart?.id) {
        const { cart: existingCart } = await sdk.store.cart.retrieve(cart?.id) as any
        setCart(existingCart)
        return cart?.id
      } else {
        const { cart: newCart } = await sdk.store.cart.create() as any
        setCart(newCart)
        return newCart?.id
      }
    } catch (error) {
      console.error('Error with cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // const addToCart = async (variantId: string, quantity: number) => {
  //   if (!cart) return
  //   try {
  //     const { cart: updatedCart } = await sdk.carts.lineItems.create(cart.id, {
  //       variant_id: variantId,
  //       quantity,
  //     })
  //     setCart(updatedCart)
  //   } catch (error) {
  //     throw error
  //   }
  // }

  const updateCart = async (lineId: string, quantity: number) => {
    console.log(lineId, state, 'uupp')
    if (!state.cart) return
    try {

       const { cart } = await medusaFetch(`/carts/${state?.cart?.id}/line-items/${lineId}`, {
            method: 'POST',
            body: JSON.stringify({
              quantity,
            }),
          })
  
          if (cart) {
          setCart(cart)
            dispatch({ type: 'SET_CART', cart })
          }


  
    } catch (error) {
      throw error
    }
  }

  // const removeFromCart = async (lineId: string) => {
  //   if (!cart) return
  //   try {
  //     const { cart: updatedCart } = await sdk.carts.lineItems.delete(cart.id, lineId)
  //     setCart(updatedCart)
  //   } catch (error) {
  //     throw error
  //   }
  // }

    // Add to cart
    const addToCart = useCallback(
      async (variantId: string, quantity = 1, metadata?: Record<string, any>) => {
        dispatch({ type: 'SET_LOADING', isLoading: true })
        let cartData = await getCartId();

        console.log(cartData, 'caaaart')
        try {
      let cartId = await retrieveCart(cartData) || localStorage.getItem(CART_ID_KEY);
      console.log(cartId)

          if (!cartId) {
            cartId = await getOrCreateCart()
          }


          localStorage.setItem('cart_id', cartId)
          console.log(cartId, "CART ID ")
          if (!cartId) {
            throw new Error('Failed to create cart')
          }
  
          const { cart } = await medusaFetch(`/carts/${cartId}/line-items`, {
            method: 'POST',
            body: JSON.stringify({
              variant_id: variantId,
              quantity,
              metadata,
            }),
          })
  
          if (cart) {
            dispatch({ type: 'SET_CART', cart })
            dispatch({ type: 'OPEN_CART' })
          }
        } catch (error) {
          console.error('Error adding to cart:', error)
          throw error
        } finally {
          dispatch({ type: 'SET_LOADING', isLoading: false })
        }
      },
      [createNewCart, medusaFetch]
    )
  
    // Update line item quantity
    const updateQuantity = useCallback(
      async (lineId: string, quantity: number, metadata?: Record<string, any>) => {
        const cartId = localStorage.getItem(CART_ID_KEY)
        if (!cartId) return
  
        dispatch({ type: 'SET_UPDATING', isUpdating: true })
  
        try {
          const { cart } = await medusaFetch(`/carts/${cartId}/line-items/${lineId}`, {
            method: 'POST',
            body: JSON.stringify({
              quantity,
              metadata,
            }),
          })
  
          if (cart) {
            dispatch({ type: 'SET_CART', cart })
          }
        } catch (error) {
          console.error('Error updating cart:', error)
        } finally {
          dispatch({ type: 'SET_UPDATING', isUpdating: false })
        }
      },
      [medusaFetch]
    )
  
    // Remove from cart
    const removeFromCart = useCallback(
      async (lineId: string) => {
        const cartId = localStorage.getItem(CART_ID_KEY)
        if (!cartId) return
  
        dispatch({ type: 'SET_UPDATING', isUpdating: true })
        
        try {
           await medusaFetch(`/carts/${cartId}/line-items/${lineId}`, {
            method: 'DELETE',
          })

      const { cart: existingCart } = await sdk.store.cart.retrieve(cartId) as any

          if (existingCart) {
            dispatch({ type: 'SET_CART', cart: existingCart })
          }
        } catch (error) {
          console.error('Error removing from cart:', error)
        } finally {
          dispatch({ type: 'SET_UPDATING', isUpdating: false })
        }
      },
      [medusaFetch]
    )
  
    // Clear entire cart
    const clearCart = useCallback(async () => {
      const cartId = localStorage.getItem(CART_ID_KEY)
      if (!cartId) return
  
      dispatch({ type: 'SET_UPDATING', isUpdating: true })
  
      try {
        // Remove all line items
        const cart = state.cart
        if (cart?.items?.length) {
          for (const item of cart.items) {
            await medusaFetch(`/carts/${cartId}/line-items/${item.id}`, {
              method: 'DELETE',
            })
          }
        }
        
        // Refresh cart
        const { cart: updatedCart } = await medusaFetch(`/carts/${cartId}`)
        if (updatedCart) {
          dispatch({ type: 'SET_CART', cart: updatedCart })
        }
      } catch (error) {
        console.error('Error clearing cart:', error)
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false })
      }
    }, [medusaFetch, state.cart])
  
    // Set/change region
    const setRegion = useCallback(async (regionId: string) => {
      const cartId = localStorage.getItem(CART_ID_KEY)
      
      dispatch({ type: 'SET_LOADING', isLoading: true })
  
      try {
        if (cartId) {
          // Update existing cart region
          const { cart } = await medusaFetch(`/carts/${cartId}`, {
            method: 'POST',
            body: JSON.stringify({ region_id: regionId }),
          })
          
          if (cart) {
            dispatch({ type: 'SET_CART', cart })
          }
        }
        
        localStorage.setItem(REGION_ID_KEY, regionId)
      } catch (error) {
        console.error('Error setting region:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false })
      }
    }, [medusaFetch])

    // Cart UI actions
    const openCart = useCallback(() => dispatch({ type: 'OPEN_CART' }), [])
    const closeCart = useCallback(() => dispatch({ type: 'CLOSE_CART' }), [])
    const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE_CART' }), [])
    

console.log(state, 'STATEE')

  return (
    <CartContext.Provider value={{  ...state, openCart, closeCart, toggleCart, addToCart,  updateCart, removeFromCart,
        cart: state.cart,
        isLoading: state.isLoading,
        isOpen: state.isOpen,
        cartItems,
        totalQuantity,
        subtotal,
        total,

    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    console.log('useCart must be used within a CartProvider')
    // throw new Error('useCart must be used within a CartProvider')
  }
  return context
}