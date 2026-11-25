import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info, Inbox, TriangleAlert } from 'lucide-react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  const { colors, prefs } = useAccessibility();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando información"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderNormal,
          borderWidth: prefs.highContrast ? 2 : 1,
        },
      ]}
    >
      <View style={[styles.skelBar, { width: '55%', height: 20, backgroundColor: colors.skeleton }]} />
      {Array.from({ length: lines }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.skelBar,
            {
              width: idx === lines - 1 ? '40%' : '88%',
              height: 14,
              backgroundColor: colors.skeleton,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function AlertBanner({
  tone = 'info',
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, prefs } = useAccessibility();

  const toneMap = {
    info: { bg: colors.statusInfoBg, fg: colors.statusInfo, Icon: Info },
    success: { bg: colors.statusSuccessBg, fg: colors.statusSuccess, Icon: CheckCircle2 },
    warning: { bg: colors.statusWarningBg, fg: colors.statusWarning, Icon: TriangleAlert },
    error: { bg: colors.statusErrorBg, fg: colors.statusError, Icon: AlertCircle },
  }[tone];

  const Icon = toneMap.Icon;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        {
          backgroundColor: toneMap.bg,
          borderColor: prefs.highContrast ? toneMap.fg : toneMap.fg + '44',
          borderWidth: prefs.highContrast ? 2 : 1,
        },
      ]}
    >
      <View style={styles.bannerHeader}>
        <Icon size={22} color={toneMap.fg} />
        <AppText variant="subtitle" color={toneMap.fg} style={styles.flexText}>
          {title}
        </AppText>
      </View>
      <AppText variant="body" color={colors.textPrimary}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, prefs } = useAccessibility();
  return (
    <View
      style={[
        styles.card,
        styles.centered,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderNormal,
          borderWidth: prefs.highContrast ? 2 : 1,
        },
      ]}
    >
      <Inbox size={32} color={colors.brandPrimary} />
      <AppText variant="subtitle" style={styles.centerText}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="primary" />
      ) : null}
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors, effectiveReduceMotion } = useAccessibility();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={effectiveReduceMotion ? 'none' : 'fade'}
      onRequestClose={onCancel}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderNormal,
            },
          ]}
        >
          <AppText variant="subtitle">{title}</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {message}
          </AppText>
          <View style={styles.modalActions}>
            <AppButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
            />
            <AppButton label={cancelLabel} onPress={onCancel} variant="secondary" disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  skelBar: {
    borderRadius: RADII.skeleton,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flexText: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  centerText: {
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.screenHorizontal,
  },
  modalCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  modalActions: {
    gap: SPACING.base,
  },
});
