import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, SkeletonCard } from '../../src/components/FeedbackStates';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { RiskBadge, StatusBadge } from '../../src/components/StatusBadge';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { fetchReportDetail } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  getCategoryLabel,
  getStatusMeta,
  REPORT_STATUSES,
} from '../../src/types/domain';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, prefs } = useAccessibility();
  const { isAdmin } = useAuth();

  const detailQuery = useQuery({
    queryKey: ['report-detail', id],
    queryFn: () => fetchReportDetail(id!),
    enabled: Boolean(id),
  });

  if (detailQuery.isLoading) {
    return (
      <AppScreen onBack={() => router.back()}>
        <AppText variant="title">Detalle del reporte</AppText>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </AppScreen>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    const err = translateAppError(detailQuery.error);
    return (
      <AppScreen onBack={() => router.back()}>
        <AppText variant="title">Detalle del reporte</AppText>
        <AlertBanner
          tone="error"
          title={err.title}
          message={err.message}
          actionLabel="Reintentar"
          onAction={() => detailQuery.refetch()}
        />
      </AppScreen>
    );
  }

  const { report, history, photoUrl } = detailQuery.data;
  const currentStep = getStatusMeta(report.status).stepOrder;

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Detalle del reporte</AppText>
        <AppText variant="label" color={colors.brandPrimary}>
          {report.tracking_code}
          {report.is_demo ? ' · Dato ficticio de demostración' : ''}
        </AppText>
        <AppText variant="subtitle">{getCategoryLabel(report.category)}</AppText>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photo}
            accessibilityLabel="Fotografía de la incidencia vial"
          />
        ) : (
          <AppText variant="note" color={colors.textSecondary}>
            Sin fotografía disponible para este registro.
          </AppText>
        )}

        <AppText variant="body">
          {[report.address, report.district].filter(Boolean).join(' · ') || 'Ubicación registrada'}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {report.description}
        </AppText>

        <View style={styles.badges}>
          <StatusBadge status={report.status} />
          <RiskBadge risk={report.risk_level} />
        </View>

        <AppText variant="note" color={colors.textSecondary}>
          Registrado: {new Date(report.created_at).toLocaleString('es-PE')}
        </AppText>
      </View>

      <AppText variant="subtitle">Seguimiento</AppText>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        {REPORT_STATUSES.map((step) => {
          const reached = step.stepOrder <= currentStep;
          return (
            <View key={step.value} style={styles.stepRow}>
              <AppText
                variant={reached ? 'label' : 'body'}
                color={reached ? colors.brandPrimary : colors.textSecondary}
              >
                {reached ? '●' : '○'} {step.label}
              </AppText>
            </View>
          );
        })}
        <AppText variant="note" color={colors.textSecondary}>
          {getStatusMeta(report.status).description}
        </AppText>
      </View>

      <AppText variant="subtitle">Historial de cambios</AppText>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        {history.length === 0 ? (
          <AppText variant="note" color={colors.textSecondary}>
            Sin movimientos adicionales registrados.
          </AppText>
        ) : (
          history.map((item) => (
            <View
              key={item.id}
              style={[styles.historyItem, { borderBottomColor: colors.borderNormal }]}
            >
              <AppText variant="label" color={colors.brandPrimary}>
                {getStatusMeta(item.new_status).label}
              </AppText>
              {item.note ? <AppText variant="body">{item.note}</AppText> : null}
              <AppText variant="note" color={colors.textSecondary}>
                {new Date(item.created_at).toLocaleString('es-PE')}
              </AppText>
            </View>
          ))
        )}
      </View>

      <AppText variant="subtitle">Ubicación en el mapa</AppText>
      <InteractiveMap
        height={180}
        reports={[report]}
        selectedReportId={report.id}
      />

      {isAdmin ? (
        <AppButton
          label="Actualizar estado (Admin)"
          variant="primary"
          icon={<Shield size={18} color={colors.textOnAction} />}
          onPress={() => router.push({ pathname: '/admin', params: { reportId: report.id } })}
        />
      ) : null}

      <AppButton
        label="Volver a mis reportes"
        variant="secondary"
        onPress={() => router.replace('/(tabs)/reports')}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  photo: {
    width: '100%',
    height: 210,
    borderRadius: RADII.button,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  stepRow: {
    paddingVertical: 2,
  },
  historyItem: {
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    gap: 2,
  },
});
