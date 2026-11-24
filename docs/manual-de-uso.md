# GanaderApp — Manual de uso

Guía para el productor y su gente. Está escrita para leerse en el teléfono.

**Dirección:** https://ganaderia-web.187.127.19.244.sslip.io

## Primer día: dejar el sistema en marcha

1. **Entrá** con el email y la contraseña que te dio el administrador.
2. En la pantalla de **Inicio** vas a ver la tarjeta **Primeros pasos**. Seguila en orden:
   - **Cargá tu primer insumo** (Stock → Producto): vacunas, semen o insumos generales.
     Poné el **mínimo**: cuando el stock baje de ahí, el sistema te avisa.
   - **Registrá tu primer animal** (Animales → Registrar): con la caravana alcanza.
   - **Completá la primera fase**: abrí la ficha del animal y tocá *Completar fase 1*.
   - **Sumá a tu gente** (Equipo → Sumar persona): cada uno entra con su propio usuario.
3. Cuando termines, la tarjeta de primeros pasos desaparece sola.

## El día a día

### Registrar trabajo en el campo
1. **Animales** → buscá por caravana o nombre.
2. Abrí la ficha: ves las **7 fases** del ciclo y cuál toca ahora.
3. Tocá **Completar fase**: queda registrada con fecha y con quién la hizo.
4. Si la fase usa semen de un lote, activá **Consumir dosis de un lote** y elegí el lote.
   El sistema descuenta la dosis del lote y del stock en el mismo movimiento.

### Sin señal en el potrero
- La app abre igual, sin internet.
- Lo que registres queda **guardado en el teléfono** y aparece en el aviso de la parte
  de arriba ("N registros en el teléfono").
- Cuando vuelve la señal se envían solos. También podés tocar **Enviar ahora**.
- Si el servidor rechaza un registro, te dice el motivo (por ejemplo, que la fase ya
  estaba completa). Nada se pierde en silencio.

### Stock
- Tocá un producto para abrir su detalle: **sumar stock**, cambiar el **mínimo** o el
  **unidad**, o **dar de baja** el producto.
- Los productos con cantidad igual o menor al mínimo aparecen en **rojo**.
- **Lotes de semen**: botón **Lote**, elegís el insumo de semen, el código, las dosis y
  el vencimiento.

### Compras y pagos
- **Stock → Compra**: descripción, monto, proveedor, insumo y cantidad, vencimiento.
  Con insumo y cantidad, el sistema calcula el costo unitario para la valorización.
- **Compras** (desde Inicio): ves cada compra con su saldo y podés **registrar pagos**
  parciales o el total.

### Alertas
La pestaña **Alertas** muestra, en rojo, lo que requiere acción hoy:
stock bajo el mínimo y lotes vencidos. En dorado, los avisos (lotes con pocas dosis).

### Reportes
- Elegí el rango de fechas y ves: fases completadas, movimientos y unidades consumidas,
  compras (total, pagado, pendiente), animales por fase y alertas.
- **Descargar compras** y **Descargar consumos** generan un archivo que abre en Excel.

### Equipo y contraseñas
- **Equipo**: sumar personas con su rol (Encargado, Operario, Veterinario), dar de baja,
  y cambiar tu contraseña.
- Si alguien olvida su contraseña, un **dueño o encargado** le fija una nueva desde la
  lista de personas.

## Roles

| Rol | Para quién | Puede |
|---|---|---|
| Dueño | El productor | Todo, incluido el equipo |
| Encargado | Capataz / administrador del campo | Cargar y supervisar trabajo, gestionar equipo |
| Operario | Personal de campo | Registrar animales, fases y consumos |
| Veterinario | Profesional sanitario | Consultar y registrar sanidad |

## Preguntas frecuentes

**Me equivoqué en la caravana.** Abrí la ficha del animal → **Editar** → corregí → Guardar.
El historial de fases se mantiene.

**Di de baja un animal por error.** Deja de aparecer en la lista pero su historial existe.
Pedí al administrador que lo reactive desde la base.

**No puedo completar una fase.** Suele ser stock insuficiente del insumo que pide la
fase; cargá stock o revisá que el insumo exista.

**Se me olvidó la contraseña.** Pedile a un dueño o encargado que te fije una nueva.

**¿Puedo usar la app en dos teléfonos?** Sí, con el mismo usuario. Lo que se registra en
uno aparece en el otro al sincronizar.
