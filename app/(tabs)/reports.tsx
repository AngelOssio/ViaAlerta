import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, EmptyState, SkeletonCard } from '../../src/components/FeedbackStates';
import { ReportCard } from '../../src/components/ReportCard';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { fetchMyReports } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';

type MyReportFilterTab = 'todos' | 'activos' | 'resuelto';

export default function MyReportsScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { user, isAuthenticated } = useAuth();
  const [filterTab, setFilterTab] = useState<MyReportFilterTab>('todos');

  const query = useQuery({
    queryKey: ['my-reports', user?.id, filterTab],
    queryFn: () => fetchMyReports(user!.id, { status: filterTab }),
    enabled: isAuthenticated && Boolean(user?.id) && isSupabaseConfigured,
  });

  if (!isAuthenticated) {
    return (
      <AppScreen>
        <AppText variant="title">Mis reportes</AppText>
        <AlertBanner
          tone="info"
          title="Necesitas una cuenta para ver tus reportes"
          message="Inicia sesión o crea una cuenta para registrar incidencias y consultar su historial de seguimiento."
          actionLabel="Iniciar sesión"
          onAction={() => router.push('/auth/login')}
        />
        <AppButton
          label="Crear una cuenta"
          variant="secondary"
          onPress={() => router.push('/auth/register')}
        />
      </AppScreen>
    );
  }

  const tabs: { key: MyReportFilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'resuelto', label: 'Resueltos' },
  ];

  const reports = query.data ?? [];

  return (
    <AppScreen>
      <View style={styles.heading}>
        <AppText variant="title">Mis reportes</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Consulta el avance de tus incidencias.
        </AppText>
      </View>

      <View style={styles.filterRow} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const active = filterTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilterTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.brandSoftBackground : colors.surface,
                  borderColor: active ? colors.brandPrimary : colors.borderNormal,
                  borderWidth: active || prefs.highContrast ? 2 : 1,
                  minHeight: prefs.largeControls ? 52 : 40,
                },
              ]}
            >
              <AppText variant="label" color={active ? colors.brandPrimary : colors.textSecondary}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {!isSupabaseConfigured ? (
        <AlertBanner
          tone="warning"
          title="Supabase sin configurar"
          message="Configura tu archivo .env para consultar y persistir tus reportes."
        />
      ) : query.isLoading ? (
        <View style={styles.list}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </View>
      ) : query.isError ? (
        <AlertBanner
          tone="error"
          title={translateAppError(query.error).title}
          message={translateAppError(query.error).message}
          actionLabel="Reintentar"
          onAction={() => query.refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="Todavía no tienes reportes"
          description={
            filterTab === 'todos'
              ? 'Cuando registres un bache, vereda o señal dañada aparecerá aquí para hacer seguimiento.'
              : 'No tienes reportes en esta categoría de estado.'
          }
          actionLabel="Crear nuevo reporte"
          onAction={() => router.push('/report/new')}
        />
      ) : (
        <View style={styles.list}>
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => router.push(`/report/${report.id}`)}
            />
          ))}
        </View>
      )}

      <AppButton
        label="Crear nuevo reporte"
        variant="primary"
        icon={<Plus size={20} color={colors.textOnAction} />}
        onPress={() => router.push('/report/new')}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.card,
    paddingVertical: SPACING.md,
    borderRadius: RADII.pill,
    justifyContent: 'center',
  },
  list: {
    gap: SPACING.lg,
  },
});
