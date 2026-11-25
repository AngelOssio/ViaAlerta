import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  AlertTriangle,
  Camera,
  Construction,
  Image as ImageIcon,
  LocateFixed,
  MapPin,
  ShieldAlert,
} from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AppTextField } from '../../src/components/AppTextField';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useReportDraft } from '../../src/contexts/ReportDraftContext';
import { RADII, SPACING } from '../../src/theme/tokens';
import {
  REPORT_CATEGORIES,
  REPORT_RISKS,
  type ReportCategory,
} from '../../src/types/domain';
import { reportFormSchema } from '../../src/validation/schemas';

function CategoryGlyph({ value, color }: { value: ReportCategory; color: string }) {
  switch (value) {
    case 'hueco':
      return <AlertTriangle size={22} color={color} />;
    case 'vereda':
      return <Construction size={22} color={color} />;
    case 'senalizacion':
      return <MapPin size={22} color={color} />;
    case 'buzon':
      return <ShieldAlert size={22} color={color} />;
  }
}

export default function NewReportScreen() {
  const router = useRouter();
  const { colors, prefs } = useAccessibility();
  const { isAuthenticated } = useAuth();
  const { draft, updateDraft } = useReportDraft();

  const [locating, setLocating] = useState(false);
  const [permissionBanner, setPermissionBanner] = useState<{
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isAuthenticated) {
    return (
      <AppScreen onBack={() => router.back()}>
        <AppText variant="title">Inicia sesión para reportar</AppText>
        <AlertBanner
          tone="info"
          title="Acceso requerido"
          message="Necesitas una cuenta activa para registrar incidencias con fotografía y ubicación."
          actionLabel="Iniciar sesión"
          onAction={() => router.replace('/auth/login')}
        />
      </AppScreen>
    );
  }

  const pickFromGallery = async () => {
    setPermissionBanner(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPermissionBanner({
        title: 'Permiso de galería rechazado',
        message:
          'Necesitamos acceso a tus fotografías para adjuntar evidencia. Puedes habilitarlo en los ajustes del teléfono o tomar una foto con la cámara.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      updateDraft({
        photoUri: asset.uri,
        photoFileName: asset.fileName || 'incidencia.jpg',
        photoMimeType: asset.mimeType || 'image/jpeg',
      });
      setFieldErrors((prev) => ({ ...prev, photoUri: '' }));
    }
  };

  const takePhotoWithCamera = async () => {
    setPermissionBanner(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setPermissionBanner({
        title: 'Permiso de cámara rechazado',
        message:
          'No tenemos acceso a la cámara. Puedes seleccionar una fotografía existente desde tu galería.',
        actionLabel: 'Elegir de galería',
        onAction: pickFromGallery,
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      updateDraft({
        photoUri: asset.uri,
        photoFileName: asset.fileName || 'camara_incidencia.jpg',
        photoMimeType: asset.mimeType || 'image/jpeg',
      });
      setFieldErrors((prev) => ({ ...prev, photoUri: '' }));
    }
  };

  const requestCurrentLocation = async () => {
    setPermissionBanner(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setPermissionBanner({
          title: 'Ubicación no disponible',
          message:
            'El permiso de ubicación fue rechazado. Puedes marcar el punto manualmente en el mapa.',
          actionLabel: 'Seleccionar en el mapa',
          onAction: () => router.push('/report/location'),
        });
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let address = '';
      let district = '';
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (places[0]) {
          const p = places[0];
          address = [p.street, p.streetNumber].filter(Boolean).join(' ') || p.name || '';
          district = [p.district || p.subregion || p.city, p.region].filter(Boolean).join(', ');
        }
      } catch {
        // Dirección opcional si el geocoder falla sin red
      }

      updateDraft({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: address || draft.address,
        district: district || draft.district || 'Lima',
      });
      setFieldErrors((prev) => ({ ...prev, latitude: '' }));
    } catch {
      setPermissionBanner({
        title: 'No pudimos obtener tu ubicación GPS',
        message: 'Verifica que el GPS esté encendido o marca el punto manualmente en el mapa.',
        actionLabel: 'Seleccionar en el mapa',
        onAction: () => router.push('/report/location'),
      });
    } finally {
      setLocating(false);
    }
  };

  const handleContinueToReview = () => {
    const parsed = reportFormSchema.safeParse({
      category: draft.category,
      description: draft.description,
      riskLevel: draft.riskLevel,
      photoUri: draft.photoUri ?? '',
      latitude: draft.latitude ?? undefined,
      longitude: draft.longitude ?? undefined,
      address: draft.address,
      district: draft.district,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'general');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    router.push('/report/review');
  };

  const hasLocation = draft.latitude !== null && draft.longitude !== null;
  const hasValidationErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <AppScreen onBack={() => router.back()} backLabel="Volver">
      <View style={styles.heading}>
        <AppText variant="title">Nuevo reporte</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Cuéntanos qué sucede en la vía.
        </AppText>
      </View>

      {permissionBanner ? (
        <AlertBanner
          tone="warning"
          title={permissionBanner.title}
          message={permissionBanner.message}
          actionLabel={permissionBanner.actionLabel}
          onAction={permissionBanner.onAction}
        />
      ) : null}

      {hasValidationErrors ? (
        <AlertBanner
          tone="error"
          title="Completa tu reporte"
          message="Revisa los campos marcados en rojo antes de continuar a la revisión."
        />
      ) : null}

      {/* 1. Categoría */}
      <View style={styles.section}>
        <AppText variant="label">Tipo de problema *</AppText>
        <View style={styles.categoryGrid}>
          {REPORT_CATEGORIES.map((item) => {
            const selected = draft.category === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => updateDraft({ category: item.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: selected ? colors.brandSoftBackground : colors.surface,
                    borderColor: selected ? colors.brandPrimary : colors.borderNormal,
                    borderWidth: selected || prefs.highContrast ? 2 : 1,
                    minHeight: prefs.largeControls ? 84 : 72,
                  },
                ]}
              >
                <CategoryGlyph
                  value={item.value}
                  color={selected ? colors.brandPrimary : colors.textSecondary}
                />
                <AppText
                  variant="note"
                  color={selected ? colors.brandPrimary : colors.textPrimary}
                  style={styles.centerText}
                >
                  {item.shortLabel}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Fotografía */}
      <View style={styles.section}>
        <AppText variant="label">Fotografía *</AppText>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: fieldErrors.photoUri ? colors.statusError : colors.borderNormal,
              borderWidth: fieldErrors.photoUri || prefs.highContrast ? 2 : 1,
            },
          ]}
        >
          {draft.photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image
                source={{ uri: draft.photoUri }}
                style={styles.photoPreview}
                accessibilityLabel="Vista previa de la fotografía seleccionada"
              />
              <AppText variant="note" color={colors.statusSuccess}>
                ✓ Fotografía seleccionada · {draft.photoFileName || 'imagen.jpg'}
              </AppText>
            </View>
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              Adjunta una foto clara donde se aprecie el problema en la vía.
            </AppText>
          )}

          <View style={styles.photoActions}>
            <AppButton
              label="Tomar foto"
              variant="secondary"
              icon={<Camera size={18} color={colors.brandPrimary} />}
              onPress={takePhotoWithCamera}
            />
            <AppButton
              label="Elegir de galería"
              variant="secondary"
              icon={<ImageIcon size={18} color={colors.brandPrimary} />}
              onPress={pickFromGallery}
            />
          </View>
        </View>
        {fieldErrors.photoUri ? (
          <AppText variant="note" color={colors.statusError}>
            {fieldErrors.photoUri}
          </AppText>
        ) : null}
      </View>

      {/* 3. Ubicación */}
      <View style={styles.section}>
        <AppText variant="label">Ubicación *</AppText>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: fieldErrors.latitude ? colors.statusError : colors.borderNormal,
              borderWidth: fieldErrors.latitude || prefs.highContrast ? 2 : 1,
            },
          ]}
        >
          {hasLocation ? (
            <View style={styles.locSummary}>
              <AppText variant="body">
                {draft.address || 'Punto marcado en el mapa'}
                {draft.district ? `, ${draft.district}` : ''}
              </AppText>
              <AppText variant="note" color={colors.textSecondary}>
                Coordenadas: {draft.latitude!.toFixed(5)}, {draft.longitude!.toFixed(5)}
              </AppText>
            </View>
          ) : (
            <AppText variant="body" color={colors.textSecondary}>
              Usa tu GPS actual o selecciona el punto manualmente en el mapa.
            </AppText>
          )}

          <AppButton
            label="Usar mi ubicación actual"
            variant="secondary"
            loading={locating}
            icon={<LocateFixed size={18} color={colors.brandPrimary} />}
            onPress={requestCurrentLocation}
          />
          <AppButton
            label={hasLocation ? 'Ajustar ubicación en el mapa' : 'Seleccionar en el mapa'}
            variant="secondary"
            icon={<MapPin size={18} color={colors.brandPrimary} />}
            onPress={() => router.push('/report/location')}
          />
        </View>
        {fieldErrors.latitude ? (
          <AppText variant="note" color={colors.statusError}>
            {fieldErrors.latitude}
          </AppText>
        ) : null}
      </View>

      {/* 4. Descripción */}
      <AppTextField
        label="Descripción"
        required
        multiline
        placeholder="Describe el problema y una referencia cercana…"
        helperText="Incluye detalles útiles (tamaño, peligro para peatones o vehículos, referencia)."
        value={draft.description}
        onChangeText={(text) => {
          updateDraft({ description: text });
          if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
        }}
        error={fieldErrors.description}
      />

      {/* 5. Nivel de riesgo */}
      <View style={styles.section}>
        <AppText variant="label">Riesgo percibido *</AppText>
        <View style={styles.riskRow} accessibilityRole="radiogroup">
          {REPORT_RISKS.map((item) => {
            const selected = draft.riskLevel === item.value;
            const bg = selected
              ? item.value === 'alto'
                ? colors.statusWarningBg
                : colors.brandSoftBackground
              : colors.surface;
            const fg = selected
              ? item.value === 'alto'
                ? colors.statusWarning
                : colors.brandPrimary
              : colors.textSecondary;

            return (
              <Pressable
                key={item.value}
                onPress={() => updateDraft({ riskLevel: item.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.riskPill,
                  {
                    backgroundColor: bg,
                    borderColor: selected ? fg : colors.borderNormal,
                    borderWidth: selected || prefs.highContrast ? 2 : 1,
                    minHeight: prefs.largeControls ? 54 : 42,
                  },
                ]}
              >
                <AppText variant="note" color={fg} style={styles.centerText}>
                  {selected ? '●' : '○'} {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AppText variant="note" color={colors.textSecondary}>
        * Campos obligatorios. Tu borrador se guarda automáticamente en este dispositivo.
      </AppText>

      <AppButton
        label="Revisar reporte"
        variant="primary"
        onPress={handleContinueToReview}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
  section: {
    gap: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADII.card,
    padding: SPACING.card,
    gap: SPACING.base,
  },
  photoPreviewWrap: {
    gap: SPACING.md,
  },
  photoPreview: {
    width: '100%',
    height: 190,
    borderRadius: RADII.button,
  },
  photoActions: {
    gap: SPACING.md,
  },
  locSummary: {
    gap: SPACING.xs,
  },
  riskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  riskPill: {
    flexGrow: 1,
    minWidth: 96,
    borderRadius: RADII.card,
    paddingHorizontal: SPACING.card,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
