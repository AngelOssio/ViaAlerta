import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { syncUserPreferences } from '../../src/services/account';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { user, notificationPrefs, refreshAccountData } = useAuth();

  const [reportUpdates, setReportUpdates] = useState(notificationPrefs.notifyReportUpdates);
  const [emailConfirmations, setEmailConfirmations] = useState(
    notificationPrefs.notifyEmailConfirmations
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setFeedback(null);
    try {
      await syncUserPreferences({
        userId: user.id,
        notifications: {
          notifyReportUpdates: reportUpdates,
          notifyEmailConfirmations: emailConfirmations,
        },
      });
      await refreshAccountData();
      setFeedback({
        tone: 'success',
        message: 'Tus preferencias se guardaron en tu cuenta.',
      });
    } catch (err) {
      setFeedback({
        tone: 'error',
        message: translateAppError(err).message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Notificaciones</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Administra tus preferencias de avisos.
      </AppText>

      {feedback ? (
        <AlertBanner
          tone={feedback.tone}
          title={feedback.tone === 'success' ? 'Preferencias guardadas' : 'No se pudo guardar'}
          message={feedback.message}
        />
      ) : null}

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
        <View style={styles.switchRow}>
          <View style={styles.flexText}>
            <AppText variant="label">Confirmaciones por correo</AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Solicita una confirmación por correo al registrar un reporte.
            </AppText>
          </View>
          <Switch
            value={emailConfirmations}
            onValueChange={setEmailConfirmations}
            accessibilityLabel="Confirmaciones por correo"
            trackColor={{ false: colors.actionDisabled, true: colors.brandPrimary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderNormal }]} />

        <View style={styles.switchRow}>
          <View style={styles.flexText}>
            <AppText variant="label">Preferencia de avisos de cambio de estado</AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Consulta el estado de tus incidencias en Mis reportes.
            </AppText>
          </View>
          <Switch
            value={reportUpdates}
            onValueChange={setReportUpdates}
            accessibilityLabel="Preferencia de avisos de cambio de estado"
            trackColor={{ false: colors.actionDisabled, true: colors.brandPrimary }}
          />
        </View>
      </View>

      <AppButton
        label="Guardar preferencias"
        variant="primary"
        loading={saving}
        onPress={handleSave}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  flexText: {
    flex: 1,
    gap: SPACING.xs,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
