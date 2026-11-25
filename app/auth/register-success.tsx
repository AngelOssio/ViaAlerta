import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { SPACING } from '../../src/theme/tokens';

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { email, requiresConfirmation } = useLocalSearchParams<{
    email?: string;
    requiresConfirmation?: string;
  }>();

  const needsVerify = requiresConfirmation === '1';

  return (
    <AppScreen>
      <AppText variant="title">Cuenta creada</AppText>

      <AlertBanner
        tone="success"
        title={needsVerify ? 'Revisa tu correo para verificarla' : '¡Bienvenido a VíaAlerta!'}
        message={
          needsVerify
            ? `Enviamos un enlace de verificación a ${email || 'tu correo'}. Ábrelo desde este dispositivo para activar tu cuenta e ingresar.`
            : 'Tu cuenta quedó registrada y activa. Ya puedes reportar incidencias y seguir su estado.'
        }
      />

      <View style={styles.actions}>
        {needsVerify ? (
          <AppButton
            label="Ir a Iniciar sesión"
            variant="primary"
            onPress={() => router.replace('/auth/login')}
          />
        ) : (
          <AppButton
            label="Ir al inicio"
            variant="primary"
            onPress={() => router.replace('/(tabs)/home')}
          />
        )}
        <AppButton
          label="Explorar mapa"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/map')}
        />
      </View>

      <AppText variant="note" color={colors.textSecondary}>
        Si no encuentras el mensaje de verificación, revisa tu carpeta de correo no deseado.
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.lg,
  },
});
