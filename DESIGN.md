---
title: Faq3D — landing de impresión 3D
handle: faq3d-landing
version: 1
date: 2026-10-20
stack: React 19, Vite, Tailwind CSS 3, Bricolage Grotesque + Archivo
mode: persuade
---

# Faq3D · Nuevo estilo de página

## Dirección

La página es la vidriera de una juguetería de barrio en Junín de los Andes.
Por encima del vidrio, la faja del local con el logo y la navegación como letras
de cartel. Detrás del vidrio, papel caliente con las fichas colgadas: un póster
A3 con el titular del día y, desde la primera pantalla, el catálogo seguro como
estantes.

## Contraste entre estilos

- Antes: modo oscuro, tarjetas con brillo, hero de copy contra imagen.
- Ahora: papel caliente, vidrio verdoso, faja de tintas, fichas de papel con
  cinta y sello rojo. El catálogo está en la primera pantalla, no detrás de un hero.

### Puntos históricos del mundo visual

- La vidriera decide en el primer píxel qué se vende y a qué precio.
- El póster no es un bloque de texto: es el anuncio del día pegado al vidrio.
- Las fichas no son tarjetas grises uniformes: son stickers de papel con borde
  de tinta, sombra corta y sello según disponibilidad.

### Herramientas usadas

- Papel base: `#F2ECE0` (paper), tono de fondo y recuadros.
- Tinta: `#16130F` (ink), bordes, letras principales y faja del local.
- Marca: `#0088DD`/sky (brand-deep `#006BB0`) para botones principales y detalles.
- Stamp rojo: `#A62E1B` para sellos “EN STOCK”; sky para “A PEDIDO”.
- Vidrio: gradiente tenue y reflejo parcial en la ventana superior.

### Tipografía

- Display: Bricolage Grotesque (700–800), cargado e self-hosted.
- Texto: Archivo (400–700), self-hosted.
- Título principal y póster: Bricolage con tracción ajustada, peso extrabold.
- Lectura: Archivo con medida moderada.

### Formas

- Fichas: borde de tinta, radio 12–16px, ombre corta, cinta en la esquina.
- Sello: “[EN STOCK]” o “A PEDIDO” con rotación, dentro del recuadro.
- Faja del local: borde delgado, letras de cartel, separación generosa.
- Vidrio: bordes gruesos del marco, vidrio con reflejo tenue, zócalo al pie.
- Sin tarjetas de la misma medida, sin números de sección y sin gradientes en el
  texto. El título lleva su propio peso.

### Acción y movimiento

- Apertura difusa de las fichas, un momento por superficie, ease-out.
- Sin entrada idéntica en cada sección y sin brillo como decoración.

## Sustancias de decisión

### Contrastes obligatorios

- Texto y placeholder ≥ 4,5:1; texto grande ≥ 3:1.
- On surfaces color, tintar el secundario desde ese color o desde el primer plano;
  nunca gris puro.
- Sin halos de desplazamiento cero recortados; la sombra tiene desplazamiento y
  desenfoque suave.

### Tablas y espaciado

- Ajuste apretado dentro del grupo; separación generosa entre grupos; más espacio
  arriba del título que debajo.
- Títulos con salto de escala y peso evidente; tracking puedo bajar hasta -0.04em,
  pero -0.02 a -0.03em suele leer mejor.

### Tipografía y medida

- Medida de cuerpo 65–75ch; display hasta 6rem; relativo al viewport siempre que
  el copy lo solicite.
- Ejecutar el copy real en cada breakpoint y corregir lo que se sale.

### Estados y cobertura

- Hover, disabled, loading, error, empty; dispositivos, foco y contenido real.
- Sin dejar la navegación, el menú móvil, el FAB o el póster parcialmente dentro;
  revisar al tamaño de entrega, no solo en una captura.

### Copia, iconos y accesibilidad

- Cada control nombra su acción; los errores nombran el problema y la recuperación.
- Iconos trazados, misma pluma y peso; sin emojis ni glifos unicode como sistema.
- Imágenes con alt que describen lo que muestran, no lo que se supone que son.

### Apertura

- Un momento main autorizado; nothing decorative across many; exponential ease-out
  desde un default visible.
- No promesa con gradientes en el texto de énfasis; el peso y el tamaño dicen lo
  mismo.

## Áreas y controles de decisión

- Título y subtítulo del hero son texto del brief original, excepto el énfasis de
  “en 3D.” con la marca.
- Mensajes de WhatsApp son texto fijo del negocio; nodo telefónico y dominio son
  placeholders pendientes de confirmar.
- El catálogo cuelga del vidrio desde la primera pantalla; las fichas no son idénticas
  entre sí, pero comparten abdomen.

## Entrega y coordinación

- 1. Revisar relación de imagen del póster con el ratio de encimero.
- 2. Confirmar el marco del vidrio sobre la cabeza de los productos.
- 3. Revisar el NAV y el menú móvil; el botón de contacto de barra y FAB.
- 4. Confirmar las ratios de contraste trazados en `.noise`.
- 5. Opcionales después del primer envío: iconos auto ejecutables, perforaciones
  decorativas, juego de colores opcionales.
