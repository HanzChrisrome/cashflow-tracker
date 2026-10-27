import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/format";
import { useAccounts } from "@/features/accounts/hooks";
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog";
import { TransactionsTable } from "@/features/transactions/transactions-table";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/features/transactions/hooks";
import { summarizeTransactions } from "@/features/transactions/totals";
import type { TransactionItem } from "@/features/transactions/api";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const accountsQuery = useAccounts();
  const deleteTransaction = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionItem | null>(null);

  const transactions = transactionsQuery.data ?? [];
  const accounts = (accountsQuery.data ?? []).map((account) => ({
    id: account.id,
    label: `${account.providerName} · ${account.nickname}`,
    amount: account.amount,
  }));
  const summary = summarizeTransactions(transactions);
  const totalIn = formatPeso(summary.inCentavos / 100);
  const totalOut = formatPeso(summary.outCentavos / 100);
  const net = formatPeso(summary.netCentavos / 100);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(transaction: TransactionItem) {
    setEditing(transaction);
    setDialogOpen(true);
  }

  async function handleDelete(transaction: TransactionItem) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction.mutateAsync(transaction.id);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Could not delete the transaction");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Record and review cash in and cash out.
          </p>
        </div>
        <Button onClick={openCreate} className="h-10 rounded-xl">
          <Plus />
          Add transaction
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Cash In"
          subtitle="All time"
          amount={totalIn}
          change="+8.2%"
          footerLabel="View transactions"
          icon={ArrowUpRight}
        />
        <StatCard
          title="Cash Out"
          subtitle="All time"
          amount={totalOut}
          change="+3.4%"
          footerLabel="View transactions"
          icon={ArrowDownLeft}
        />
        <StatCard
          variant="filled"
          title="Net Cash Flow"
          subtitle="Cash out minus cash in"
          amount={net}
          change="+5.1%"
          footerLabel="View transactions"
          icon={Wallet}
        />
      </div>

      {transactionsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      ) : transactionsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load transactions: {transactionsQuery.error.message}
        </p>
      ) : (
        <TransactionsTable
          transactions={transactions}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accounts={accounts}
        transaction={editing ?? undefined}
        onSaved={() => setDialogOpen(false)}
      />
    </div>
  );
}
