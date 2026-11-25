import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AlertTriangle, Construction, MapPin, ShieldAlert } from 'lucide-react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import {
  getCategoryLabel,
  type PublicReport,
  type ReportCategory,
} from '../types/domain';
import { AppText } from './AppText';
import { RiskBadge, StatusBadge } from './StatusBadge';

function CategoryIcon({ category, color }: { category: ReportCategory; color: string }) {
  switch (category) {
    case 'hueco':
      return <AlertTriangle size={20} color={color} />;
    case 'vereda':
      return <Construction size={20} color={color} />;
    case 'senalizacion':
      return <MapPin size={20} color={color} />;
    case 'buzon':
      return <ShieldAlert size={20} color={color} />;
  }
}

export interface ReportCardProps {
  report: PublicReport;
  onPress: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const { colors, prefs } = useAccessibility();
  const categoryLabel = getCategoryLabel(report.category);
  const locationText = [report.address, report.district].filter(Boolean).join(' · ') || 'Ubicación en mapa';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${categoryLabel}, código ${report.tracking_code}, en ${locationText}`}
      accessibilityHint="Pulsa para abrir el detalle y seguimiento del reporte"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.brandSoftBackground : colors.surface,
          borderColor: prefs.highContrast ? colors.borderNormal : colors.borderNormal,
          borderWidth: prefs.highContrast ? 2 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <CategoryIcon category={report.category} color={colors.brandPrimary} />
        <AppText variant="subtitle" style={styles.titleText}>
          {categoryLabel}
        </AppText>
        {report.is_demo ? (
          <View style={[styles.demoTag, { backgroundColor: colors.statusWarningBg }]}>
            <AppText variant="note" color={colors.statusWarning}>
              Demo
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="note" color={colors.textSecondary}>
        {locationText}
      </AppText>

      <AppText variant="note" color={colors.textSecondary} numberOfLines={2}>
        {report.description}
      </AppText>

      <View style={styles.badgesRow}>
        <StatusBadge status={report.status} />
        <RiskBadge risk={report.risk_level} />
      </View>

      <AppText variant="label" color={colors.brandPrimary}>
        Código: {report.tracking_code}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  titleText: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  demoTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
});
