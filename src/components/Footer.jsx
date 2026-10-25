import { Link } from 'lucide-react'
import { SITE, GENERAL_WHATSAPP_LINK, NAV_LINKS } from '../config/constants.js'
import { InstagramIcon, TikTokIcon, ProductWhatsappIcon } from './icons.jsx'

const SOCIALS = [
  { href: SITE.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SITE.tiktok, label: 'TikTok', Icon: TikTokIcon },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="container-shop py-12 sm:py-16">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <a
              href="#top"
              className="inline-flex min-h-11 items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] sm:inline"
            >
              <span className="font-display text-white">Faq3D</span>
              <span className="border-l border-paper/25 pl-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/55">
                Creando tus ideas
              </span>
            </a>

            <p className="mt-3 flex items-start gap-1.5 text-sm text-paper/70">
              <span className="mt-0.5 inline-flex h-3 w-3 shrink-0">
                <svg viewBox="0 0 16 16" className="h-3 w-3 fill-paper/70" aria-hidden="true">
                  <path d="M8 14s5.5-8 5.5-11A5.5 5.5 0 0 0 8 2.5a5.5 5.5 0 0 0-5.5 5.5c0 3 5.5 11 5.5 11z" />
                </svg>
              </span>
              {SITE.location} · retiros por WhatsApp
            </p>
          </div>

          <nav aria-label="Enlaces del pie">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/65">
              Navegar
            </h2>
            <ul className="mt-1 space-y-0.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex min-h-11 w-full items-center text-sm text-paper/75 transition-colors hover:text-paper"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/65">
              Redes
            </h2>
            <ul className="mt-2 flex gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Faq3D en ${label}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-paper/25 text-paper/80 transition-colors hover:border-paper hover:text-paper"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={GENERAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-paper underline decoration-paper/35 underline-offset-4 hover:decoration-paper"
              aria-label="Contáctame por WhatsApp"
            >
              <ProductWhatsappIcon className="h-4 w-4 text-brand-normal" />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-paper/15 pt-5 text-[11px] text-paper/60 sm:flex-row sm:items-center sm:justify-between sm:pr-16 lg:pr-20">
          <p>
            © {new Date().getFullYear()} {SITE.name}. {SITE.tagline}.
          </p>
          <p>Impresiones 3D en Junín de los Andes, Neuquén.</p>
        </div>
      </div>
    </footer>
  )
}
