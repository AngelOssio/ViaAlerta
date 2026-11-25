import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderTransactionalEmail } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const GRACE_DAYS = 30;
const ANONYMIZED_RETENTION_MONTHS = 12;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const emailFrom = Deno.env.get('EMAIL_FROM');
    const appPublicUrl = Deno.env.get('APP_PUBLIC_URL') || 'viaalerta://';
    const cronSecret = Deno.env.get('CRON_SECRET');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const action = body.action as
      | 'deactivate'
      | 'reactivate'
      | 'request_deletion'
      | 'cancel_deletion'
      | 'process_due_deletions';

    // 1. Tarea programada en el servidor para ejecutar eliminaciones vencidas y anonimizar reportes
    if (action === 'process_due_deletions') {
      const providedSecret = req.headers.get('x-cron-secret');
      if (!cronSecret || providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'No autorizado para ejecutar la tarea programada.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const nowIso = new Date().toISOString();
      const { data: dueRequests, error: dueErr } = await adminClient
        .from('account_deletion_requests')
        .select('id, user_id')
        .eq('status', 'pending')
        .lte('scheduled_for', nowIso);

      if (dueErr) throw dueErr;

      const processed: string[] = [];
      for (const item of dueRequests ?? []) {
        const retentionUntil = new Date();
        retentionUntil.setMonth(retentionUntil.getMonth() + ANONYMIZED_RETENTION_MONTHS);

        // Anonimizar reportes del usuario y fijar retención prevista de 12 meses (decisión del proyecto)
        await adminClient
          .from('reports')
          .update({
            user_id: null,
            anonymized_at: nowIso,
            anonymized_retention_until: retentionUntil.toISOString(),
          })
          .eq('user_id', item.user_id);

        await adminClient
          .from('account_deletion_requests')
          .update({ status: 'completed', completed_at: nowIso })
          .eq('id', item.id);

        // Eliminar usuario en Supabase Auth (cascada limpia profiles, user_roles, user_preferences)
        await adminClient.auth.admin.deleteUser(item.user_id);
        processed.push(item.id);
      }

      return new Response(
        JSON.stringify({ processedCount: processed.length, processedIds: processed }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Acciones autenticadas del usuario sobre su propia cuenta
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sesión requerida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida o vencida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;

    if (action === 'deactivate') {
      await adminClient
        .from('profiles')
        .update({ account_status: 'deactivated', deactivated_at: new Date().toISOString() })
        .eq('id', user.id);

      return new Response(JSON.stringify({ ok: true, accountStatus: 'deactivated' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reactivate') {
      await adminClient
        .from('profiles')
        .update({ account_status: 'active', deactivated_at: null })
        .eq('id', user.id);

      return new Response(JSON.stringify({ ok: true, accountStatus: 'active' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'request_deletion') {
      const phrase = String(body.confirmationPhrase || '').trim();
      if (phrase !== 'ELIMINAR') {
        return new Response(
          JSON.stringify({ error: 'Debes escribir exactamente ELIMINAR para confirmar la solicitud.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + GRACE_DAYS);

      // Evitar solicitudes pendientes duplicadas
      const { data: existing } = await adminClient
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      let requestRecord = existing;
      if (!requestRecord) {
        const { data: inserted, error: insertErr } = await adminClient
          .from('account_deletion_requests')
          .insert({
            user_id: user.id,
            confirmation_phrase: 'ELIMINAR',
            status: 'pending',
            scheduled_for: scheduledDate.toISOString(),
          })
          .select('*')
          .single();

        if (insertErr) throw insertErr;
        requestRecord = inserted;
      }

      await adminClient
        .from('profiles')
        .update({ account_status: 'pending_deletion' })
        .eq('id', user.id);

      // Intentar enviar correo real de confirmación si el proveedor está configurado
      let emailSent = false;
      if (resendApiKey && emailFrom && !emailFrom.includes('.example') && user.email) {
        const supportEmail = emailFrom.match(/<([^>]+)>/)?.[1] || emailFrom;
        const { data: profile } = await adminClient
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        const rendered = renderTransactionalEmail(
          'deletion_requested',
          {
            userName: profile?.full_name || 'usuario',
            scheduledFor: new Date(requestRecord.scheduled_for).toLocaleDateString('es-PE'),
            actionUrl: `${appPublicUrl}account/delete-cancel`,
          },
          supportEmail
        );

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [user.email],
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          }),
        });

        emailSent = resendRes.ok;
        if (emailSent) {
          await adminClient
            .from('account_deletion_requests')
            .update({ confirmation_email_sent_at: new Date().toISOString() })
            .eq('id', requestRecord.id);
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          request: requestRecord,
          emailSent,
          graceDays: GRACE_DAYS,
          retentionMonths: ANONYMIZED_RETENTION_MONTHS,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cancel_deletion') {
      const nowIso = new Date().toISOString();
      const { data: updated, error: cancelErr } = await adminClient
        .from('account_deletion_requests')
        .update({ status: 'cancelled', cancelled_at: nowIso })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .select('*');

      if (cancelErr) throw cancelErr;

      await adminClient
        .from('profiles')
        .update({ account_status: 'active', deactivated_at: null })
        .eq('id', user.id);

      return new Response(
        JSON.stringify({ ok: true, cancelledCount: updated?.length ?? 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Acción no reconocida.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno del servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
