import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import { getCategoryLabel, type ReportCategory } from '../../src/types/domain';

export default function ReportSuccessScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const params = useLocalSearchParams<{
    reportId?: string;
    trackingCode?: string;
    category?: ReportCategory;
    address?: string;
    emailSent?: string;
  }>();

  const emailConfirmed = params.emailSent === '1';

  return (
    <AppScreen>
      <AppText variant="title">Reporte registrado</AppText>

      <View
        style={[
          styles.successCard,
          {
            backgroundColor: colors.supportBackground,
            borderColor: prefs.highContrast ? colors.statusSuccess : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <CheckCircle2 size={30} color={colors.statusSuccess} />
        <AppText variant="subtitle" color={colors.statusSuccess}>
          ✓ Reporte registrado
        </AppText>
        <AppText variant="body">
          Gracias por ayudar a mejorar las vías de tu comunidad.
        </AppText>
      </View>

      <View
        style={[
          styles.codeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <AppText variant="title" color={colors.brandPrimary}>
          {params.trackingCode || 'Registrado'}
        </AppText>
        <AppText variant="body">
          {params.category ? getCategoryLabel(params.category) : 'Incidencia vial'}
        </AppText>
        {params.address ? (
          <AppText variant="note" color={colors.textSecondary}>
            {params.address}
          </AppText>
        ) : null}
        <StatusBadge status="recibido" />
        <AppText variant="note" color={colors.textSecondary}>
          {emailConfirmed
            ? 'Te enviamos un correo electrónico con el comprobante de registro.'
            : 'Tu comprobante quedó guardado en Mis reportes (el envío adicional por correo requiere configurar Resend en Supabase).'}
        </AppText>
      </View>

      <View style={styles.actions}>
        {params.reportId ? (
          <AppButton
            label="Ver seguimiento"
            variant="primary"
            onPress={() => router.replace(`/report/${params.reportId}`)}
          />
        ) : null}
        <AppButton
          label="Ver mis reportes"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/reports')}
        />
        <AppButton
          label="Volver al inicio"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/home')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  successCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  codeCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.md,
  },
  actions: {
    gap: SPACING.lg,
  },
});
