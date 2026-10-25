# Faq3D: landing page y catálogo

Landing page de **Faq3D** ("Creando tus ideas"), impresión 3D en **Junín de los Andes, Neuquén**.
React + Vite + Tailwind CSS, carruseles con Embla e íconos de Lucide. Cada botón de consulta abre
WhatsApp con el mensaje ya escrito.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ en http://localhost:4173
```

## Qué editar (y dónde)

### 1. Número de WhatsApp: `src/config/constants.js`

```js
export const WHATSAPP_NUMBER = '5493517874761' // formato internacional, sin "+"
```

Es el único lugar donde se define. Se usa en el navbar, hero, botón flotante y en cada tarjeta,
donde el mensaje incluye el nombre y el precio del producto (si la planilla no trae un precio
publicable, el mensaje va solo con el nombre).

### 2. Catálogo en vivo: Google Sheets

La web lee el catálogo de una planilla publicada como CSV. La URL está en
`src/config/constants.js`:

```js
export const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv'
```

Para cambiar la planilla solo hay que editar `GOOGLE_SHEETS_CSV_URL`. Si la URL está vacía, la
petición falla o la hoja no trae filas, la web cae sola al catálogo local
(`src/data/products.js`) y muestra el aviso "Catálogo local de respaldo" en la sección de stock.

Columnas que se leen de la planilla:

| Columna | Qué se espera |
| --- | --- |
| `id` | Identificador de la fila (número o texto). |
| `name` | Nombre del producto. Las filas sin nombre se ignoran. |
| `category` | `juguetes`, `munecos`, `llaveros` o `accesorios` (también acepta "Muñecos & Figuras", "Juguetes Sensoriales & Articulados", etc.). Una categoría desconocida deja el producto en un estante "Otros modelos". |
| `price` | Número en formato argentino: `8500`, `$8,000` o `$8.000`. Si falta o es menor a `$500`, la web muestra **"Consultar"** en lugar de la cifra. |
| `status` | `stock` (En Stock) o `pedido` (A Pedido). |
| `image` | Foto del producto: nombre de archivo, URL directa o link de Google Drive. Sin foto (o si no carga) se usa `public/products/placeholder.svg`. Ver [Fotos de productos](#4-fotos-de-productos-publicproducts). |
| `video` | Opcional. Clip del producto: link de Google Drive o archivo/URL de video. La tarjeta muestra la foto y un botón "Ver video". Ver [Videos](#videos-webm-mp4-mov-ogv-m4v). |
| `featured` | `TRUE` / `1` / `Sí`: el producto aparece en la vidriera del hero. |
| `colors` | Lista separada por comas: `Blanco, Negro` o `Blanco:#FFFFFF, Negro`. Se reconocen todos los colores del diccionario (ver más abajo). |
| `description` | Texto libre de la tarjeta. |
| `active` | `TRUE` / `1` / `Sí`: **solo se publica el producto si está en `TRUE`**. Con `FALSE` (o vacía) el producto queda oculto y la web avisa cuántos ocultó. |

#### Precios: un precio mal cargado se muestra como "Consultar"

Un `1` o un `2` en la columna `price` es un precio de prueba, pero en la web se ve como una
cotización: la portada anunciaba **"Desde $1"** y esas tarjetas se vendían a un peso. Ahora todo
precio menor a `MIN_VALID_PRICE` (`$500`, en `src/config/constants.js`), vacío o con texto se trata
como **sin precio**:

- la tarjeta (y la ficha destacada del stock) muestra **"Consultar"**, sin la unidad "ARS";
- el "Desde" del hero queda en el precio válido más bajo (si no hay ninguno, dice "Consultar");
- el mensaje de WhatsApp va con el nombre del modelo y sin la cifra en paréntesis.

El resto del catálogo no cambia: un precio real (`$2.500`, `$8.000`) se sigue mostrando igual. Si te
parece que el piso es alto o bajo, se ajusta en una sola constante.

El flujo es: `useProducts` (pide y normaliza el CSV) → `CatalogContext` (estado compartido) →
componentes. Los componentes nunca importan la lista estática.

#### Categorías: se normalizan en todos los caminos

La planilla escribe la categoría como le sale ("Muñecos & Figuras", "Juguetes", "llaveros"...), pero
el sitio la usa como id (`munecos`, `juguetes`...). El mapeo vive en `src/config/categories.js` y se
aplica en **los tres caminos que traen productos**: la planilla, la copia guardada en el navegador y
el catálogo local de respaldo. Además `CatalogContext` lo vuelve a aplicar al agrupar, y los rótulos
de categoría (`categoryLabel`, `categoryTint`) aceptan cualquiera de las dos formas.

Antes, la copia de `localStorage` se leía sin normalizar: una copia guardada por una versión
anterior traía "Muñecos & Figuras" tal cual, el modelo caía en el estante "Otros modelos" y el
estante "Muñecos & Figuras" salía **vacío al recargar** hasta que llegaba la planilla (un segundo
después). "Muñecos & Figuras" era la única categoría que se notaba porque es la única escrita de
esa forma en la planilla: las otras tres ya venían en minúsculas y por casualidad coincidían.

Si tocás la planilla, cambiá la categoría de la forma que quieras: el texto se normaliza solo.

**Un estante sin modelos no se muestra.** Si una categoría no tiene productos publicados (por
ejemplo, hoy no hay ningún modelo en "Muñecos & Figuras"), el catálogo no dibuja su estante ni el
cartel "Sin modelos publicados todavía", y el título se ajusta ("Los tres estantes"); los chips de
"categorías disponibles" del stock tampoco la anuncian. Mientras la planilla está cargando se
muestran los cuatro con esqueletos, para no dejar la sección vacía. Si además se cae la red y el
catálogo queda sin ningún producto, vuelven los cuatro estantes con su mensaje de "sin modelos".

#### Colores de filamento: `src/config/colors.js`

La columna `colors` de la planilla acepta cualquiera de los colores del diccionario, escritos como
los quieras: no importa si van en minúscula, con mayúscula, con tildes o con espacios de
más ("Verde Fluor", "verde fluor", "VERDE FLUOR"). El valor por defecto sale del diccionario
(`src/config/colors.js`); también se puede forzar uno por producto con la forma
`Nombre:#FFFFFF` o `Nombre:rgba(...)`.

El diccionario trae:

- **Básicos y neutros:** blanco, negro, gris, gris oscuro, plata, transparente.
- **Rojos y rosas:** rojo, rojo oscuro, rosa, magenta, fucsia, pastel rosa.
- **Azules y celestes:** celeste, azul, azul marino, azul francia, turquesa, pastel celeste.
- **Verdes:** verde, verde oscuro, verde fluor, verde manzana, verde militar, pastel verde.
- **Amarillos y naranjas:** amarillo, amarillo fluor, naranja, pastel amarillo, pastel naranja.
- **Violetas y morados:** violeta, morado, lila, pastel violeta.
- **Marrones, dorados y especiales:** marron, chocolate, piel, dorado, bronce, cobre.
- **Efectos especiales (multicapa):** multicolor, arcoiris, galaxy.

Los tres últimos son **degradados** y "transparente" es un `rgba`: no son hex, así que el valor se
valida con `normalizeColorValue` (acepta hex, `rgb/rgba`, `hsl` y degradados) y la muestra de la
tarjeta los pinta con `background-image`. Si se filtraran con un simple `^#`, el efecto se perdía
al leer la planilla o la copia guardada.

Para agregar un color nuevo: una línea en `FILAMENT_COLOR_MAP` y, si querés que salga en otro
lugar de la paleta, su clave en `FILAMENT_COLOR_ORDER`. El mismo diccionario se usa para la
planilla, la copia local del navegador y el catálogo de respaldo, así que ningún camino pierde el
color.

Para comprobarlo en un navegador real (además de leer la planilla de verdad, mira cómo queda
pintado cada color):

```bash
node scripts/verify-colors.mjs http://localhost:5173/
```

#### Carga instantánea (el catálogo se ve enseguida)

La planilla tarda ~1 s en responder (redirección de Google + descarga del CSV), así que la web
hace tres cosas para que el catálogo no aparezca tarde:

1. **Copia local en `localStorage`** (`stale-while-revalidate`): la última versión válida se
   guarda y, al abrir o recargar, se pinta en el primer frame con los datos reales. Después
   refresca sola contra la planilla. Por eso, al **recargar** la web el catálogo ya está
   completo desde el primer pintado.
2. **Precarga desde `index.html`**: un script inline pide el CSV mientras se descarga el bundle
   (el mismo `GOOGLE_SHEETS_CSV_URL`, inyectado por `vite.config.js`). La app reutiliza esa
   respuesta y no vuelve a pedirla. Si esa precarga falla, la app reintenta con su propia
   petición.
3. **Esqueletos de carga**: mientras no hay ningún dato se muestran esqueletos
   (`src/components/Skeleton.jsx`), nunca el catálogo local de ejemplo. Antes se veía el
   catálogo de ejemplo con precios que no existían en la planilla y después saltaba al real.

En la sección de stock se ve el estado: "Conectando con la planilla…", "Listado en vivo desde la
planilla" o "Catálogo local de respaldo" (cuando la planilla no respondió).

#### Actualización automática (polling)

`useProducts` vuelve a consultar la planilla **cada 60 minutos** en segundo plano y solo actualiza
el estado si algo cambió de verdad (precio, stock, colores, productos nuevos), así que el
visitador ve los cambios **sin recargar la pestaña**. Además, al volver a la pestaña (de estar
oculta) refresca al instante. En la sección de stock se ve la hora de la última actualización.

- El polling no borra el catálogo ante una falla puntual: se conserva la última versión válida y
  se avisa que no se pudo actualizar.
- Las peticiones usan `cache: 'no-store'`, porque Google responde con `max-age=300` y el
  navegador serviría una copia vieja.
- El intervalo se puede cambiar con `VITE_SHEETS_POLL_MS` (milisegundos), por ejemplo
  `VITE_SHEETS_POLL_MS=4000 npm run dev` para probar más rápido.

#### Orden de los productos

El catálogo se ordena por `id` **descendente** (numérico cuando los ids son números), así que
los productos nuevos — que van con id más alto — aparecen primero en las categorías, en el stock y
en la vidriera del hero.

Para comprobar en un navegador real que la planilla se está reflejando:

```bash
node scripts/verify-catalog.mjs http://localhost:5173/
```

El script imprime el origen del catálogo, los productos, los estantes, el filtrado por `active`,
el orden y el carrusel, y falla (código 1) si algo de eso no se cumple. Hay más pruebas:

```bash
node scripts/verify-first-paint.mjs http://localhost:5173/     # comprueba que el catálogo real se ve al instante
node scripts/verify-active-filter.mjs http://localhost:5173/   # comprueba que active=FALSE oculta
node scripts/verify-colors.mjs http://localhost:5173/          # comprueba que los colores de filamento se leen y se pintan
node scripts/verify-swatches.mjs http://localhost:5173/        # comprueba que las muestras de color van bajo la foto
node scripts/audit-mobile.mjs http://localhost:5173/            # mide overflow y targets táctiles en 320/360/390/414px
VITE_SHEETS_POLL_MS=4000 npx vite --port 5199                  # polling acelerado para la prueba
node scripts/verify-polling.mjs http://localhost:5199/          # comprueba que actualiza sin recargar
node scripts/diagnose-first-paint.mjs http://localhost:5173/    # cronología del primer pintado (diagnóstico)
```

`verify-first-paint.mjs` tiene tres escenarios: carga en frío (sin copia guardada), recarga (con la
copia) y **copia vieja con la planilla inaccesible** (una copia guardada por una versión anterior,
con la categoría sin normalizar). En el último se corta la red a propósito: la copia es la única
fuente y el estante tiene que salir igual.

### 3. Catálogo local de respaldo: `src/data/products.js`

Es el **respaldo** que se muestra si la planilla no responde (por ejemplo, si se cae internet en
ese momento). La planilla sigue siendo la fuente de verdad: este archivo tiene que **reflejar los
mismos productos, precios y estados** que la planilla, porque si no el cliente ve información que
no corresponde. Cuando cambies precios o productos en la planilla, actualizá también este archivo.

Cada producto es un objeto:

```js
{
  id: '2',                      // único, también se usa como key de React
  name: 'Dragon Articulado Flexi',
  category: 'juguetes',         // debe coincidir con un id de CATEGORIES
  price: 8000,                  // número; se muestra como $8.000
  status: 'stock',              // 'stock' | 'pedido'
  featured: true,               // aparece en la vidriera del hero
  image: '/products/dragon-articulado.svg',
  description: 'Impreso en una sola pieza',
  colors: [{ name: 'Blanco', hex: '#FFFFFF' }],
}
```

- **Stock inmediato** se arma solo con los productos `status: 'stock'`.
- **Hero** usa los `featured: true`.
- Si agregás una categoría nueva, sumala a `CATEGORIES` con el mismo `id`.

### 4. Fotos de productos: `public/products/`

Las imágenes actuales son placeholders generados (ilustraciones de capas de impresión).
Para poner las fotos reales: reemplazá cada archivo manteniendo el nombre (o cambiá `image` en
`products.js`, o la columna `image` de la planilla). Conviene fotos cuadradas; la tarjeta usa
`aspect-square` y el hero recorta con `object-cover`. `placeholder.svg` se usa cuando un producto
no tiene foto o la URL remota no carga.

La columna `image` de la planilla acepta **cuatro formas** (todas se normalizan en
`normalizeSheetImage`, en `src/hooks/useProducts.js`):

| Formato | Ejemplo | Qué hace la web |
| --- | --- | --- |
| Nombre de archivo | `corazon_maicra.webp` o `boca abrelatas - copia.jpg` | Lo busca en `public/products/` (no importan los espacios). **El archivo tiene que estar ahí.** |
| Ruta local | `/products/dragon-articulado.svg` | La usa tal cual. |
| URL directa | `https://sitio.com/foto.jpg` | La usa tal cual. Tiene que terminar en una imagen, no en una página. |
| Link de Google Drive | `https://drive.google.com/file/d/ID/view?usp=sharing` | Se convierte al CDN de contenido (`lh3.googleusercontent.com/d/ID=w1200`). |

Un link de Drive **solo funciona si el archivo está compartido como "Cualquier persona con el
enlace"**: si está privado, Google redirige al login y la web muestra el placeholder. Un link de
Drive pegado tal cual (con `/view`) tampoco sirve: es una página HTML, no la imagen; por eso la web
lo traduce sola.

Por qué se usa `lh3.googleusercontent.com` y no `drive.google.com/thumbnail`: el segundo redirige
con `application/binary` y Chrome corta la carga con `ERR_BLOCKED_BY_ORB`, así que la foto nunca
aparecía (el archivo estaba público y aun así no se veía). Además las tarjetas piden las imágenes
con `referrerpolicy="no-referrer"`, que es lo que destraba el CDN de Google. Si en el futuro algún
link de Drive deja de verse, ese es el primer par de cosas para revisar.

#### Videos (`.webm`, `.mp4`, `.mov`, `.ogv`, `.m4v`)

Hay dos formas de publicar un clip:

| Dónde | Qué muestra la tarjeta |
| --- | --- |
| Columna `video` (recomendado) | La foto de `image` + un botón **Ver video**. Al tocarlo, el clip se reproduce en el lugar de la foto. |
| Celda `image` con un archivo de video | El clip se reproduce solo, mudo y en loop, mientras está a la vista. |

En la columna `video` se acepta:

- **Link de Google Drive** (`drive.google.com/file/d/ID/view`): la web lo convierte al reproductor
  embebido de Drive (`/file/d/ID/preview`). Es la única forma de reproducir un video alojado en
  Drive; el archivo tiene que estar compartido como "Cualquier persona con el enlace".
- **Archivo o URL de video** (`clip.webm` en `public/products/`, o `https://sitio.com/clip.mp4`): se
  reproduce con un `<video controls>` nativo.

El reproductor no se carga hasta que el visitante toca "Ver video": un iframe de Drive por tarjeta
hubiera hecho pesar el catálogo entero. En la columna `image`, en cambio, el clip corre solo
(`src/config/media.js` decide, `ProductCard` dibuja).

- Se reproduce **mudo, en loop y solo mientras está a la vista**: si hay varios clips en el
  catálogo no corren todos a la vez (IntersectionObserver).
- Con `prefers-reduced-motion` no arranca solo: muestra el primer cuadro y deja los controles.
- Si el video no carga, cae al placeholder igual que una foto rota.
- Vale tanto un archivo propio (`clip.webm` en `public/products/`) como una URL directa
  (`https://sitio.com/clip.webm`).

**Ojo con Drive en la columna `image`:** un link de Drive no dice si el archivo es foto o video, así
que se resuelve siempre como imagen (en un video, la miniatura es un cuadro del clip). Para que se
reproduzca, usá la columna `video` o una URL que termine en la extensión.

Para revisar de una vez, fila por fila, si las fotos y videos de la planilla existen de verdad:

```bash
node scripts/check-images.mjs
```

Abre cada foto o clip (y cada archivo local), verifica que la respuesta sea `content-type: image/*`
o `video/*` y falla con código 1 diciendo qué fila está mal y por qué (archivo que falta, link
privado, formato no reconocido). No necesita el servidor de desarrollo: lee la planilla
directamente.

Assets principales:

| Archivo | Uso |
| --- | --- |
| `public/logo.webp` | Logo completo (footer), recortado y con fondo transparente. |
| `public/logo-mark.webp` | Isotipo (cubo + extrusor) para el navbar. |
| `public/favicon.png` | Ícono del sitio. |
| `public/hero.jpg` | Foto del banner de ubicación y envíos. |
| `public/og-image.jpg` | Imagen para compartir en redes (Open Graph / Twitter, 1200×630). |

### 5. Redes: `src/config/constants.js`

Actualizá `SITE.instagram` y `SITE.tiktok` con los perfiles reales (y el `sameAs` del JSON-LD
en `index.html`).

### 6. Pedido (carrito): `src/context/CartContext.jsx`

El botón **Pedido** del navbar abre un cajón con lo que el visitante fue sumando desde las
tarjetas. Ahí ajusta cantidades y manda todo junto a WhatsApp con el total ya calculado: no hay
pago ni checkout en la web.

- **Qué se guarda:** solo el id y la cantidad, en `localStorage` (`faq3d:cart:v1`). El nombre y el
  precio salen del catálogo en cada render, así un precio corregido en la planilla se ve también
  en un carrito abierto ayer, y un producto que se da de baja desaparece del pedido solo.
- **Mensaje de WhatsApp:** lo arma `cartWhatsappLink()` en `src/config/constants.js`. Viaja con el
  saludo obligatorio, una línea por modelo (`• 2 × Lagarto articulado — $16.000`), el `Total:` y,
  si hay modelos sin precio publicable, una línea `A confirmar por WhatsApp: …`.
- **Precios "Consultar":** un modelo con precio menor a `$500` o vacío se puede sumar, pero no
  suma al total y se avisa aparte (ver [Precios](#precios-un-precio-mal-cargado-se-muestra-como-consultar)).
- **Al agregar:** el primer ítem del pedido abre el cajón, para que el visitante vea dónde quedó
  lo que sumó; los siguientes **no** lo abren (no le tapan la página a cada click) y muestran un
  aviso discreto "Agregado al pedido" durante 2,2 s. Ese aviso es un `role="status"` con
  `aria-live="polite"`, así que también lo escucha quien usa lector de pantalla, y se limpia si el
  cajón se abre a mano.
- **Peso:** el cajón no renderiza nada hasta que se abre (ni iframes ni fotos extra); el botón
  Agregar solo escribe en el estado y el contador del navbar se actualiza solo.
- **Accesibilidad:** `role="dialog"` + `aria-modal`, foco al abrir, Tab atrapado dentro del cajón,
  `Escape` y clic en el fondo cierran, el foco vuelve al botón que lo abrió y el scroll del body se
  bloquea mientras está abierto.
- **Móvil:** abajo de 390px el CTA de WhatsApp del navbar queda solo con ícono y abajo de 640px el
  botón del pedido pierde su texto (queda el ícono con su `aria-label`), para que entren el logo,
  los dos botones y el menú en 320px.

### 7. Dominio y SEO técnico: `vite.config.js`

El dominio público se define una sola vez, en la constante `SITE_URL` de `vite.config.js`:

```js
const SITE_URL = (process.env.SITE_URL ?? 'https://faq3d.com.ar').replace(/\/+$/, '')
```

De ahí salen `canonical`, `hreflang`, `og:url`/`og:image`, `robots.txt` y `sitemap.xml`, así que
al publicar solo hay que reemplazarlo por el dominio real (sin barra final). También se puede
sobreescribir en el build sin tocar código:

```bash
SITE_URL=https://midominio.com npm run build
```

- `robots.txt` y `sitemap.xml` se generan en cada build (y se sirven también en `npm run dev`).
- `index.html` incluye Open Graph completo, Twitter Card `summary_large_image` y JSON-LD
  (`Store` con dirección, área de servicio y redes).
- La imagen social es `public/og-image.jpg` (1200×630): si cambiás el diseño, regenerala con
  las mismas medidas.

## Estructura

```
src/
  config/constants.js     # WhatsApp, links, precios formateados, pedido, navegación, URL del CSV
  config/colors.js        # diccionario de colores de filamento (nombre -> hex/rgba/degradado)
  config/categories.js    # normaliza la categoría de la planilla al id del sitio
  config/media.js         # foto o video según la extensión de la fuente
  data/products.js        # categorías, catálogo local de respaldo y helpers
  hooks/useProducts.js    # pide el CSV, lo normaliza y lo refresca cada 60 minutos
  context/CatalogContext  # estado compartido del catálogo (productos, stats, origen, actualización)
  context/CartContext     # pedido: ítems, cantidades, total y apertura del cajón
  components/
    Navbar · Hero · HeroCarousel
    StockSection · CatalogSection · ProductRow · ProductCard
    CartDrawer · CartNotice · AddToCartButton
    HowToBuy · ShippingBanner · Footer · WhatsAppFab
    PaperStar · SectionHeading · Skeleton · icons
  index.css               # tema, utilidades y estilos base
scripts/
  verify-catalog.mjs      # comprueba en navegador real que se refleja la planilla
  verify-first-paint.mjs  # comprueba que el catálogo real aparece al instante
  verify-active-filter.mjs # comprueba que active=FALSE oculta el producto
  verify-colors.mjs       # comprueba que los colores de filamento se leen y se pintan
  verify-swatches.mjs     # comprueba que las muestras de color van dentro del marco de la foto
  audit-mobile.mjs        # overflow horizontal y touch targets en 320/360/390/414px
  check-images.mjs        # verifica que cada foto de la planilla exista y sea una imagen
  verify-polling.mjs      # comprueba que el polling actualiza sin recargar
  diagnose-first-paint.mjs # cronología del primer pintado (diagnóstico)
```

## Notas de diseño

- Estética de archivo de papel: fondo `#F2ECE0` (paper), tinta `#16130F` (ink) y acento
  `#0088DD` (brand).
- Las muestras de color van **dentro del marco de la foto**, pegadas debajo de la imagen. Antes
  ocupaban una fila entre la foto y el texto: en el estante (imagen a la izquierda, texto a la
  derecha) esa fila empujaba el texto hacia abajo y dejaba un hueco entre la foto y el nombre.
  Ahora el texto arranca en el mismo alto que la foto, sin huecos.
- **Mobile:** los controles táctiles del navbar, las tarjetas, el estante y el footer tienen
  44px de alto como mínimo (Apple HIG / Material). El levantado de las tarjetas al pasar el mouse
  está detrás de `@media (hover: hover) and (pointer: fine)`, así que en pantallas táctiles la
  tarjeta no queda flotando después de un tap. `scroll-padding-top` compensa el header sticky
  (64px en móvil) para que los saltos de ancla no queden tapados.
- **Hero en móvil:** la grilla del hero lleva `min-w-0` en la grilla y en sus dos columnas. Sin eso,
  el ancho mínimo del carrusel (los slides de Embla) estiraba la columna a ~595px y en 320–640px la
  tarjeta del hero se veía **cortada por la derecha** (título, subtítulo y el botón "Ver el
  catálogo" quedaban fuera de la ventana, tapados por el `overflow:hidden` del marco).
- **Stats del hero:** son tres columnas de ~56px en 320px, así que la etiqueta va en 9px y la cifra
  en 18px hasta `sm` (en 24px, "$2.500" se salía de su celda). Si el catálogo no tiene ningún precio
  publicable, el "Desde" no se dibuja: quedan dos columnas (un "Consultar" de 90px no entra ahí, y
  las tarjetas ya lo dicen).
- Tipografía: Bricolage Grotesque (títulos) + Archivo (texto), autoalojadas en `public/fonts/`.
- Respeta `prefers-reduced-motion` y tiene foco visible para navegación por teclado.
