-- VíaAlerta · Datos de demostración FICTICIOS (separados de datos reales)
-- Todos los registros tienen is_demo = true y no pertenecen a cuentas reales.
-- Ejecutar solo en entornos de prueba/demostración académica.

insert into public.reports (
  tracking_code,
  user_id,
  category,
  description,
  risk_level,
  status,
  latitude,
  longitude,
  address,
  district,
  is_demo
) values
(
  'VA-DEMO-001',
  null,
  'hueco',
  '[DEMO] Hueco profundo frente al paradero que dificulta el paso de vehículos y genera frenadas bruscas.',
  'alto',
  'recibido',
  -11.976500,
  -76.768900,
  'Av. Nicolás Ayllón cuadra 4',
  'Chaclacayo, Lima',
  true
),
(
  'VA-DEMO-002',
  null,
  'vereda',
  '[DEMO] Vereda fracturada con losas levantadas junto al cruce peatonal; dificulta el tránsito con silla de ruedas.',
  'medio',
  'en_atencion',
  -11.978100,
  -76.765200,
  'Calle Los Pinos 215',
  'Chaclacayo, Lima',
  true
),
(
  'VA-DEMO-003',
  null,
  'senalizacion',
  '[DEMO] Señal de cruce escolar inclinada y parcialmente oculta por ramas tras la última lluvia.',
  'bajo',
  'resuelto',
  -11.974900,
  -76.771400,
  'Av. Los Girasoles 108',
  'Chaclacayo, Lima',
  true
)
on conflict (tracking_code) do nothing;
