import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import { AppText } from './AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'link';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  style,
  testID,
}: AppButtonProps) {
  const { colors, buttonHeight, prefs } = useAccessibility();
  const isDisabled = disabled || loading;

  if (variant === 'link') {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.linkButton,
          { minHeight: prefs.largeControls ? 52 : 40, opacity: pressed ? 0.65 : 1 },
          style,
        ]}
      >
        <AppText
          variant="label"
          color={isDisabled ? colors.textSecondary : colors.brandPrimary}
          style={styles.linkText}
        >
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label}, cargando` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => {
        let backgroundColor = colors.actionPrimary;
        let borderColor = 'transparent';
        let borderWidth = 0;

        if (isDisabled) {
          backgroundColor = colors.actionDisabled;
          if (prefs.highContrast) {
            borderColor = colors.borderControl;
            borderWidth = 1;
          }
        } else if (variant === 'primary') {
          backgroundColor = pressed ? colors.actionPressed : colors.actionPrimary;
        } else if (variant === 'secondary') {
          backgroundColor = pressed ? colors.brandSoftBackground : colors.surface;
          borderColor = colors.borderControl;
          borderWidth = prefs.highContrast ? 2 : 1;
        } else if (variant === 'danger') {
          backgroundColor = pressed ? colors.textPrimary : colors.statusError;
        }

        return [
          styles.base,
          {
            minHeight: buttonHeight,
            backgroundColor,
            borderColor,
            borderWidth,
          },
          style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            isDisabled
              ? colors.textSecondary
              : variant === 'secondary'
                ? colors.brandPrimary
                : colors.textOnAction
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon}
          <AppText
            variant="button"
            color={
              isDisabled
                ? colors.textSecondary
                : variant === 'secondary'
                  ? colors.brandPrimary
                  : colors.textOnAction
            }
            style={styles.textCenter}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: RADII.button,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    flexShrink: 1,
  },
  textCenter: {
    textAlign: 'center',
    flexShrink: 1,
  },
  linkButton: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
