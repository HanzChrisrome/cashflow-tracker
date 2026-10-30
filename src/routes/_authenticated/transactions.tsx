import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet, X } from "lucide-react";
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
  useReleaseTransaction,
  useDeleteTransaction,
  useTransactions,
} from "@/features/transactions/hooks";
import {
  customDateRange,
  periodRange,
  summarizeTransactions,
  type Period,
} from "@/features/transactions/totals";
import { type TransactionItem } from "@/features/transactions/api";
import { ConfirmDialog } from "@/components/dashboard/alert-dialog";

export const Route = createFileRoute("/_authenticated/transactions")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { account?: string; new?: boolean } => ({
    account: typeof search.account === "string" ? search.account : undefined,
    new: search.new === true || search.new === "true" ? true : undefined,
  }),
  component: TransactionsPage,
});

type TransactionsFilter = Period | "All Time" | "Custom Range";

const FILTER_OPTIONS: TransactionsFilter[] = [
  "Today",
  "This Month",
  "Last Month",
  "This Year",
  "All Time",
  "Custom Range",
];

function TransactionsPage() {
  const accountsQuery = useAccounts();
  const releaseTransaction = useReleaseTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionItem | null>(null);
  const [filter, setFilter] = useState<TransactionsFilter>("Today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Account Filter
  const { account: accountParam, new: openNewParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const selectedAccountId =
    accountParam &&
    accountsQuery.data?.some((account) => account.id === accountParam)
      ? accountParam
      : undefined;

  // Date Filter
  const range =
    filter === "All Time"
      ? undefined
      : filter === "Custom Range"
        ? customDateRange(fromDate, toDate)
        : periodRange(filter);

  const transactionsQuery = useTransactions({
    accountId: selectedAccountId,
    from: range?.start,
    to: range?.end,
  });

  // Deep link from the dashboard: /transactions?new=true keeps the dialog
  // open while the param is present; closing strips it so refresh won't
  // reopen the form.
  function closeDialog() {
    setDialogOpen(false);
    if (openNewParam) {
      navigate({
        to: "/transactions",
        search: (previous) => ({ account: previous.account }),
        replace: true,
      });
    }
  }

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

  async function handleRelease(transaction: TransactionItem) {
    try {
      await releaseTransaction.mutateAsync(transaction.id);
      toast.success("Transaction released.");
    } catch (error) {
      toast.error(
        `Could not release transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const transactions = transactionsQuery.data ?? [];
  const accounts = (accountsQuery.data ?? []).map((account) => ({
    id: account.id,
    label: `${account.providerName} · ${account.nickname}${account.isActive ? "" : " · Inactive"}`,
    amount: account.amount,
  }));

  const selectedAccountName = accounts.find(
    (account) => account.id === selectedAccountId,
  )?.label;

  const summary = summarizeTransactions(transactions);
  const totalIn = formatPeso(summary.inCentavos / 100);
  const totalOut = formatPeso(summary.outCentavos / 100);
  const totalFee = formatPeso(summary.totalFeeCentavos / 100);
  const isDateFiltered = filter !== "All Time" && filter !== "Custom Range";
  const emptyMessage = selectedAccountId
    ? "No transactions for this account."
    : filter === "Today"
      ? "No transactions yet today."
      : isDateFiltered
        ? "No transactions in this range."
        : "No transactions yet.";

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(transaction: TransactionItem) {
    setEditing(transaction);
    setDialogOpen(true);
  }

  function openRelease(transaction: TransactionItem) {
    setEditing(transaction);
    setReleaseDialogOpen(true);
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
          <div className="flex items-center gap-1">
            <Select
              items={[
                { value: "all", label: "All accounts" },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: account.label,
                })),
              ]}
              value={selectedAccountId ?? "all"}
              onValueChange={(value) =>
                navigate({
                  to: "/transactions",
                  search: {
                    account: !value || value === "all" ? undefined : value,
                  },
                })
              }
            >
              <SelectTrigger
                aria-label="Filter by account"
                className="h-10 w-44 rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccountId && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear account filter"
                onClick={() =>
                  navigate({
                    to: "/transactions",
                    search: { account: undefined },
                  })
                }
              >
                <X />
              </Button>
            )}
          </div>
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
          title="Total Income"
          subtitle={`Cash out and cash in · ${filter} from ${selectedAccountId ? selectedAccountName : "all accounts"}`}
          amount={totalFee}
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
          key={`${filter}-${fromDate}-${toDate}-${selectedAccountId ?? "all"}`}
          transactions={transactions}
          onEdit={openEdit}
          onRelease={openRelease}
          onDelete={handleDelete}
          emptyMessage={emptyMessage}
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

      <ConfirmDialog
        open={releaseDialogOpen}
        onOpenChange={() => setReleaseDialogOpen(false)}
        title="Release transaction?"
        description={
          editing && (
            <>
              This will release the{" "}
              {editing.type === "cash_in" ? "cash in" : "cash out"} of{" "}
              <span className="font-medium text-foreground">
                {formatPeso(editing.amount)}
              </span>{" "}
              on {editing.accountLabel}. This can't be undone.
            </>
          )
        }
        confirmLabel="Release"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (!editing) return;
          handleRelease(editing);
        }}
      />

      <TransactionFormDialog
        open={dialogOpen || openNewParam === true}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        accounts={accounts}
        transaction={editing ?? undefined}
        onSaved={closeDialog}
      />
    </div>
  );
}
