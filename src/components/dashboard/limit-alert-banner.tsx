import { TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import { getLimitStatus } from "@/lib/limit-status";

export type LimitAlertAccount = {
  id: string;
  providerName: string;
  nickname: string;
  monthlyLimit: string;
  amount: string;
  isActive: boolean;
};

export function LimitAlertBanner({
  accounts,
  threshold,
}: {
  accounts: LimitAlertAccount[];
  threshold: number;
}) {
  const flagged = accounts
    .filter((account) => account.isActive)
    .map((account) => ({
      account,
      status: getLimitStatus({
        amount: account.amount,
        limit: account.monthlyLimit,
        threshold,
        isActive: true,
      }),
    }))
    .filter(
      ({ status }) =>
        status.status === "warning" || status.status === "reached",
    )
    .sort((a, b) => b.status.percent - a.status.percent);

  if (flagged.length === 0) return null;

  const anyReached = flagged.some(({ status }) => status.status === "reached");

  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border p-4",
        anyReached
          ? "border-destructive/50 bg-destructive/10"
          : "border-warning/50 bg-warning-tint",
      )}
    >
      <div className="flex items-center gap-2">
        <TriangleAlert
          className={cn(
            "size-4 shrink-0",
            anyReached ? "text-destructive" : "text-warning",
          )}
        />
        <p
          className={cn(
            "text-sm font-semibold",
            anyReached ? "text-destructive" : "text-warning",
          )}
        >
          {flagged.length === 1
            ? "1 account is near its limit"
            : `${flagged.length} accounts are near their limit`}
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {flagged.map(({ account, status }) => (
          <li
            key={account.id}
            className="flex items-center justify-between gap-3 text-sm"
            data-testid="limit-alert-row"
          >
            <span className="min-w-0 truncate">
              <span className="font-medium">{account.providerName}</span>
              <span className="text-muted-foreground">
                {" "}
                · {account.nickname}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                status.status === "reached"
                  ? "text-destructive"
                  : "text-warning",
              )}
            >
              {Math.floor(status.percent)}% used ·{" "}
              {status.status === "reached"
                ? "Limit reached"
                : `${formatPeso(status.remaining)} left`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
