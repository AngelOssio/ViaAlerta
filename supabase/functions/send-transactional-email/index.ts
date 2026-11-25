import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderTransactionalEmail, type EmailTemplateName } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ sent: false, error: 'Autenticación requerida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ sent: false, error: 'Sesión inválida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const template = body.template as EmailTemplateName;
    const payload = (body.payload || {}) as Record<string, string>;
    const recipient = userData.user.email;

    if (!['welcome', 'password_recovery', 'report_registered', 'deletion_requested'].includes(template)) {
      return new Response(JSON.stringify({ sent: false, error: 'Plantilla no válida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Jamás fingir envío si no hay proveedor configurado o si el remitente usa .example
    if (!resendApiKey || !emailFrom || emailFrom.includes('.example')) {
      await adminClient.from('email_dispatch_logs').insert({
        user_id: userData.user.id,
        template,
        recipient_email: recipient,
        status: 'not_configured',
        error_message: 'Proveedor de correo (RESEND_API_KEY / EMAIL_FROM verificado) no configurado en el servidor.',
      });

      return new Response(
        JSON.stringify({
          sent: false,
          reason: 'not_configured',
          message: 'El envío de correo transaccional no está configurado en este servidor.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supportEmail = emailFrom.match(/<([^>]+)>/)?.[1] || emailFrom;
    const rendered = renderTransactionalEmail(template, payload, supportEmail);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const resendJson = await resendRes.json();

    if (!resendRes.ok) {
      await adminClient.from('email_dispatch_logs').insert({
        user_id: userData.user.id,
        template,
        recipient_email: recipient,
        status: 'failed',
        error_message: JSON.stringify(resendJson),
      });

      return new Response(
        JSON.stringify({
          sent: false,
          reason: 'provider_error',
          message: 'El proveedor de correo rechazó el envío.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await adminClient.from('email_dispatch_logs').insert({
      user_id: userData.user.id,
      template,
      recipient_email: recipient,
      status: 'sent',
      provider_message_id: resendJson.id ?? null,
    });

    return new Response(
      JSON.stringify({ sent: true, id: resendJson.id ?? null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ sent: false, error: err instanceof Error ? err.message : 'Error interno.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
