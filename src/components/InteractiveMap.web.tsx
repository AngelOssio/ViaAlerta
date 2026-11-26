import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII } from '../theme/tokens';
import { DEFAULT_COORDS, getCategoryLabel } from '../types/domain';
import type { InteractiveMapProps } from './InteractiveMap';

function pin(color: string, selected = false) {
  const dot = document.createElement('span');
  Object.assign(dot.style, {
    display: 'block',
    width: '18px',
    height: '18px',
    boxSizing: 'border-box',
    borderRadius: '50%',
    border: '2px solid white',
    backgroundColor: color,
    boxShadow: selected ? '0 0 0 3px #172435' : '0 1px 5px #0008',
  });
  return L.divIcon({ className: '', html: dot, iconSize: [18, 18], iconAnchor: [9, 9] });
}

const EMPTY_REPORTS: NonNullable<InteractiveMapProps['reports']> = [];

export function InteractiveMap({
  height = 240,
  reports = EMPTY_REPORTS,
  selectedReportId,
  onSelectReport,
  pickerCoordinate,
  onPickCoordinate,
  initialRegion,
}: InteractiveMapProps) {
  const { colors, prefs } = useAccessibility();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const reportLayer = useRef<L.LayerGroup | null>(null);
  const callbacks = useRef({ onSelectReport, onPickCoordinate });
  const initialCenter = useRef(initialRegion ?? pickerCoordinate ?? reports[0] ?? DEFAULT_COORDS);
  const centerOnFirstReport = useRef(!initialRegion && !pickerCoordinate && !reports.length);
  const latitude = pickerCoordinate?.latitude;
  const longitude = pickerCoordinate?.longitude;

  useEffect(() => {
    callbacks.current = { onSelectReport, onPickCoordinate };
  }, [onSelectReport, onPickCoordinate]);

  useEffect(() => {
    if (!container.current) return;
    const { latitude, longitude } = initialCenter.current;
    const map = L.map(container.current, { scrollWheelZoom: false })
      .setView([latitude, longitude], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.on('click', ({ latlng }: L.LeafletMouseEvent) => {
      callbacks.current.onPickCoordinate?.({ latitude: latlng.lat, longitude: latlng.lng });
    });

    mapRef.current = map;
    reportLayer.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      reportLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = reportLayer.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (centerOnFirstReport.current && reports.length) {
      map.panTo([reports[0].latitude, reports[0].longitude], { animate: false });
      centerOnFirstReport.current = false;
    }
    for (const report of reports) {
      const label = getCategoryLabel(report.category) + ' · ' + report.tracking_code;
      const color = report.status === 'resuelto'
        ? colors.statusSuccess
        : report.risk_level === 'alto' ? colors.statusError : colors.brandPrimary;
      const selected = report.id === selectedReportId;
      const marker = L.marker([report.latitude, report.longitude], {
        title: label,
        icon: pin(color, selected),
        zIndexOffset: selected ? 100 : 0,
      }).addTo(layer);
      const tooltip = document.createElement('span');
      tooltip.textContent = label;
      marker.bindTooltip(tooltip);
      marker.on('click', () => callbacks.current.onSelectReport?.(report));
    }
  }, [reports, selectedReportId, colors]);

  const canPick = Boolean(onPickCoordinate);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude === undefined || longitude === undefined) return;

    map.panInside([latitude, longitude]);
    const marker = L.marker([latitude, longitude], {
      title: 'Ubicación de la incidencia',
      draggable: canPick,
      icon: pin(colors.brandPrimary, true),
    }).addTo(map);
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      callbacks.current.onPickCoordinate?.({ latitude: lat, longitude: lng });
    });

    return () => { marker.remove(); };
  }, [latitude, longitude, canPick, colors.brandPrimary]);

  return (
    <div
      ref={container}
      role="region"
      aria-label="Mapa interactivo de incidencias viales"
      style={{
        width: '100%',
        height,
        borderRadius: RADII.card,
        border: (prefs.highContrast ? '2px' : '1px') + ' solid ' + colors.borderNormal,
        overflow: 'hidden',
        boxSizing: 'border-box',
        isolation: 'isolate',
      }}
    />
  );
}
