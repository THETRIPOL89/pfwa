import { useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

/**
 * Applies the resolved theme to <html> by toggling the `dark` class and
 * updates the meta theme-color so the mobile browser chrome matches.
 */
export function useDarkMode() {
  const { mode, setResolved } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = mode === 'system' ? (mql.matches ? 'dark' : 'light') : mode;
      root.classList.toggle('dark', resolved === 'dark');
      setResolved(resolved);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#ffffff');
      }
    };
    apply();
    if (mode === 'system') {
      const onChange = () => apply();
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
  }, [mode, setResolved]);
}