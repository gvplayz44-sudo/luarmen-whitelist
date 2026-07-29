import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { api_key, script_name, source_code } = body;

          if (!api_key || !script_name || !source_code) {
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

          const planLimits: Record<string, number> = { 
            owner: 999, 
            pro: 10, 
            premium: 6, 
            basic: 3, 
            free: 0 
          };
          const maxScripts = planLimits[keyData.plan] || 0;

          if (keyData.plan !== 'owner') {
            const { count } = await supabase
              .from('scripts')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', keyData.user_id);

            if (count && count >= maxScripts) {
              return new Response(
                JSON.stringify({ error: `Plan limit reached. Max ${maxScripts} scripts.` }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }

          const generateLoaderId = () => {
            const chars = '0123456789abcdef';
            let result = '';
            for (let i = 0; i < 32; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          const generateScriptKey = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 32; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };

          const scriptKey = generateScriptKey();
          const loaderId = generateLoaderId();
          const loaderPath = `/files/v4/loaders/${loaderId}.lua`;

          const { data: script, error } = await supabase
            .from('scripts')
            .insert({
              user_id: keyData.user_id,
              script_name,
              source_code,
              script_key: scriptKey,
              loader_path: loaderPath,
              enabled: true,
              keyless_mode: false,
              downloads: 0
            })
            .select()
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to upload: ' + error.message }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              script,
              loader_path: loaderPath,
              script_key: scriptKey,
              loader_id: loaderId,
              loadstring: `script_key="${scriptKey}"; loadstring(game:HttpGet("https://api.luarmen.lovable.app${loaderPath}"))()`
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('Upload error:', error);
          return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
