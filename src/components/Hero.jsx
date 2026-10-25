import { MapPin } from 'lucide-react'
import HeroCarousel from './HeroCarousel.jsx'
import { CarouselSkeleton, StatSkeleton } from './Skeleton.jsx'
import { GENERAL_WHATSAPP_LINK, formatPriceLabel, isValidPrice } from '../config/constants.js'
import { useCatalog } from '../context/CatalogContext.jsx'
import { ProductWhatsappIcon, WhatsAppIcon } from './icons.jsx'

const HERO_SLIDES = 5

const STAT_LABEL =
  'text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] text-ink-faded sm:text-[10px] sm:tracking-[0.14em]'
const STAT_VALUE = 'font-display text-lg font-extrabold tabular-nums sm:text-2xl'

export default function Hero() {
  const { featuredProducts, stats, isLoading } = useCatalog()
  const hasMinPrice = isValidPrice(stats.minPrice)
  const windowProducts = featuredProducts.slice(0, HERO_SLIDES)

  return (
    <section id="top" className="container-shop pb-10 pt-4 sm:pb-14 sm:pt-6">
      <div className="window-frame lg:flex lg:min-h-[calc(100vh-9rem)] lg:flex-col">
        <div className="window-glass lg:flex lg:flex-1 lg:flex-col">
          {/* min-w-0 en la grilla y en sus dos columnas: sin eso, el ancho
              mínimo del carrusel (los slides) estiraba la columna a ~595px y
              en móvil la tarjeta del hero salía cortada por la derecha. */}
          <div className="relative grid min-w-0 gap-5 p-4 sm:gap-6 sm:p-6 lg:flex-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-10 lg:p-8">
            <article className="paper-sheet relative z-10 flex min-w-0 flex-col self-start px-5 py-6 sm:px-8 sm:py-9 lg:self-stretch lg:px-9">
              <span className="tape -top-3 left-6 w-20 sm:left-10" aria-hidden="true" />
              <span
                className="tape -bottom-3 right-8 w-20 rotate-[4deg]"
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faded sm:text-[11px]">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Junín de los Andes<span className="hidden sm:inline"> · Neuquén</span>
                </p>
                <span className="stamp stamp-stock shrink-0">Hecho acá</span>
              </div>

              <h1 className="mt-5 text-[2.35rem] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-[3.2rem] lg:text-[4.05rem]">
                Tus ideas cobran vida{' '}
                <span className="text-sky-500">en 3D.</span>
              </h1>

              <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-ink-soft sm:text-base">
                Muñecos articulados, juguetes sensoriales, llaveros y accesorios. Llevate el que
                ya está listo o encargá el tuyo a pedido, en el color que elijas.
              </p>
              <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-ink-soft sm:text-base">
                ¿Viste un diseño viral en redes? Consultanos 
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <a
                  href={GENERAL_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ink"
                  aria-label="Pedir por WhatsApp"
                >
                  <ProductWhatsappIcon className="h-4 w-4 text-sky-300" />
                  Pedir por WhatsApp
                </a>
                <a href="#catalogo" className="btn-outline">
                  Ver el catálogo
                </a>
              </div>

              <div className="mt-8 pt-2 lg:mt-auto">
                {/* Dos columnas de 56px en 320px: la etiqueta va en 9px y la
                    cifra en 18px hasta sm, si no "$2.500" se sale de su celda. */}
                <dl
                  className={`grid gap-2 border-t border-dashed border-ink/25 pt-5 sm:gap-3 ${
                    hasMinPrice ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  <div>
                    <dt className={STAT_LABEL}>
                      Modelos
                    </dt>
                    <dd className={STAT_VALUE}>
                      {isLoading ? <StatSkeleton className="h-7 w-10 sm:h-8" /> : stats.total}
                    </dd>
                  </div>
                  {/* Sin un precio publicable no hay "Desde" que mostrar: un
                      "Consultar" de 90px no entra en la columna de 56px, y en
                      las tarjetas ya se lee "Consultar". */}
                  {hasMinPrice && (
                    <div>
                      <dt className={STAT_LABEL}>
                        Desde
                      </dt>
                      <dd className={STAT_VALUE}>
                        {isLoading ? (
                          <StatSkeleton className="h-7 w-16 sm:h-8" />
                        ) : (
                          formatPriceLabel(stats.minPrice)
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </article>

            <div className="relative min-w-0 lg:flex lg:flex-col lg:justify-center">
              <span
                className="absolute -left-5 bottom-2 top-2 hidden w-px bg-ink/30 lg:block"
                aria-hidden="true"
              />
              <div className="lg:content-center">
                {isLoading ? (
                  <CarouselSkeleton />
                ) : (
                  <HeroCarousel
                    products={windowProducts}
                    catalogHref="#catalogo"
                    total={stats.total}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t-[6px] border-ink bg-ink px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-paper/75 sm:px-6 sm:text-[11px]">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-paper/70" aria-hidden="true" />
            Stock inmediato
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-paper/70" aria-hidden="true" />
            Retiro en Junín de los Andes
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-paper/70" aria-hidden="true" />
            Envíos a todo el país
          </span>
          <span className="hidden text-paper/65 lg:block">Impresión 3D a pedido</span>
        </div>
      </div>
    </section>
  )
}
