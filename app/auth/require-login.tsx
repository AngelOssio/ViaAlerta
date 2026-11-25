import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function RequireLoginScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Inicia sesión para reportar</AppText>

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
        <Lock size={28} color={colors.brandPrimary} />
        <AppText variant="subtitle">Necesitas una cuenta para enviar reportes</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Puedes seguir consultando las incidencias públicas sin iniciar sesión.
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Iniciar sesión"
          variant="primary"
          onPress={() => router.push('/auth/login')}
        />
        <AppButton
          label="Crear una cuenta"
          variant="secondary"
          onPress={() => router.push('/auth/register')}
        />
        <AppButton
          label="Seguir explorando"
          variant="link"
          onPress={() => router.replace('/(tabs)/map')}
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
    gap: SPACING.lg,
  },
});
