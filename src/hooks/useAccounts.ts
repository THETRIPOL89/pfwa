import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from '@/services/accounts';
import type { Account, AccountInput } from '@/types/domain';

export const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: listAccounts,
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: id ? accountKeys.detail(id) : accountKeys.all,
    queryFn: () => getAccount(id!),
    enabled: !!id,
  });
}

export function useCreateAccount(opts?: UseMutationOptions<Account, Error, AccountInput>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    ...opts,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      // opts.onSuccess may have a different context type signature; cast for safety.
      (opts?.onSuccess as ((d: Account, v: AccountInput) => void) | undefined)?.(data, vars);
      void ctx;
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AccountInput> }) =>
      updateAccount(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: accountKeys.all });
      qc.setQueryData(accountKeys.detail(data.id), data);
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}