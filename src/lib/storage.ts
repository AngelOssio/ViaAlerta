import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccessibilityPreferences, ReportDraft } from '../types/domain';

const KEYS = {
  ACCESSIBILITY: 'viaalerta:accessibility:v1',
  REPORT_DRAFT: 'viaalerta:report_draft:v1',
} as const;

export const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  textScale: 1,
  highContrast: false,
  largeControls: false,
  reduceMotion: false,
};

export async function loadAccessibilityPreferences(): Promise<AccessibilityPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACCESSIBILITY);
    if (!raw) return DEFAULT_ACCESSIBILITY;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    const validScale = ([1, 1.25, 1.5, 2] as const).includes(parsed.textScale as 1 | 1.25 | 1.5 | 2)
      ? (parsed.textScale as 1 | 1.25 | 1.5 | 2)
      : 1;
    return {
      textScale: validScale,
      highContrast: Boolean(parsed.highContrast),
      largeControls: Boolean(parsed.largeControls),
      reduceMotion: Boolean(parsed.reduceMotion),
    };
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

export async function saveAccessibilityPreferences(prefs: AccessibilityPreferences): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACCESSIBILITY, JSON.stringify(prefs));
}

export function generateUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEmptyReportDraft(): ReportDraft {
  return {
    clientSubmissionId: generateUuidV4(),
    category: 'hueco',
    description: '',
    riskLevel: 'medio',
    photoUri: null,
    photoFileName: null,
    photoMimeType: null,
    latitude: null,
    longitude: null,
    address: '',
    district: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function loadReportDraft(): Promise<ReportDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REPORT_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReportDraft;
    if (!parsed.clientSubmissionId) {
      parsed.clientSubmissionId = generateUuidV4();
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveReportDraft(draft: ReportDraft): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.REPORT_DRAFT,
    JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
  );
}

export async function clearReportDraft(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.REPORT_DRAFT);
}
