import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Home, Map, User } from 'lucide-react-native';
import { AppText } from '../../src/components/AppText';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { RADII, SPACING } from '../../src/theme/tokens';

function CustomTabBar({
  state,
  descriptors,
}: {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
}) {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const insets = useSafeAreaInsets();

  const iconFor = (name: string, color: string) => {
    switch (name) {
      case 'home':
        return <Home size={22} color={color} />;
      case 'map':
        return <Map size={22} color={color} />;
      case 'reports':
        return <ClipboardList size={22} color={color} />;
      case 'profile':
      default:
        return <User size={22} color={color} />;
    }
  };

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.screenBackground,
          paddingBottom: Math.max(insets.bottom, 12),
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
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key]?.options?.title ?? route.name;
          const color = isFocused ? colors.brandPrimary : colors.textSecondary;

          const onPress = () => {
            if (!isFocused) {
              router.navigate(`/(tabs)/${route.name}` as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={[
                styles.tabItem,
                { minHeight: prefs.largeControls ? 64 : 52 },
              ]}
            >
              {iconFor(route.name, color)}
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

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar
          state={props.state}
          descriptors={props.descriptors}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reportes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
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
