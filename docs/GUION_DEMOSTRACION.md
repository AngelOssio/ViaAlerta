# Guion de demostración · VíaAlerta

**Duración estimada:** 5–7 minutos  
**Prerrequisitos:** Archivo `.env` conectado a Supabase, migraciones `0001` y `0002` aplicadas, y un segundo usuario promovido a rol `admin` según la sección 4 del `README.md`.

---

## Parte 1 · Exploración inicial y creación de cuenta (1 min)
1. Abrir **VíaAlerta** recién instalada. Verificar que inicia en **Bienvenida** sin ninguna cuenta precargada.
2. Tocar **Explorar mapa sin iniciar sesión**: mostrar las incidencias públicas cargadas desde PostgreSQL (sin correos ni datos personales).
3. Tocar **+ Reportar problema**: verificar que la app protege la acción y redirige a **Inicia sesión para reportar**.
4. Tocar **Crear una cuenta**, completar nombre, correo real y contraseña (≥ 8 caracteres), y enviar. Confirmar el correo si la verificación por email está activa e ingresar.

## Parte 2 · Registrar incidencia con foto y ubicación (2 min)
1. En **Inicio**, tocar **+ Reportar problema**.
2. Elegir categoría **Hueco** y escribir una descripción real (≥ 10 caracteres).
3. En **Fotografía**, tocar **Tomar foto** (o **Elegir de galería**; si se niega cámara, demostrar que ofrece galería).
4. En **Ubicación**, tocar **Usar mi ubicación actual** (si se niega el GPS, tocar **Seleccionar en el mapa** y colocar el marcador manualmente).
5. Seleccionar riesgo **Alto** y tocar **Revisar reporte**.
6. Verificar los datos en **Revisar reporte** y tocar **Confirmar y enviar**.
7. Observar la pantalla **Enviando reporte** mientras se sube la imagen al bucket privado `report-photos` y se guarda el registro.
8. En **Reporte registrado**, verificar el código real generado (`VA-2026-001`) y tocar **Ver seguimiento**.

## Parte 3 · Persistencia real (30 s)
1. Cerrar completamente la aplicación (forzar cierre desde el selector de apps).
2. Volver a abrir **VíaAlerta**: comprobar que la sesión persiste de forma segura (`SecureStore`).
3. Ir a la pestaña **Reportes** y abrir el reporte creado para verificar que permanece guardado con su fotografía y ubicación.

## Parte 4 · Cambio de estado como administrador (1 min)
1. Ir a **Perfil → Cerrar sesión** e ingresar con la cuenta autorizada con rol `admin`.
2. Abrir **Panel de administración** (desde *Inicio* o *Perfil*).
3. Filtrar por **Recibido**, seleccionar el reporte recién creado, cambiar el estado a **En atención** (o **Resuelto**) y escribir una observación (ej. *"Cuadrilla asignada para reparación de pista"*).
4. Guardar y verificar la confirmación de actualización.

## Parte 5 · Consulta del seguimiento y accesibilidad (1 min)
1. Volver a ingresar con la cuenta ciudadana, abrir **Reportes → Detalle del reporte** y mostrar el nuevo estado reflejado junto con la observación en el **Historial de cambios**.
2. Ir a **Perfil → Configuración → Accesibilidad**: activar **Texto al 200 %**, **Alto contraste** y **Controles grandes (64 px)**, comprobar la vista previa en vivo y navegar por *Inicio* y *Reportes* verificando que no hay recortes ni superposiciones.
