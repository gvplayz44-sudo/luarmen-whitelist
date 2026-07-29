import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/files/v4/loaders/$id')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const loaderId = params.id.replace('.lua', '');
          const loaderPath = `/files/v4/loaders/${loaderId}.lua`;

          const url = new URL(request.url);
          const providedKey = url.searchParams.get('key');
          const providedHwid = url.searchParams.get('hwid');

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: script, error } = await supabase
            .from('scripts')
            .select('source_code, script_name, script_key, enabled, keyless_mode')
            .eq('loader_path', loaderPath)
            .single();

          if (error || !script) {
            return new Response('-- Script not found', { 
              status: 404, 
              headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } 
            });
          }

          if (script.enabled === false) {
            return new Response('-- Script disabled', { 
              status: 403, 
              headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } 
            });
          }

          const { data: settings } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'global_kill_switch')
            .single();

          if (settings && settings.value === 'true') {
            return new Response('-- Scripts disabled globally', { 
              status: 403, 
              headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } 
            });
          }

          const userAgent = request.headers.get('user-agent') || '';
          const isBrowser = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge'].some(b => userAgent.includes(b));
          
          if (isBrowser) {
            return new Response(
              `<!DOCTYPE html>
<html>
<head>
  <title>Not Authorized</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0c14;
      color: #eef0f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .container { padding: 40px 20px; max-width: 420px; }
    .badge { color: #8b90a8; border: 1px solid #22273a; border-radius: 100px; padding: 6px 18px; display: inline-block; margin-bottom: 24px; font-size: 12px; letter-spacing: 0.5px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 26px; margin-bottom: 12px; font-weight: 600; }
    p { color: #8b90a8; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">⛔ 403 FORBIDDEN</div>
    <div class="icon">🚫</div>
    <h1>Not Authorized</h1>
    <p>You are not allowed to view these files.</p>
  </div>
</body>
</html>`,
              { 
                status: 403, 
                headers: { 
                  'Content-Type': 'text/html', 
                  'Access-Control-Allow-Origin': '*' 
                } 
              }
            );
          }

          if (!script.keyless_mode) {
            if (!providedKey || providedKey !== script.script_key) {
              return new Response(
                '-- ERROR: Invalid key',
                { status: 403, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }
              );
            }

            const { data: keyCheck } = await supabase
              .from('key_check_list')
              .select('*')
              .eq('script_key', providedKey)
              .eq('is_active', true)
              .single();

            if (!keyCheck) {
              return new Response(
                '-- ERROR: Key not active',
                { status: 403, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }
              );
            }

            if (keyCheck.expires_at && new Date(keyCheck.expires_at) < new Date()) {
              await supabase
                .from('key_check_list')
                .update({ is_active: false })
                .eq('id', keyCheck.id);
              
              return new Response(
                '-- ERROR: Key expired',
                { status: 403, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }
              );
            }

            if (providedHwid) {
              const { data: binding } = await supabase
                .from('hwid_bindings')
                .select('hwid')
                .eq('script_key', script.script_key)
                .eq('hwid', providedHwid)
                .single();

              if (!binding) {
                await supabase
                  .from('hwid_bindings')
                  .insert({ script_key: script.script_key, hwid: providedHwid });
              }
            }

            await supabase
              .from('script_downloads')
              .insert({
                script_key: script.script_key,
                hwid: providedHwid || 'unknown',
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
              });

            await supabase
              .from('scripts')
              .update({ 
                downloads: supabase.raw('downloads + 1'), 
                last_used: new Date().toISOString() 
              })
              .eq('script_key', script.script_key);
          }

          return new Response(
            script.source_code,
            { 
              status: 200, 
              headers: { 
                'Content-Type': 'text/plain', 
                'Access-Control-Allow-Origin': '*' 
              } 
            }
          );

        } catch (error) {
          console.error('Loader error:', error);
          return new Response(
            '-- Error loading script',
            { 
              status: 500, 
              headers: { 
                'Content-Type': 'text/plain', 
                'Access-Control-Allow-Origin': '*' 
              } 
            }
          );
        }
      }
    }
  }
});
