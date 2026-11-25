import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { requestAccountDeactivation } from '../../src/services/account';
import { SPACING } from '../../src/theme/tokens';

export default function DeactivateAccountScreen() {
  const router = useRouter();
  const { refreshAccountData, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeactivate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await requestAccountDeactivation();
      await refreshAccountData();
      setDone(true);
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AppScreen>
        <AppText variant="title">Cuenta desactivada</AppText>
        <AlertBanner
          tone="success"
          title="Tu cuenta está en pausa"
          message="Conservamos tus reportes y datos. Cuando quieras regresar, inicia sesión y reactívala desde Configuración."
        />
        <AppButton
          label="Cerrar sesión e ir al inicio"
          variant="primary"
          onPress={async () => {
            await signOut();
            router.replace('/auth/welcome');
          }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Desactivar cuenta</AppText>
      <AlertBanner
        tone="info"
        title="Pausa temporal sin perder tus datos"
        message="Tu cuenta se marcará como desactivada en el servidor. Podrás reactivarla cuando quieras sin perder tus reportes anteriores."
      />
      {errorMsg ? (
        <AlertBanner tone="error" title="No se pudo desactivar" message={errorMsg} />
      ) : null}
      <View style={styles.actions}>
        <AppButton
          label="Confirmar desactivación temporal"
          variant="primary"
          loading={loading}
          onPress={handleDeactivate}
        />
        <AppButton label="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.base,
  },
});
