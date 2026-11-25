/**
 * Utilidad matemática de cálculo de contraste WCAG 2.1 (luminancia relativa).
 * Permite verificar y probar automáticamente las combinaciones de colores reales de VíaAlerta.
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function channelLuminance(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export interface ContrastCheck {
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesUI: boolean;
}

export function evaluatePair(name: string, foreground: string, background: string): ContrastCheck {
  const ratio = getContrastRatio(foreground, background);
  return {
    name,
    foreground,
    background,
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7.0,
    passesUI: ratio >= 3.0,
  };
}
