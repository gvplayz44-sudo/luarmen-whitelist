import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/source-view')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, enabled } = body;

          if (!api_key) {
            return new Response(
              JSON.stringify({ error: 'API key required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: keyData } = await supabase
            .from('api_keys')
            .select('plan')
            .eq('key', api_key)
            .single();

          if (!keyData || keyData.plan !== 'owner') {
            return new Response(
              JSON.stringify({ error: 'Owner only' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const value = enabled ? 'true' : 'false';
          await supabase
            .from('site_settings')
            .upsert({ key: 'allow_source_view', value }, { onConflict: 'key' });

          return new Response(
            JSON.stringify({ success: true, enabled }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
      GET: async () => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: settings } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'allow_source_view')
            .single();

          return new Response(
            JSON.stringify({ enabled: settings?.value === 'true' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ enabled: false }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
