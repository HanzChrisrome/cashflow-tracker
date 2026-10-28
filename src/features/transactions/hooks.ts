import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "./api";
import type { TransactionFormValues } from "./schema";

export function useTransactions(accountId?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.list({
      accountId: accountId ?? undefined,
    }),
    queryFn: () => listTransactions(accountId),
    placeholderData: keepPreviousData,
  });
}

export function useSaveTransaction(transactionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: TransactionFormValues) =>
      transactionId
        ? updateTransaction(transactionId, values)
        : createTransaction(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
