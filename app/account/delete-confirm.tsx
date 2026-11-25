import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AppTextField } from '../../src/components/AppTextField';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { requestScheduledDeletion } from '../../src/services/account';
import { SPACING } from '../../src/theme/tokens';
import {
  deletionConfirmationSchema,
  type DeletionConfirmationValues,
} from '../../src/validation/schemas';

export default function ConfirmDeletionScreen() {
  const router = useRouter();
  const { refreshAccountData } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeletionConfirmationValues>({
    resolver: zodResolver(deletionConfirmationSchema),
    defaultValues: { confirmationWord: '' },
  });

  const typedWord = (useWatch({ control, name: 'confirmationWord' }) ?? '').trim();
  const matchesExact = typedWord === 'ELIMINAR';

  const onSubmit = async (values: DeletionConfirmationValues) => {
    setErrorMsg(null);
    try {
      const result = await requestScheduledDeletion(values.confirmationWord.trim());
      await refreshAccountData();
      router.replace({
        pathname: '/account/delete-scheduled',
        params: {
          scheduledFor: result.request.scheduled_for,
          emailSent: result.emailSent ? '1' : '0',
        },
      });
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Confirmar eliminación</AppText>
      <AppText variant="body">
        Escribe ELIMINAR para confirmar que quieres solicitar la eliminación programada de tu
        cuenta.
      </AppText>

      {errorMsg ? (
        <AlertBanner tone="error" title="No se pudo procesar la solicitud" message={errorMsg} />
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="confirmationWord"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Palabra de confirmación"
              placeholder="Escribe ELIMINAR"
              helperText="Debe coincidir exactamente en mayúsculas."
              autoCapitalize="characters"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmationWord?.message}
            />
          )}
        />

        <AppButton
          label="Solicitar eliminación"
          variant="danger"
          disabled={!matchesExact}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        <AppButton
          label="Volver"
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => router.back()}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.lg,
  },
});
