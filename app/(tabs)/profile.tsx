import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, ConfirmDialog } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { RADII, SPACING } from '../../src/theme/tokens';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileTabScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { user, profile, isAuthenticated, isAdmin, signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setConfirmLogout(false);
      router.replace('/auth/welcome');
    } finally {
      setSigningOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppScreen>
        <AppText variant="title">Mi perfil</AppText>
        <AlertBanner
          tone="info"
          title="Exploras como invitado"
          message="Inicia sesión para editar tu perfil, consultar tus reportes y gestionar tu cuenta. Las opciones de accesibilidad siguen disponibles sin cuenta."
          actionLabel="Iniciar sesión"
          onAction={() => router.push('/auth/login')}
        />
        <View style={styles.actions}>
          <AppButton
            label="Crear una cuenta"
            variant="secondary"
            onPress={() => router.push('/auth/register')}
          />
          <AppButton
            label="Accesibilidad"
            variant="secondary"
            onPress={() => router.push('/profile/accessibility')}
          />
          <AppButton
            label="Ayuda"
            variant="secondary"
            onPress={() => router.push('/profile/help')}
          />
        </View>
      </AppScreen>
    );
  }

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Usuario';
  const initials = getInitials(displayName);

  return (
    <AppScreen>
      <AppText variant="title">Mi perfil</AppText>

      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <AppText variant="title" color={colors.brandPrimary}>
          {initials}
        </AppText>
        <AppText variant="subtitle">{displayName}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {user?.email}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {profile?.district || 'Chaclacayo, Lima'}
        </AppText>
        {isAdmin ? (
          <View style={[styles.adminBadge, { backgroundColor: colors.surface, borderColor: colors.brandPrimary }]}>
            <Shield size={14} color={colors.brandPrimary} />
            <AppText variant="note" color={colors.brandPrimary}>
              Rol autorizado: Administrador
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {isAdmin ? (
          <AppButton
            label="Panel de administración"
            variant="primary"
            icon={<Shield size={18} color={colors.textOnAction} />}
            onPress={() => router.push('/admin')}
          />
        ) : null}
        <AppButton
          label="Editar perfil"
          variant="secondary"
          onPress={() => router.push('/profile/edit')}
        />
        <AppButton
          label="Mis reportes"
          variant="secondary"
          onPress={() => router.push('/(tabs)/reports')}
        />
        <AppButton
          label="Notificaciones"
          variant="secondary"
          onPress={() => router.push('/profile/notifications')}
        />
        <AppButton
          label="Configuración"
          variant="secondary"
          onPress={() => router.push('/profile/settings')}
        />
        <AppButton
          label="Ayuda"
          variant="secondary"
          onPress={() => router.push('/profile/help')}
        />
        <AppButton
          label="Cerrar sesión"
          variant="danger"
          onPress={() => setConfirmLogout(true)}
        />
      </View>

      <ConfirmDialog
        visible={confirmLogout}
        title="¿Quieres cerrar sesión?"
        message="Tus reportes guardados y tus preferencias de accesibilidad permanecerán disponibles cuando vuelvas a ingresar."
        confirmLabel="Sí, cerrar sesión"
        cancelLabel="Seguir en mi cuenta"
        destructive
        loading={signingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  actions: {
    gap: SPACING.base,
  },
});
