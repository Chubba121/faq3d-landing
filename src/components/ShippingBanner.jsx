import { MapPin, Truck } from 'lucide-react'
import { GENERAL_WHATSAPP_LINK } from '../config/constants.js'
import { WhatsAppIcon } from './icons.jsx'

export default function ShippingBanner() {
  return (
    <section id="envios" className="container-shop py-14 sm:py-20" aria-label="Retiro y envíos">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
        <figure className="relative">
          <span
            className="tape -top-3 left-8 z-10 w-24 -rotate-6 sm:left-12"
            aria-hidden="true"
          />
          <div className="print-photo aspect-[4/3] overflow-hidden rounded-xl border-[8px] border-paper shadow-paper">
            <img
              src="/hero.jpg"
              alt="Taller de impresión 3D de Faq3D en Junín de los Andes"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded">
            
          </figcaption>
        </figure>

        <div>
          <h2 className="text-[2rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-4xl lg:text-[2.9rem]">
            Retiro y envíos
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Comprás en Junín de los Andes o te lo mandamos a donde estés.
          </p>

          <ul className="mt-7 divide-y divide-ink/15 border-y border-ink/15">
            <li className="flex gap-4 py-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-sans text-base font-bold">Retiro en mano</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Acordamos un punto de encuentro en Junín de los Andes, Neuquén, y coordinamos
                  día y horario por WhatsApp.
                </p>
              </div>
            </li>
            <li className="flex gap-4 py-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-sans text-base font-bold">Envíos a todo el país</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  Enviamos a toda la provincia de Neuquén y al resto del país, con el pedido
                  embalado. El costo depende de tu código postal.
                </p>
              </div>
            </li>
          </ul>

          <a
            href={GENERAL_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ink mt-7"
            aria-label="Consultar retiro o envío por WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4 text-sky-300" />
            Consultar mi envío
          </a>
        </div>
      </div>
    </section>
  )
}
