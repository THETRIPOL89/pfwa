import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { TransfersPage } from '@/pages/TransfersPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { InvestmentsPage } from '@/pages/InvestmentsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { NewsPage } from '@/pages/NewsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RequireAuth } from '@/components/auth/RequireAuth';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}