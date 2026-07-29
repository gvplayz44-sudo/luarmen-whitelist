import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/script/$id')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { id } = params;
          const url = new URL(request.url);
          const apiKey = url.searchParams.get('api_key');

          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.SB_URL!,
            process.env.SB_SERVICE!
          );

          const { data: script, error } = await supabase
            .from('scripts')
            .select('id, script_name, script_key, loader_path, source_code, enabled, keyless_mode, downloads, last_used, created_at, user_id, profiles(username)')
            .eq('id', id)
            .single();

          if (error || !script) {
            return new Response(
              JSON.stringify({ error: 'Script not found' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ script }),
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
