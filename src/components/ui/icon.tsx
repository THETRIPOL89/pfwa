import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  Bitcoin,
  Briefcase,
  Bus,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  ExternalLink,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LineChart,
  PiggyBank,
  Plane,
  ReceiptText,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps icon name strings (stored in DB / mocks) to actual lucide components.
 * Add a name here when introducing a new icon in the database.
 */
const MAP: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  Bitcoin,
  Briefcase,
  Bus,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  ExternalLink,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LineChart,
  PiggyBank,
  Plane,
  ReceiptText,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
};

export function Icon({
  name,
  className,
  fallback,
}: {
  name: string;
  className?: string;
  fallback?: LucideIcon | string;
}) {
  const Cmp = MAP[name] ?? (typeof fallback === 'string' ? MAP[fallback] : fallback) ?? Sparkles;
  return <Cmp className={className} />;
}