import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import type { TypographyVariant } from '../theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const { colors, getTextStyle } = useAccessibility();
  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[getTextStyle(variant), { color: color ?? colors.textPrimary }, style]}
      {...rest}
    />
  );
}
