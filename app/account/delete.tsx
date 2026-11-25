import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function DeleteAccountIntroScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Eliminar cuenta</AppText>
      <AppText variant="body">
        Puedes cancelar la solicitud durante 30 días. Después, la eliminación será definitiva.
      </AppText>

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
        <AppText variant="label">Datos de tu cuenta</AppText>
        <AppText variant="body">
          Durante el periodo de gracia de 30 días (definido como política del proyecto) se
          conservan para que puedas cancelar. Al vencer el plazo se eliminan tu perfil, correo y
          preferencias.
        </AppText>

        <AppText variant="label">Reportes enviados</AppText>
        <AppText variant="body">
          Se conservan sin tu nombre ni correo durante 12 meses previstos después de la eliminación,
          para mantener el seguimiento comunitario de las incidencias.
        </AppText>
      </View>

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
        <AppText variant="label" color={colors.brandPrimary}>
          ¿Solo quieres hacer una pausa?
        </AppText>
        <AppText variant="body">
          Desactiva tu cuenta temporalmente y reactívala cuando quieras.
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Desactivar temporalmente"
          variant="secondary"
          onPress={() => router.push('/account/deactivate')}
        />
        <AppButton
          label="Continuar con la eliminación"
          variant="danger"
          onPress={() => router.push('/account/delete-confirm')}
        />
        <AppButton
          label="Volver a Configuración"
          variant="link"
          onPress={() => router.back()}
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
