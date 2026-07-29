import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/verify-hwid')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { script_key, hwid, user_key } = body;

          if (!script_key || !hwid) {
            return new Response(
              JSON.stringify({ status: "INVALID KEY", message: "Missing fields" }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: script, error: scriptError } = await supabase
            .from('scripts')
            .select('script_key, source_code, user_id, enabled, keyless_mode')
            .eq('script_key', script_key)
            .single();

          if (scriptError || !script) {
            return new Response(
              JSON.stringify({ status: "INVALID KEY", message: "Script not found" }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (script.enabled === false) {
            return new Response(
              JSON.stringify({ status: "ERROR", message: "Script disabled" }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          const { data: settings } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'global_kill_switch')
            .single();

          if (settings && settings.value === 'true') {
            return new Response(
              JSON.stringify({ status: "ERROR", message: "Scripts disabled globally" }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (script.keyless_mode === false) {
            if (!user_key) {
              return new Response(
                JSON.stringify({ status: "INVALID KEY", message: "No key provided" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            if (user_key !== script_key) {
              return new Response(
                JSON.stringify({ status: "INVALID KEY", message: "Key does not match" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const { data: keyCheck } = await supabase
              .from('key_check_list')
              .select('*')
              .eq('script_key', user_key)
              .eq('is_active', true)
              .single();

            if (!keyCheck) {
              return new Response(
                JSON.stringify({ status: "INVALID KEY", message: "Key not found or inactive" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }

            if (keyCheck.expires_at && new Date(keyCheck.expires_at) < new Date()) {
              await supabase.from('key_check_list').update({ is_active: false }).eq('id', keyCheck.id);
              return new Response(
                JSON.stringify({ status: "INVALID KEY", message: "Key expired" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }

          const { data: binding } = await supabase
            .from('hwid_bindings')
            .select('hwid')
            .eq('script_key', script_key)
            .eq('hwid', hwid)
            .single();

          if (!binding) {
            await supabase
              .from('hwid_bindings')
              .insert({ script_key: script_key, hwid: hwid });

            await supabase
              .from('scripts')
              .update({ downloads: supabase.raw('downloads + 1'), last_used: new Date().toISOString() })
              .eq('script_key', script_key);

            return new Response(
              JSON.stringify({ status: "OK", source: script.source_code, message: "HWID bound" }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          await supabase
            .from('scripts')
            .update({ downloads: supabase.raw('downloads + 1'), last_used: new Date().toISOString() })
            .eq('script_key', script_key);

          return new Response(
            JSON.stringify({ status: "OK", source: script.source_code, message: "HWID verified" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          console.error('HWID error:', error);
          return new Response(
            JSON.stringify({ status: "ERROR", message: "Server error" }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
