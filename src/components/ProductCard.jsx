import { useEffect, useRef, useState } from 'react'
import { formatPriceLabel, isValidPrice, productWhatsappLink } from '../config/constants.js'
import { colorSwatchStyle } from '../config/colors.js'
import { Play } from 'lucide-react'
import { isVideoSource } from '../config/media.js'
import { STATUS_STYLES, categoryLabel, productNumber } from '../data/products.js'
import { useCatalog } from '../context/CatalogContext.jsx'
import AddToCartButton from './AddToCartButton.jsx'
import { ProductWhatsappIcon, WhatsAppIcon } from './icons.jsx'

const PLACEHOLDER_IMAGE = '/products/placeholder.svg'

// Se lee una sola vez, como en HeroCarousel: la preferencia no cambia a mitad
// de la visita y así no se crea un listener por cada tarjeta.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ProductCard({ product, variant = 'full', tilt }) {
  const { products } = useCatalog()
  const status = STATUS_STYLES[product.status] ?? STATUS_STYLES.pedido
  const isWindow = variant === 'window'
  const isShelf = variant === 'shelf'

  // Clips (.webm, .mp4...) se reproducen; el resto va como foto. Si el video
  // no se puede cargar (formato o archivo faltante) cae al placeholder, igual
  // que una foto rota.
  const [mediaFailed, setMediaFailed] = useState(false)
  const isVideo = isVideoSource(product.image) && !mediaFailed
  const videoRef = useRef(null)

  // Columna `video` de la planilla: un clip aparte de la foto. Se reproduce
  // recién al tocarlo (un iframe de Drive por tarjeta sería muy pesado).
  const [showClip, setShowClip] = useState(false)
  const [clipFailed, setClipFailed] = useState(false)
  const hasClip = Boolean(product.video)
  const clipIsFile = isVideoSource(product.video)
  const playingClip = hasClip && showClip && !clipFailed

  // Un clip corre solo mientras se ve: si hay varios en el catálogo no se
  // descargan ni reproducen todos a la vez, y el que quedó fuera de pantalla
  // se pausa (el autoplay del navegador no siempre lo hace por su cuenta).
  useEffect(() => {
    const video = videoRef.current
    if (!isVideo || prefersReducedMotion || !video) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      video.play().catch(() => {})
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.25 },
    )
    observer.observe(video)

    return () => observer.disconnect()
  }, [isVideo])

  return (
    <article
      className={`product-card ${isShelf ? 'sm:flex-row' : ''}`}
      data-tilt={tilt}
    >
      {isWindow && (
        <span className="tape" aria-hidden="true" />
      )}

      <div
        className={`relative p-3 ${
          isShelf ? 'sm:w-[42%] sm:shrink-0 sm:border-r sm:border-dashed sm:border-ink/20' : ''
        }`}
      >
        {playingClip ? (
          clipIsFile ? (
            <video
              src={product.video}
              controls
              autoPlay
              playsInline
              onError={() => setClipFailed(true)}
              aria-label={`Video de ${product.name}`}
              className="aspect-square w-full rounded-sm bg-ink object-contain"
            />
          ) : (
            // Drive: el único reproductor posible es el embed oficial.
            <iframe
              src={product.video}
              title={`Video de ${product.name}`}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="aspect-square w-full rounded-sm border-0 bg-ink"
            />
          )
        ) : isVideo ? (
          <video
            ref={videoRef}
            src={product.image}
            muted
            loop
            playsInline
            // Con menos movimiento pedido por el sistema no arranca solo: se
            // muestra el primer cuadro y quedan los controles para darle play.
            autoPlay={!prefersReducedMotion}
            controls={prefersReducedMotion}
            preload="metadata"
            onError={() => setMediaFailed(true)}
            aria-label={`Video de ${product.name}`}
            className="aspect-square w-full rounded-sm bg-ink/5 object-contain"
          />
        ) : (
          <img
            src={mediaFailed ? PLACEHOLDER_IMAGE : product.image}
            alt={`Ilustración de ${product.name}`}
            width={800}
            height={800}
            loading={isWindow ? 'eager' : 'lazy'}
            decoding="async"
            // Sin referrer, Chrome no bloquea las fotos de Drive con ORB.
            referrerPolicy="no-referrer"
            onError={(event) => {
              const image = event.currentTarget
              if (image.dataset.fallback) return
              image.dataset.fallback = 'true'
              image.src = PLACEHOLDER_IMAGE
            }}
            className="aspect-square w-full object-contain"
          />
        )}
        <span className="plate-number absolute left-3.5 top-3">N° {productNumber(product.id, products)}</span>
        <span
          className={`stamp stamp-${product.status === 'stock' ? 'stock' : 'order'} absolute right-3 top-3.5 bg-paper/85`}
          aria-label={status.label === 'En Stock' ? 'Disponible para retirar o comprar hoy' : 'Disponible a pedido, se imprime para ti'}
        >
          {status.label}
        </span>

        {/* Las muestras de color van dentro del marco de la foto, pegadas a
            ella: así no abren un hueco ni empujan el texto de al lado. */}
        {Array.isArray(product.colors) && product.colors.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name + '-' + c.hex}
                className="h-3 w-3 rounded-full border border-ink/20"
                // Los efectos especiales (multicolor, arcoiris, galaxy) son
                // degradados: van en background-image, no en background-color.
                style={colorSwatchStyle(c.hex)}
                title={c.name}
                aria-label={c.name}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className={`flex flex-1 flex-col border-t border-dashed border-ink/20 px-3.5 pb-3.5 pt-3 ${
          isShelf ? 'sm:border-t-0 sm:px-5 sm:py-4' : ''
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faded">
          {categoryLabel(product.category)}
        </p>
        <h3
          className={`mt-1 font-sans font-bold leading-snug text-ink ${
            isWindow ? 'text-[15px]' : isShelf ? 'text-xl' : 'text-lg'
          }`}
        >
          {product.name}
        </h3>
        {!isWindow && (
          <p className="mt-1.5 text-sm leading-snug text-ink-soft">{product.description}</p>
        )}

        {hasClip && (
          <button
            type="button"
            onClick={() => setShowClip((value) => !value)}
            aria-pressed={playingClip}
            aria-label={
              playingClip ? `Ocultar video de ${product.name}` : `Ver video de ${product.name}`
            }
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 self-start text-[13px] font-semibold text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            {playingClip ? 'Ocultar video' : 'Ver video'}
          </button>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-4">
          <span className="price">{formatPriceLabel(product.price)}</span>
          {isValidPrice(product.price) && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faded">
              ARS
            </span>
          )}
        </div>

        {isWindow ? (
          <div className="mt-1 flex items-center justify-between gap-2">
            <a
              href={productWhatsappLink({ name: product.name, price: product.price })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
              aria-label={`Pedir ${product.name} por WhatsApp`}
            >
              <ProductWhatsappIcon className="h-3.5 w-3.5 text-brand-deep" />
              Pedir
            </a>
            <AddToCartButton product={product} compact />
          </div>
        ) : (
          <div className={`mt-3 flex items-center gap-2 ${isShelf ? 'sm:self-start' : ''}`}>
            <a
              href={productWhatsappLink({ name: product.name, price: product.price })}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-ink min-h-11 flex-1 py-2.5 text-[13px] ${isShelf ? 'sm:px-5' : ''}`}
              aria-label={`Pedir ${product.name} por WhatsApp`}
            >
              <ProductWhatsappIcon className="h-4 w-4 text-sky-300" />
              Pedir por WhatsApp
            </a>
            <AddToCartButton product={product} compact />
          </div>
        )}
      </div>
    </article>
  )
}
