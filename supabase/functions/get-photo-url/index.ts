import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genera una URL firmada temporal para una fotografía almacenada en el bucket privado report-photos
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { reportId } = await req.json();
    if (!reportId || typeof reportId !== 'string') {
      return new Response(JSON.stringify({ error: 'reportId es obligatorio.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: photo, error: photoErr } = await adminClient
      .from('report_photos')
      .select('storage_path')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (photoErr || !photo?.storage_path) {
      return new Response(JSON.stringify({ signedUrl: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from('report-photos')
      .createSignedUrl(photo.storage_path, 3600);

    if (signErr) throw signErr;

    return new Response(JSON.stringify({ signedUrl: signed?.signedUrl ?? null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'No se pudo firmar la imagen.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
