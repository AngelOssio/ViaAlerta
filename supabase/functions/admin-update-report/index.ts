import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_STATUSES = ['recibido', 'en_revision', 'en_atencion', 'resuelto'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sesión de administrador requerida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesión inválida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validación estricta de rol en el servidor (nunca confiar solo en la UI)
    const { data: roleRow } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (roleRow?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado: no cuentas con rol de administrador.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportId, newStatus, note } = await req.json();
    if (!reportId || !VALID_STATUSES.includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos (reportId o newStatus).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing, error: fetchErr } = await adminClient
      .from('reports')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (fetchErr || !existing) {
      return new Response(JSON.stringify({ error: 'Reporte no encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: updated, error: updateErr } = await adminClient
      .from('reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    const cleanNote =
      typeof note === 'string' && note.trim().length > 0
        ? note.trim()
        : 'Estado actualizado desde la consola administrativa.';

    const { error: histErr } = await adminClient.from('report_status_history').insert({
      report_id: reportId,
      previous_status: existing.status,
      new_status: newStatus,
      note: cleanNote,
      changed_by: userData.user.id,
    });

    if (histErr) throw histErr;

    return new Response(JSON.stringify({ ok: true, report: updated }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
