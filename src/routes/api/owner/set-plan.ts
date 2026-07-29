import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/set-plan')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, user_id, plan } = body;

          if (!api_key || !user_id || !plan) {
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
            .select('plan')
            .eq('key', api_key)
            .single();

          if (!keyData || keyData.plan !== 'owner') {
            return new Response(
              JSON.stringify({ error: 'Owner only' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase
            .from('profiles')
            .update({ plan })
            .eq('id', user_id);

          await supabase
            .from('api_keys')
            .update({ plan })
            .eq('user_id', user_id);

          const { data: userKey } = await supabase
            .from('api_keys')
            .select('key')
            .eq('user_id', user_id)
            .single();

          if (userKey) {
            await supabase
              .from('key_check_list')
              .update({ plan })
              .eq('script_key', userKey.key);
          }

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
