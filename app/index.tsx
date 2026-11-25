import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAccessibility } from '../src/contexts/AccessibilityContext';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexGate() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useAccessibility();

  if (loading) {
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

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/welcome" />;
}
