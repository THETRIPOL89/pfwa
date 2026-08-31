import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Conti', icon: Wallet },
  { to: '/transactions', label: 'Movimenti', icon: Receipt },
  { to: '/investments', label: 'Investi', icon: TrendingUp },
  { to: '/insights', label: 'AI', icon: Sparkles },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'size-5 transition-transform',
                      isActive && 'scale-110',
                    )}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}