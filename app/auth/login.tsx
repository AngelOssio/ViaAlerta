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
import { loginSchema, type LoginFormValues } from '../../src/validation/schemas';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { signIn, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();
  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    clearSessionExpiredMessage();
    try {
      await signIn(values.email, values.password);
      router.replace('/(tabs)/home');
    } catch (err) {
      setSubmitError(translateAppError(err));
    }
  };

  return (
    <AppScreen>
      <AppButton
        label="← Bienvenida"
        variant="secondary"
        onPress={() => router.replace('/auth/welcome')}
      />

      <View
        style={[
          styles.bannerCard,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <AppText variant="title">{'Tu comunidad,\nmejor conectada.'}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Reporta problemas en las vías y consulta su seguimiento.
        </AppText>
      </View>

      <View style={styles.heading}>
        <AppText variant="title">Inicia sesión</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Ingresa para cuidar las vías de tu zona.
        </AppText>
      </View>

      {sessionExpiredMessage ? (
        <AlertBanner
          tone="warning"
          title="Tu sesión ha vencido"
          message={sessionExpiredMessage}
        />
      ) : null}

      {submitError ? (
        <AlertBanner
          tone="error"
          title={submitError.title}
          message={submitError.message}
          actionLabel={
            submitError.kind === 'auth_invalid' ? 'Recuperar contraseña' : undefined
          }
          onAction={
            submitError.kind === 'auth_invalid'
              ? () => router.push('/auth/forgot-password')
              : undefined
          }
        />
      ) : null}

      <View style={styles.form}>
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
              textContentType="emailAddress"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              isPassword
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <AppButton
          label="¿Olvidaste tu contraseña?"
          variant="link"
          onPress={() => router.push('/auth/forgot-password')}
        />

        <AppButton
          label="Ingresar"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <AppButton
          label="Crear una cuenta"
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => router.push('/auth/register')}
        />

        <AppButton
          label="Explorar mapa sin iniciar sesión"
          variant="link"
          disabled={isSubmitting}
          onPress={() => router.replace('/(tabs)/map')}
        />
      </View>

      <AppText variant="note" color={colors.textSecondary}>
        Reporta, ubica y sigue
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.md,
  },
  heading: {
    gap: SPACING.xs,
  },
  form: {
    gap: SPACING.lg,
  },
});
