import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard.jsx'

export default function ProductRow({ products, label = 'Productos' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const syncArrows = useCallback((api) => {
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [])

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

  // Si todas las piezas entran en pantalla no hay nada que desplazar.
  const canScroll = canPrev || canNext

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded">
          {products.length} piezas en el mostrador
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="arrow-btn hidden sm:inline-flex"
            aria-label={`${label} anteriores`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="arrow-btn hidden sm:inline-flex"
            aria-label={`Más ${label}`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="region"
        aria-roledescription="carrusel"
        aria-label={label}
      >
        <div className="-ml-3 flex touch-pan-y pb-1">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 shrink-0 grow-0 basis-[85%] pl-3 sm:basis-1/2 lg:basis-[31.5%]"
              role="group"
              aria-roledescription="slide"
              aria-label={product.name}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faded sm:hidden">
        {canScroll ? 'Deslizá para ver más' : ''}
      </p>
    </div>
  )
}
