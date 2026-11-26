import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII } from '../theme/tokens';
import {
  DEFAULT_COORDS,
  getCategoryLabel,
  getStatusMeta,
  type PublicReport,
} from '../types/domain';

export interface InteractiveMapProps {
  height?: number;
  reports?: PublicReport[];
  selectedReportId?: string | null;
  onSelectReport?: (report: PublicReport) => void;
  pickerCoordinate?: { latitude: number; longitude: number } | null;
  onPickCoordinate?: (coord: { latitude: number; longitude: number }) => void;
  initialRegion?: Region;
}

export function InteractiveMap({
  height = 240,
  reports = [],
  selectedReportId,
  onSelectReport,
  pickerCoordinate,
  onPickCoordinate,
  initialRegion,
}: InteractiveMapProps) {
  const { colors, prefs } = useAccessibility();

  const region: Region = initialRegion ?? {
    latitude: pickerCoordinate?.latitude ?? reports[0]?.latitude ?? DEFAULT_COORDS.latitude,
    longitude: pickerCoordinate?.longitude ?? reports[0]?.longitude ?? DEFAULT_COORDS.longitude,
    latitudeDelta: DEFAULT_COORDS.latitudeDelta,
    longitudeDelta: DEFAULT_COORDS.longitudeDelta,
  };

  const handlePress = (event: MapPressEvent) => {
    if (onPickCoordinate) {
      onPickCoordinate(event.nativeEvent.coordinate);
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          height,
          borderColor: colors.borderNormal,
          borderWidth: prefs.highContrast ? 2 : 1,
        },
      ]}
    >
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onPress={handlePress}
        showsUserLocation
        showsMyLocationButton
        accessibilityLabel="Mapa interactivo de incidencias viales"
      >
        {reports.map((report) => {
          const isSelected = report.id === selectedReportId;
          const pinColor =
            report.status === 'resuelto'
              ? colors.statusSuccess
              : report.risk_level === 'alto'
                ? colors.statusError
                : colors.brandPrimary;

          return (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              pinColor={isSelected ? colors.actionPressed : pinColor}
              title={getCategoryLabel(report.category)}
              description={`${getStatusMeta(report.status).label} · ${report.address || report.tracking_code}`}
              onPress={() => onSelectReport?.(report)}
            />
          );
        })}

        {pickerCoordinate ? (
          <Marker
            coordinate={pickerCoordinate}
            draggable
            pinColor={colors.brandPrimary}
            title="Ubicación de la incidencia"
            description="Mantén presionado y arrastra para ajustar"
            onDragEnd={(e) => onPickCoordinate?.(e.nativeEvent.coordinate)}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: RADII.card,
    overflow: 'hidden',
  },
});
