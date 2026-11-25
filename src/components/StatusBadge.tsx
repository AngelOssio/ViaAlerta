import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import {
  getRiskLabel,
  getStatusMeta,
  type ReportRisk,
  type ReportStatus,
} from '../types/domain';
import { AppText } from './AppText';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { colors, prefs } = useAccessibility();
  const meta = getStatusMeta(status);

  let fg = colors.statusInfo;
  let bg = colors.statusInfoBg;
  let Icon = Clock;

  if (status === 'en_revision') {
    fg = colors.statusWarning;
    bg = colors.statusWarningBg;
    Icon = Search;
  } else if (status === 'en_atencion') {
    fg = colors.brandPrimary;
    bg = colors.brandSoftBackground;
    Icon = Clock;
  } else if (status === 'resuelto') {
    fg = colors.statusSuccess;
    bg = colors.statusSuccessBg;
    Icon = CheckCircle2;
  }

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: prefs.highContrast ? fg : 'transparent',
          borderWidth: prefs.highContrast ? 1.5 : 0,
        },
      ]}
      accessibilityLabel={`Estado: ${meta.label}`}
    >
      <Icon size={14} color={fg} />
      <AppText variant="label" color={fg}>
        {meta.label}
      </AppText>
    </View>
  );
}

export function RiskBadge({ risk }: { risk: ReportRisk }) {
  const { colors, prefs } = useAccessibility();
  const label = `Riesgo ${getRiskLabel(risk).toLowerCase()}`;

  let fg = colors.textSecondary;
  let bg = colors.screenBackground;
  if (risk === 'alto') {
    fg = colors.statusWarning;
    bg = colors.statusWarningBg;
  } else if (risk === 'medio') {
    fg = colors.brandPrimary;
    bg = colors.brandSoftBackground;
  } else {
    fg = colors.statusSuccess;
    bg = colors.statusSuccessBg;
  }

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: prefs.highContrast ? fg : 'transparent',
          borderWidth: prefs.highContrast ? 1.5 : 0,
        },
      ]}
      accessibilityLabel={label}
    >
      <AlertTriangle size={14} color={fg} />
      <AppText variant="note" color={fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
  },
});
