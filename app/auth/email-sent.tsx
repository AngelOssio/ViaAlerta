import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { SPACING } from '../../src/theme/tokens';

export default function EmailSentScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { sendPasswordReset } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg(null);
    setResentMessage(null);
    try {
      await sendPasswordReset(email);
      setResentMessage('Solicitamos nuevamente el envío del enlace de recuperación.');
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AppScreen>
      <AppText variant="title">Revisa tu correo</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Si existe una cuenta registrada para {email || 'ese correo'}, el servicio de autenticación ha
        enviado un enlace para restablecer tu contraseña.
      </AppText>

      <AlertBanner
        tone="info"
        title="Abre el enlace desde este dispositivo"
        message="Al tocar el enlace del correo, VíaAlerta se abrirá automáticamente en la pantalla para crear tu nueva contraseña."
      />

      {resentMessage ? (
        <AlertBanner tone="success" title="Enlace reenviado" message={resentMessage} />
      ) : null}

      {errorMsg ? (
        <AlertBanner tone="error" title="No se pudo reenviar" message={errorMsg} />
      ) : null}

      <View style={styles.actions}>
        {email ? (
          <AppButton
            label="Reenviar enlace"
            variant="secondary"
            loading={resending}
            onPress={handleResend}
          />
        ) : null}
        <AppButton
          label="Volver a iniciar sesión"
          variant="primary"
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: SPACING.lg,
  },
});
