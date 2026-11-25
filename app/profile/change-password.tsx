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
import { translateAppError } from '../../src/lib/errors';
import { SPACING } from '../../src/theme/tokens';
import { updatePasswordSchema, type UpdatePasswordValues } from '../../src/validation/schemas';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { updatePassword } = useAuth();
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: UpdatePasswordValues) => {
    setErrorMsg(null);
    setSaved(false);
    try {
      await updatePassword(values.password);
      reset();
      setSaved(true);
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Cambiar contraseña</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Actualiza la contraseña de tu cuenta activa en VíaAlerta.
        </AppText>
      </View>

      {saved ? (
        <AlertBanner
          tone="success"
          title="Contraseña actualizada"
          message="Tu nueva contraseña ya está vigente para próximos inicios de sesión."
        />
      ) : null}

      {errorMsg ? (
        <AlertBanner tone="error" title="No pudimos cambiar la contraseña" message={errorMsg} />
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
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
              label="Confirmar nueva contraseña"
              placeholder="Repite la contraseña"
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

        <AppButton
          label="Actualizar contraseña"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
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
