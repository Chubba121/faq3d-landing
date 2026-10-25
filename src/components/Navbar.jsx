import { useEffect, useState } from 'react'
import { Menu, ShoppingCart, X } from 'lucide-react'
import { GENERAL_WHATSAPP_LINK, NAV_LINKS } from '../config/constants.js'
import { useCart } from '../context/CartContext.jsx'
import { ProductWhatsappIcon, WhatsAppIcon } from './icons.jsx'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { count, open: openCart } = useCart()

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 bg-ink text-paper">
      <nav
        className="container-shop flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]"
        aria-label="Principal"
      >
        <a href="#top" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="Faq3D, inicio">
          <img
            src="/logo-mark.webp"
            alt=""
            width={320}
            height={431}
            className="h-9 w-auto sm:h-10"
          />
          <span className="font-display text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">
            Faq3D
          </span>
          <span className="hidden border-l border-paper/25 pl-3 text-[10px] font-semibold uppercase leading-[1.25] tracking-[0.18em] text-paper/55 md:block">
            Creando
            <br />
            tus ideas
          </span>
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-paper/70 transition-colors hover:text-paper"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-paper/25 px-3 text-paper transition-colors hover:border-paper hover:bg-paper/10 sm:px-3.5"
            aria-label={count === 0 ? 'Abrir tu pedido, vacío' : `Abrir tu pedido, ${count} ${count === 1 ? 'ítem' : 'ítems'}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            <span className="hidden text-[13px] font-semibold sm:inline">Pedido</span>
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 font-display text-[11px] font-extrabold tabular-nums text-white ring-2 ring-ink"
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          <a
            href={GENERAL_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tag min-h-11 px-3.5 py-2 text-[13px] sm:px-4"
            aria-label="Contáctame por WhatsApp"
          >
            <ProductWhatsappIcon className="h-4 w-4 text-brand-deep" />
            {/* Con el carrito el navbar necesita ~336px: abajo de 390 el CTA
                de WhatsApp se queda solo con el ícono (su aria-label lo
                nombra) para no comer el padding lateral. */}
            <span className="hidden sm:inline">Contactar</span>
            <span className="hidden min-[390px]:inline sm:hidden">WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-paper/25 text-paper transition-colors hover:border-paper lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div
        id="menu-movil"
        hidden={!open}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-paper/15 bg-ink lg:hidden"
      >
        <ul className="container-shop flex flex-col py-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-paper/10 py-3.5 font-display text-2xl font-bold tracking-tight text-paper transition-colors hover:text-brand"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
