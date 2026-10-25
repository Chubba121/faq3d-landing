import SectionHeading from './SectionHeading.jsx'
import { GENERAL_WHATSAPP_LINK, productWhatsappLink } from '../config/constants.js'
import { WhatsAppIcon } from './icons.jsx'

const STEPS = [
  {
    title: 'Elegí tu modelo',
    text: 'Mirá nuestro stock listo para entregar o elegí cualquier producto del catálogo para que lo imprimamos a pedido en los colores que más te gusten.',
  },
  {
    title: 'Escribinos por WhatsApp',
    text: 'Tocá el botón de contacto para confirmar disponibilidad, colores de filamento y método de pago.',
  },
  {
    title: 'Recibilo en tus manos',
    text: 'Coordinamos la entrega en Junín de los Andes o te lo enviamos por correo a donde estés.',
  },
]

export default function HowToBuy() {
  return (
    <section id="como-comprar" className="border-y border-ink/15 bg-paper-deep">
      <div className="container-shop py-14 sm:py-20">
        <SectionHeading
          title="Cómo se compra"
          description="Elegís, escribís y coordinamos por WhatsApp. No hay carrito ni formularios."
        />

        <div className="paper-sheet relative mt-9 px-5 pb-7 pt-8 sm:px-8 sm:pb-9">
          <span className="tape -top-3 left-8 w-24 -rotate-3" aria-hidden="true" />
          <span className="tape -bottom-3 right-10 w-20 rotate-2" aria-hidden="true" />

          <ol className="grid gap-8 md:grid-cols-3 md:gap-0">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="border-t border-dashed border-ink/25 pt-5 first:border-t-0 first:pt-0 md:border-l md:border-t-0 md:px-6 md:pt-0 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
              >
                <span className="stamp stamp-stock">Paso 0{index + 1}</span>
                <h3 className="mt-4 font-display text-[1.3rem] font-extrabold leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-7 text-sm text-ink-soft">
          ¿Ya sabés qué querés?{' '}
          <a
            href={productWhatsappLink({ name: 'Modelo de catálogo', price: 0 })}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline decoration-ink/35 underline-offset-4 hover:decoration-ink"
            aria-label="Elegir un modelo de catálogo por WhatsApp"
          >
            <WhatsAppIcon className="inline h-3.5 w-3.5 align-middle mr-1 text-sky-300" aria-hidden="true" />
            Elegí un modelo
          </a>{' '}
          y te respondemos.
        </p>
      </div>
    </section>
  )
}
