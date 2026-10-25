# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vecinos de Junín de los Andes y alrededores que compran regalos, juguetes y accesorios para sus familias, hijos o amigos. También turistas de paso, pero el público principal es local: gente que puede retirar en mano y que valora saber qué hay disponible hoy.

## Product Purpose

Mostrar el catálogo de piezas impresas en 3D de Faq3D (juguetes sensoriales y articulados, muñecos, llaveros y accesorios), con stock inmediato y modelos a pedido, y derivar cada consulta a WhatsApp. El éxito es que alguien vea el catálogo, encuentre un modelo y escriba.

## Positioning

Impresión 3D hecha en el pueblo: modelos de catálogo que se imprimen a pedido en los colores que el cliente elija, con retiro en Junín de los Andes y envíos al resto del país.

## Operating Context

Emprendimiento chico, atendido por sus dueños. Las consultas se cierran por WhatsApp, sin carrito ni pago online. La entrega se coordina en persona en Junín de los Andes o por correo. El catálogo se edita a mano en un archivo de datos: precios en pesos, estado de stock y fotos.

## Capabilities and Constraints

- Solo stock y modelos de catálogo a pedido. No se ofrece diseño ni modelado 3D personalizado desde cero.
- Cada producto tiene categoría, precio en ARS y estado: `stock` o `pedido`.
- Todos los caminos de contacto terminan en WhatsApp, con mensaje general o con el detalle del producto y su precio.
- Los mensajes de WhatsApp son texto fijo del negocio y no se reescriben.
- Número de WhatsApp y dominio todavía son placeholders a confirmar por el dueño.
- Las once imágenes de producto son ilustraciones placeholder: el dueño debe reemplazarlas por fotos reales.

## Brand Commitments

- Nombre Faq3D, eslogan "Creando tus ideas".
- Logo existente: tipografía blanca y cubo celeste, fondo transparente. Necesita apoyarse sobre una superficie oscura para leerse.
- Se mantienen los mensajes de WhatsApp y el catálogo.
- El dueño pidió abrir el sitio a fondo claro para esta etapa; el modo oscuro deja de ser una restricción de marca.

## Evidence on Hand

- `public/logo.webp`, `public/logo-mark.webp`: marca oficial recortada.
- `public/hero.jpg`: foto del extrusor de la impresora 3D.
- `public/products/*.svg`: ilustraciones placeholder de los diez modelos.
- `src/data/products.js`: catálogo real con precios y estados.
- No hay testimonios, ventas históricas, fotos de piezas terminadas ni dominio confirmado; nada de eso debe inventarse.

## Product Principles

1. El catálogo es el argumento: precios visibles y modelos reconocibles antes que cualquier discurso de marca.
2. Todo termina en una conversación real de WhatsApp, con el producto ya identificado.
3. Se muestra lo que existe: stock hoy, a pedido después, sin prometer diseño a medida.
4. Hecho en Junín de los Andes: la escala local y el retiro en mano son parte del valor.
5. El dueño puede mantenerlo solo: datos simples, fotos reemplazables.

## Accessibility & Inclusion

Contraste AA en texto y controles, foco visible, navegación por teclado y respeto por `prefers-reduced-motion`.
