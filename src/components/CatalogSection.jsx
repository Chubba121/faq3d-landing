import SectionHeading from './SectionHeading.jsx'
import ProductCard from './ProductCard.jsx'
import { ShelfSkeleton } from './Skeleton.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { productWhatsappLink } from '../config/constants.js'

export const DEBUG_CATALOG_LINKS = true

const COUNT_WORDS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis']

// "Los cuatro estantes" cuando hay cuatro: el título no puede prometer un
// estante que la planilla no tiene.
function shelvesTitle(count) {
  if (count === 0) return 'Los estantes'
  if (count === 1) return 'El único estante'
  return `Los ${COUNT_WORDS[count] ?? count} estantes`
}

export default function CatalogSection() {
  const { categories, productsByCategory, products, stats, isLoading } = useCatalog()

  const shelves = categories.map((category) => ({
    id: category.id,
    label: category.label,
    description: category.description,
    tint: category.tint,
    products: productsByCategory(category.id),
  }))

  // Un estante solo se muestra si su categoría tiene modelos publicados: con
  // "Muñecos & Figuras" sin productos, el cartel "Sin modelos publicados
  // todavía" quedaba como un hueco en medio del catálogo. Mientras carga (o si
  // el catálogo llegó vacío) se muestran todos para no dejar la sección muda.
  const hasCatalog = products.length > 0
  const visibleShelves =
    hasCatalog && !isLoading
      ? shelves.filter((shelf) => shelf.products.length > 0)
      : shelves

  // Lo que venga de la planilla con una categoría que no conocemos va a un estante aparte.
  const otherProducts = products.filter(
    (product) => !categories.some((category) => category.id === product.category),
  )

  if (otherProducts.length) {
    shelves.push({
      id: 'otros',
      label: 'Otros modelos',
      description: 'Piezas que publicamos con una categoría nueva en la planilla.',
      tint: '#6B6255',
      products: otherProducts,
    })
  }

  return (
    <section id="catalogo" className="container-shop py-14 sm:py-20">
      <SectionHeading
        title={shelvesTitle(visibleShelves.length)}
        description={`${stats.total} modelos impresos acá. Elegí el que te gusta y escribinos: el modelo y el precio ya viajan en el mensaje.`}
      />

      <div className="mt-10 space-y-12 sm:space-y-16">
        {visibleShelves.map((shelf) => (
          <Shelf key={shelf.id} shelf={shelf} isLoading={isLoading} />
        ))}
      </div>
    </section>
  )
}

function Shelf({ shelf, isLoading }) {
  const { products } = shelf

  return (
    <div id={`catalogo-categoria-${shelf.id}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-ink pb-3">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: shelf.tint }}
            aria-hidden="true"
          />
          <h3 className="font-display text-[1.55rem] font-extrabold leading-none tracking-tight sm:text-3xl">
            {shelf.label}
          </h3>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded">
          {isLoading ? (
            'cargando…'
          ) : (
            <>
              {products.length} {products.length === 1 ? 'modelo' : 'modelos'}
            </>
          )}
        </p>
      </div>

      <p className="mt-2.5 max-w-xl text-sm text-ink-soft">{shelf.description}</p>

      {DEBUG_CATALOG_LINKS && (
        <nav aria-label={`Enlaces relacionados de ${shelf.label}`} className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <a
            href={productWhatsappLink({ name: `${shelf.label} - modelos de catálogo`, price: 0 })}
            className="inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faded underline decoration-ink/30 underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            pedir esta categoría por WhatsApp
          </a>
        </nav>
      )}

      {isLoading ? (
        <ShelfSkeleton count={2} />
      ) : products.length === 0 ? (
        <div className="archive-empty mt-6" id="catalogo-sin-productos" role="status" aria-label="Sin modelos en esta categoría">
          <span className="archive-empty-label">Sin modelos publicados todavía.</span>
          {DEBUG_CATALOG_LINKS ? (
            <p className="archive-empty-note">Todavía no publicamos modelos en esta categoría de la planilla.</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 sm:gap-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="shelf"
              tilt={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
