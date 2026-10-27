import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { AccountsCard } from "@/components/dashboard/account-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeso, sumPeso } from "@/lib/format";
import { DEFAULT_WARNING_THRESHOLD } from "@/lib/limit-status";
import { LimitAlertBanner } from "@/components/dashboard/limit-alert-banner";
import { useAccounts } from "@/features/accounts/hooks";
import { RecentTransactionsCard } from "@/features/transactions/RecentTransactionsCard";
import { useTransactions } from "@/features/transactions/hooks";
import {
  monthlyCashIn,
  percentChangeLabel,
  periodRange,
  previousPeriodRange,
  summarizeTransactions,
  type Period,
} from "@/features/transactions/totals";
import { useAppSettings } from "@/hooks/use-app-settings";

export const Route = createFileRoute("/_authenticated/")({
  component: OverviewPage,
});

function OverviewPage() {
  const [period, setPeriod] = useState<Period>("This Month");
  const accountsQuery = useAccounts();
  const transactionsQuery = useTransactions();
  const settingsQuery = useAppSettings();
  const threshold = settingsQuery.data ?? DEFAULT_WARNING_THRESHOLD;

  const transactions = transactionsQuery.data ?? [];
  const current = summarizeTransactions(transactions, periodRange(period));
  const previous = summarizeTransactions(
    transactions,
    previousPeriodRange(period),
  );
  const cashInChange = percentChangeLabel(
    current.inCentavos,
    previous.inCentavos,
  );
  const cashOutChange = percentChangeLabel(
    current.outCentavos,
    previous.outCentavos,
  );
  const chartData = monthlyCashIn(transactions);
  const chartTotal = sumPeso(chartData.map((datum) => datum.total));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track your cash flow across all accounts.
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <SelectTrigger
            aria-label="Select period"
            className="h-9 w-36 rounded-xl"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="This Month">This Month</SelectItem>
            <SelectItem value="Last Month">Last Month</SelectItem>
            <SelectItem value="This Year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          variant="filled"
          title="Total Balance"
          subtitle={
            accountsQuery.data
              ? `Across ${accountsQuery.data.length} accounts`
              : "Across your accounts"
          }
          amount={
            accountsQuery.data
              ? sumPeso(accountsQuery.data.map((account) => account.amount))
              : "—"
          }
          footerLabel="View accounts"
          icon={Wallet}
        />
        <StatCard
          title="Cash In"
          subtitle={period}
          amount={formatPeso(current.inCentavos / 100)}
          change={cashInChange?.label}
          trend={cashInChange?.trend}
          footerLabel="View transactions"
          icon={ArrowDownLeft}
        />
        <StatCard
          title="Cash Out"
          subtitle={period}
          amount={formatPeso(current.outCentavos / 100)}
          change={cashOutChange?.label}
          trend={cashOutChange?.trend}
          footerLabel="View transactions"
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {accountsQuery.isPending ? (
            <Card className="h-full">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Loading accounts…
              </CardContent>
            </Card>
          ) : accountsQuery.isError ? (
            <Card className="h-full">
              <CardContent
                role="alert"
                className="py-8 text-center text-sm text-destructive"
              >
                Could not load accounts: {accountsQuery.error.message}
              </CardContent>
            </Card>
          ) : (
            <>
              <LimitAlertBanner
                accounts={accountsQuery.data}
                threshold={threshold}
              />
              <AccountsCard
                accounts={accountsQuery.data}
                threshold={threshold}
              />
            </>
          )}
        </div>
        <div className="lg:col-span-3">
          <ChartCard data={chartData} total={chartTotal} />
        </div>
      </div>

      {transactionsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      ) : transactionsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load transactions: {transactionsQuery.error.message}
        </p>
      ) : (
        <RecentTransactionsCard transactions={transactions} />
      )}
    </div>
  );
}
