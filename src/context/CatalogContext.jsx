import { createContext, useContext, useMemo } from 'react'
import useProducts from '../hooks/useProducts.js'
import { normalizeCategoryId } from '../config/categories.js'
import { isValidPrice } from '../config/constants.js'
import { CATEGORIES } from '../data/products.js'

/**
 * CatalogContext
 *
 * Una sola fuente de verdad para el catálogo: lo que llega del CSV público de
 * Google Sheets y, si la planilla no responde, el catálogo local de respaldo.
 * Los componentes leen de acá en lugar de importar la lista estática.
 */

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const { isLoading, error, products, fromSheet, hiddenCount, lastUpdated, isRefreshing } = useProducts()

  const value = useMemo(() => {
    // La categoría se normaliza una vez más acá: el agrupado es por coincidencia
    // exacta de id, así que un solo producto con la categoría sin normalizar
    // ("Muñecos & Figuras") dejaba su estante vacío y caía en "otros".
    const list = (products ?? []).map((product) => ({
      ...product,
      category: normalizeCategoryId(product.category),
    }))
    const stockProducts = list.filter((product) => product.status === 'stock')
    const featuredProducts = list.filter((product) => product.featured)
    // El "Desde" del hero solo cuenta precios publicables: un `1` de prueba en
    // la planilla anunciaba "Desde $1" en la portada.
    const prices = list.map((product) => product.price).filter(isValidPrice)

    return {
      products: list,
      categories: CATEGORIES,
      stockProducts,
      featuredProducts,
      productsByCategory: (categoryId) => list.filter((product) => product.category === categoryId),
      stats: {
        total: list.length,
        stock: stockProducts.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        categories: CATEGORIES.length,
      },
      isLoading,
      error,
      fromSheet,
      hiddenCount,
      lastUpdated,
      isRefreshing,
    }
  }, [products, isLoading, error, fromSheet, hiddenCount, lastUpdated, isRefreshing])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (!context) {
    throw new Error('useCatalog() debe usarse dentro de <CatalogProvider>')
  }
  return context
}
