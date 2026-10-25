import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard.jsx'

const AUTOPLAY_DELAY = 4500

/**
 * Vidriera del hero: carrusel de productos destacados.
 *
 * - Avanza solo (autoplay) y se detiene en cuanto el visitante interactúa.
 * - Flechas de anterior/siguiente en desktop, swipe en móvil.
 * - Si el sistema pide menos movimiento, el autoplay queda apagado.
 */
export default function HeroCarousel({ products, catalogHref, total }) {
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const plugins = useMemo(
    () =>
      reducedMotion
        ? []
        : [
            Autoplay({
              delay: AUTOPLAY_DELAY,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ],
    [reducedMotion],
  )

  // Ojo con el ancho de los slides y el loop: Embla solo puede rotar si los
  // slides RESTANTES llenan el ancho visible. Con basis 31,5% y 4 destacados
  // quedan 3 × 31,5% = 94,5% < 100%, así que Embla apaga el loop en silencio:
  // las flechas hacían un pequeño rebote ("nudge") y no avanzaban, y el
  // autoplay se frenaba en el último producto. Con 1/3 exacto, 3 slides llenan
  // el ancho y el loop queda habilitado (y con 3 destacados no hay overflow:
  // las flechas se deshabilitan, que es lo correcto).
  const options = useMemo(
    () => ({ align: 'start', loop: products.length > 1 }),
    [products.length],
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const syncArrows = useCallback((api) => {
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [])

  // Si todos los productos entran en la pantalla no hay nada que desplazar:
  // las flechas quedan deshabilitadas y no tiene sentido prometer que rota.
  const canScroll = canPrev || canNext

  useEffect(() => {
    if (!emblaApi) return undefined

    syncArrows(emblaApi)
    emblaApi.on('select', syncArrows)
    emblaApi.on('reInit', syncArrows)

    return () => {
      emblaApi.off('select', syncArrows)
      emblaApi.off('reInit', syncArrows)
    }
  }, [emblaApi, syncArrows])

  if (!products.length) return null

  return (
    <div>
      <h1 className="mb-4 text-[3rem] font-extrabold ink">Destacados</h1>
      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Productos destacados"
      >
        <div className="-ml-3 flex touch-pan-y pb-1">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] pl-3 sm:basis-[60%] lg:basis-1/3"
              role="group"
              aria-roledescription="slide"
              aria-label={product.name}
            >
              <ProductCard
                product={product}
                variant="window"
                tilt={index === 0 ? 'left' : index === 2 ? 'right' : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded sm:hidden">
          {canScroll ? 'Deslizá para ver más' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="arrow-btn hidden sm:inline-flex"
            aria-label="Producto anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="arrow-btn hidden sm:inline-flex"
            aria-label="Producto siguiente"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <a
        href={catalogHref}
        className="group relative mt-4 flex flex-col justify-between gap-4 rounded-xl border border-dashed border-ink/35 bg-paper/55 p-4 transition-colors hover:border-ink hover:bg-paper focus-visible:border-ink sm:flex-row sm:items-center"
      >
        <span className="flex flex-col gap-1">
          <span className="plate-number">Catálogo completo</span>
          <span className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-[1.4rem]">
            Ver los {total} modelos
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Bajar al estante
          <ArrowDown
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </a>
    </div>
  )
}
