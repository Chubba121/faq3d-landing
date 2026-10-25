import { Check } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'

/**
 * Aviso del pedido.
 *
 * Solo aparece cuando el cajón no se abrió (o sea, a partir del segundo ítem):
 * el primero abre el cajón y ahí se ve el producto. Va como `role="status"`
 * para que también lo escuche quien usa lector de pantalla, y no intercepta
 * clicks porque es un cartel, no un botón.
 */
export default function CartNotice() {
  const { notice } = useCart()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5"
    >
      {notice ? (
        <span className="cart-notice inline-flex items-center gap-2 rounded-[4px] border border-ink/20 bg-ink px-3.5 py-2.5 text-[13px] font-semibold text-paper shadow-lift">
          <Check className="h-4 w-4 text-sky-300" aria-hidden="true" />
          {notice}
        </span>
      ) : null}
    </div>
  )
}
