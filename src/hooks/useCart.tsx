'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import type { Cart, CartItem, Artikal, StanjeSkladista } from '@/types/nibis'

// ─── Actions ─────────────────────────────────────────────────────────────────
type CartAction =
  | { type: 'ADD'; artikal: Artikal | any; cijena: number; stanje: StanjeSkladista | null }
  | { type: 'REMOVE'; artikalId: number }
  | { type: 'SET_QTY'; artikalId: number; qty: number }
  | { type: 'CLEAR' }

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD': {
      const existing = state[action.artikal.id]
      const max = action.stanje?.raspolozivaKolicina ?? 9999
      const newQty = Math.min((existing?.qty ?? 0) + 1, max)
      return {
        ...state,
        [action.artikal.id]: {
          artikal: action.artikal,
          qty: newQty,
          cijena: action.cijena,
          stanje: action.stanje,
        },
      }
    }
    case 'REMOVE': {
      const next = { ...state }
      delete next[action.artikalId]
      return next
    }
    case 'SET_QTY': {
      if (action.qty <= 0) {
        const next = { ...state }
        delete next[action.artikalId]
        return next
      }
      const item = state[action.artikalId]
      if (!item) return state
      const max = item.stanje?.raspolozivaKolicina ?? 9999
      return {
        ...state,
        [action.artikalId]: { ...item, qty: Math.min(action.qty, max) },
      }
    }
    case 'CLEAR':
      return {}
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  cart: Cart
  items: CartItem[]
  totalQty: number
  add: (artikal: Artikal | any, cijena: number, stanje: StanjeSkladista | null) => void
  remove: (artikalId: number) => void
  setQty: (artikalId: number, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {})

  const add = useCallback((artikal: Artikal | any, cijena: number, stanje: StanjeSkladista | null) => {
    dispatch({ type: 'ADD', artikal, cijena, stanje })
  }, [])

  const remove = useCallback((artikalId: number) => {
    dispatch({ type: 'REMOVE', artikalId })
  }, [])

  const setQty = useCallback((artikalId: number, qty: number) => {
    dispatch({ type: 'SET_QTY', artikalId, qty })
  }, [])

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const items = Object.values(cart)
  const totalQty = items.reduce((s, c) => s + c.qty, 0)

  return (
    <CartContext.Provider value={{ cart, items, totalQty, add, remove, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
