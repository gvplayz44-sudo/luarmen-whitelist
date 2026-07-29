import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/generate-key')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, script_id, duration_days } = body;

          if (!api_key || !script_id) {
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

          const allowedPlans = ['basic', 'premium', 'pro', 'owner'];
          if (!allowedPlans.includes(keyData.plan)) {
            return new Response(
              JSON.stringify({ error: 'Your plan does not allow key generation' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { data: script } = await supabase
            .from('scripts')
            .select('script_key, script_name, user_id')
            .eq('id', script_id)
            .single();

          if (!script) {
            return new Response(
              JSON.stringify({ error: 'Script not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (keyData.plan !== 'owner' && script.user_id !== keyData.user_id) {
            return new Response(
              JSON.stringify({ error: 'Not authorized for this script' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const generateKey = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 32; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          const newKey = generateKey();
          const expiresAt = duration_days && duration_days > 0 
            ? new Date(Date.now() + duration_days * 86400000).toISOString() 
            : null;

          await supabase
            .from('key_check_list')
            .insert({
              script_key: newKey,
              user_id: keyData.user_id,
              plan: keyData.plan,
              duration_days: duration_days || 0,
              expires_at: expiresAt,
              is_active: true
            });

          return new Response(
            JSON.stringify({
              success: true,
              key: newKey,
              script_key: script.script_key,
              duration_days: duration_days || 'forever',
              expires_at: expiresAt,
              loadstring: `script_key="${newKey}"; loadstring(game:HttpGet("https://api.luarmen.lovable.app/files/v4/loaders/${script.script_key}.lua"))()`
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Generate key error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
