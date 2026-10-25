import { ProductWhatsappIcon } from './icons.jsx'
import { GENERAL_WHATSAPP_LINK } from '../config/constants.js'

export default function WhatsAppFab() {
  return (
    <a
      href={GENERAL_WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="pulse-bottom fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-ink/30 hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-focused"
      aria-label="Contáctame por WhatsApp"
    >
      <span className="relative z-10 flex h-12 w-12 items-center justify-center">
        <ProductWhatsappIcon className="h-7 w-7 text-brand-normal" aria-hidden="true" />
      </span>
      <span className="absolute inset-0 rounded-full animate-pulse-background" aria-hidden="true" />
    </a>
  )
}
