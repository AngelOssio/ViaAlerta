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
import { SPACING } from '../../src/theme/tokens';
import { registerSchema, type RegisterFormValues } from '../../src/validation/schemas';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    try {
      const result = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      router.replace({
        pathname: '/auth/register-success',
        params: {
          email: values.email.trim().toLowerCase(),
          requiresConfirmation: result.requiresEmailConfirmation ? '1' : '0',
        },
      });
    } catch (err) {
      setSubmitError(translateAppError(err));
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Crea tu cuenta</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Empieza a reportar y seguir las incidencias de tu zona.
        </AppText>
      </View>

      {submitError ? (
        <AlertBanner
          tone="error"
          title={submitError.title}
          message={submitError.message}
          actionLabel={
            submitError.kind === 'already_registered' ? 'Ir a iniciar sesión' : undefined
          }
          onAction={
            submitError.kind === 'already_registered'
              ? () => router.replace('/auth/login')
              : undefined
          }
        />
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Nombre completo"
              placeholder="Nombre y apellidos"
              autoCapitalize="words"
              autoComplete="name"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.fullName?.message}
            />
          )}
        />

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
              required
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
              placeholder="Crea una contraseña"
              helperText="Usa al menos 8 caracteres."
              isPassword
              autoCapitalize="none"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              isPassword
              autoCapitalize="none"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <AppText variant="note" color={colors.textSecondary}>
          Al crear tu cuenta aceptas el uso de tus datos para gestionar tus reportes.
        </AppText>

        <AppButton
          label="Crear mi cuenta"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <AppButton
          label="Ya tengo una cuenta"
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => router.replace('/auth/login')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  form: {
    gap: SPACING.lg,
  },
});
