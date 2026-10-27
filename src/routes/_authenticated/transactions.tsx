import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeso } from "@/lib/format";
import { useAccounts } from "@/features/accounts/hooks";
import { TransactionFormDialog } from "@/features/transactions/TransactionFormDialog";
import { TransactionsTable } from "@/features/transactions/transactions-table";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/features/transactions/hooks";
import {
  customDateRange,
  filterTransactionsByRange,
  periodRange,
  summarizeTransactions,
  type Period,
} from "@/features/transactions/totals";
import type { TransactionItem } from "@/features/transactions/api";
import { ConfirmDialog } from "@/components/dashboard/alert-dialog";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

type TransactionsFilter = Period | "All Time" | "Custom Range";

const FILTER_OPTIONS: TransactionsFilter[] = [
  "All Time",
  "This Month",
  "Last Month",
  "This Year",
  "Custom Range",
];

function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const accountsQuery = useAccounts();
  const deleteTransaction = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [filter, setFilter] = useState<TransactionsFilter>("All Time");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [toDelete, setToDelete] = useState<TransactionItem | null>(null);

  function handleDelete(transaction: TransactionItem) {
    setToDelete(transaction);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteTransaction.mutateAsync(toDelete.id);
      toast.success("Transaction deleted.");
    } catch (error) {
      toast.error(
        `Could not delete transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setToDelete(null);
    }
  }

  const transactions = transactionsQuery.data ?? [];
  const accounts = (accountsQuery.data ?? []).map((account) => ({
    id: account.id,
    label: `${account.providerName} · ${account.nickname}`,
    amount: account.amount,
  }));

  const range =
    filter === "All Time"
      ? undefined
      : filter === "Custom Range"
        ? customDateRange(fromDate, toDate)
        : periodRange(filter);

  const filtered = filterTransactionsByRange(transactions, range);
  const isFiltering = filtered.length !== transactions.length;
  const summary = summarizeTransactions(filtered);
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
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as TransactionsFilter)}
          >
            <SelectTrigger
              aria-label="Filter by period"
              className="h-10 w-40 rounded-xl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="h-10 rounded-xl">
            <Plus />
            Add transaction
          </Button>
        </div>
      </div>

      {filter === "Custom Range" && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              From
            </span>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 w-44 rounded-xl"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              To
            </span>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 w-44 rounded-xl"
            />
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Cash In"
          subtitle={filter}
          amount={totalIn}
          footerLabel="View transactions"
          icon={ArrowUpRight}
        />
        <StatCard
          title="Cash Out"
          subtitle={filter}
          amount={totalOut}
          footerLabel="View transactions"
          icon={ArrowDownLeft}
        />
        <StatCard
          variant="filled"
          title="Net Cash Flow"
          subtitle={`Cash out minus cash in · ${filter}`}
          amount={net}
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
          key={`${filter}-${fromDate}-${toDate}`}
          transactions={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          emptyMessage={
            isFiltering
              ? "No transactions in this range."
              : "No transactions yet."
          }
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={() => setToDelete(null)}
        title="Delete transaction?"
        description={
          toDelete && (
            <>
              This will permanently delete the{" "}
              {toDelete.type === "cash_in" ? "cash in" : "cash out"} of{" "}
              <span className="font-medium text-foreground">
                {formatPeso(toDelete.amount)}
              </span>{" "}
              on {toDelete.accountLabel}. This can't be undone.
            </>
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
      />

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
