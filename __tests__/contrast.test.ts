import { evaluatePair } from '../src/theme/contrast';
import { HIGH_CONTRAST_PALETTE, LIGHT_PALETTE } from '../src/theme/tokens';

describe('Verificación matemática de contraste WCAG 2.1', () => {
  test('Paleta Clara cumple >= 4.5:1 en textos clave y >= 3:1 en bordes de control', () => {
    const checks = [
      evaluatePair('Texto principal sobre fondo pantalla', LIGHT_PALETTE.textPrimary, LIGHT_PALETTE.screenBackground),
      evaluatePair('Texto principal sobre superficie blanca', LIGHT_PALETTE.textPrimary, LIGHT_PALETTE.surface),
      evaluatePair('Texto secundario sobre superficie blanca', LIGHT_PALETTE.textSecondary, LIGHT_PALETTE.surface),
      evaluatePair('Texto secundario sobre fondo pantalla', LIGHT_PALETTE.textSecondary, LIGHT_PALETTE.screenBackground),
      evaluatePair('Botón principal (blanco sobre azul)', LIGHT_PALETTE.textOnAction, LIGHT_PALETTE.actionPrimary),
      evaluatePair('Botón peligro (blanco sobre rojo error)', LIGHT_PALETTE.textOnAction, LIGHT_PALETTE.statusError),
      evaluatePair('Texto advertencia sobre fondo advertencia', LIGHT_PALETTE.statusWarning, LIGHT_PALETTE.statusWarningBg),
      evaluatePair('Texto éxito sobre fondo éxito', LIGHT_PALETTE.statusSuccess, LIGHT_PALETTE.statusSuccessBg),
      evaluatePair('Borde de control sobre fondo pantalla', LIGHT_PALETTE.borderControl, LIGHT_PALETTE.screenBackground),
    ];

    for (const check of checks) {
      if (check.name.includes('Borde de control')) {
        expect(check.passesUI).toBe(true);
      } else {
        expect(check.passesAA).toBe(true);
      }
    }
  });

  test('Paleta Alto Contraste supera >= 7:1 (AAA) en textos principales y botón principal', () => {
    const checks = [
      evaluatePair('HC Texto principal sobre fondo', HIGH_CONTRAST_PALETTE.textPrimary, HIGH_CONTRAST_PALETTE.screenBackground),
      evaluatePair('HC Texto secundario sobre superficie', HIGH_CONTRAST_PALETTE.textSecondary, HIGH_CONTRAST_PALETTE.surface),
      evaluatePair('HC Botón principal', HIGH_CONTRAST_PALETTE.textOnAction, HIGH_CONTRAST_PALETTE.actionPrimary),
      evaluatePair('HC Botón peligro', HIGH_CONTRAST_PALETTE.textOnAction, HIGH_CONTRAST_PALETTE.statusError),
      evaluatePair('HC Borde de control', HIGH_CONTRAST_PALETTE.borderControl, HIGH_CONTRAST_PALETTE.screenBackground),
    ];

    for (const check of checks) {
      expect(check.passesAAA).toBe(true);
    }
  });
});
