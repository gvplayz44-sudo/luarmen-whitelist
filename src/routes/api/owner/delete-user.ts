import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/delete-user')({
  server: {
    handlers: {
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const apiKey = url.searchParams.get('api_key');
          const userId = url.searchParams.get('user_id');

          if (!apiKey || !userId) {
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
            .eq('key', apiKey)
            .single();

          if (!keyData || keyData.plan !== 'owner') {
            return new Response(
              JSON.stringify({ error: 'Owner only' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase.from('key_check_list').delete().eq('user_id', userId);
          await supabase.from('user_connections').delete().eq('user_id', userId);
          await supabase.from('scripts').delete().eq('user_id', userId);
          await supabase.from('api_keys').delete().eq('user_id', userId);
          await supabase.from('activity_log').delete().eq('user_id', userId);
          await supabase.from('profiles').delete().eq('id', userId);

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Delete user error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
