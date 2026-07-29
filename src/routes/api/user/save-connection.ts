import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/user/save-connection')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { discord_user_id, api_key, discord_username } = body;

          if (!discord_user_id || !api_key) {
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

          const { data, error } = await supabase
            .from('user_connections')
            .upsert({
              user_id: keyData.user_id,
              discord_user_id: discord_user_id,
              discord_username: discord_username || 'Unknown',
              api_key: api_key,
              last_active: new Date().toISOString()
            }, { onConflict: 'discord_user_id' })
            .select()
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to save connection' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, connection: data }),
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
