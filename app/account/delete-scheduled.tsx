import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { cancelScheduledDeletion } from '../../src/services/account';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function DeleteScheduledScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { pendingDeletion, refreshAccountData, signOut } = useAuth();
  const params = useLocalSearchParams<{ scheduledFor?: string; emailSent?: string }>();

  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scheduledDateIso = params.scheduledFor || pendingDeletion?.scheduled_for;
  const formattedDate = scheduledDateIso
    ? new Date(scheduledDateIso).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'en 30 días';

  const emailConfirmed =
    params.emailSent === '1' || Boolean(pendingDeletion?.confirmation_email_sent_at);

  const handleCancel = async () => {
    setCancelling(true);
    setErrorMsg(null);
    try {
      await cancelScheduledDeletion();
      await refreshAccountData();
      setCancelled(true);
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    } finally {
      setCancelling(false);
    }
  };

  if (cancelled) {
    return (
      <AppScreen>
        <AppText variant="title">Solicitud cancelada</AppText>
        <AlertBanner
          tone="success"
          title="Tu cuenta sigue activa"
          message="Cancelamos tu solicitud de eliminación. Tus datos y reportes continúan disponibles normalmente."
        />
        <AppButton
          label="Volver al inicio"
          variant="primary"
          onPress={() => router.replace('/(tabs)/home')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen onBack={() => router.replace('/(tabs)/home')}>
      <AppText variant="title">Eliminación programada</AppText>

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
        <AppText variant="subtitle" color={colors.brandPrimary}>
          30 días para cambiar de decisión
        </AppText>
        <AppText variant="body">
          Fecha programada: {formattedDate}. Al finalizar el plazo se ejecutará la anonimización de
          reportes (conservación prevista de 12 meses) y la eliminación definitiva de tu cuenta.
        </AppText>
        <AppText variant="note" color={colors.textSecondary}>
          {emailConfirmed
            ? 'Enviamos un correo electrónico con el comprobante y el enlace de cancelación.'
            : 'La solicitud quedó registrada en el servidor. (El envío del correo de comprobación requiere configurar Resend en Supabase).'}
        </AppText>
      </View>

      {errorMsg ? (
        <AlertBanner tone="error" title="No pudimos cancelar" message={errorMsg} />
      ) : null}

      <View style={styles.actions}>
        <AppButton
          label="Cancelar la eliminación"
          variant="primary"
          loading={cancelling}
          onPress={handleCancel}
        />
        <AppButton
          label="Cerrar sesión e ir a Iniciar sesión"
          variant="secondary"
          disabled={cancelling}
          onPress={async () => {
            await signOut();
            router.replace('/auth/login');
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.md,
  },
  actions: {
    gap: SPACING.base,
  },
});
