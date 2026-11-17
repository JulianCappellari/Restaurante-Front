# Portada pública

La portada de Restaurante App prioriza explorar la carta. La reserva queda junto a la acción principal y vuelve a aparecer después de la explicación del servicio en el salón.

## Composición

En escritorio, el primer bloque reparte el espacio entre el título y una fotografía gastronómica. En móvil, el título y las acciones quedan encima de la imagen. Las categorías llevan al filtro correspondiente de la carta. El enlace «¿Ya estás en el salón?» lleva a las instrucciones de pedido por QR.

## Tipografía y color

- Bricolage Grotesque para títulos y marca al pie. Poppins para lectura y controles.
- Azul `#17336d` para la navegación y el primer bloque. Tinta `#16284e` para el texto.
- Amarillo `#ffdb71` para la acción principal y las reservas al pie.
- Papel `#f9f8f1` para la carta y salvia `#e4ebe0` para el pedido por QR.

## Movimiento

La portada usa GSAP y ScrollTrigger para acercar la fotografía con el desplazamiento, ordenar la entrada de las categorías y mostrar el progreso de lectura. En escritorio alto con puntero preciso, la escena del salón queda fija brevemente y el teléfono muestra las tres etapas reales del pedido. En pantallas chicas y táctiles se leen los pasos con desplazamiento continuo. Con movimiento reducido se muestra la versión estática completa. Los controles conservan foco visible y enlaces nativos.

## Imágenes

- `public/portada/milanesa-editorial.webp` es una imagen generada con ImageGen y rotulada como ilustrativa. La descripción de generación está junto al archivo.
- `public/Fondo-restaurante.avif` es un recurso del proyecto reutilizado como imagen decorativa.

## Recorrido del cliente

- La carta usa búsqueda insensible a los acentos, filtros seleccionables y promociones desplegables. Las fotos vienen del catálogo. Un plato sin foto muestra un marcador gráfico.
- Los formularios, el carrito y la cuenta usan superficies claras, controles de al menos 44 px para acciones principales y azul para la selección activa. En móvil, las secciones de cuenta permanecen accesibles desde su propia navegación.
- En la vista de mesa el encabezado azul identifica la mesa. Amarillo identifica la llamada al mozo y el botón del carrito permanece visible al pie cuando hay platos agregados.
- Los tokens que reutilizan componentes existentes se aplican dentro de `data-customer`. La marca de foco se adapta al fondo y los diálogos reducen movimiento cuando el sistema lo solicita.

## Pantallas del equipo

- Comparten navegación azul, títulos en Bricolage Grotesque y superficies claras para lectura prolongada. El tema se aplica dentro de `data-staff`. El encabezado muestra las áreas disponibles para el rol que ingresó.
- Cocina usa nombres, contadores e iconos además del color. Ámbar indica comandas recibidas, azul indica preparación y verde indica comandas listas.
- Salón usa ámbar para llamados y verde para platos listos. La bandeja aparece antes de las mesas y la comanda. Recepción abre con el acceso al QR y la agenda. Administración pone los indicadores antes de los módulos y ofrece accesos directos a las secciones.
- Los controles principales tienen foco visible. Las transiciones de la navegación y los accesos del equipo responden en 140 ms y se omiten con movimiento reducido.

## Confirmación y seguimiento en mesa

- La carta y los pedidos comparten el acceso visible al mozo. Cada pedido muestra sus platos y las etapas de cocina en orden. El paso actual usa texto en negrita y una marca visual.
- Los diálogos de plato y carrito se anclan abajo en celular y se centran en escritorio. El mensaje frente a un envío incierto ofrece reintentar el mismo pedido.
- La carta distingue entre un QR que requiere acción del comensal y una falla temporal que permite reintentar. La página 404 ofrece volver a inicio o explorar la carta.

## Compra online

- Carrito, pago y confirmación comparten un indicador textual de pasos. El pago muestra la dirección antes del medio y el total antes de confirmar.
- La confirmación presenta el número de pedido, dirección, medio elegido y total. Permanece visible y enlaza el historial y la carta.
- El diálogo de tarjeta se abre abajo en móvil. Los estados de error de dirección, tarjetas y confirmación ofrecen acciones en el mismo lugar donde se detectan.

## Mi cuenta

- La navegación muestra las seis secciones en dos filas en pantallas angostas y en una fila cuando hay espacio.
- Los pedidos muestran el estado y total antes del detalle desplegable. Los filtros cuentan todos, los que siguen en curso y el historial. Los cambios del canal de cliente actualizan los datos del historial.
- Las reservas agrupan las próximas visitas y el historial. Cambiar fecha o turno se hace en la misma ficha. Cancelar requiere una confirmación que identifica la reserva.

## Sistema de motion (cliente)

`src/components/motion/MotionProvider.tsx` anima cualquier página del cliente a partir de atributos. Se monta en el layout del cliente y en el de acceso. Las pantallas del equipo no lo usan, porque se recorren muchas veces por turno y necesitan respuesta inmediata.

| Atributo | Efecto | Recursos de GSAP |
| --- | --- | --- |
| `data-split` | Titular que entra por líneas con máscara | SplitText, `once` |
| `data-reveal` (`up`, `left`, `right`, `scale`, `fade`) | Aparición agrupada al entrar en pantalla | `ScrollTrigger.batch` |
| `data-reveal="clip"` | Imagen que se abre con clip-path al desplazarse | `scrub` |
| `data-stagger` | Hijos que entran en cascada | `stagger` |
| `data-parallax="0.12"` | Desplazamiento vertical relativo | `scrub` |
| `data-zoom` | Imagen que se acerca con el scroll | `scrub` |
| `data-scrub-words` | Párrafo que se enciende palabra por palabra | SplitText, `scrub` |
| `data-pin-steps` con `data-step`, `data-step-media`, `data-pin-stage` | Relato fijado con pasos e imágenes que cambian | `pin`, `snap`, `fastScrollEnd`, `onUpdate` |
| `data-hscroll` con `data-hscroll-track` y `data-hscroll-item` | Galería horizontal fijada con animaciones internas | `pin`, `containerAnimation` |

Además:
- La barra superior se vuelve translúcida al desplazarse (`ScrollTrigger.create` sin animación).
- Barra de progreso de lectura en todas las páginas del cliente salvo la portada, que tiene la suya.
- Transición entre páginas en `app/(dashboard)/template.tsx`: fundido y barra amarilla. Solo usa opacidad para no afectar elementos fijos.
- La carta usa GSAP Flip al cambiar de categoría.
- Lenis (`lenis`) da scroll suave fuera de la portada y se sincroniza con ScrollTrigger.
- Con movimiento reducido no se aplica ningún efecto. En táctil, pantallas angostas o bajas, las secciones fijadas pasan a contenido continuo o carril nativo.
- Un nodo solo se anima después de que React lo hidrató, para no alterar el HTML del servidor.

Recursos de ScrollTrigger en uso: scrub, pin, pinSpacing, anticipatePin, snap y snapDirectional, batch, matchMedia, containerAnimation, once, callbacks (onEnter, onToggle, onUpdate, onLeave), evento scrollEnd, invalidateOnRefresh, refreshPriority, sort y refresh, fastScrollEnd, inicio y fin calculados por función, y ScrollToPlugin. No se usan markers (solo depuración), ScrollSmoother (se superpone con Lenis), normalizeScroll ni scrollers distintos de la ventana.
