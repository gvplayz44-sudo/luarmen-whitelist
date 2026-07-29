import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/update-plan')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, plan } = body;

          if (!api_key || !plan) {
            return new Response(
              JSON.stringify({ error: 'Missing fields' }),
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
            .select('user_id')
            .eq('key', api_key)
            .single();

          if (!keyData) {
            return new Response(
              JSON.stringify({ error: 'Invalid API key' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase
            .from('profiles')
            .update({ plan })
            .eq('id', keyData.user_id);

          await supabase
            .from('api_keys')
            .update({ plan })
            .eq('user_id', keyData.user_id);

          return new Response(
            JSON.stringify({ success: true, plan }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
