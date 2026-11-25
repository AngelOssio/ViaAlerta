import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearReportDraft,
  createEmptyReportDraft,
  loadReportDraft,
  saveReportDraft,
} from '../lib/storage';
import type { ReportDraft } from '../types/domain';

interface ReportDraftContextValue {
  draft: ReportDraft;
  hydrated: boolean;
  updateDraft: (patch: Partial<ReportDraft>) => void;
  resetDraft: () => Promise<void>;
}

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

export function ReportDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadReportDraft().then((saved) => {
      if (mounted) {
        if (saved) setDraft(saved);
        setHydrated(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<ReportDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      saveReportDraft(next).catch(() => {});
      return next;
    });
  }, []);

  const resetDraft = useCallback(async () => {
    const fresh = createEmptyReportDraft();
    setDraft(fresh);
    await clearReportDraft();
  }, []);

  const value = useMemo(
    () => ({ draft, hydrated, updateDraft, resetDraft }),
    [draft, hydrated, updateDraft, resetDraft]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft(): ReportDraftContextValue {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) {
    throw new Error('useReportDraft debe usarse dentro de ReportDraftProvider');
  }
  return ctx;
}
