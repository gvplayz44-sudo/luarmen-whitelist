import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/all-users')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const apiKey = url.searchParams.get('api_key');

          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: 'API key required' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } }
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
            .eq('key', apiKey)
            .single();

          if (!keyData || keyData.plan !== 'owner') {
            return new Response(
              JSON.stringify({ error: 'Owner only' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { data: users } = await supabase
            .from('profiles')
            .select('id, username, plan, whitelisted, blacklisted, blacklist_reason, created_at')
            .order('created_at', { ascending: false });

          return new Response(
            JSON.stringify({ users: users || [] }),
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
