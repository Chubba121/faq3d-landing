/**
 * Esqueletos de carga.
 *
 * Mientras llega el CSV de Google Sheets mostramos la forma de la grilla (para
 * que la página no salte de tamaño al aparecer el catálogo) en lugar del
 * catálogo local de ejemplo, que mostraba precios y disponibilidad falsos.
 */

function Shimmer({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink/10 ${className}`} aria-hidden="true" />
}

/** Tarjeta de producto en carga. */
export function ProductCardSkeleton({ className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-ink/10 bg-paper ${className}`}>
      <div className="p-3">
        <Shimmer className="aspect-square w-full" />
      </div>
      <div className="border-t border-dashed border-ink/15 px-3.5 pb-3.5 pt-3">
        <Shimmer className="h-2.5 w-20" />
        <Shimmer className="mt-2 h-4 w-3/4" />
        <Shimmer className="mt-3 h-3 w-full" />
        <Shimmer className="mt-3 h-5 w-24" />
        <Shimmer className="mt-3 h-9 w-full" />
      </div>
    </div>
  )
}

/** Fila de tarjetas en carga (estante del catálogo). */
export function ShelfSkeleton({ count = 2 }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 sm:gap-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

/** Bloque de carrusel en carga (vidriera del hero). */
export function CarouselSkeleton({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="-ml-3 flex touch-pan-y pb-1">
        {[0, 1, 2].map((index) => (
          <div key={index} className="min-w-0 shrink-0 grow-0 basis-[85%] pl-3 sm:basis-[60%] lg:basis-[31.5%]">
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
              <div className="p-3">
                <Shimmer className="aspect-square w-full" />
              </div>
              <div className="border-t border-dashed border-ink/15 px-3.5 pb-3.5 pt-3">
                <Shimmer className="h-2.5 w-16" />
                <Shimmer className="mt-2 h-3.5 w-4/5" />
                <Shimmer className="mt-3 h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Shimmer className="mt-3 h-3 w-40" />
    </div>
  )
}

/** Número en carga (estadísticas del hero). */
export function StatSkeleton({ className = '' }) {
  return <Shimmer className={`h-7 w-12 ${className}`} />
}
