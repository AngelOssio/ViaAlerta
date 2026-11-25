import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, MapPin } from 'lucide-react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { SPACING } from '../theme/tokens';
import { AppText } from './AppText';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  showBrandHeader?: boolean;
  onBack?: () => void;
  backLabel?: string;
  onNotificationsPress?: () => void;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

export function AppScreen({
  children,
  scroll = true,
  showBrandHeader = true,
  onBack,
  backLabel,
  onNotificationsPress,
  contentStyle,
  footer,
}: AppScreenProps) {
  const { colors, hitTarget } = useAccessibility();

  const header = showBrandHeader ? (
    <View style={styles.brandHeader}>
      <View style={styles.brandLeft}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel ?? 'Volver'}
            style={({ pressed }) => [
              styles.iconButton,
              {
                minWidth: hitTarget,
                minHeight: hitTarget,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ArrowLeft size={22} color={colors.brandPrimary} />
          </Pressable>
        ) : null}
        <MapPin size={24} color={colors.brandPrimary} strokeWidth={2.2} />
        <AppText variant="subtitle" color={colors.brandPrimary} accessibilityRole="header">
          VíaAlerta
        </AppText>
      </View>
      {onNotificationsPress ? (
        <Pressable
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          style={({ pressed }) => [
            styles.iconButton,
            {
              minWidth: hitTarget,
              minHeight: hitTarget,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Bell size={22} color={colors.brandPrimary} />
        </Pressable>
      ) : null}
    </View>
  ) : null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: colors.screenBackground }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.staticContent, contentStyle]}>
            {header}
            {children}
          </View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingTop: SPACING.lg,
    paddingBottom: 32,
    gap: SPACING.lg,
  },
  staticContent: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  footer: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
});
