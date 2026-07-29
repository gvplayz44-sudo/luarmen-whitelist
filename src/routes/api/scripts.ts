import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/scripts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const apiKey = url.searchParams.get('api_key');

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          if (apiKey) {
            const { data: keyData } = await supabase
              .from('api_keys')
              .select('user_id')
              .eq('key', apiKey)
              .single();

            if (keyData) {
              const { data: scripts } = await supabase
                .from('scripts')
                .select('id, script_name, script_key, loader_path, enabled, keyless_mode, downloads, created_at')
                .eq('user_id', keyData.user_id)
                .order('created_at', { ascending: false });

              return new Response(
                JSON.stringify({ scripts: scripts || [] }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }

          return new Response(
            JSON.stringify({ scripts: [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ scripts: [] }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
