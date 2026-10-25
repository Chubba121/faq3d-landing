import SectionHeading from './SectionHeading.jsx'
import ProductRow from './ProductRow.jsx'
import { ProductCardSkeleton } from './Skeleton.jsx'
import { categoryLabel } from '../data/products.js'
import { useCatalog } from '../context/CatalogContext.jsx'

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export default function StockSection() {
  const {
    stockProducts,
    categories,
    productsByCategory,
    fromSheet,
    isLoading,
    lastUpdated,
    isRefreshing,
    error,
  } = useCatalog()
  const stockList = stockProducts.slice(0, 5)
  // Mismos criterios que los estantes del catálogo: una categoría sin modelos
  // no se anuncia como "disponible".
  const availableCategories = isLoading
    ? categories
    : categories.filter((category) => productsByCategory(category.id).length > 0)

  return (
    <section id="stock" className="container-shop">
      <SectionHeading
        title="Para llevar hoy"
        description="Piezas impresas y listas: retiras hoy en Junín de los Andes o te las acercamos. Si aparece aca, ya está impresa."
      />

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLoading
                ? 'animate-pulse bg-brand'
                : fromSheet
                  ? isRefreshing
                    ? 'animate-pulse bg-brand'
                    : 'bg-brand'
                  : 'bg-ink/30'
            }`}
            aria-hidden="true"
          />
          {isLoading
            ? 'Conectando con la planilla…'
            : fromSheet
              ? ''
              : 'Catálogo local de respaldo'}
        </span>
        {isRefreshing && !isLoading ? <span>actualizando…</span> : null}
        {lastUpdated && !isLoading ? (
          <span>
            actualizado{' '}
            <time dateTime={new Date(lastUpdated).toISOString()}>
              {timeFormatter.format(lastUpdated)}
            </time>
          </span>
        ) : null}
      </p>

      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-ink-faded" role="status">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : stockList.length > 0 ? (
        <ProductRow products={stockList} label="Stock inmediato" />
      ) : (
        <div className="mt-6 paper-sheet py-12 text-center">
          <p className="text-md text-ink-soft">Sin stock en este momento. Escribinos por WhatsApp para consultar disponibilidad y fechas de impresión a pedido.</p>
        </div>
      )}

      {availableCategories.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Categorías disponibles">
          {availableCategories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-ink/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/75"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.tint }} />
              {categoryLabel(cat.id)}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
