import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNavigation } from '../src/components/BottomNavigation';
import { AccessibilityProvider, useAccessibility } from '../src/contexts/AccessibilityContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ReportDraftProvider } from '../src/contexts/ReportDraftContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 20_000,
    },
  },
});

function RootNavigator() {
  const { colors, hydrated, effectiveReduceMotion } = useAccessibility();
  const { passwordRecoveryMode } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (passwordRecoveryMode && segments.join('/') !== 'auth/reset-password') {
      router.replace('/auth/reset-password');
    }
  }, [passwordRecoveryMode, router, segments]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.screenBackground,
        }}
      >
        <ActivityIndicator size="large" color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.screenBackground },
          animation: effectiveReduceMotion ? 'none' : 'default',
        }}
      />
      <BottomNavigation />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <AuthProvider>
            <ReportDraftProvider>
              <RootNavigator />
            </ReportDraftProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
