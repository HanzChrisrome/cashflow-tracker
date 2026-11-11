import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import {
  DEFAULT_WARNING_THRESHOLD,
  getLimitStatus,
  type LimitStatus,
} from "@/lib/limit-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export type AccountCardData = {
  id: string;
  providerName: string;
  nickname: string;
  ownerName: string;
  monthlyLimit: string;
  amount: string;
  isActive: boolean;
};

const cardStyles: Record<LimitStatus, string> = {
  ok: "border-border",
  inactive: "border-border",
  warning: "border-warning/50 bg-warning-tint",
  reached: "border-destructive/50 bg-destructive/10",
};

function UsageBadge({ status }: { status: LimitStatus }) {
  if (status !== "warning" && status !== "reached") return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "reached"
          ? "bg-destructive text-background"
          : "bg-warning text-background",
      )}
    >
      {status === "reached" ? "Limit reached" : "Near limit"}
    </span>
  );
}

export function AccountCard({
  account,
  threshold = DEFAULT_WARNING_THRESHOLD,
}: {
  account: AccountCardData;
  threshold?: number;
}) {
  const status = getLimitStatus({
    amount: account.amount,
    limit: account.monthlyLimit,
    threshold,
    isActive: account.isActive,
  });
  const showAlert = status.status === "warning" || status.status === "reached";

  return (
    <div
      data-slot="account-tile"
      className={cn("rounded-xl border p-3.5", cardStyles[status.status])}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
          {account.providerName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{account.providerName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {account.nickname}
          </p>
        </div>
        <UsageBadge status={status.status} />
      </div>
      <p className="mt-3 text-base font-bold tracking-tight">
        {account.ownerName}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
        {formatPeso(account.amount)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        of {formatPeso(account.monthlyLimit)} this month
      </p>

      {showAlert && (
        <>
          <div
            role="progressbar"
            aria-label={`Monthly limit usage for ${account.nickname}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(Math.floor(status.percent), 100)}
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-foreground/10"
          >
            <div
              className={cn(
                "h-full rounded-full",
                status.status === "reached"
                  ? "bg-destructive"
                  : "bg-warning-bar",
              )}
              style={{ width: `${Math.min(status.percent, 100)}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-2 text-xs font-medium",
              status.status === "reached" ? "text-destructive" : "text-warning",
            )}
          >
            {Math.floor(status.percent)}% used ·{" "}
            {status.overBy > 0
              ? `Over by ${formatPeso(status.overBy)}`
              : `${formatPeso(status.remaining)} left`}
          </p>
        </>
      )}

      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
        <span
          className={cn(
            "size-1.5 rounded-full",
            account.isActive ? "bg-success" : "bg-destructive",
          )}
        />
        <span
          className={account.isActive ? "text-success" : "text-destructive"}
        >
          {account.isActive ? "Active" : "Inactive"}
        </span>
      </p>
    </div>
  );
}

export function AccountsCard({
  accounts,
  threshold = DEFAULT_WARNING_THRESHOLD,
}: {
  accounts: AccountCardData[];
  threshold?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.ceil(accounts.length / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAccounts = accounts.slice(startIndex, startIndex + pageSize);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            render={<Link to="/accounts/new" />}
          >
            <Plus />
            Add New
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid flex-1 content-start grid-cols-1 gap-3 min-h-[24rem] sm:grid-cols-2">
        {accounts.length === 0 ? (
          <p className="col-span-full flex min-h-[22rem] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            No accounts yet.{" "}
            <Link
              to="/accounts/new"
              className="font-medium text-primary hover:underline"
            >
              Add one
            </Link>
            .
          </p>
        ) : (
          paginatedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              threshold={threshold}
            />
          ))
        )}
      </CardContent>
      <CardFooter className="bg-white">
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–
              {Math.min(startIndex + pageSize, accounts.length)} of{" "}
              {accounts.length} accounts
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-lg"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft />
              </Button>

              <span className="text-xs font-medium tabular-nums">
                {currentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-lg"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
