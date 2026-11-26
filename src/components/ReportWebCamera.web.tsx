import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { RADII, SPACING } from '../theme/tokens';
import { AppButton } from './AppButton';
import { AppText } from './AppText';
import { AlertBanner } from './FeedbackStates';
import type { ReportWebCameraProps } from './ReportWebCamera';

function cameraErrorMessage(error: unknown) {
  switch (error instanceof Error ? error.name : '') {
    case 'NotAllowedError':
      return 'Permite el acceso a la cámara en los ajustes del sitio y vuelve a intentarlo.';
    case 'NotFoundError':
      return 'El navegador no detectó una cámara en este dispositivo.';
    case 'NotReadableError':
      return 'No se pudo iniciar la cámara. Cierra otras aplicaciones que puedan estar usándola.';
    default:
      return 'No se pudo usar la cámara. También puedes adjuntar una foto desde la galería.';
  }
}

export function ReportWebCamera({ onCapture, onClose }: ReportWebCameraProps) {
  const { colors } = useAccessibility();
  const preview = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? null
      : 'La cámara web requiere una conexión HTTPS y un navegador compatible.'
  );

  useEffect(() => {
    const video = preview.current;
    if (!video || typeof navigator.mediaDevices?.getUserMedia !== 'function') return;

    let active = true;
    let stream: MediaStream | undefined;
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    }).then(async (cameraStream) => {
      stream = cameraStream;
      if (!active) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = cameraStream;
      await video.play();
    }).catch((cause: unknown) => {
      stream?.getTracks().forEach((track) => track.stop());
      if (active) setError(cameraErrorMessage(cause));
    });

    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, []);

  const capture = () => {
    const video = preview.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setError('No se pudo capturar la foto. Puedes elegir una imagen de la galería.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.75));
  };

  return (
    <View style={{ gap: SPACING.sm }}>
      <video
        ref={preview}
        autoPlay
        muted
        playsInline
        onPlaying={() => setReady(true)}
        aria-label="Vista previa de la cámara"
        style={{
          display: error ? 'none' : 'block',
          width: '100%',
          maxHeight: 360,
          backgroundColor: colors.surface,
          borderRadius: RADII.card,
        }}
      />
      {error ? (
        <AlertBanner tone="warning" title="Cámara no disponible" message={error} />
      ) : (
        <>
          {!ready && <AppText variant="note">Esperando acceso a la cámara…</AppText>}
          <AppButton label="Capturar foto" onPress={capture} disabled={!ready} />
        </>
      )}
      <AppButton label="Cerrar cámara" onPress={onClose} variant="link" />
    </View>
  );
}
