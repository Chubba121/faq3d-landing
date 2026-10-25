# AGENTS.md - Faq3D Landing Page & Catálogo Interactivo

## 1. Descripción del Proyecto
Construir una Landing Page moderna, rápida y orientada a la conversión para **Faq3D** ("Creando tus ideas"), un emprendimiento de impresión 3D ubicado en **Junín de los Andes, Neuquén, Argentina**.
El objetivo principal es exhibir productos mediante carruseles atractivos, vender **stock inmediato** y tomar **encargos a pedido** de catálogo (juguetes sensoriales/articulados, muñecos, llaveros y accesorios), derivando todas las consultas directamente a WhatsApp.

> **Restricción de Negocio Importante:** NO incluir secciones ni formularios de "diseño o modelado 3D personalizado desde cero". El emprendimiento trabaja exclusivamente con productos en stock y modelos de catálogo a pedido.

---

## 2. Stack Tecnológico y Librerías
- **Framework:** React 18+ con Vite (JavaScript o TypeScript).
- **Estilos:** Tailwind CSS.
- **Iconografía:** `lucide-react`.
- **Carruseles / Sliders:** `swiper` o `embla-carousel-react` (fluidos, con soporte touch/swipe para móviles y botones de navegación en desktop).
- **Animaciones:** Transiciones nativas de Tailwind + efectos suaves de aparición (fade-in / slide-up).

---

## 3. Identidad Visual y Diseño (Bold Dark Minimalism)
El logo oficial (`logo.png`) tiene fondo transparente con tipografía blanca ("Faq", "CREANDO TUS IDEAS" y el extrusor) y celeste/azul vibrante ("3D" y las capas superiores del cubo). Por lo tanto, **la interfaz debe ser estrictamente en Modo Oscuro (Dark Mode)** para garantizar contraste total.

### Paleta de Colores:
- **Fondo Principal:** `#090D16` (equivalente a `bg-slate-950`).
- **Fondo de Tarjetas / Secciones Secundarias:** `#111827` (`bg-gray-900` / `bg-slate-900`) con bordes sutiles `border-slate-800` y efecto `backdrop-blur` donde corresponda.
- **Color Primario / Acento (Celeste Faq3D):** `#0088DD` / `sky-500` (`hover:bg-sky-400`). Usado en botones principales, detalles de énfasis, bordes activos y badges.
- **Texto Principal:** Blanco puro `#FFFFFF` para títulos con mucho peso visual (`font-extrabold` / `tracking-tight`).
- **Texto Secundario:** Gris claro `#94A3B8` (`text-slate-400`).
- **Badge "En Stock":** Verde esmeralda (`bg-emerald-500/20 text-emerald-400 border-emerald-500/30`).
- **Badge "A Pedido":** Celeste (`bg-sky-500/20 text-sky-400 border-sky-500/30`).

### Estilo Estético:
- **Minimalismo con peso (Bold Minimalism):** Tipografía Sans-Serif geométrica (ej. *Inter*, *Plus Jakarta Sans* o *Space Grotesk*), títulos grandes, mucho aire/espacio negativo entre secciones, tarjetas con bordes redondeados (`rounded-2xl`), sombras suaves con ligero resplandor celeste al hacer hover (`hover:border-sky-500/50 transition-all`).

---

## 4. Lógica de Contacto (WhatsApp)
- **Número de WhatsApp (Configuración centralizada):** Definir una constante global `WHATSAPP_NUMBER = "5492990000000"` (reemplazar luego por el número real en un archivo `src/config/constants.js`).
- **Mensaje General (Hero, Navbar y Botón Flotante):**
  Al hacer clic en el botón principal de contacto o en el botón flotante, redirigir a:
  `https://wa.me/${+543517874761}?text=${encodeURIComponent("Hola, vengo de la web, estoy interesado en una de tus impresiones.")}`
- **Mensaje por Producto (En cada tarjeta):**
  Cada tarjeta de producto tendrá un botón `"Lo quiero / Consultar"` que redirigirá con el mensaje:
  `"Hola, vengo de la web, estoy interesado en una de tus impresiones. Me gustaría consultar por: [Nombre del Producto] (${[Precio]})"`

---

## 5. Arquitectura de Secciones (Single Page Application)

### A. Navbar (Sticky & Glassmorphism)
- Barra fija superior (`sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80`).
- Izquierda: Imagen del logo (`/logo.png`) con buen tamaño.
- Centro (Desktop): Enlaces de navegación con scroll suave (`#stock`, `#catalogo`, `#como-comprar`, `#envios`).
- Derecha: Botón CTA destacado con ícono de WhatsApp `"Contactar"`.

### B. Hero Section (Impacto Visual + Carrusel Principal)
- Layout a 2 columnas en Desktop (Texto a la izquierda, Carrusel visual a la derecha) y apilado en Móvil.
- **Columna Izquierda:**
  - Badge superior: `"📍 Junín de los Andes, Neuquén • Envíos a todo el país"`.
  - Título H1 con peso: `"Tus ideas cobran vida en 3D."` (con las palabras `"en 3D"` resaltadas en degradado celeste `from-sky-400 to-blue-500 bg-clip-text text-transparent`).
  - Subtítulo persuasivo: `"Muñecos articulados, juguetes sensoriales, llaveros y accesorios únicos. Llevate nuestros modelos en stock con entrega inmediata o encargá tu favorito a pedido."`
  - Dos botones:
    1. Primario (Celeste): `"Ver Stock Disponible"` (scroll a `#stock`).
    2. Secundario (Borde blanco/gris): `"Hablar por WhatsApp"` (link directo con el mensaje requerido).
- **Columna Derecha:**
  - Carrusel automático (Hero Carousel) mostrando de 3 a 5 fotos grandes de las mejores impresiones con etiquetas flotantes de precio y categoría.

### C. Sección "¡Listos para Entregar!" (`#stock`)
- Orientada a vender rápido lo que ya está impreso.
- Título: `"Stock Inmediato"` + Subtítulo: `"Piezas listas para retirar hoy mismo en Junín de los Andes o despachar por envío."`
- **Carrusel horizontal deslizable** de tarjetas de productos que tienen `status: "En Stock"`.

### D. Catálogo por Categorías con Carruseles (`#catalogo`)
- Sistema de filtros por pestañas (Tabs) o carruseles apilados para las 4 categorías clave:
  1. **Juguetes Sensoriales & Articulados** (ej. dragones articulados, fidgets, pulpos, etc.)
  2. **Muñecos & Figuras** (personajes, cultura pop, decoración)
  3. **Llaveros** (diseños llamativos, clubes, personajes, souvenirs)
  4. **Accesorios** (soportes para auriculares/celulares, organizadores de escritorio, mates, etc.)
- **Estructura de la Tarjeta de Producto (`ProductCard`):**
  - Imagen con relación de aspecto `aspect-square` o `aspect-[4/3]`, con efecto zoom suave al hacer hover.
  - Badge en la esquina superior izquierda: `"En Stock"` (verde) o `"A Pedido"` (celeste).
  - Categoría en texto pequeño.
  - Título del producto en blanco y negrita.
  - **Precio visible** en tamaño destacado (ej. `$8.500` en color celeste o blanco brillante).
  - Botón de ancho completo: `"Pedir por WhatsApp"` con ícono.

### E. Sección "¿Cómo Comprar?" (`#como-comprar`)
- Diseño en 3 tarjetas limpias numeradas (`01`, `02`, `03`):
  1. **Elegí tu modelo:** Mirá nuestro stock listo para entregar o elegí cualquier producto del catálogo para que lo imprimamos a pedido en los colores que más te gusten.
  2. **Escribinos por WhatsApp:** Tocá el botón de contacto para confirmar disponibilidad, colores de filamento y método de pago.
  3. **Recibilo en tus manos:** Coordinamos la entrega en **Junín de los Andes** o te lo enviamos por correo a donde estés.

### F. Banner de Ubicación y Envíos (`#envios`)
- Bloque visual destacado con estética moderna indicando:
  - **Entregas personales:** Punto de encuentro / retiro en **Junín de los Andes, Neuquén**.
  - **Envíos:** Despachos seguros y bien embalados a toda la provincia y el país.

### G. Footer y Botón Flotante (FAB)
- **Footer minimalista:** Logo de Faq3D, eslogan *"Creando tus ideas"*, enlaces a redes sociales (Instagram / TikTok) y copyright.
- **Botón Flotante de WhatsApp:** Fijo abajo a la derecha (`fixed bottom-6 right-6 z-50`), con animación sutil de pulso, ícono de WhatsApp y enlace directo con el texto obligatorio:
  `"Hola, vengo de la web, estoy interesado en una de tus impresiones."`

---

## 6. Estructura de Datos Inicial (`src/data/products.js`)
Crear un archivo centralizado y fácil de editar por el dueño del emprendimiento donde pueda agregar fotos, cambiar precios o pasar
