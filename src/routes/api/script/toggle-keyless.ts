import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/script/toggle-keyless')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { script_id, api_key, keyless_enabled } = body;

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
            .select('user_id, keyless_mode')
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

          if (!isOwner && !isPremium) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to toggle keyless mode' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (isPremium && script.user_id !== keyData.user_id) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to toggle keyless mode for this script' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const newStatus = keyless_enabled !== undefined ? keyless_enabled : !script.keyless_mode;

          await supabase
            .from('scripts')
            .update({ keyless_mode: newStatus })
            .eq('id', script_id);

          return new Response(
            JSON.stringify({
              success: true,
              keyless_enabled: newStatus
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
