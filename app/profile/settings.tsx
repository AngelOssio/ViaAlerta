import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, ConfirmDialog } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { requestAccountReactivation } from '../../src/services/account';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { profile, pendingDeletion, notificationPrefs, signOut, refreshAccountData } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleReactivate = async () => {
    setReactivating(true);
    setStatusMessage(null);
    try {
      await requestAccountReactivation();
      await refreshAccountData();
      setStatusMessage('Tu cuenta volvió a estar activa.');
    } catch (err) {
      setStatusMessage(translateAppError(err).message);
    } finally {
      setReactivating(false);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Configuración</AppText>

      {statusMessage ? (
        <AlertBanner tone="info" title="Estado de cuenta" message={statusMessage} />
      ) : null}

      <AppText variant="subtitle">Preferencias</AppText>
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
        <View style={styles.prefRow}>
          <AppText variant="body" style={styles.flexText}>
            Preferencia de avisos de mis reportes
          </AppText>
          <AppText variant="label" color={colors.brandPrimary}>
            {notificationPrefs.notifyReportUpdates ? 'Activados' : 'Desactivados'}
          </AppText>
        </View>
        <View style={styles.prefRow}>
          <AppText variant="body" style={styles.flexText}>
            Confirmaciones por correo
          </AppText>
          <AppText variant="label" color={colors.brandPrimary}>
            {notificationPrefs.notifyEmailConfirmations ? 'Activadas' : 'Desactivadas'}
          </AppText>
        </View>
        <AppButton
          label="Configurar notificaciones"
          variant="secondary"
          onPress={() => router.push('/profile/notifications')}
        />
      </View>

      <AppText variant="subtitle">Personaliza tu experiencia</AppText>
      <AppButton
        label="Accesibilidad →"
        variant="primary"
        onPress={() => router.push('/profile/accessibility')}
      />
      <AppText variant="note" color={colors.textSecondary}>
        Tamaño de texto (hasta 200 %), alto contraste, controles grandes y movimiento reducido.
      </AppText>

      <AppText variant="subtitle">Cuenta y seguridad</AppText>
      <View style={styles.actions}>
        <AppButton
          label="Cambiar contraseña"
          variant="secondary"
          onPress={() => router.push('/profile/change-password')}
        />

        {profile?.account_status === 'deactivated' ? (
          <AppButton
            label="Reactivar cuenta"
            variant="primary"
            loading={reactivating}
            onPress={handleReactivate}
          />
        ) : null}

        <AppButton
          label={pendingDeletion ? 'Ver eliminación programada' : 'Eliminar cuenta'}
          variant="danger"
          onPress={() =>
            router.push(pendingDeletion ? '/account/delete-scheduled' : '/account/delete')
          }
        />

        <AppButton
          label="Cerrar sesión"
          variant="secondary"
          onPress={() => setConfirmLogout(true)}
        />

        <AppButton
          label="Volver a mi perfil"
          variant="link"
          onPress={() => router.back()}
        />
      </View>

      <ConfirmDialog
        visible={confirmLogout}
        title="¿Quieres cerrar sesión?"
        message="Podrás volver a iniciar sesión cuando quieras."
        confirmLabel="Cerrar sesión"
        destructive
        onConfirm={async () => {
          await signOut();
          setConfirmLogout(false);
          router.replace('/auth/welcome');
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  flexText: {
    flex: 1,
  },
  actions: {
    gap: SPACING.base,
  },
});
