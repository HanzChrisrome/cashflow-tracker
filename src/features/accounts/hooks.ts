import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from "./api";
import type { AccountFormValues } from "./schema";

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: listAccounts,
  });
}

export function useAccount(accountId: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () => getAccount(accountId),
  });
}

export function useSaveAccount(accountId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: AccountFormValues) =>
      accountId ? updateAccount(accountId, values) : createAccount(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
