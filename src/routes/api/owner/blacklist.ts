import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/blacklist')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, user_id, reason } = body;

          if (!api_key || !user_id) {
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

          let targetUserId = user_id;
          if (!user_id.includes('-')) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', user_id)
              .single();
            if (userData) targetUserId = userData.id;
          }

          if (!targetUserId) {
            return new Response(
              JSON.stringify({ error: 'User not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              blacklisted: true,
              blacklist_reason: reason || 'No reason provided',
              blacklisted_at: new Date().toISOString(),
              whitelisted: false,
              whitelist_plan: null,
              whitelist_expires: null
            })
            .eq('id', targetUserId);

          await supabase
            .from('api_keys')
            .update({ plan: 'free' })
            .eq('user_id', targetUserId);

          const { data: userKey } = await supabase
            .from('api_keys')
            .select('key')
            .eq('user_id', targetUserId)
            .single();

          if (userKey) {
            await supabase
              .from('key_check_list')
              .update({
                plan: 'free',
                is_active: false
              })
              .eq('script_key', userKey.key);
          }

          return new Response(
            JSON.stringify({ success: true, reason: reason || 'No reason provided' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Blacklist error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      },
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

          await supabase
            .from('profiles')
            .update({
              blacklisted: false,
              blacklist_reason: null,
              blacklisted_at: null,
              plan: 'free',
              whitelisted: false
            })
            .eq('id', userId);

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Unblacklist error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
