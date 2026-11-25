import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type {
  AccessibilityPreferences,
  DeletionRequest,
  NotificationPreferences,
} from '../types/domain';

export async function updateUserProfile(params: {
  userId: string;
  fullName: string;
  district: string;
  phone?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: params.fullName.trim(),
      district: params.district.trim(),
      phone: params.phone?.trim() || null,
    })
    .eq('id', params.userId);
  if (error) throw error;
}

export async function syncUserPreferences(params: {
  userId: string;
  accessibility?: AccessibilityPreferences;
  notifications?: NotificationPreferences;
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  const payload: Record<string, unknown> = { user_id: params.userId };
  if (params.accessibility) {
    payload.text_scale = params.accessibility.textScale;
    payload.high_contrast = params.accessibility.highContrast;
    payload.large_controls = params.accessibility.largeControls;
    payload.reduce_motion = params.accessibility.reduceMotion;
  }
  if (params.notifications) {
    payload.notify_report_updates = params.notifications.notifyReportUpdates;
    payload.notify_email_confirmations = params.notifications.notifyEmailConfirmations;
  }

  const { error } = await supabase.from('user_preferences').upsert(payload, {
    onConflict: 'user_id',
  });
  if (error) throw error;
}

export async function requestAccountDeactivation(): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado en .env');
  const { data, error } = await supabase.functions.invoke('account-lifecycle', {
    body: { action: 'deactivate' },
  });
  if (error || !data?.ok) {
    throw new Error(data?.error || error?.message || 'No se pudo desactivar la cuenta.');
  }
}

export async function requestAccountReactivation(): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado en .env');
  const { data, error } = await supabase.functions.invoke('account-lifecycle', {
    body: { action: 'reactivate' },
  });
  if (error || !data?.ok) {
    throw new Error(data?.error || error?.message || 'No se pudo reactivar la cuenta.');
  }
}

export async function requestScheduledDeletion(confirmationPhrase: string): Promise<{
  request: DeletionRequest;
  emailSent: boolean;
  graceDays: number;
  retentionMonths: number;
}> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado en .env');
  const { data, error } = await supabase.functions.invoke('account-lifecycle', {
    body: { action: 'request_deletion', confirmationPhrase },
  });
  if (error || !data?.ok) {
    throw new Error(
      data?.error ||
        error?.message ||
        'No se pudo programar la eliminación. Verifica que la función account-lifecycle esté desplegada.'
    );
  }
  return {
    request: data.request as DeletionRequest,
    emailSent: Boolean(data.emailSent),
    graceDays: Number(data.graceDays ?? 30),
    retentionMonths: Number(data.retentionMonths ?? 12),
  };
}

export async function cancelScheduledDeletion(): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase no configurado en .env');
  const { data, error } = await supabase.functions.invoke('account-lifecycle', {
    body: { action: 'cancel_deletion' },
  });
  if (error || !data?.ok) {
    throw new Error(data?.error || error?.message || 'No se pudo cancelar la solicitud.');
  }
}
