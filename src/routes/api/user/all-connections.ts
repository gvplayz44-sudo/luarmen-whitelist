import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/user/all-connections')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: connections } = await supabase
            .from('user_connections')
            .select('discord_user_id, api_key, user_id, discord_username, linked_at, last_active')
            .order('linked_at', { ascending: false });

          return new Response(
            JSON.stringify({ connections: connections || [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ connections: [] }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
