import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, type TextStyle } from 'react-native';
import {
  DEFAULT_ACCESSIBILITY,
  loadAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../lib/storage';
import {
  BASE_TYPOGRAPHY,
  HIGH_CONTRAST_PALETTE,
  LIGHT_PALETTE,
  TOUCH_TARGETS,
  type ColorPalette,
  type TypographyVariant,
} from '../theme/tokens';
import type { AccessibilityPreferences } from '../types/domain';

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences;
  hydrated: boolean;
  colors: ColorPalette;
  systemReduceMotion: boolean;
  effectiveReduceMotion: boolean;
  buttonHeight: number;
  inputMinHeight: number;
  hitTarget: number;
  getTextStyle: (variant: TypographyVariant) => TextStyle;
  updatePrefs: (patch: Partial<AccessibilityPreferences>) => Promise<void>;
  resetPrefs: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_ACCESSIBILITY);
  const [hydrated, setHydrated] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadAccessibilityPreferences().then((loaded) => {
      if (mounted) {
        setPrefs(loaded);
        setHydrated(true);
      }
    });

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setSystemReduceMotion(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setSystemReduceMotion(enabled);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const updatePrefs = useCallback(async (patch: Partial<AccessibilityPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveAccessibilityPreferences(next).catch(() => {});
      return next;
    });
  }, []);

  const resetPrefs = useCallback(async () => {
    setPrefs(DEFAULT_ACCESSIBILITY);
    await saveAccessibilityPreferences(DEFAULT_ACCESSIBILITY);
  }, []);

  const colors = prefs.highContrast ? HIGH_CONTRAST_PALETTE : LIGHT_PALETTE;
  const effectiveReduceMotion = prefs.reduceMotion || systemReduceMotion;
  const buttonHeight = prefs.largeControls
    ? TOUCH_TARGETS.buttonHeightLarge
    : TOUCH_TARGETS.buttonHeightNormal;
  const inputMinHeight = prefs.largeControls
    ? TOUCH_TARGETS.inputMinHeightLarge
    : TOUCH_TARGETS.inputMinHeightNormal;
  const hitTarget = prefs.largeControls
    ? TOUCH_TARGETS.minHitTargetLarge
    : TOUCH_TARGETS.minHitTargetNormal;

  const getTextStyle = useCallback(
    (variant: TypographyVariant): TextStyle => {
      const base = BASE_TYPOGRAPHY[variant];
      const scaledSize = Math.round(base.fontSize * prefs.textScale);
      return {
        fontFamily: base.fontFamily,
        fontSize: scaledSize,
        lineHeight: Math.round(scaledSize * base.lineHeightRatio),
      };
    },
    [prefs.textScale]
  );

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      prefs,
      hydrated,
      colors,
      systemReduceMotion,
      effectiveReduceMotion,
      buttonHeight,
      inputMinHeight,
      hitTarget,
      getTextStyle,
      updatePrefs,
      resetPrefs,
    }),
    [
      prefs,
      hydrated,
      colors,
      systemReduceMotion,
      effectiveReduceMotion,
      buttonHeight,
      inputMinHeight,
      hitTarget,
      getTextStyle,
      updatePrefs,
      resetPrefs,
    ]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }
  return ctx;
}
