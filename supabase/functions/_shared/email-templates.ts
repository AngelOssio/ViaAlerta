// Plantillas accesibles (HTML semántico + texto plano) basadas en los 4 correos de Figma.
// No usa dominios .example como remitentes reales; el remitente se configura por variable EMAIL_FROM.

export type EmailTemplateName =
  | 'welcome'
  | 'password_recovery'
  | 'report_registered'
  | 'deletion_requested';

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapAccessibleHtml(title: string, bodyHtml: string, supportEmail: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#F3F6FA;font-family:Inter,Arial,Helvetica,sans-serif;color:#172B45;line-height:1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;border:1px solid #C5CFDB;border-radius:16px;">
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:#17489D;">VíaAlerta</p>
        ${bodyHtml}
        <hr style="border:none;border-top:1px solid #C5CFDB;margin:20px 0;" />
        <p style="margin:0;font-size:12px;color:#596B80;">
          Mensaje automático de VíaAlerta. Si necesitas ayuda, escribe a ${escapeHtml(supportEmail)}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderTransactionalEmail(
  template: EmailTemplateName,
  payload: Record<string, string>,
  supportEmail: string
): EmailRenderResult {
  const userName = payload.userName || 'vecino/a';
  const actionUrl = payload.actionUrl || 'viaalerta://';

  switch (template) {
    case 'welcome': {
      const subject = 'Bienvenido a VíaAlerta · Verifica tu cuenta';
      const html = wrapAccessibleHtml(
        subject,
        `<h1 style="margin:0 0 12px 0;font-size:22px;color:#172B45;">¡Hola, ${escapeHtml(userName)}!</h1>
        <p style="margin:0 0 14px 0;font-size:14px;color:#172B45;">
          Tu cuenta en VíaAlerta quedó registrada. Ya puedes reportar incidencias en la vía pública y consultar su seguimiento.
        </p>
        <p style="margin:16px 0;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background-color:#2463D4;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px;">
            Abrir VíaAlerta
          </a>
        </p>`,
        supportEmail
      );
      const text = [
        'VíaAlerta',
        '',
        `¡Hola, ${userName}!`,
        'Tu cuenta en VíaAlerta quedó registrada. Ya puedes reportar incidencias en la vía pública y consultar su seguimiento.',
        '',
        `Abrir VíaAlerta: ${actionUrl}`,
        `Ayuda: ${supportEmail}`,
      ].join('\n');
      return { subject, html, text };
    }

    case 'password_recovery': {
      const subject = 'Recupera el acceso a tu cuenta de VíaAlerta';
      const html = wrapAccessibleHtml(
        subject,
        `<h1 style="margin:0 0 12px 0;font-size:22px;color:#172B45;">Restablecer contraseña</h1>
        <p style="margin:0 0 14px 0;font-size:14px;color:#172B45;">
          Recibimos una solicitud para cambiar tu contraseña en VíaAlerta. Usa el siguiente enlace para continuar:
        </p>
        <p style="margin:16px 0;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background-color:#2463D4;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px;">
            Crear nueva contraseña
          </a>
        </p>
        <p style="margin:0;font-size:12px;color:#596B80;">
          Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>`,
        supportEmail
      );
      const text = [
        'VíaAlerta - Restablecer contraseña',
        '',
        'Recibimos una solicitud para cambiar tu contraseña.',
        `Enlace para restablecer: ${actionUrl}`,
        '',
        'Si no solicitaste este cambio, ignora este mensaje.',
        `Ayuda: ${supportEmail}`,
      ].join('\n');
      return { subject, html, text };
    }

    case 'report_registered': {
      const trackingCode = payload.trackingCode || 'VA-0000-000';
      const categoryLabel = payload.categoryLabel || 'Incidencia vial';
      const address = payload.address || 'Ubicación registrada en el mapa';
      const statusLabel = payload.statusLabel || 'Recibido';
      const subject = `Recibimos tu reporte ${trackingCode}`;
      const html = wrapAccessibleHtml(
        subject,
        `<h1 style="margin:0 0 10px 0;font-size:22px;color:#172B45;">Tu reporte quedó registrado</h1>
        <p style="margin:0 0 14px 0;font-size:14px;color:#172B45;">
          Gracias por avisarnos, ${escapeHtml(userName)}. Ya puedes consultar el seguimiento de la incidencia.
        </p>
        <div style="background-color:#EAF1FE;border-radius:12px;padding:14px;margin:0 0 16px 0;font-size:13px;color:#172B45;">
          <p style="margin:0 0 4px 0;"><strong>Código:</strong> ${escapeHtml(trackingCode)}</p>
          <p style="margin:0 0 4px 0;"><strong>Incidencia:</strong> ${escapeHtml(categoryLabel)}</p>
          <p style="margin:0 0 4px 0;"><strong>Ubicación:</strong> ${escapeHtml(address)}</p>
          <p style="margin:0;"><strong>Estado:</strong> ${escapeHtml(statusLabel)}</p>
        </div>
        <p style="margin:16px 0;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background-color:#2463D4;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px;">
            Ver seguimiento del reporte
          </a>
        </p>`,
        supportEmail
      );
      const text = [
        'VíaAlerta - Tu reporte quedó registrado',
        '',
        `Gracias por avisarnos, ${userName}.`,
        `Código: ${trackingCode}`,
        `Incidencia: ${categoryLabel}`,
        `Ubicación: ${address}`,
        `Estado: ${statusLabel}`,
        '',
        `Ver seguimiento: ${actionUrl}`,
        `Ayuda: ${supportEmail}`,
      ].join('\n');
      return { subject, html, text };
    }

    case 'deletion_requested': {
      const scheduledFor = payload.scheduledFor || 'en 30 días';
      const subject = 'Confirmación: solicitud de eliminación de cuenta en VíaAlerta';
      const html = wrapAccessibleHtml(
        subject,
        `<h1 style="margin:0 0 10px 0;font-size:22px;color:#172B45;">Eliminación programada</h1>
        <p style="margin:0 0 14px 0;font-size:14px;color:#172B45;">
          Hola, ${escapeHtml(userName)}. Registramos tu solicitud de eliminación de cuenta.
        </p>
        <div style="background-color:#EAF1FE;border-radius:12px;padding:14px;margin:0 0 16px 0;font-size:13px;color:#172B45;">
          <p style="margin:0 0 6px 0;"><strong>Periodo de gracia (decisión del proyecto):</strong> 30 días.</p>
          <p style="margin:0 0 6px 0;"><strong>Fecha programada:</strong> ${escapeHtml(scheduledFor)}</p>
          <p style="margin:0;">Al vencer el plazo, se eliminará tu perfil y correo, y tus reportes previos permanecerán anonimizados durante 12 meses para seguimiento vial.</p>
        </div>
        <p style="margin:16px 0;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background-color:#2463D4;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px;">
            Cancelar solicitud de eliminación
          </a>
        </p>`,
        supportEmail
      );
      const text = [
        'VíaAlerta - Solicitud de eliminación programada',
        '',
        `Hola, ${userName}. Registramos tu solicitud de eliminación de cuenta.`,
        'Periodo de gracia (decisión del proyecto): 30 días.',
        `Fecha programada: ${scheduledFor}`,
        'Al vencer el plazo, tus reportes permanecerán anonimizados durante 12 meses.',
        '',
        `Cancelar eliminación: ${actionUrl}`,
        `Ayuda: ${supportEmail}`,
      ].join('\n');
      return { subject, html, text };
    }
  }
}
