# VíaAlerta · Aplicación móvil de incidencias viales

Proyecto académico del curso **Interacción Hombre-Máquina**  
**Grupo:** 14 · **Sección:** 42920  
**Referencia visual:** Archivo Figma `IyQVCM1RBPAJj4KdAfyfQY` (páginas *Prototipo* y *Wireframes*).

---

## 1. Arquitectura y tecnologías

- **Mobile:** React Native `0.88.1`, Expo SDK `58`, TypeScript `6.0`, Expo Router.
- **Backend y persistencia:** Supabase (Auth, PostgreSQL con RLS, Storage privado `report-photos` y Edge Functions en Deno).
- **Datos y formularios:** TanStack Query v5, React Hook Form, Zod v4.
- **Dispositivo:** `expo-image-picker` (cámara y galería), `expo-location` (GPS y geocodificación inversa), `react-native-maps` (mapa interactivo real), `expo-secure-store` (sesión segura cifrada con particionamiento >2 KB), `@react-native-async-storage/async-storage` (preferencias de accesibilidad y borrador de reporte).
- **Tipografía e iconos:** Inter (`@expo-google-fonts/inter`) y `lucide-react-native`.

---

## 2. Compatibilidad: Expo Go vs. Development Build

- **Expo Go (Android e iOS):** Todas las dependencias seleccionadas (`expo-router`, `expo-image-picker`, `expo-location`, `expo-secure-store`, `react-native-maps`, `react-native-svg`) son módulos nativos incluidos en el ecosistema Expo SDK 58. Por tanto, el flujo principal puede probarse en **Expo Go** (en iOS usa Apple Maps; en Android requiere Google Play Services y en desarrollo puede requerir clave de Google Maps al compilar nativamente).
- **Development Build recomendado:** Para probar **enlaces profundos personalizados** (`viaalerta://auth/callback`, `viaalerta://auth/reset-password`, `viaalerta://account/delete-cancel`) y la configuración completa de mapas en Android, se recomienda compilar un Development Build con `npx expo prebuild` o EAS Build (`eas build --profile development`).

---

## 3. Instalación y configuración paso a paso

### 3.1. Instalar dependencias

```bash
npm install
```

### 3.2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa las claves **públicas** de tu proyecto Supabase (nunca incluyas `service_role` en el cliente ni publiques `.env` en Git):

```bash
cp .env.example .env
```

Variables requeridas en `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_SCHEME=viaalerta`

### 3.3. Aplicar migraciones SQL en Supabase

Ejecuta en el **SQL Editor** de Supabase (o mediante Supabase CLI `supabase db push`), en orden estricto:

1. `supabase/migrations/0001_initial_schema.sql` — Tablas (`profiles`, `user_roles`, `user_preferences`, `reports`, `report_photos`, `report_status_history`, `account_deletion_requests`, `email_dispatch_logs`), índices, triggers y generación automática de códigos `VA-YYYY-NNN`.
2. `supabase/migrations/0002_rls_and_storage.sql` — Políticas RLS, vista pública sin PII (`public.public_reports`), RPC protegido `admin_update_report_status` y bucket privado `report-photos`.

### 3.4. Configurar Supabase Auth (enlaces profundos)

En **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, agrega:
- `viaalerta://auth/callback`
- `viaalerta://auth/reset-password`
- `viaalerta://account/delete-cancel`

*(En Expo Go también puedes agregar la URL `exp://...` que muestre la terminal al ejecutar `npx expo start`.)*

### 3.5. Desplegar Edge Functions (opcional para correos y ciclo de cuenta, recomendado)

```bash
supabase functions deploy admin-update-report
supabase functions deploy get-photo-url
supabase functions deploy send-transactional-email
supabase functions deploy account-lifecycle
```

Secretos de servidor (solo en Supabase, **nunca** en la app móvil):

```bash
supabase secrets set RESEND_API_KEY=re_tu_api_key
supabase secrets set EMAIL_FROM="VíaAlerta <notificaciones@tudominio-verificado.pe>"
supabase secrets set APP_PUBLIC_URL="viaalerta://"
supabase secrets set CRON_SECRET="clave_aleatoria_segura"
```

> **Nota honesta sobre correos:** Si `RESEND_API_KEY` o un remitente verificado (no `.example`) no están configurados, la app **no** afirma que envió un correo transaccional de confirmación de reporte ni de eliminación; informa claramente que el registro se guardó y que el envío por correo requiere configurar el proveedor.

### 3.6. Ejecutar la aplicación (Android e iOS)

```bash
# Iniciar Metro / Expo Dev Server
npm start

# Abrir directamente en emulador Android
npm run android

# Abrir en simulador iOS (requiere macOS)
npm run ios
```

---

## 4. Procedimiento seguro para configurar un administrador

Los usuarios **no pueden** autoasignarse el rol `admin` desde la aplicación: la tabla `public.user_roles` no tiene políticas `INSERT`/`UPDATE`/`DELETE` para `authenticated`.

Para promover una cuenta real a administrador de forma segura:

1. Crea la cuenta normalmente desde la app (pantalla *Crear cuenta*).
2. En el **SQL Editor** de Supabase (con privilegios de servicio), ejecuta:

```sql
update public.user_roles
set role = 'admin', updated_at = now()
where user_id = (
  select id from auth.users where email = 'admin-correo@tudominio.pe'
);
```

3. Cierra sesión y vuelve a ingresar (o recarga la app). Aparecerá el acceso al **Panel de administración** en *Inicio* y *Perfil*. Toda actualización de estado es verificada nuevamente en el servidor mediante `public.is_admin(auth.uid())`.

---

## 5. Datos de demostración ficticios (separados de datos reales)

Para poblar incidencias de muestra en el mapa sin mezclarlas con cuentas reales, ejecuta opcionalmente:

```sql
-- Archivo: supabase/seed.demo.sql
```

Todos los registros de prueba llevan `is_demo = true`, prefijo `[DEMO]` y código `VA-DEMO-00x`, mostrándose claramente etiquetados como **Demo** en la interfaz. Nunca se precarga una sesión iniciada.

---

## 6. Verificación de accesibilidad y contraste

Se centralizaron los tokens en `src/theme/tokens.ts` en dos modos: **Claro** y **Alto contraste**, contrastados con las variables `--va-*` de Figma y comprobados matemáticamente mediante `src/theme/contrast.ts` y `__tests__/contrast.test.ts`:

| Combinación | Modo Claro | Modo Alto Contraste | Referencia WCAG 2.1 |
| :--- | :---: | :---: | :--- |
| Texto principal (`#172B45` / `#000000`) sobre fondo pantalla | **13.52:1** | **21.00:1** | AA (≥4.5) y AAA (≥7.0) |
| Texto secundario (`#596B80` / `#172B45`) sobre superficie blanca | **5.49:1** | **14.31:1** | AA (≥4.5) / AAA en HC |
| Botón principal (blanco sobre `#2463D4` / `#17489D`) | **5.51:1** | **8.88:1** | AA (≥4.5) / AAA en HC |
| Botón peligro (blanco sobre `#B42318` / `#911B12`) | **6.18:1** | **8.75:1** | AA (≥4.5) / AAA en HC |
| Borde de control (`#596B80` / `#000000`) sobre fondo pantalla | **5.05:1** | **21.00:1** | UI no textual (≥3.0) |

> No se declara cumplimiento total de WCAG 2.1 AA/AAA a nivel de auditoría manual con lectores de pantalla en dispositivo físico hasta completar pruebas en VoiceOver (iOS) y TalkBack (Android).

---

## 7. Estado de funcionalidades y validación

### Implementado
- Autenticación real con Supabase Auth (bienvenida, login, registro, recuperación, enlace profundo, cierre de sesión, sin sesión precargada).
- Exploración pública como invitado en el mapa sin exponer PII (`public.public_reports`), exigiendo cuenta para reportar.
- Creación completa de reporte con categoría, descripción, riesgo, cámara/galería (`expo-image-picker`), GPS o selección manual en mapa (`expo-location` + `react-native-maps`), revisión, envío real sin temporizadores simulados, protección contra duplicados (`client_submission_id`), persistencia de borrador y manejo de permisos rechazados.
- Consulta de *Mis reportes*, filtros, detalle con foto firmada e historial cronológico de estados (`Recibido`, `En revisión`, `En atención`, `Resuelto`).
- Vista administrativa protegida en cliente y servidor (RLS + Edge Function + RPC `admin_update_report_status`).
- Tres preferencias funcionales de accesibilidad persistidas (texto hasta 200 %, alto contraste, controles grandes 64 px) + respeto de movimiento reducido del sistema.
- Perfil, edición de perfil, cambio de contraseña, preferencias de notificaciones diferenciadas del servicio real y ayuda.
- Flujo completo de gestión y eliminación programada de cuenta (desactivación temporal, confirmación deliberada escribiendo `ELIMINAR`, periodo de gracia de 30 días, cancelación dentro del plazo y acción programada `process_due_deletions` con anonimización de reportes prevista por 12 meses).
- Plantillas de los 4 correos en HTML accesible y texto plano (`supabase/functions/_shared/email-templates.ts`).

### Pendiente de configuración externa / entorno
- Proveer credenciales reales de un proyecto Supabase en `.env` y ejecutar las migraciones SQL.
- Configurar `RESEND_API_KEY` + dominio remitente verificado y un cron externo (o `pg_cron`) que invoque `account-lifecycle` con `{ "action": "process_due_deletions" }` y cabecera `x-cron-secret`.
- Notificaciones push móviles nativas (FCM/APNs) no implementadas en el MVP (claramente indicado en la pantalla *Notificaciones*).

### Lo probado vs. no verificado en este entorno
- **Probado en entorno local de desarrollo:** Compilación TypeScript (`npm run typecheck`), análisis estático ESLint (`npm run lint`), pruebas unitarias Jest (`npm test`) para validaciones Zod, cálculo matemático de contraste y traductor de errores.
- **No verificado en este entorno (sin emulador Android/iOS ni credenciales Supabase activas):** Ejecución visual en dispositivo físico/emulador Android e iOS, cámara/GPS en hardware real, prueba end-to-end contra una instancia remota de Supabase y recorrido con VoiceOver/TalkBack.
