export type AppErrorKind =
  | 'network'
  | 'auth_invalid'
  | 'auth_expired'
  | 'email_unconfirmed'
  | 'already_registered'
  | 'permission_denied'
  | 'upload_failed'
  | 'not_configured'
  | 'validation'
  | 'unknown';

export interface FriendlyError {
  kind: AppErrorKind;
  title: string;
  message: string;
  actionLabel: string;
}

export function translateAppError(error: unknown): FriendlyError {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (error as { message?: string })?.message ?? 'Error inesperado';

  const lower = raw.toLowerCase();

  if (lower.includes('supabase no configurado') || lower.includes('placeholder.supabase.co')) {
    return {
      kind: 'not_configured',
      title: 'Falta configurar Supabase',
      message:
        'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env para conectar con la base de datos.',
      actionLabel: 'Revisar configuración',
    };
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout') ||
    lower.includes('network')
  ) {
    return {
      kind: 'network',
      title: 'Sin conexión a internet',
      message:
        'No pudimos comunicarnos con el servidor. Tus datos siguen guardados; verifica tu señal e inténtalo nuevamente.',
      actionLabel: 'Reintentar',
    };
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return {
      kind: 'auth_invalid',
      title: 'No pudimos iniciar sesión',
      message:
        'El correo o la contraseña no coinciden con una cuenta registrada. Verifica los datos o recupera tu acceso.',
      actionLabel: 'Intentar de nuevo',
    };
  }

  if (lower.includes('email not confirmed')) {
    return {
      kind: 'email_unconfirmed',
      title: 'Confirma tu correo electrónico',
      message:
        'Antes de ingresar, abre el enlace de verificación que enviamos a tu bandeja de entrada.',
      actionLabel: 'Entendido',
    };
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return {
      kind: 'already_registered',
      title: 'Correo ya registrado',
      message:
        'Ya existe una cuenta con ese correo electrónico. Inicia sesión o recupera tu contraseña.',
      actionLabel: 'Ir a iniciar sesión',
    };
  }

  if (lower.includes('jwt expired') || lower.includes('refresh token') || lower.includes('session')) {
    return {
      kind: 'auth_expired',
      title: 'Tu sesión ha vencido',
      message: 'Por seguridad, vuelve a iniciar sesión para continuar con esta operación.',
      actionLabel: 'Iniciar sesión',
    };
  }

  if (
    lower.includes('42501') ||
    lower.includes('no autorizado') ||
    lower.includes('row-level security') ||
    lower.includes('permission denied')
  ) {
    return {
      kind: 'permission_denied',
      title: 'Acceso restringido',
      message: 'No cuentas con permisos suficientes para realizar esta acción.',
      actionLabel: 'Volver',
    };
  }

  if (lower.includes('storage') || lower.includes('subir') || lower.includes('imagen')) {
    return {
      kind: 'upload_failed',
      title: 'No se pudo subir la fotografía',
      message:
        'Ocurrió un problema al guardar la imagen. Tu reporte sigue conservado; intenta reenviarlo o elige otra foto.',
      actionLabel: 'Reintentar subida',
    };
  }

  return {
    kind: 'unknown',
    title: 'Ocurrió un inconveniente',
    message: raw || 'No pudimos completar la operación. Inténtalo nuevamente en unos segundos.',
    actionLabel: 'Reintentar',
  };
}
