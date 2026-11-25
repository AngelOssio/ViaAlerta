import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Filter, Plus, Search } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner, EmptyState, SkeletonCard } from '../../src/components/FeedbackStates';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { ReportCard } from '../../src/components/ReportCard';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { translateAppError } from '../../src/lib/errors';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { fetchPublicReports } from '../../src/services/reports';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type PublicReport,
  type ReportCategory,
  type ReportStatus,
} from '../../src/types/domain';

export default function MapScreen() {
  const router = useRouter();
  const { colors, prefs, getTextStyle, inputMinHeight, effectiveReduceMotion } = useAccessibility();
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ReportCategory | 'todas'>('todas');
  const [status, setStatus] = useState<ReportStatus | 'todos'>('todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PublicReport | null>(null);

  const reportsQuery = useQuery({
    queryKey: ['public-reports', category, status, search],
    queryFn: () => fetchPublicReports({ category, status, search }),
    enabled: isSupabaseConfigured,
  });

  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const activeReport =
    selectedReport && reports.some((r) => r.id === selectedReport.id)
      ? selectedReport
      : reports[0] ?? null;

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (category !== 'todas') {
      parts.push(REPORT_CATEGORIES.find((c) => c.value === category)?.shortLabel ?? category);
    }
    if (status !== 'todos') {
      parts.push(REPORT_STATUSES.find((s) => s.value === status)?.label ?? status);
    }
    return parts.length > 0 ? `Filtros · ${parts.join(', ')}` : 'Filtros · Todos los reportes';
  }, [category, status]);

  const handleCreateReport = () => {
    if (!isAuthenticated) {
      router.push('/auth/require-login');
      return;
    }
    router.push('/report/new');
  };

  return (
    <AppScreen>
      <AppText variant="title">Mapa de incidencias</AppText>

      <View
        style={[
          styles.searchBox,
          {
            minHeight: inputMinHeight,
            backgroundColor: colors.surface,
            borderColor: colors.borderControl,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar calle, distrito o código…"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Buscar calle, distrito o código"
          style={[styles.searchInput, getTextStyle('body'), { color: colors.textPrimary }]}
        />
      </View>

      <AppButton
        label={activeFilterSummary}
        variant="secondary"
        icon={<Filter size={18} color={colors.brandPrimary} />}
        onPress={() => setFilterOpen(true)}
      />

      {!isSupabaseConfigured ? (
        <AlertBanner
          tone="warning"
          title="Supabase sin configurar"
          message="Agrega tus claves públicas en .env para consultar las incidencias guardadas en PostgreSQL."
        />
      ) : reportsQuery.isLoading ? (
        <SkeletonCard lines={4} />
      ) : reportsQuery.isError ? (
        <AlertBanner
          tone="error"
          title={translateAppError(reportsQuery.error).title}
          message={translateAppError(reportsQuery.error).message}
          actionLabel="Reintentar"
          onAction={() => reportsQuery.refetch()}
        />
      ) : (
        <>
          <InteractiveMap
            height={230}
            reports={reports}
            selectedReportId={activeReport?.id ?? null}
            onSelectReport={(rep) => setSelectedReport(rep)}
          />

          <AppText variant="label">
            {reports.length === 1
              ? '1 incidencia encontrada'
              : `${reports.length} incidencias encontradas`}
          </AppText>

          {activeReport ? (
            <View style={styles.selectedBlock}>
              <ReportCard
                report={activeReport}
                onPress={() => router.push(`/report/${activeReport.id}`)}
              />
              <AppButton
                label="Ver detalle"
                variant="secondary"
                onPress={() => router.push(`/report/${activeReport.id}`)}
              />
            </View>
          ) : (
            <EmptyState
              title="No encontramos incidencias con esos filtros"
              description="Prueba restableciendo los filtros o registrando una nueva incidencia en tu zona."
              actionLabel="Restablecer filtros"
              onAction={() => {
                setCategory('todas');
                setStatus('todos');
                setSearch('');
              }}
            />
          )}
        </>
      )}

      <AppButton
        label="Reportar problema"
        variant="primary"
        icon={<Plus size={20} color={colors.textOnAction} />}
        onPress={handleCreateReport}
      />

      <Modal
        visible={filterOpen}
        animationType={effectiveReduceMotion ? 'none' : 'slide'}
        transparent
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.screenBackground, borderColor: colors.borderNormal },
            ]}
          >
            <ScrollView contentContainerStyle={styles.modalContent}>
              <AppText variant="title">Filtrar incidencias</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                Encuentra los reportes que te interesan.
              </AppText>

              <View style={[styles.filterCard, { backgroundColor: colors.surface, borderColor: colors.borderNormal }]}>
                <AppText variant="label">Tipo de incidencia</AppText>
                {([{ value: 'todas', label: 'Todas' }, ...REPORT_CATEGORIES] as const).map((item) => {
                  const selected = category === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setCategory(item.value as ReportCategory | 'todas')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={styles.radioRow}
                    >
                      <AppText variant="body" color={selected ? colors.brandPrimary : colors.textPrimary}>
                        {selected ? '●' : '○'} {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.filterCard, { backgroundColor: colors.surface, borderColor: colors.borderNormal }]}>
                <AppText variant="label">Estado</AppText>
                {([{ value: 'todos', label: 'Todos' }, ...REPORT_STATUSES] as const).map((item) => {
                  const selected = status === item.value;
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => setStatus(item.value as ReportStatus | 'todos')}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={styles.radioRow}
                    >
                      <AppText variant="body" color={selected ? colors.brandPrimary : colors.textPrimary}>
                        {selected ? '●' : '○'} {item.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <AppButton label="Aplicar filtros" variant="primary" onPress={() => setFilterOpen(false)} />
              <AppButton
                label="Restablecer filtros"
                variant="secondary"
                onPress={() => {
                  setCategory('todas');
                  setStatus('todos');
                  setFilterOpen(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.card,
    paddingHorizontal: SPACING.card,
    gap: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.base,
  },
  selectedBlock: {
    gap: SPACING.base,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderWidth: 1,
  },
  modalContent: {
    padding: SPACING.screenHorizontal,
    gap: SPACING.lg,
    paddingBottom: 36,
  },
  filterCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  radioRow: {
    paddingVertical: SPACING.xs,
  },
});
