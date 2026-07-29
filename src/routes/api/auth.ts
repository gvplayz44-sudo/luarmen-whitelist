import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { username, password, api_key } = body;

          if (!username || !password) {
            return new Response(
              JSON.stringify({ success: false, message: 'Username and password required' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, plan')
            .eq('username', username)
            .single();

          if (existingUser) {
            return new Response(
              JSON.stringify({ success: false, message: 'Username already taken' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          let plan = 'free';
          let finalApiKey = api_key;
          let isOwner = false;

          if (!api_key || api_key.trim() === '') {
            finalApiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            plan = 'free';
          } else if (api_key === 'yathush123yathush') {
            isOwner = true;
            plan = 'owner';
            finalApiKey = api_key;
          } else if (api_key.startsWith('sk_')) {
            const { data: existingKey } = await supabase
              .from('api_keys')
              .select('user_id')
              .eq('key', api_key)
              .single();

            if (existingKey) {
              return new Response(
                JSON.stringify({ success: false, message: 'API key already in use' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }
            finalApiKey = api_key;
            plan = 'free';
          } else {
            return new Response(
              JSON.stringify({ success: false, message: 'Invalid API key format' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { data: newUser, error: createError } = await supabase
            .from('profiles')
            .insert({
              username: username,
              password: password,
              plan: plan,
              whitelisted: isOwner ? true : false,
              whitelist_plan: isOwner ? 'owner' : null
            })
            .select()
            .single();

          if (createError) {
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to create user' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { error: keyError } = await supabase
            .from('api_keys')
            .insert({
              user_id: newUser.id,
              key: finalApiKey,
              plan: plan
            });

          if (keyError) {
            await supabase.from('profiles').delete().eq('id', newUser.id);
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to save API key' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase
            .from('key_check_list')
            .insert({
              script_key: finalApiKey,
              user_id: newUser.id,
              plan: plan,
              duration_days: plan !== 'free' ? 30 : 0,
              expires_at: plan !== 'free' ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
              is_active: true
            });

          if (isOwner) {
            await supabase
              .from('site_settings')
              .upsert({ key: 'global_kill_switch', value: 'false' }, { onConflict: 'key' });
          }

          return new Response(
            JSON.stringify({
              success: true,
              api_key: finalApiKey,
              plan: plan,
              username: username,
              isOwner: isOwner
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Auth error:', error);
          return new Response(
            JSON.stringify({ success: false, message: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
