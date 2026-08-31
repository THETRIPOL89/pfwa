import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Newspaper,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/useUiStore';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Conti', icon: Wallet },
  { to: '/transactions', label: 'Transazioni', icon: Receipt },
  { to: '/transfers', label: 'Trasferimenti', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budget', icon: PiggyBank },
  { to: '/investments', label: 'Investimenti', icon: TrendingUp },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/news', label: 'Notizie', icon: Newspaper },
];

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 border-r bg-card/30 backdrop-blur lg:block',
        collapsed ? 'w-[68px]' : 'w-64',
        'transition-[width] duration-200',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-primary-foreground">
          <span className="text-sm font-bold">P</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight">PFWA</span>
        )}
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-3 left-0 right-0 px-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
            )
          }
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Impostazioni</span>}
        </NavLink>
      </div>
    </aside>
  );
}