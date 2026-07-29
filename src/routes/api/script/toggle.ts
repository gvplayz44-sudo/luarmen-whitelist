import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/script/toggle')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { script_id, api_key, enabled } = body;

          if (!script_id || !api_key) {
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
            .select('user_id, plan')
            .eq('key', api_key)
            .single();

          if (!keyData) {
            return new Response(
              JSON.stringify({ error: 'Invalid API key' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { data: script } = await supabase
            .from('scripts')
            .select('user_id')
            .eq('id', script_id)
            .single();

          if (!script) {
            return new Response(
              JSON.stringify({ error: 'Script not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const isOwner = keyData.plan === 'owner';
          const isPremium = keyData.plan === 'premium' || keyData.plan === 'pro';
          const isBasic = keyData.plan === 'basic';

          if (!isOwner && !isPremium && !isBasic) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to toggle scripts' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if ((isPremium || isBasic) && script.user_id !== keyData.user_id) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to toggle this script' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const newStatus = enabled !== undefined ? enabled : !script.enabled;

          await supabase
            .from('scripts')
            .update({ enabled: newStatus })
            .eq('id', script_id);

          return new Response(
            JSON.stringify({
              success: true,
              enabled: newStatus
            }),
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
