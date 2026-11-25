/**
 * Sistema centralizado de tokens de VíaAlerta.
 * Contrastado directamente con las variables de Figma (`--va-*`, página Prototipo).
 * Modificar esta paleta actualiza todos los componentes de la aplicación.
 */

export interface ColorPalette {
  brandPrimary: string;
  brandSecondary: string;
  actionPrimary: string;
  actionPressed: string;
  actionDisabled: string;
  textOnAction: string;
  screenBackground: string;
  surface: string;
  brandSoftBackground: string;
  supportBackground: string;
  textPrimary: string;
  textSecondary: string;
  borderNormal: string;
  borderControl: string;
  statusInfo: string;
  statusInfoBg: string;
  statusWarning: string;
  statusWarningBg: string;
  statusError: string;
  statusErrorBg: string;
  statusSuccess: string;
  statusSuccessBg: string;
  skeleton: string;
  overlay: string;
}

export const LIGHT_PALETTE: ColorPalette = {
  brandPrimary: '#2463D4',
  brandSecondary: '#138574',
  actionPrimary: '#2463D4',
  actionPressed: '#17489D',
  actionDisabled: '#DCE3ED',
  textOnAction: '#FFFFFF',
  screenBackground: '#F3F6FA',
  surface: '#FFFFFF',
  brandSoftBackground: '#EAF1FE',
  supportBackground: '#E5F5F0',
  textPrimary: '#172B45',
  textSecondary: '#596B80',
  borderNormal: '#C5CFDB',
  borderControl: '#596B80',
  statusInfo: '#2463D4',
  statusInfoBg: '#EAF1FE',
  statusWarning: '#945000',
  statusWarningBg: '#FFF2D7',
  statusError: '#B42318',
  statusErrorBg: '#FEECEC',
  statusSuccess: '#176644',
  statusSuccessBg: '#E5F5F0',
  skeleton: '#DCE3ED',
  overlay: 'rgba(23, 43, 69, 0.55)',
};

export const HIGH_CONTRAST_PALETTE: ColorPalette = {
  brandPrimary: '#17489D',
  brandSecondary: '#0B5E52',
  actionPrimary: '#17489D',
  actionPressed: '#0C2D6B',
  actionDisabled: '#CBD5E1',
  textOnAction: '#FFFFFF',
  screenBackground: '#FFFFFF',
  surface: '#FFFFFF',
  brandSoftBackground: '#E6EEFC',
  supportBackground: '#DFF5ED',
  textPrimary: '#000000',
  textSecondary: '#172B45',
  borderNormal: '#172B45',
  borderControl: '#000000',
  statusInfo: '#17489D',
  statusInfoBg: '#E6EEFC',
  statusWarning: '#7A4100',
  statusWarningBg: '#FFE8B8',
  statusError: '#911B12',
  statusErrorBg: '#FADBD8',
  statusSuccess: '#0E5235',
  statusSuccessBg: '#DFF5ED',
  skeleton: '#B8C4D4',
  overlay: 'rgba(0, 0, 0, 0.72)',
};

export const SPACING = {
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  card: 14,
  xl: 16,
  xxl: 20,
  screenHorizontal: 24,
} as const;

export const RADII = {
  skeleton: 6,
  sm: 8,
  input: 10,
  button: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const FONT_FAMILIES = {
  regular: 'Inter_400Regular',
  bold: 'Inter_700Bold',
} as const;

export const BASE_TYPOGRAPHY = {
  title: { fontSize: 26, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.bold },
  subtitle: { fontSize: 18, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.bold },
  button: { fontSize: 15, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.bold },
  body: { fontSize: 14, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.regular },
  label: { fontSize: 13, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.bold },
  note: { fontSize: 12, lineHeightRatio: 1.4, fontFamily: FONT_FAMILIES.regular },
} as const;

export type TypographyVariant = keyof typeof BASE_TYPOGRAPHY;

export const TOUCH_TARGETS = {
  buttonHeightNormal: 52,
  buttonHeightLarge: 64,
  inputMinHeightNormal: 46,
  inputMinHeightLarge: 58,
  minHitTargetNormal: 48,
  minHitTargetLarge: 64,
} as const;
