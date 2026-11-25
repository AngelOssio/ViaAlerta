import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LocateFixed } from 'lucide-react-native';
import { AppButton } from '../../src/components/AppButton';
import { AppScreen } from '../../src/components/AppScreen';
import { AppText } from '../../src/components/AppText';
import { AppTextField } from '../../src/components/AppTextField';
import { AlertBanner } from '../../src/components/FeedbackStates';
import { InteractiveMap } from '../../src/components/InteractiveMap';
import { useAccessibility } from '../../src/contexts/AccessibilityContext';
import { useReportDraft } from '../../src/contexts/ReportDraftContext';
import { SPACING } from '../../src/theme/tokens';
import { DEFAULT_COORDS } from '../../src/types/domain';

export default function SelectLocationScreen() {
  const router = useRouter();
  const { colors } = useAccessibility();
  const { draft, updateDraft } = useReportDraft();

  const [coord, setCoord] = useState({
    latitude: draft.latitude ?? DEFAULT_COORDS.latitude,
    longitude: draft.longitude ?? DEFAULT_COORDS.longitude,
  });
  const [address, setAddress] = useState(draft.address);
  const [district, setDistrict] = useState(draft.district || 'Chaclacayo, Lima');
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const reverseLookup = async (latitude: number, longitude: number) => {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (places[0]) {
        const p = places[0];
        const streetText = [p.street, p.streetNumber].filter(Boolean).join(' ') || p.name || '';
        const distText = [p.district || p.subregion || p.city, p.region].filter(Boolean).join(', ');
        if (streetText) setAddress(streetText);
        if (distText) setDistrict(distText);
      }
    } catch {
      // Dirección editable manualmente siempre disponible
    }
  };

  const handleUseGps = async () => {
    setGpsError(null);
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setGpsError(
          'Permiso de ubicación denegado. Toca directamente en el mapa para situar el marcador manualmente.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoord(next);
      await reverseLookup(next.latitude, next.longitude);
    } catch {
      setGpsError('No se pudo obtener la señal GPS. Toca en el mapa para ubicar el punto.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    updateDraft({
      latitude: coord.latitude,
      longitude: coord.longitude,
      address: address.trim(),
      district: district.trim(),
    });
    router.back();
  };

  return (
    <AppScreen onBack={() => router.back()}>
      <View style={styles.heading}>
        <AppText variant="title">Seleccionar ubicación</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Toca el mapa o arrastra el marcador azul para indicar el punto exacto.
        </AppText>
      </View>

      {gpsError ? (
        <AlertBanner tone="warning" title="Ubicación manual" message={gpsError} />
      ) : null}

      <InteractiveMap
        height={260}
        pickerCoordinate={coord}
        onPickCoordinate={(next) => {
          setCoord(next);
          reverseLookup(next.latitude, next.longitude).catch(() => {});
        }}
      />

      <AppText variant="note" color={colors.textSecondary}>
        Latitud: {coord.latitude.toFixed(6)} · Longitud: {coord.longitude.toFixed(6)}
      </AppText>

      <AppButton
        label="Usar mi ubicación GPS"
        variant="secondary"
        loading={locating}
        icon={<LocateFixed size={18} color={colors.brandPrimary} />}
        onPress={handleUseGps}
      />

      <AppTextField
        label="Dirección o referencia"
        placeholder="Ej. Av. Nicolás Ayllón frente al paradero"
        helperText="Opcional, ayuda a ubicar mejor el problema."
        value={address}
        onChangeText={setAddress}
      />

      <AppTextField
        label="Distrito o zona"
        placeholder="Ej. Chaclacayo, Lima"
        value={district}
        onChangeText={setDistrict}
      />

      <AppButton label="Confirmar ubicación" variant="primary" onPress={handleConfirm} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: SPACING.xs,
  },
});
