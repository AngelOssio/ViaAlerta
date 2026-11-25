import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Shield } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, SkeletonCard } from '../../src/components/FeedbackStates';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { ReportCard } from '../../src/components/ReportCard';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { fetchMyReports, fetchPublicReports } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { user, profile, isAuthenticated, isAdmin, pendingDeletion } = useAuth();

  const myReportsQuery = useQuery({
    queryKey: ['my-reports', user?.id],
    queryFn: () => fetchMyReports(user!.id),
    enabled: isAuthenticated && Boolean(user?.id) && isSupabaseConfigured,
  });

  const publicReportsQuery = useQuery({
    queryKey: ['public-reports', 'home'],
    queryFn: () => fetchPublicReports(),
    enabled: isSupabaseConfigured,
  });

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'vecino';

  const myTotal = myReportsQuery.data?.length ?? 0;
  const myResolved = myReportsQuery.data?.filter((r) => r.status === 'resuelto').length ?? 0;
  const recentPublic = publicReportsQuery.data ?? [];
  const featuredReport = recentPublic[0];

  const handleCreateReport = () => {
    if (!isAuthenticated) {
      router.push('/auth/require-login');
      return;
    }
    router.push('/report/new');
  };

  return (
    <AppScreen
      onNotificationsPress={() =>
        router.push(isAuthenticated ? '/profile/notifications' : '/auth/require-login')
      }
    >
      <View style={styles.greeting}>
        <AppText variant="title">
          {isAuthenticated ? `Hola, ${firstName}` : 'Explorar sin cuenta'}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {isAuthenticated
            ? '¿Qué podemos mejorar hoy?'
            : 'Consulta las incidencias de tu comunidad.'}
        </AppText>
      </View>

      {pendingDeletion ? (
        <AlertBanner
          tone="warning"
          title="Eliminación de cuenta programada"
          message={`Tu solicitud está programada para el ${new Date(
            pendingDeletion.scheduled_for
          ).toLocaleDateString('es-PE')}. Puedes cancelarla dentro del plazo de 30 días.`}
          actionLabel="Gestionar solicitud"
          onAction={() => router.push('/account/delete-scheduled')}
        />
      ) : null}

      {profile?.account_status === 'deactivated' ? (
        <AlertBanner
          tone="info"
          title="Cuenta desactivada temporalmente"
          message="Tu cuenta está en pausa. Puedes reactivarla cuando quieras desde Configuración."
          actionLabel="Ir a Configuración"
          onAction={() => router.push('/profile/settings')}
        />
      ) : null}

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.brandSoftBackground,
            borderColor: prefs.highContrast ? colors.borderNormal : 'transparent',
            borderWidth: prefs.highContrast ? 2 : 0,
          },
        ]}
      >
        <AppText variant="subtitle">{'Una vía mejor empieza\ncon tu reporte.'}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Una foto y una ubicación pueden marcar la diferencia.
        </AppText>
        <AppButton
          label="Reportar problema"
          variant="primary"
          icon={<Plus size={20} color={colors.textOnAction} />}
          onPress={handleCreateReport}
        />
      </View>

      {isAdmin ? (
        <AppButton
          label="Abrir panel de administración"
          variant="secondary"
          icon={<Shield size={18} color={colors.brandPrimary} />}
          onPress={() => router.push('/admin')}
        />
      ) : null}

      {isAuthenticated ? (
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/reports')}
            accessibilityRole="button"
            accessibilityLabel={`Mis reportes: ${myTotal}`}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderNormal,
                borderWidth: prefs.highContrast ? 2 : 1,
              },
            ]}
          >
            <AppText variant="title" color={colors.brandPrimary}>
              {String(myTotal).padStart(2, '0')}
            </AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Mis reportes
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/reports')}
            accessibilityRole="button"
            accessibilityLabel={`Resueltos: ${myResolved}`}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.supportBackground,
                borderColor: prefs.highContrast ? colors.statusSuccess : 'transparent',
                borderWidth: prefs.highContrast ? 2 : 0,
              },
            ]}
          >
            <AppText variant="title" color={colors.brandSecondary}>
              {String(myResolved).padStart(2, '0')}
            </AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Resueltos
            </AppText>
          </Pressable>
        </View>
      ) : (
        <AlertBanner
          tone="info"
          title="Modo exploración"
          message="Para registrar incidencias y seguir tus propios reportes, inicia sesión o crea una cuenta."
          actionLabel="Iniciar sesión"
          onAction={() => router.push('/auth/login')}
        />
      )}

      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">Cerca de ti</AppText>
        <AppButton label="Ver mapa completo" variant="link" onPress={() => router.push('/(tabs)/map')} />
      </View>

      {!isSupabaseConfigured ? (
        <AlertBanner
          tone="warning"
          title="Conecta Supabase para ver incidencias reales"
          message="Configura .env con las credenciales públicas de tu proyecto Supabase y aplica las migraciones SQL."
        />
      ) : publicReportsQuery.isLoading ? (
        <SkeletonCard lines={3} />
      ) : publicReportsQuery.isError ? (
        <AlertBanner
          tone="error"
          title={translateAppError(publicReportsQuery.error).title}
          message={translateAppError(publicReportsQuery.error).message}
          actionLabel="Reintentar"
          onAction={() => publicReportsQuery.refetch()}
        />
      ) : (
        <>
          <InteractiveMap
            height={170}
            reports={recentPublic}
            onSelectReport={(rep) => router.push(`/report/${rep.id}`)}
          />
          {featuredReport ? (
            <ReportCard
              report={featuredReport}
              onPress={() => router.push(`/report/${featuredReport.id}`)}
            />
          ) : (
            <AlertBanner
              tone="info"
              title="Sin incidencias registradas aún"
              message="Cuando se registren reportes en la base de datos aparecerán aquí y en el mapa."
            />
          )}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    gap: SPACING.xs,
  },
  heroCard: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  statCard: {
    flex: 1,
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
});
