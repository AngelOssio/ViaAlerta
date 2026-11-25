import React from 'react';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <AppScreen>
      <AppText variant="title">Correo verificado</AppText>
      <AlertBanner
        tone="success"
        title="Tu cuenta está confirmada"
        message={
          isAuthenticated
            ? 'Tu sesión ya está activa. Puedes empezar a reportar incidencias viales.'
            : 'Tu correo quedó confirmado. Inicia sesión para continuar.'
        }
      />
      <AppButton
        label={isAuthenticated ? 'Ir al inicio' : 'Iniciar sesión'}
        variant="primary"
        onPress={() => router.replace(isAuthenticated ? '/(tabs)/home' : '/auth/login')}
      />
    </AppScreen>
  );
}
