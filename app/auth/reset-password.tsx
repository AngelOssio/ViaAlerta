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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { updatePassword } = useAuth();
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: UpdatePasswordValues) => {
    setErrorMsg(null);
    try {
      await updatePassword(values.password);
      setDone(true);
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    }
  };

  if (done) {
    return (
      <AppScreen>
        <AppText variant="title">Contraseña actualizada</AppText>
        <AlertBanner
          tone="success"
          title="Tu contraseña se cambió correctamente"
          message="Ya puedes continuar usando tu cuenta de VíaAlerta con tu nueva clave."
        />
        <AppButton
          label="Ir al inicio"
          variant="primary"
          onPress={() => router.replace('/(tabs)/home')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.heading}>
        <AppText variant="title">Nueva contraseña</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Elige una contraseña segura de al menos 8 caracteres.
        </AppText>
      </View>

      {errorMsg ? (
        <AlertBanner tone="error" title="No pudimos actualizarla" message={errorMsg} />
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
              placeholder="Repite la nueva contraseña"
              isPassword
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <AppButton
          label="Guardar nueva contraseña"
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
