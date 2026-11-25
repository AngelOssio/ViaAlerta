import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function HelpScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.borderNormal,
      borderWidth: prefs.highContrast ? 2 : 1,
    },
  ];

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Ayuda</AppText>

      <View style={cardStyle}>
        <AppText variant="label" color={colors.brandPrimary}>
          ¿Cómo reporto un problema?
        </AppText>
        <AppText variant="body">
          Elige el tipo de incidencia, adjunta una fotografía, indica la ubicación en el mapa y
          revisa los datos antes de enviarlos.
        </AppText>
      </View>

      <View style={cardStyle}>
        <AppText variant="label" color={colors.brandPrimary}>
          ¿Qué significa cada estado?
        </AppText>
        <AppText variant="body">
          {'Recibido: registrado.\nEn revisión: se está evaluando.\nEn atención: se está atendiendo.\nResuelto: atención finalizada.'}
        </AppText>
      </View>

      <View style={cardStyle}>
        <AppText variant="label" color={colors.brandPrimary}>
          ¿Ya existe un reporte?
        </AppText>
        <AppText variant="body">
          Consulta primero el mapa para evitar registrar la misma incidencia.
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Consultar mapa"
          variant="primary"
          onPress={() => router.replace('/(tabs)/map')}
        />
        <AppButton
          label="Accesibilidad"
          variant="secondary"
          onPress={() => router.push('/profile/accessibility')}
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
