import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AppTextField } from '../../src/components/AppTextField';
import { AlertBanner, EmptyState, SkeletonCard } from '../../src/components/FeedbackStates';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { adminUpdateReportStatus, fetchAdminReports } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  getCategoryLabel,
  REPORT_STATUSES,
  type Report,
  type ReportStatus,
} from '../../src/types/domain';
import {
  adminStatusUpdateSchema,
  type AdminStatusUpdateValues,
} from '../../src/validation/schemas';

export default function AdminPanelScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reportId: initialReportId } = useLocalSearchParams<{ reportId?: string }>();
  const { colors, prefs } = useAccessibility();
  const { isAuthenticated, isAdmin } = useAuth();

  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'todos'>('todos');
  const [selectedId, setSelectedId] = useState<string | null>(initialReportId ?? null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; title: string; message: string } | null>(null);

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => fetchAdminReports({ status: statusFilter }),
    enabled: isAuthenticated && isAdmin,
  });

  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const selectedReport: Report | null =
    reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdminStatusUpdateValues>({
    resolver: zodResolver(adminStatusUpdateSchema),
    defaultValues: {
      status: selectedReport?.status ?? 'en_atencion',
      note: '',
    },
  });

  const chosenStatus = useWatch({ control, name: 'status' });

  const updateMutation = useMutation({
    mutationFn: (values: AdminStatusUpdateValues) => {
      if (!selectedReport) throw new Error('Selecciona un reporte primero.');
      return adminUpdateReportStatus({
        reportId: selectedReport.id,
        newStatus: values.status,
        note: values.note,
      });
    },
    onSuccess: async (updated) => {
      setFeedback({
        tone: 'success',
        title: 'Estado actualizado',
        message: `El reporte ${updated.tracking_code} cambió de estado y quedó registrado en el historial.`,
      });
      reset({ status: updated.status, note: '' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['public-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['report-detail', updated.id] }),
      ]);
    },
    onError: (err) => {
      const translated = translateAppError(err);
      setFeedback({ tone: 'error', title: translated.title, message: translated.message });
    },
  });

  if (!isAuthenticated || !isAdmin) {
    return (
      <AppScreen onBack={() => router.back()}>
        <AppText variant="title">Panel administrativo</AppText>
        <AlertBanner
          tone="error"
          title="Acceso restringido"
          message="Esta sección solo está disponible para cuentas autorizadas con rol de administrador en la base de datos. Todas las operaciones administrativas están protegidas en el servidor mediante RLS y funciones verificadas."
          actionLabel="Volver al inicio"
          onAction={() => router.replace('/(tabs)/home')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.headerRow}>
        <Shield size={24} color={colors.brandPrimary} />
        <AppText variant="title" style={styles.flexText}>
          Administración
        </AppText>
      </View>

      <AlertBanner
        tone="info"
        title="Seguimiento interno del proyecto"
        message="Esta consola permite actualizar estados y registrar observaciones en el historial para demostrar el flujo de seguimiento. No corresponde a una integración oficial municipal."
      />

      {feedback ? (
        <AlertBanner tone={feedback.tone} title={feedback.title} message={feedback.message} />
      ) : null}

      {/* Filtros por estado */}
      <View style={styles.chipsRow}>
        {([{ value: 'todos', label: 'Todos' }, ...REPORT_STATUSES] as const).map((item) => {
          const active = statusFilter === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setStatusFilter(item.value as ReportStatus | 'todos')}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.brandSoftBackground : colors.surface,
                  borderColor: active ? colors.brandPrimary : colors.borderNormal,
                  borderWidth: active || prefs.highContrast ? 2 : 1,
                },
              ]}
            >
              <AppText variant="note" color={active ? colors.brandPrimary : colors.textSecondary}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {reportsQuery.isLoading ? (
        <SkeletonCard lines={4} />
      ) : reportsQuery.isError ? (
        <AlertBanner
          tone="error"
          title={translateAppError(reportsQuery.error).title}
          message={translateAppError(reportsQuery.error).message}
          actionLabel="Reintentar"
          onAction={() => reportsQuery.refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="Sin reportes en este estado"
          description="Cambia el filtro para revisar otras incidencias."
        />
      ) : (
        <>
          <AppText variant="label">Selecciona un reporte ({reports.length})</AppText>
          <View style={styles.list}>
            {reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <Pressable
                  key={rep.id}
                  onPress={() => {
                    setSelectedId(rep.id);
                    setValue('status', rep.status);
                    setFeedback(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.reportOption,
                    {
                      backgroundColor: isSelected ? colors.brandSoftBackground : colors.surface,
                      borderColor: isSelected ? colors.brandPrimary : colors.borderNormal,
                      borderWidth: isSelected || prefs.highContrast ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <AppText variant="label" color={colors.brandPrimary}>
                      {rep.tracking_code}
                    </AppText>
                    <StatusBadge status={rep.status} />
                  </View>
                  <AppText variant="body">{getCategoryLabel(rep.category)}</AppText>
                  <AppText variant="note" color={colors.textSecondary} numberOfLines={2}>
                    {rep.address || rep.district || 'Sin dirección'} · {rep.description}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {selectedReport ? (
            <View
              style={[
                styles.editorCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderNormal,
                  borderWidth: prefs.highContrast ? 2 : 1,
                },
              ]}
            >
              <AppText variant="subtitle">
                Actualizar {selectedReport.tracking_code}
              </AppText>

              <AppText variant="label">Nuevo estado</AppText>
              <View style={styles.chipsRow}>
                {REPORT_STATUSES.map((st) => {
                  const selected = chosenStatus === st.value;
                  return (
                    <Pressable
                      key={st.value}
                      onPress={() => setValue('status', st.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.brandSoftBackground : colors.screenBackground,
                          borderColor: selected ? colors.brandPrimary : colors.borderNormal,
                          borderWidth: selected || prefs.highContrast ? 2 : 1,
                        },
                      ]}
                    >
                      <AppText
                        variant="note"
                        color={selected ? colors.brandPrimary : colors.textPrimary}
                      >
                        {selected ? '●' : '○'} {st.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppTextField
                    label="Observación para el historial"
                    required
                    multiline
                    placeholder="Ej. Cuadrilla asignada para evaluación de la vía."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.note?.message}
                  />
                )}
              />

              <AppButton
                label="Guardar cambio de estado"
                variant="primary"
                loading={updateMutation.isPending}
                onPress={handleSubmit((vals) => updateMutation.mutate(vals))}
              />
              <AppButton
                label="Ver detalle del reporte"
                variant="secondary"
                onPress={() => router.push(`/report/${selectedReport.id}`)}
              />
            </View>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flexText: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
  },
  list: {
    gap: SPACING.base,
  },
  reportOption: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.xs,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  editorCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.lg,
  },
});
