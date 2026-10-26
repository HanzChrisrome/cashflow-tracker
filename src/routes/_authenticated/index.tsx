import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { AccountsCard } from "@/components/dashboard/account-card";
import { ActivitiesTable } from "@/components/dashboard/activities-table";
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
import { sumPeso } from "@/lib/format";
import { useAccounts } from "@/features/accounts/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: OverviewPage,
});

function OverviewPage() {
  const [period, setPeriod] = useState("This Month");
  const accountsQuery = useAccounts();

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
          onValueChange={(value) => setPeriod(value as string)}
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
          change="+2.5%"
          footerLabel="View accounts"
          icon={Wallet}
        />
        <StatCard
          title="Cash In"
          subtitle="This month"
          amount="₱48,500.00"
          change="+3.2%"
          footerLabel="View transactions"
          icon={ArrowDownLeft}
        />
        <StatCard
          title="Cash Out"
          subtitle="This month"
          amount="₱18,640.50"
          change="+1.8%"
          footerLabel="View transactions"
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
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
            <AccountsCard accounts={accountsQuery.data} />
          )}
        </div>
        <div className="lg:col-span-3">
          <ChartCard />
        </div>
      </div>

      <ActivitiesTable />
    </div>
  );
}
