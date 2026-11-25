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
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { updateUserProfile } from '../../src/services/account';
import { SPACING } from '../../src/theme/tokens';
import { profileSchema, type ProfileFormValues } from '../../src/validation/schemas';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshAccountData } = useAuth();
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      district: profile?.district ?? 'Chaclacayo, Lima',
      phone: profile?.phone ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    setErrorMsg(null);
    setSaved(false);
    try {
      await updateUserProfile({
        userId: user.id,
        fullName: values.fullName,
        district: values.district,
        phone: values.phone,
      });
      await refreshAccountData();
      setSaved(true);
    } catch (err) {
      setErrorMsg(translateAppError(err).message);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <AppText variant="title">Editar perfil</AppText>

      {saved ? (
        <AlertBanner
          tone="success"
          title="Cambios guardados"
          message="Tus datos de perfil se actualizaron correctamente en tu cuenta."
        />
      ) : null}

      {errorMsg ? (
        <AlertBanner tone="error" title="No pudimos guardar los cambios" message={errorMsg} />
      ) : null}

      <View style={styles.form}>
        <AppTextField
          label="Correo electrónico"
          value={user?.email ?? ''}
          disabled
          helperText="El correo está asociado a tu cuenta de autenticación."
        />

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Nombre completo"
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
          name="district"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Distrito o zona"
              required
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.district?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextField
              label="Teléfono (opcional)"
              keyboardType="phone-pad"
              placeholder="Ej. 999 888 777"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <AppButton
          label="Guardar cambios"
          variant="primary"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
        <AppButton
          label="Volver a mi perfil"
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
