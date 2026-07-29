import { createFileRoute } from '@tanstack/start';

export const Route = createFileRoute('/api/stats')({
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

          const { count: totalScripts } = await supabase
            .from('scripts')
            .select('*', { count: 'exact', head: true });

          const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          const { count: totalDownloads } = await supabase
            .from('script_downloads')
            .select('*', { count: 'exact', head: true });

          return new Response(
            JSON.stringify({ total_scripts: totalScripts || 0, total_users: totalUsers || 0, total_downloads: totalDownloads || 0 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        } catch (error) {
          return new Response(
            JSON.stringify({ total_scripts: 0, total_users: 0, total_downloads: 0 }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }
});
