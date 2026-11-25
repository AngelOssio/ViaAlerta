import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AppTextField } from '../../src/components/AppTextField';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError, type FriendlyError } from '../../src/lib/errors';
import { RADII, SPACING } from '../../src/theme/tokens';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../../src/validation/schemas';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { sendPasswordReset } = useAuth();
  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setSubmitError(null);
    try {
      await sendPasswordReset(values.email);
      router.replace({
        pathname: '/auth/email-sent',
        params: { email: values.email.trim().toLowerCase() },
      });
    } catch (err) {
      setSubmitError(translateAppError(err));
    }
  };

  return (
    <AppScreen>
      <AppButton
        label="← Volver a iniciar sesión"
        variant="secondary"
        onPress={() => router.back()}
      />

      <View style={styles.heading}>
        <AppText variant="title">Recupera tu acceso</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Escribe el correo asociado a tu cuenta. Te enviaremos un enlace para cambiar tu contraseña.
        </AppText>
      </View>

      {submitError ? (
        <AlertBanner tone="error" title={submitError.title} message={submitError.message} />
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextField
            label="Correo electrónico"
            placeholder="nombre@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <AppButton
        label="Enviar enlace"
        variant="primary"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />

      <View
        style={[
          styles.helpCard,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <AppText variant="label" color={colors.brandPrimary}>
          ¿No recuerdas qué correo usaste?
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Revisa el mensaje de bienvenida que recibiste al registrarte.
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  helpCard: {
    borderRadius: RADII.card,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
});
