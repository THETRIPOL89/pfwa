import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useSyncStore } from '@/stores/useSyncStore';

/**
 * Top-level layout: sidebar (desktop), top bar, content, bottom nav
 * (mobile). Wires global online/offline listeners.
 */
export function AppShell() {
  useDarkMode();
  const { setOnline } = useSyncStore();
  const location = useLocation();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-24 lg:pb-10">
          <div className="mx-auto w-full max-w-7xl animate-fade-in p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}