import { StyleSheet, View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import { AppText } from './AppText';
import type { InteractiveMapProps } from './InteractiveMap';

export function InteractiveMap({
  height = 240,
  reports = [],
  pickerCoordinate,
}: InteractiveMapProps) {
  const { colors } = useAccessibility();

  return (
    <View
      style={[
        styles.webFallback,
        {
          height,
          backgroundColor: colors.brandSoftBackground,
          borderColor: colors.borderNormal,
        },
      ]}
    >
      <AppText variant="label" color={colors.brandPrimary}>
        Mapa interactivo nativo (Android / iOS)
      </AppText>
      <AppText variant="note" color={colors.textSecondary}>
        {pickerCoordinate
          ? `Punto seleccionado: ${pickerCoordinate.latitude.toFixed(5)}, ${pickerCoordinate.longitude.toFixed(5)}`
          : `${reports.length} incidencias cargadas desde la base de datos.`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    width: '100%',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
