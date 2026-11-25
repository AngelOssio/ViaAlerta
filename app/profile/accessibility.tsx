import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { syncUserPreferences } from '../../src/services/account';
import { RADII, SPACING } from '../../src/theme/tokens';

const TEXT_SCALES: { value: 1 | 1.25 | 1.5 | 2; label: string }[] = [
  { value: 1, label: '100 %' },
  { value: 1.25, label: '125 %' },
  { value: 1.5, label: '150 %' },
  { value: 2, label: '200 %' },
];

export default function AccessibilityScreen() {
  const router = useRouter();
  const { prefs, colors, systemReduceMotion, updatePrefs, resetPrefs } = useAccessibility();
  const { user, isAuthenticated } = useAuth();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      if (isAuthenticated && user) {
        await syncUserPreferences({ userId: user.id, accessibility: prefs });
      }
      setSavedMsg(
        'Tus ajustes de accesibilidad quedaron guardados en este dispositivo' +
          (isAuthenticated ? ' y sincronizados con tu cuenta.' : '.')
      );
    } catch {
      setSavedMsg('Tus ajustes quedaron guardados localmente en este dispositivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Accesibilidad</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Adapta la lectura y los controles a tus necesidades. Todos los cambios se aplican de
          inmediato en toda la aplicación.
        </AppText>
      </View>

      {savedMsg ? (
        <AlertBanner tone="success" title="Cambios guardados" message={savedMsg} />
      ) : null}

      {/* 1. Tamaño del texto hasta 200 % */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <AppText variant="subtitle">Tamaño del texto</AppText>
        <AppText variant="note" color={colors.textSecondary}>
          Escala el texto desde 100 % hasta 200 % sin recortar contenido.
        </AppText>
        <View style={styles.scaleRow} accessibilityRole="radiogroup">
          {TEXT_SCALES.map((item) => {
            const selected = prefs.textScale === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => updatePrefs({ textScale: item.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Tamaño de texto ${item.label}`}
                style={[
                  styles.scaleChip,
                  {
                    backgroundColor: selected ? colors.brandSoftBackground : colors.screenBackground,
                    borderColor: selected ? colors.brandPrimary : colors.borderNormal,
                    borderWidth: selected || prefs.highContrast ? 2 : 1,
                    minHeight: prefs.largeControls ? 56 : 44,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  color={selected ? colors.brandPrimary : colors.textPrimary}
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Alto contraste */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <View style={styles.switchRow}>
          <View style={styles.flexText}>
            <AppText variant="subtitle">Alto contraste</AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Distingue mejor el texto, los botones y los bordes con mayor relación de contraste.
            </AppText>
          </View>
          <Switch
            value={prefs.highContrast}
            onValueChange={(value) => updatePrefs({ highContrast: value })}
            accessibilityLabel="Activar alto contraste"
            trackColor={{ false: colors.actionDisabled, true: colors.brandPrimary }}
          />
        </View>
      </View>

      {/* 3. Controles grandes (64 px) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <View style={styles.switchRow}>
          <View style={styles.flexText}>
            <AppText variant="subtitle">Controles grandes</AppText>
            <AppText variant="note" color={colors.textSecondary}>
              Amplía las áreas táctiles de botones y controles de 52 px a 64 px.
            </AppText>
          </View>
          <Switch
            value={prefs.largeControls}
            onValueChange={(value) => updatePrefs({ largeControls: value })}
            accessibilityLabel="Activar controles grandes"
            trackColor={{ false: colors.actionDisabled, true: colors.brandPrimary }}
          />
        </View>
      </View>

      {/* 4. Movimiento reducido */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <View style={styles.switchRow}>
          <View style={styles.flexText}>
            <AppText variant="subtitle">Movimiento reducido</AppText>
            <AppText variant="note" color={colors.textSecondary}>
              {systemReduceMotion
                ? 'Tu dispositivo ya tiene activado movimiento reducido; VíaAlerta lo respeta automáticamente.'
                : 'Desactiva transiciones animadas entre pantallas y diálogos.'}
            </AppText>
          </View>
          <Switch
            value={prefs.reduceMotion || systemReduceMotion}
            onValueChange={(value) => updatePrefs({ reduceMotion: value })}
            accessibilityLabel="Activar movimiento reducido"
            trackColor={{ false: colors.actionDisabled, true: colors.brandPrimary }}
          />
        </View>
      </View>

      {/* Vista previa combinada en tiempo real (fiel a Figma 4224:584) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderNormal,
            borderWidth: prefs.highContrast ? 2 : 1,
          },
        ]}
      >
        <AppText variant="note" color={colors.textSecondary}>
          Vista previa combinada en vivo
        </AppText>
        <AppText variant="subtitle">Reporte en revisión</AppText>
        <AppText variant="body">
          Recibimos tu aviso sobre un hueco en la pista frente al paradero.
        </AppText>
        <StatusBadge status="en_revision" />
        <AppText variant="label" color={colors.textSecondary}>
          Ejemplo: VA-2026-014
        </AppText>
        <AppButton
          label="Botón de muestra"
          variant="primary"
          onPress={() => {}}
        />
      </View>

      <AppButton
        label="Guardar preferencias"
        variant="primary"
        loading={saving}
        onPress={handleSave}
      />

      <AppButton
        label="Restablecer valores predeterminados"
        variant="secondary"
        onPress={async () => {
          await resetPrefs();
          setSavedMsg('Se restablecieron los valores predeterminados de accesibilidad.');
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  scaleChip: {
    flexGrow: 1,
    minWidth: 72,
    borderRadius: RADII.button,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  flexText: {
    flex: 1,
    gap: SPACING.xs,
  },
});
