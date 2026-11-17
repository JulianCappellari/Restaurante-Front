# Producto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Usuarios y tareas

Quien llega a la portada pública quiere conocer la carta y decidir si hace un pedido o reserva una mesa. El comensal que llega por QR abre la carta vinculada a su visita, personaliza pedidos y puede llamar al mozo.

## Propósito

Restaurante App permite explorar platos, hacer pedidos online y reservar. En el salón conecta los pedidos por QR y los tomados por el mozo con la misma cuenta de mesa y con cocina.

## Contenido y alcance

La portada pública usa español rioplatense. El nombre comercial disponible en el proyecto es Restaurante App. Dirección, teléfonos, horarios, calificaciones y testimonios de la portada original requieren confirmación antes de presentarlos como datos del restaurante.

## Servicio de punta a punta

Objetivo: cero esperas que no sean de cocina. El cliente no espera para pedir, para recibir ni para pagar; el mozo se dedica a atender.

### En la mesa (QR)
- **Marcha por tiempos.** El comensal elige "Todo junto" o "Por tiempos". Por tiempos, cocina recibe el primer tiempo y el resto queda en espera hasta que la mesa termina lo anterior; el comensal puede pedir "Traer lo siguiente". Las bebidas nunca esperan.
- **Pago desde la mesa.** Lo mío, partes iguales o toda la mesa, con propina y medio de pago. El pedido de cobro llega al mozo, que lo confirma en caja. Con la mesa servida y saldada, la mesa se cierra sola y recepción la ve libre.
- **Modo asistido.** Letra más grande y más contraste; el llamado al mozo llega con prioridad. Llamado con motivo: pedir, consulta, cuenta o ayuda.
- **Alergias por comensal.** La carta marca los platos no aptos y cocina recibe el aviso en rojo sobre el plato.
- **Carta viva.** Un plato se agota solo cuando falta stock para una porción. "Suele pedirse con" según los pedidos reales.
- **Tiempo estimado real** según la carga de cocina, y **opinión al momento** (me gustó / no me gustó) por plato servido.
- **Idioma.** Interfaz de la mesa en español o inglés (los nombres de los platos quedan como en la carta).

### Equipo
- **Mozo:** filtro "Mi sector", bandeja ordenada por urgencia (asistidos primero, platos que se enfrían), platos demorados, cobros para confirmar, vibración ante trabajo nuevo, "Marchar lo siguiente".
- **Cocina:** pantalla por estación, platos en espera con "Marchar ya", indicación de cuándo empezar cada plato para que la mesa salga junta, alerta de alergia, avance por mesa y preparación sugerida del día con faltantes de insumos.
- **Recepción:** salón en vivo por estado de cada mesa y lista de espera con estimación según la permanencia real y aviso por WhatsApp.
- **Administración:** pestaña Servicio con tiempos de punta a punta, mozos, platos (venta, tiempo de cocina, opinión, costo y margen), canales de venta, y edición de alérgenos, tiempos de preparación y sectores.
- **Cliente con sesión:** "Lo de siempre" en la carta.

### Límites actuales
- El cobro no procesa dinero online: queda pendiente hasta que el mozo lo confirma. Con credenciales de Mercado Pago, la confirmación puede llegar del proveedor.
- PedidosYa y Rappi figuran como canales de venta; recibir sus pedidos requiere sus integraciones y credenciales.
- El backend agrega al arrancar las columnas y tablas nuevas (`ensureServiceSchema`), sin borrar datos.

## Mesa mixta: pedir, cocinar y servir aunque algo cambie

### Una mesa, varios comensales, una cuenta
- Al escanear el QR, cada persona elige un nombre o apodo (sin crear cuenta). Quien pide con el mozo se suma desde el panel del mozo, que carga cada plato "para" esa persona.
- Cada plato queda a nombre de quien lo pidió; un plato compartido se divide en partes iguales (al centavo).
- En la pestaña Cuenta, cada comensal ve lo que consumió cada uno, qué está pagado y qué falta, y elige: pagar lo suyo, pagar por varios (marcándolos), partes iguales o toda la mesa. Puede pedir ayuda para cerrar.
- Un pago en curso reserva esas partes durante 10 minutos: nadie las paga dos veces. Si no se confirma, vuelven a quedar disponibles.
- El mozo ve la cuenta por comensal, cobra a uno, a varios o todo, y ve saldos a favor (por ejemplo, tras un cambio de plato más barato).

### Relevo al mozo
- El cliente elige el motivo (tomar el pedido, consulta, la cuenta, ayuda). El mozo ve la mesa, el motivo y lo ya confirmado; toca "Voy" y el cliente ve quién va a su mesa. Otro mozo no puede tomar el mismo aviso.

### Radar de demoras
- Mesa sentada que no pidió, llamado sin tomar, comanda sin empezar, plato demorado, plato listo sin retirar, cobro o cambio sin resolver. Cada aviso le llega al rol que puede actuar (salón o cocina); el encargado ve todo en Administración > Radar.

### Faltantes sin rehacer el pedido
- Cocina toca "Falta un ingrediente": se marcan todos los pedidos pendientes con ese plato, el plato se pausa en la carta y no se puede preparar. El mozo ofrece una alternativa del mismo tiempo con la diferencia de precio. Si el plato se pidió por QR, el cliente acepta o lo quita desde su celular; si fue con el mozo, confirma el mozo. Se ajustan precio, totales y stock; el resto del pedido sigue.

### Salón, retiro y delivery según la carga
- Antes de confirmar un pedido online, el cliente ve un rango de espera calculado con la carga de cada estación del turno.
- El encargado puede pausar los pedidos online o fijar cuántos pueden estar en cocina a la vez.

### Piloto y demo
- Administración > Servicio compara tres tiempos (llegada → primer pedido, plato listo → servido, llamado → atención) entre el período actual y el anterior, y entre mesas con QR y mesas con mozo. Una mesa cuenta como "con QR" si al menos un comensal pidió por QR.
- Demo de mesa mixta (solo en base de prueba o demo): `DB_NAME=restaurante_pruebas npm run demo:mesa` en el backend.
