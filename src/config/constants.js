/**
 * Configuración central de Faq3D.
 *
 * WHATSAPP_NUMBER: número de contacto en formato internacional, sin "+", sin
 * espacios ni guiones. Es el ÚNICO lugar donde hay que cambiarlo.
 *
 * GOOGLE_SHEETS_CSV_URL: URL pública de Google Sheets exportada como CSV.
 * Mantiene el catálogo de productos e imágenes actualizado sin tocar código.
 * Si esta constante está vacía o cambia de largo, la app vuelve automáticamente
 * al archivo local de productos.
 */

// ⚠️ Replace con el número real una vez confirmado.
export const WHATSAPP_NUMBER = '5493517874761'

export const SITE = {
  name: 'Faq3D',
  tagline: 'Creando tus ideas',
  location: 'Junín de los Andes, Neuquén',
  instagram: 'https://www.instagram.com/faq3d',
  tiktok: 'https://www.tiktok.com/@faq3d',
}

export const GOOGLE_SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiOQHx52TsMJMNlI4_8rPYaF7HawTsObFnXWknP-Iwnf7JaMoNt1WXmFoDs-e9d_yYJzS2mLB5D-Uf/pub?output=csv'

export const WHATSAPP_MESSAGES = {
  general: 'Hola, vengo de la web, estoy interesado en una de tus impresiones.',
  // El precio se omite cuando la planilla no trae uno válido (vacío, texto o
  // una cifra de relleno): mandar "($1)" al vendedor no le dice nada y "($0)"
  // menos. Sin precio, el mensaje pide presupuesto por el modelo.
  product: (name, price) =>
    price
      ? `Hola, vengo de la web, estoy interesado en una de tus impresiones. Me gustaría consultar por: ${name} (${price})`
      : `Hola, vengo de la web, estoy interesado en una de tus impresiones. Me gustaría consultar por: ${name}`,
  // El carrito manda el pedido armado: una línea por modelo y el total, para
  // que el cliente no tenga que repetir la lista a mano.
  cart: (body) =>
    `Hola, vengo de la web, estoy interesado en una de tus impresiones. Quiero encargar:\n${body}`,
}

/**
 * Piso de precio razonable para un producto impreso.
 *
 * Si en la planilla alguien deja un `1` o un `2` de prueba, mostrarlo en la
 * web es peor que no mostrarlo: el hero diría "Desde $1" y la tarjeta cotizaría
 * la pieza a un peso. Por debajo de este piso (o sin precio) la web muestra
 * "Consultar" y el mensaje de WhatsApp va sin cifra.
 */
export const MIN_VALID_PRICE = 500

export const PRICE_ON_REQUEST = 'Consultar'

/** ¿El precio es un monto publicable? */
export function isValidPrice(value) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= MIN_VALID_PRICE
}

/**
 * Arma un link de WhatsApp con el mensaje ya codificado.
 */
export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export const GENERAL_WHATSAPP_LINK = whatsappLink(WHATSAPP_MESSAGES.general)

/**
 * Link de WhatsApp con el detalle del producto elegido.
 */
export function productWhatsappLink({ name, price }) {
  return whatsappLink(WHATSAPP_MESSAGES.product(name, isValidPrice(price) ? formatPrice(price) : ''))
}

/**
 * Pedido armado en el carrito -> link de WhatsApp con el detalle y el total.
 *
 * Cada línea lleva cantidad, modelo y subtotal. Los modelos sin precio
 * publicable ("Consultar") no suman al total: se listan aparte para que el
 * dueño los cotice en la misma conversación.
 */
export function cartWhatsappLink(items) {
  const list = (items ?? []).filter((item) => item?.name && item.qty > 0)
  if (!list.length) return GENERAL_WHATSAPP_LINK

  const lines = list.map((item) => {
    const priced = isValidPrice(item.price)
    const subtotal = priced ? ` — ${formatPrice(item.price * item.qty)}` : ' — precio a confirmar'
    return `• ${item.qty} × ${item.name}${subtotal}`
  })

  const total = list.reduce(
    (sum, item) => sum + (isValidPrice(item.price) ? item.price * item.qty : 0),
    0,
  )
  if (total > 0) lines.push(`Total: ${formatPrice(total)}`)

  const pending = list.filter((item) => !isValidPrice(item.price)).map((item) => item.name)
  if (pending.length) lines.push(`A confirmar por WhatsApp: ${pending.join(', ')}`)

  return whatsappLink(WHATSAPP_MESSAGES.cart(lines.join('\n')))
}

/**
 * 8500 -> "$8.500"
 */
export function formatPrice(value) {
  return `$${new Intl.NumberFormat('es-AR').format(value)}`
}

/**
 * 8500 -> "$8.500"; 2 o vacío -> "Consultar"
 *
 * Es lo que se imprime en la tarjeta y en la ficha destacada.
 */
export function formatPriceLabel(value) {
  return isValidPrice(value) ? formatPrice(value) : PRICE_ON_REQUEST
}

export const NAV_LINKS = [
  { href: '#stock', label: 'Stock' },
  { href: '#catalogo', label: 'Catálogo' },
  { href: '#como-comprar', label: 'Cómo comprar' },
  { href: '#envios', label: 'Envíos' },
]

// Detección de cambio para reactivar el efecto en App.jsx sin cuidar el link.
export const GOOGLE_SHEETS_URL_BEFORE_REACTIVATE =
  GOOGLE_SHEETS_CSV_URL
