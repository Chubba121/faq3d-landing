import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useCatalog } from './CatalogContext.jsx'
import { cartWhatsappLink, isValidPrice } from '../config/constants.js'

/**
 * CartContext
 *
 * El pedido que el visitante arma antes de escribir por WhatsApp. No hay pago
 * ni checkout: la web suma y el mensaje viaja con el detalle y el total, para
 * que no tenga que tipear los modelos a mano.
 *
 * Se guarda SOLO el id y la cantidad. El nombre y el precio salen del catálogo
 * en cada render, así un cambio de precio en la planilla se refleja también en
 * un carrito abierto desde ayer (y un producto que se dio de baja desaparece
 * solo del pedido en vez de quedar con un precio viejo).
 */

const STORAGE_KEY = 'faq3d:cart:v1'
const MAX_QTY = 99
const NOTICE_MS = 2200

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { products, isLoading } = useCatalog()
  const [entries, setEntries] = useState(readStoredEntries)
  const [isOpen, setIsOpen] = useState(false)
  // Aviso breve ("Agregado al pedido") para los clicks que NO abren el cajón.
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef(null)

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const showNotice = useCallback((text) => {
    setNotice(text)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), NOTICE_MS)
  }, [])

  useEffect(() => {
    writeStoredEntries(entries)
  }, [entries])

  // Productos que ya no se publican: se sacan del pedido cuando el catálogo
  // está disponible. Con el catálogo en carga no se toca nada, si no se
  // vaciaría el carrito guardado antes del primer render.
  useEffect(() => {
    if (isLoading) return

    const published = new Set(products.map((product) => product.id))
    setEntries((current) => {
      const kept = current.filter((entry) => published.has(entry.id))
      return kept.length === current.length ? current : kept
    })
  }, [products, isLoading])

  const items = useMemo(
    () =>
      entries.flatMap((entry) => {
        const product = products.find((candidate) => candidate.id === entry.id)
        if (!product) return []

        const priced = isValidPrice(product.price)
        return [
          {
            ...product,
            qty: entry.qty,
            hasPrice: priced,
            lineTotal: priced ? product.price * entry.qty : 0,
          },
        ]
      }),
    [entries, products],
  )

  const add = useCallback(
    (product) => {
      if (!product?.id) return

      // El primer ítem abre el cajón: el visitante ve dónde quedó lo que sumó
      // (antes no pasaba nada visible y el pedido parecía perdido). Los
      // siguientes solo avisan, para no taparle la página a cada click.
      const wasEmpty = items.length === 0

      setEntries((current) => {
        const existing = current.find((entry) => entry.id === product.id)
        if (!existing) return [...current, { id: product.id, qty: 1 }]
        return current.map((entry) =>
          entry.id === product.id ? { ...entry, qty: clampQty(entry.qty + 1) } : entry,
        )
      })

      if (wasEmpty) {
        clearTimeout(noticeTimer.current)
        setNotice('')
        setIsOpen(true)
      } else {
        showNotice('Agregado al pedido')
      }
    },
    [items.length, showNotice],
  )

  const setQty = useCallback((id, qty) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, qty: clampQty(qty) } : entry)),
    )
  }, [])

  const remove = useCallback((id) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  const open = useCallback(() => {
    clearTimeout(noticeTimer.current)
    setNotice('')
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0)
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const pending = items.filter((item) => !item.hasPrice)

    return {
      items,
      count,
      total,
      pending,
      whatsappHref: items.length ? cartWhatsappLink(items) : '',
      notice,
      isOpen,
      open,
      close,
      add,
      setQty,
      remove,
      clear,
    }
  }, [items, notice, isOpen, open, close, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart() debe usarse dentro de <CartProvider>')
  }
  return context
}

function clampQty(value) {
  const number = Math.floor(Number(value))
  if (!Number.isFinite(number)) return 1
  return Math.min(MAX_QTY, Math.max(1, number))
}

function readStoredEntries() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const seen = new Set()
    return parsed.flatMap((entry) => {
      const id = String(entry?.id ?? '').trim()
      if (!id || seen.has(id)) return []
      seen.add(id)
      return [{ id, qty: clampQty(entry?.qty) }]
    })
  } catch {
    // Copia corrupta o localStorage bloqueado: se arranca con el carrito vacío.
    return []
  }
}

function writeStoredEntries(entries) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Sin storage (modo privado, cuota llena) el carrito vive solo en memoria.
  }
}

/**
 * Conserva el foco y el scroll del body mientras el cajón está abierto.
 * Devuelve el elemento que tenía el foco para devolvérselo al cerrar.
 */
export function useDrawerBehaviour(isOpen, onClose, panelRef) {
  const previousFocus = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    previousFocus.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null)

    const first = focusables()[0]
    first?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const nodes = focusables()
      if (!nodes.length) return

      const firstNode = nodes[0]
      const lastNode = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault()
        lastNode.focus()
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault()
        firstNode.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus()
    }
  }, [isOpen, onClose, panelRef])
}
