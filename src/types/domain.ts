export type UserRole = 'ciudadano' | 'admin';
export type AccountStatus = 'active' | 'deactivated' | 'pending_deletion' | 'deleted';
export type ReportCategory = 'hueco' | 'vereda' | 'senalizacion' | 'buzon';
export type ReportRisk = 'bajo' | 'medio' | 'alto';
export type ReportStatus = 'recibido' | 'en_revision' | 'en_atencion' | 'resuelto';
export type DeletionRequestStatus = 'pending' | 'cancelled' | 'completed';

export interface Profile {
  id: string;
  full_name: string;
  district: string;
  phone: string | null;
  account_status: AccountStatus;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessibilityPreferences {
  textScale: 1 | 1.25 | 1.5 | 2;
  highContrast: boolean;
  largeControls: boolean;
  reduceMotion: boolean;
}

export interface NotificationPreferences {
  notifyReportUpdates: boolean;
  notifyEmailConfirmations: boolean;
}

export interface PublicReport {
  id: string;
  tracking_code: string;
  category: ReportCategory;
  description: string;
  risk_level: ReportRisk;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  district: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  primary_photo_path?: string | null;
}

export interface Report extends PublicReport {
  user_id: string | null;
  client_submission_id: string | null;
  anonymized_at: string | null;
  anonymized_retention_until: string | null;
}

export interface ReportStatusHistoryItem {
  id: string;
  new_status: ReportStatus;
  note: string | null;
  created_at: string;
}

export interface DeletionRequest {
  id: string;
  user_id: string;
  status: DeletionRequestStatus;
  requested_at: string;
  scheduled_for: string;
  cancelled_at: string | null;
  completed_at: string | null;
  confirmation_email_sent_at: string | null;
}

export interface ReportDraft {
  clientSubmissionId: string;
  category: ReportCategory;
  description: string;
  riskLevel: ReportRisk;
  photoUri: string | null;
  photoFileName: string | null;
  photoMimeType: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string;
  district: string;
  updatedAt: string;
}

export const REPORT_CATEGORIES: {
  value: ReportCategory;
  shortLabel: string;
  label: string;
}[] = [
  { value: 'hueco', shortLabel: 'Hueco', label: 'Hueco en la pista' },
  { value: 'vereda', shortLabel: 'Vereda', label: 'Vereda deteriorada' },
  { value: 'senalizacion', shortLabel: 'Señal', label: 'Señalización dañada' },
  { value: 'buzon', shortLabel: 'Buzón', label: 'Buzón sin tapa' },
];

export const REPORT_RISKS: {
  value: ReportRisk;
  label: string;
}[] = [
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

export const REPORT_STATUSES: {
  value: ReportStatus;
  label: string;
  description: string;
  stepOrder: number;
}[] = [
  {
    value: 'recibido',
    label: 'Recibido',
    description: 'Registrado y pendiente de evaluación.',
    stepOrder: 0,
  },
  {
    value: 'en_revision',
    label: 'En revisión',
    description: 'Se está evaluando la información y ubicación.',
    stepOrder: 1,
  },
  {
    value: 'en_atencion',
    label: 'En atención',
    description: 'Incidencia en curso de atención y seguimiento.',
    stepOrder: 2,
  },
  {
    value: 'resuelto',
    label: 'Resuelto',
    description: 'Atención finalizada.',
    stepOrder: 3,
  },
];

export function getCategoryLabel(category: ReportCategory): string {
  return REPORT_CATEGORIES.find((c) => c.value === category)?.label ?? 'Incidencia vial';
}

export function getRiskLabel(risk: ReportRisk): string {
  return REPORT_RISKS.find((r) => r.value === risk)?.label ?? 'Medio';
}

export function getStatusMeta(status: ReportStatus) {
  return (
    REPORT_STATUSES.find((s) => s.value === status) ?? {
      value: 'recibido' as const,
      label: 'Recibido',
      description: 'Registrado y pendiente de evaluación.',
      stepOrder: 0,
    }
  );
}

export const DEFAULT_COORDS = {
  latitude: -11.9765,
  longitude: -76.7689,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};
