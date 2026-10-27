import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatTimestampInput,
  type TransactionItem,
} from "./transactions-table";

export function RecentTransactionsCard({
  transactions,
  limit = 5,
}: {
  transactions: TransactionItem[];
  limit?: number;
}) {
  const recent = transactions.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            render={<Link to="/transactions" />}
          >
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="pb-1">
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No transactions yet.{" "}
            <Link
              to="/transactions"
              className="font-medium text-primary hover:underline"
            >
              Record one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    transaction.type === "cash_out"
                      ? "bg-primary-tint text-primary"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {transaction.type === "cash_out" ? (
                    <ArrowDownLeft className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {transaction.type === "cash_in" ? "Cash In" : "Cash Out"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {transaction.accountLabel} ·{" "}
                    {formatTimestampInput(transaction.timestamp)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    transaction.type === "cash_out"
                      ? "text-success"
                      : "text-destructive",
                  )}
                >
                  {transaction.type === "cash_out" ? "+" : "-"}
                  {formatPeso(transaction.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
