import { useRef } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart, useDrawerBehaviour } from '../context/CartContext.jsx'
import { PRICE_ON_REQUEST, formatPrice, isValidPrice } from '../config/constants.js'
import { isVideoSource } from '../config/media.js'
import { ProductWhatsappIcon } from './icons.jsx'

const PLACEHOLDER_IMAGE = '/products/placeholder.svg'

/**
 * Cajón del pedido.
 *
 * Muestra lo que el visitante fue agregando, deja ajustar cantidades y manda
 * todo junto a WhatsApp con el total ya calculado: el cliente no tipea nada y
 * el dueño recibe el pedido completo en un solo mensaje.
 */
export default function CartDrawer() {
  const { isOpen, close, items, count, total, pending, whatsappHref, setQty, remove, clear } =
    useCart()
  const panelRef = useRef(null)

  useDrawerBehaviour(isOpen, close, panelRef)

  if (!isOpen) return null

  const empty = items.length === 0

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/55"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="cart-panel absolute inset-y-0 right-0 flex w-full max-w-[27rem] flex-col border-l border-ink/25 bg-paper shadow-frame"
      >
        <header className="flex items-center justify-between gap-3 border-b border-paper/15 bg-ink px-4 py-3 text-paper">
          <div className="flex items-baseline gap-2.5">
            {/* text-paper explícito: la base de Tailwind pinta los h2 con
                text-ink y quedaba tinta oscura sobre el header oscuro. */}
            <h2 id="cart-title" className="font-display text-xl font-extrabold tracking-tight text-paper">
              Tu pedido
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/60">
              {count === 0 ? 'vacío' : `${count} ${count === 1 ? 'ítem' : 'ítems'}`}
            </span>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar el pedido"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-paper/25 text-paper transition-colors hover:border-paper hover:bg-paper/10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-8 w-8 text-ink/40" aria-hidden="true" />
            <p className="max-w-[22ch] font-display text-xl font-bold leading-tight tracking-tight">
              Todavía no agregaste nada
            </p>
            <p className="max-w-[30ch] text-sm leading-relaxed text-ink-soft">
              Sumá los modelos que te gusten y mandanos el pedido completo con el total ya
              calculado.
            </p>
            <a href="#stock" onClick={close} className="btn-ink min-h-11 px-5 py-2.5 text-sm">
              Ver el stock
            </a>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-dashed divide-ink/15 overflow-y-auto px-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3.5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[4px] border border-ink/15 bg-white/60">
                    {isVideoSource(item.image) ? (
                      <video
                        src={item.image}
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={`Video de ${item.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <img
                        src={item.image}
                        alt={`Ilustración de ${item.name}`}
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          const image = event.currentTarget
                          if (image.dataset.fallback) return
                          image.dataset.fallback = 'true'
                          image.src = PLACEHOLDER_IMAGE
                        }}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-bold leading-snug text-ink">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faded">
                          {item.status === 'stock' ? 'En stock' : 'A pedido'}
                          {item.hasPrice ? ` · ${formatPrice(item.price)} c/u` : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Quitar ${item.name} del pedido`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-ink-faded transition-colors hover:bg-ink/10 hover:text-ink"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-[4px] border border-ink/25">
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          aria-label={`Restar uno de ${item.name}`}
                          className="inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-ink/10 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                          className="w-7 text-center font-display text-base font-extrabold tabular-nums"
                          aria-live="polite"
                          aria-label={`Cantidad de ${item.name}`}
                        >
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          aria-label={`Sumar uno de ${item.name}`}
                          className="inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-ink/10"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <span className="price text-base">
                        {item.hasPrice ? formatPrice(item.lineTotal) : PRICE_ON_REQUEST}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-ink/15 bg-paper-deep/60 px-4 pb-4 pt-3.5">
              <dl className="flex items-baseline justify-between gap-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded">
                  Total
                </dt>
                <dd className="font-display text-2xl font-extrabold tabular-nums tracking-tight">
                  {isValidPrice(total) ? formatPrice(total) : PRICE_ON_REQUEST}
                </dd>
              </dl>

              {pending.length > 0 && (
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {pending.length === 1 ? 'Un modelo queda' : `${pending.length} modelos quedan`} a
                  confirmar: {pending.map((item) => item.name).join(', ')}.
                </p>
              )}

              <p className="mt-2 text-[11px] leading-relaxed text-ink-faded">
                Confirmamos stock, colores de filamento y envío por WhatsApp. No se paga nada en la
                web.
              </p>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink mt-3 min-h-12 w-full py-3 text-sm"
              >
                <ProductWhatsappIcon className="h-5 w-5 text-sky-300" />
                Pedir por WhatsApp
              </a>

              <button
                type="button"
                onClick={clear}
                className="mt-1 inline-flex min-h-11 w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                Vaciar pedido
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
