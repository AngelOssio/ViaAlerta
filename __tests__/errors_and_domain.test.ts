import { translateAppError } from '../src/lib/errors';
import { getCategoryLabel, getRiskLabel, getStatusMeta } from '../src/types/domain';

describe('Traductor de errores y metadatos de dominio', () => {
  test('traduce errores críticos a mensajes comprensibles en español', () => {
    expect(translateAppError(new Error('Network request failed')).kind).toBe('network');
    expect(translateAppError(new Error('Invalid login credentials')).kind).toBe('auth_invalid');
    expect(translateAppError(new Error('JWT expired')).kind).toBe('auth_expired');
    expect(translateAppError(new Error('permission denied for table reports (42501)')).kind).toBe(
      'permission_denied'
    );
    expect(translateAppError(new Error('Error al subir imagen en storage')).kind).toBe(
      'upload_failed'
    );
    expect(translateAppError(new Error('Supabase no configurado en .env')).kind).toBe(
      'not_configured'
    );
  });

  test('resuelve etiquetas de categoría, riesgo y estado', () => {
    expect(getCategoryLabel('hueco')).toBe('Hueco en la pista');
    expect(getCategoryLabel('vereda')).toBe('Vereda deteriorada');
    expect(getRiskLabel('alto')).toBe('Alto');
    expect(getStatusMeta('recibido').label).toBe('Recibido');
    expect(getStatusMeta('en_atencion').label).toBe('En atención');
    expect(getStatusMeta('resuelto').label).toBe('Resuelto');
  });
});
