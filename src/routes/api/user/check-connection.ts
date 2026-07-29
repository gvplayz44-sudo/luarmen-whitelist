import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/user/check-connection')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const discordUserId = url.searchParams.get('discord_user_id');

          if (!discordUserId) {
            return new Response(
              JSON.stringify({ error: 'discord_user_id required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: connection } = await supabase
            .from('user_connections')
            .select('user_id, api_key, discord_username')
            .eq('discord_user_id', discordUserId)
            .single();

          if (!connection) {
            return new Response(
              JSON.stringify({ connected: false }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              connected: true,
              user_id: connection.user_id,
              api_key: connection.api_key,
              discord_username: connection.discord_username
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ connected: false }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
