import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import { AppText } from './AppText';

export interface AppTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  isPassword?: boolean;
  required?: boolean;
}

export function AppTextField({
  label,
  helperText,
  error,
  disabled = false,
  isPassword = false,
  required = false,
  multiline = false,
  onFocus,
  onBlur,
  ...rest
}: AppTextFieldProps) {
  const { colors, inputMinHeight, getTextStyle, prefs } = useAccessibility();
  const [focused, setFocused] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const hasError = Boolean(error);
  const borderColor = hasError
    ? colors.statusError
    : focused
      ? colors.brandPrimary
      : colors.borderControl;
  const borderWidth = focused || hasError || prefs.highContrast ? 2 : 1;

  return (
    <View style={styles.container}>
      <AppText
        variant="label"
        color={disabled ? colors.textSecondary : colors.textPrimary}
      >
        {label}
        {required ? ' *' : ''}
      </AppText>

      <View
        style={[
          styles.inputBox,
          {
            minHeight: multiline ? Math.max(104, inputMinHeight * 2) : inputMinHeight,
            backgroundColor: disabled ? colors.actionDisabled : colors.surface,
            borderColor,
            borderWidth,
          },
        ]}
      >
        <TextInput
          editable={!disabled}
          secureTextEntry={isPassword && !showSecret}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            getTextStyle('body'),
            {
              color: disabled ? colors.textSecondary : colors.textPrimary,
            },
          ]}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowSecret((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showSecret ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={styles.eyeButton}
          >
            {showSecret ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <AlertCircle size={16} color={colors.statusError} />
          <AppText variant="note" color={colors.statusError} style={styles.flexText}>
            {error}
          </AppText>
        </View>
      ) : helperText ? (
        <AppText variant="note" color={colors.textSecondary}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: SPACING.sm,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.input,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  eyeButton: {
    paddingLeft: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  flexText: {
    flex: 1,
  },
});
