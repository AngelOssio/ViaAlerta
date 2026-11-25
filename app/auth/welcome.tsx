import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();

  return (
    <AppScreen>
      {!isSupabaseConfigured ? (
        <AlertBanner
          tone="warning"
          title="Configuración de Supabase pendiente"
          message="Crea tu archivo .env con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY para habilitar el registro, inicio de sesión y reportes reales."
        />
      ) : null}

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <AppText variant="title">
          {'Tus calles.\nTu comunidad.\nTu voz.'}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Reporta problemas en las vías y ayuda a mejorar tu entorno.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">Reporta, ubica y sigue</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Registra una incidencia con una foto, indica dónde está y consulta su estado.
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
          label="Explorar mapa sin iniciar sesión"
          variant="link"
          onPress={() => router.replace('/(tabs)/map')}
        />
      </View>

      <AppText variant="note" color={colors.textSecondary}>
        Una comunidad informada puede hacer la diferencia.
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: RADII.card,
    padding: SPACING.xl,
    gap: SPACING.base,
  },
  section: {
    gap: SPACING.sm,
  },
  actions: {
    gap: SPACING.lg,
  },
});
