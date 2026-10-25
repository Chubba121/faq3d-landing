/**
 * Detección de media para las tarjetas de producto.
 *
 * La planilla tiene dos columnas:
 *   - `image`: la foto (o, si tiene extensión de video, el clip).
 *   - `video`: un clip opcional para reproducir al tocarlo.
 *
 * Un `<img>` no puede dibujar un video (esa era la razón por la que un .webm
 * "no se veía"), así que hay que saber qué se va a renderizar.
 *
 * La detección es por extensión: es la única señal confiable sin descargar el
 * archivo. Los links de Google Drive NO tienen extensión, por eso se detectan
 * por host y se resuelven a endpoints propios (imagen o reproductor).
 */

const VIDEO_EXTENSION = /\.(mp4|webm|ogv|ogg|mov|m4v)(?:[?#].*)?$/i
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|svg|bmp)(?:[?#].*)?$/i

export function isVideoSource(src) {
  return VIDEO_EXTENSION.test(String(src ?? ''))
}

/** Extensiones que la planilla puede escribir como nombre de archivo suelto. */
export function hasMediaExtension(value) {
  return VIDEO_EXTENSION.test(String(value ?? '')) || IMAGE_EXTENSION.test(String(value ?? ''))
}

/**
 * Id de un archivo de Google Drive, si el link es de Drive.
 * Acepta .../file/d/ID/..., .../open?id=ID, .../d/ID/edit, docs.google.com...
 */
export function driveFileId(value) {
  let url
  try {
    url = new URL(String(value ?? '').trim())
  } catch {
    return null
  }

  if (!/(^|\.)(drive|docs)\.google\.com$/i.test(url.hostname)) return null

  const fromPath = url.pathname.match(/\/d\/([\w-]{10,})/)
  const fromQuery = url.searchParams.get('id')
  return fromPath?.[1] ?? (/^[\w-]{10,}$/.test(fromQuery ?? '') ? fromQuery : null)
}

/**
 * Link de Drive -> imagen directa.
 *
 * Se usa el CDN `lh3.googleusercontent.com/d/ID=wNNNN` y no
 * `drive.google.com/thumbnail?...`: ese último redirige con
 * `application/binary` y Chrome corta la carga con ERR_BLOCKED_BY_ORB.
 * Las imágenes se piden con `referrerpolicy="no-referrer"` (ver ProductCard).
 */
export function driveImageUrl(value) {
  const id = driveFileId(value)
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1200` : null
}

/**
 * Link de Drive -> reproductor embebido de Drive (iframe).
 * Es la única forma de reproducir un video alojado en Drive: el archivo publico
 * no se puede pasar a un <video>.
 */
export function drivePreviewUrl(value) {
  const id = driveFileId(value)
  return id ? `https://drive.google.com/file/d/${id}/preview` : null
}
