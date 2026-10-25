import { useEffect, useRef, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'

const FEEDBACK_MS = 1800

/**
 * Suma un producto al pedido.
 *
 * No abre el cajón: la tarjeta se repite en la vidriera, el stock y el
 * catálogo, así que un click no debería taparle la página al visitante. La
 * confirmación es el propio botón (que pasa a "Agregado") y el contador del
 * navbar, que se actualiza solo.
 */
export default function AddToCartButton({ product, compact = false, className = '' }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onClick = () => {
    add(product)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), FEEDBACK_MS)
  }

  const label = `Agregar ${product.name} al pedido`

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
          added
            ? 'border-brand-deep bg-brand text-white'
            : 'border-ink/35 text-ink hover:border-ink hover:bg-ink hover:text-paper'
        } ${className}`}
      >
        {added ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`btn-outline min-h-11 px-4 py-2.5 text-[13px] ${className}`}
    >
      {added ? (
        <Check className="h-4 w-4 text-brand-deep" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {added ? 'Agregado' : 'Agregar'}
    </button>
  )
}
