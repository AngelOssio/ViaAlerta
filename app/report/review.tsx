import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, SkeletonCard } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useReportDraft } from '../../src/contexts/ReportDraftContext';
import { translateAppError, type FriendlyError } from '../../src/lib/errors';
import { submitReportWithPhoto } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';
import { getCategoryLabel, getRiskLabel } from '../../src/types/domain';

export default function ReviewReportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, prefs } = useAccessibility();
  const { user, profile, notificationPrefs } = useAuth();
  const { draft, resetDraft } = useReportDraft();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);

  const handleConfirmAndSend = async () => {
    if (!user) {
      router.replace('/auth/require-login');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitReportWithPhoto({
        userId: user.id,
        userName: profile?.full_name || user.email?.split('@')[0] || 'usuario',
        draft,
        sendEmailConfirmation: notificationPrefs.notifyEmailConfirmations,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['public-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
      ]);

      await resetDraft();

      router.replace({
        pathname: '/report/success',
        params: {
          reportId: result.report.id,
          trackingCode: result.report.tracking_code,
          category: result.report.category,
          address:
            result.report.address ||
            `${result.report.latitude.toFixed(5)}, ${result.report.longitude.toFixed(5)}`,
          emailSent: result.emailConfirmationSent ? '1' : '0',
        },
      });
    } catch (err) {
      setSubmitError(translateAppError(err));
      setSubmitting(false);
    }
  };

  // Pantalla "Enviando reporte" dura exactamente mientras se completa la operación real en Supabase
  if (submitting) {
    return (
      <AppScreen>
        <AppText variant="title">Enviando reporte</AppText>
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.brandSoftBackground,
              borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
              borderWidth: prefs.highContrast ? 2 : 0,
            },
          ]}
        >
          <UploadCloud size={30} color={colors.brandPrimary} />
          <AppText variant="subtitle">Estamos registrando tu incidencia</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Subiendo la fotografía y guardando tu reporte en el servidor. Espera un momento.
          </AppText>
        </View>
        <AppText variant="label" color={colors.textSecondary}>
          Preparando la confirmación…
        </AppText>
        <SkeletonCard lines={4} />
      </AppScreen>
    );
  }

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Revisar reporte</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Verifica la información antes de enviarla.
        </AppText>
      </View>

      {submitError ? (
        <AlertBanner
          tone="error"
          title={submitError.title}
          message={`${submitError.message} Tus datos siguen conservados y puedes reintentar sin duplicar el reporte.`}
          actionLabel="Reintentar envío"
          onAction={handleConfirmAndSend}
        />
      ) : null}

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <AppText variant="subtitle">{getCategoryLabel(draft.category)}</AppText>

        {draft.photoUri ? (
          <View style={styles.photoWrap}>
            <Image
              source={{ uri: draft.photoUri }}
              style={styles.photo}
              accessibilityLabel="Fotografía adjunta al reporte"
            />
            <AppText variant="label" color={colors.brandPrimary}>
              Fotografía adjunta · {draft.photoFileName || 'imagen.jpg'}
            </AppText>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <AppText variant="label">Ubicación</AppText>
          <AppText variant="body">
            {[draft.address, draft.district].filter(Boolean).join(', ') || 'Ubicación marcada en el mapa'}
          </AppText>
          {draft.latitude !== null && draft.longitude !== null ? (
            <AppText variant="note" color={colors.textSecondary}>
              {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
            </AppText>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <AppText variant="label">Descripción</AppText>
          <AppText variant="body">{draft.description}</AppText>
        </View>

        <AppText variant="label" color={colors.statusWarning}>
          Riesgo percibido: {getRiskLabel(draft.riskLevel)}
        </AppText>
      </View>

      <AppButton
        label="Editar información"
        variant="secondary"
        onPress={() => router.back()}
      />

      <AppButton
        label="Cambiar ubicación"
        variant="secondary"
        onPress={() => router.push('/report/location')}
      />

      <AppText variant="note" color={colors.textSecondary}>
        Al enviarlo, se registrará con el estado Recibido.
      </AppText>

      <AppButton
        label="Confirmar y enviar"
        variant="primary"
        onPress={handleConfirmAndSend}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  progressCard: {
    borderRadius: RADII.card,
    padding: SPACING.xl,
    gap: SPACING.base,
  },
  summaryCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  photoWrap: {
    gap: SPACING.md,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: RADII.button,
  },
  fieldGroup: {
    gap: 2,
  },
});
