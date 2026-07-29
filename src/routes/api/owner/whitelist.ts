import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/owner/whitelist')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, user_id, plan, duration_days } = body;

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

          const expiresAt = duration_days && duration_days > 0 
            ? new Date(Date.now() + duration_days * 86400000).toISOString() 
            : null;

          await supabase
            .from('profiles')
            .update({
              plan: plan,
              whitelisted: true,
              whitelist_plan: plan,
              whitelist_expires: expiresAt,
              whitelisted_at: new Date().toISOString(),
              blacklisted: false
            })
            .eq('id', targetUserId);

          await supabase
            .from('api_keys')
            .update({ plan: plan })
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
                plan: plan,
                is_active: true,
                expires_at: expiresAt,
                duration_days: duration_days || 0
              })
              .eq('script_key', userKey.key);
          }

          return new Response(
            JSON.stringify({ success: true, plan, expires_at: expiresAt }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Whitelist error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
