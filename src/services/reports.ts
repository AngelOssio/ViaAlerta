import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  getCategoryLabel,
  getStatusMeta,
  type PublicReport,
  type Report,
  type ReportCategory,
  type ReportDraft,
  type ReportStatus,
  type ReportStatusHistoryItem,
} from '../types/domain';

export interface ReportFilter {
  category?: ReportCategory | 'todas';
  status?: ReportStatus | 'todos' | 'activos';
  search?: string;
}

export interface CreatedReportResult {
  report: Report;
  photoUploaded: boolean;
  emailConfirmationSent: boolean;
}

export async function fetchPublicReports(filter?: ReportFilter): Promise<PublicReport[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  let query = supabase
    .from('public_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filter?.category && filter.category !== 'todas') {
    query = query.eq('category', filter.category);
  }
  if (filter?.status && filter.status !== 'todos') {
    if (filter.status === 'activos') {
      query = query.neq('status', 'resuelto');
    } else {
      query = query.eq('status', filter.status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  let list = (data ?? []) as PublicReport[];
  if (filter?.search && filter.search.trim().length > 0) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        (item.address ?? '').toLowerCase().includes(q) ||
        (item.district ?? '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tracking_code.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function fetchMyReports(userId: string, filter?: ReportFilter): Promise<Report[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  let query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filter?.category && filter.category !== 'todas') {
    query = query.eq('category', filter.category);
  }
  if (filter?.status && filter.status !== 'todos') {
    if (filter.status === 'activos') {
      query = query.neq('status', 'resuelto');
    } else {
      query = query.eq('status', filter.status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function fetchAdminReports(filter?: ReportFilter): Promise<Report[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filter?.status && filter.status !== 'todos') {
    if (filter.status === 'activos') {
      query = query.neq('status', 'resuelto');
    } else {
      query = query.eq('status', filter.status);
    }
  }
  if (filter?.category && filter.category !== 'todas') {
    query = query.eq('category', filter.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function fetchReportDetail(reportId: string): Promise<{
  report: PublicReport;
  history: ReportStatusHistoryItem[];
  photoUrl: string | null;
}> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  const [reportRes, historyRes] = await Promise.all([
    supabase.from('public_reports').select('*').eq('id', reportId).single(),
    supabase
      .from('report_status_history')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false }),
  ]);

  if (reportRes.error) throw reportRes.error;
  const report = reportRes.data as PublicReport;
  const history = (historyRes.data ?? []) as ReportStatusHistoryItem[];

  let photoUrl: string | null = null;
  if (report.primary_photo_path) {
    // 1. Intento directo si el usuario autenticado tiene permiso (propietario o admin)
    const directSigned = await supabase.storage
      .from('report-photos')
      .createSignedUrl(report.primary_photo_path, 3600);
    if (!directSigned.error && directSigned.data?.signedUrl) {
      photoUrl = directSigned.data.signedUrl;
    } else {
      // 2. Fallback seguro mediante Edge Function para exploración pública
      const { data: fnData } = await supabase.functions.invoke('get-photo-url', {
        body: { reportId },
      });
      photoUrl = fnData?.signedUrl ?? null;
    }
  }

  return { report, history, photoUrl };
}

/**
 * Envía un reporte de forma idempotente (usa client_submission_id para evitar duplicados al reintentar),
 * sube la fotografía al bucket privado report-photos y solicita correo de confirmación real si está configurado.
 */
export async function submitReportWithPhoto(params: {
  userId: string;
  userName: string;
  draft: ReportDraft;
  sendEmailConfirmation: boolean;
}): Promise<CreatedReportResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  const { userId, userName, draft, sendEmailConfirmation } = params;
  if (!draft.photoUri) {
    throw new Error('Debes adjuntar una fotografía antes de enviar el reporte.');
  }
  if (draft.latitude === null || draft.longitude === null) {
    throw new Error('Debes seleccionar una ubicación antes de enviar el reporte.');
  }

  // 1. Verificar si ya existe un reporte con este client_submission_id (protege contra reintentos duplicados)
  const { data: existingReport } = await supabase
    .from('reports')
    .select('*')
    .eq('client_submission_id', draft.clientSubmissionId)
    .maybeSingle();

  let report: Report;
  if (existingReport) {
    report = existingReport as Report;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        client_submission_id: draft.clientSubmissionId,
        category: draft.category,
        description: draft.description.trim(),
        risk_level: draft.riskLevel,
        status: 'recibido',
        latitude: draft.latitude,
        longitude: draft.longitude,
        address: draft.address.trim() || null,
        district: draft.district.trim() || 'Chaclacayo, Lima',
        is_demo: false,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;
    report = inserted as Report;
  }

  // 2. Subir fotografía si aún no tiene registro en report_photos
  const { data: existingPhoto } = await supabase
    .from('report_photos')
    .select('id')
    .eq('report_id', report.id)
    .maybeSingle();

  let photoUploaded = Boolean(existingPhoto);

  if (!photoUploaded) {
    const mimeType = draft.photoMimeType || 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `${userId}/${report.id}.${ext}`;

    const response = await fetch(draft.photoUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    }

    const { error: metaError } = await supabase.from('report_photos').insert({
      report_id: report.id,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: arrayBuffer.byteLength || null,
      uploaded_by: userId,
    });

    if (metaError && !metaError.message.toLowerCase().includes('duplicate')) {
      throw metaError;
    }
    photoUploaded = true;
  }

  // 3. Intentar correo transaccional de confirmación (nunca finge envío si no está configurado)
  let emailConfirmationSent = false;
  if (sendEmailConfirmation) {
    try {
      const { data: emailRes } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          template: 'report_registered',
          payload: {
            userName,
            trackingCode: report.tracking_code,
            categoryLabel: getCategoryLabel(report.category),
            address: report.address || `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`,
            statusLabel: getStatusMeta(report.status).label,
            actionUrl: `viaalerta://report/${report.id}`,
          },
        },
      });
      emailConfirmationSent = Boolean(emailRes?.sent);
    } catch {
      emailConfirmationSent = false;
    }
  }

  return {
    report,
    photoUploaded,
    emailConfirmationSent,
  };
}

/**
 * Actualización administrativa protegida en el servidor.
 * Intenta Edge Function `admin-update-report` y, si no está desplegada, usa la función RPC
 * `admin_update_report_status` que también valida `is_admin(auth.uid())` en PostgreSQL.
 */
export async function adminUpdateReportStatus(params: {
  reportId: string;
  newStatus: ReportStatus;
  note: string;
}): Promise<Report> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado en .env');
  }

  const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-update-report', {
    body: {
      reportId: params.reportId,
      newStatus: params.newStatus,
      note: params.note,
    },
  });

  if (!fnError && fnData?.report) {
    return fnData.report as Report;
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_report_status', {
    p_report_id: params.reportId,
    p_new_status: params.newStatus,
    p_note: params.note,
  });

  if (rpcError) throw rpcError;
  return rpcData as Report;
}
