import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes';
import { useEffect } from 'react';
import { initAuthListener } from '@/stores/useAuthStore';

/**
 * Provider order matters:
 *  - QueryClient first so any code below (including the router) can call hooks.
 *  - Router last so providers wrap the routed tree.
 *  - Auth listener initialised once on mount so the supabase session
 *    hydrates before any guarded route renders.
 */
export default function App() {
  useEffect(() => {
    // Subscribes for the lifetime of the page; supabase-js auto-cleans on unload.
    initAuthListener();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}