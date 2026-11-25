import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Home, Map, User } from 'lucide-react-native';
import { AppText } from './AppText';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';

const tabs = [
  { name: 'home', href: '/(tabs)/home', label: 'Inicio', Icon: Home },
  { name: 'map', href: '/(tabs)/map', label: 'Mapa', Icon: Map },
  { name: 'reports', href: '/(tabs)/reports', label: 'Reportes', Icon: ClipboardList },
  { name: 'profile', href: '/(tabs)/profile', label: 'Perfil', Icon: User },
] as const;

export function BottomNavigation() {
  const router = useRouter();
  const segments: readonly string[] = useSegments();
  const [section, screen] = segments;
  const { colors, prefs } = useAccessibility();
  const insets = useSafeAreaInsets();

  if (!section || section === 'index' || (section === 'auth' && screen !== 'require-login')) {
    return null;
  }

  const onTabScreen = section === '(tabs)';

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.screenBackground,
          paddingBottom: Math.max(insets.bottom, 12),
          marginLeft: insets.left,
          marginRight: insets.right,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        {tabs.map(({ name, href, label, Icon }) => {
          const isFocused = onTabScreen && screen === name;
          const color = isFocused ? colors.brandPrimary : colors.textSecondary;

          return (
            <Pressable
              key={name}
              onPress={() => {
                if (onTabScreen) {
                  if (!isFocused) router.navigate(href);
                } else {
                  router.dismissTo(href);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={[styles.tabItem, { minHeight: prefs.largeControls ? 64 : 52 }]}
            >
              <Icon size={22} color={color} />
              <AppText
                variant="note"
                color={color}
                numberOfLines={1}
                style={{ fontWeight: isFocused ? '700' : '400' }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingTop: SPACING.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: 2,
  },
});
