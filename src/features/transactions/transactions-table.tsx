import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionType } from "./schema";

export type TransactionItem = {
  id: string;
  type: TransactionType;
  accountId: string;
  accountLabel: string;
  amount: string;
  fee: string;
  countFee: boolean;
  timestamp: string;
};

export function formatTimestampInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: TransactionItem[];
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transaction: TransactionItem) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {transactions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/50 pl-5 text-xs text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="bg-muted/50 text-xs text-muted-foreground">
                  Account
                </TableHead>
                <TableHead className="bg-muted/50 text-right text-xs text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="hidden bg-muted/50 text-right text-xs text-muted-foreground sm:table-cell">
                  Fee
                </TableHead>
                <TableHead className="hidden bg-muted/50 text-xs text-muted-foreground md:table-cell">
                  Date &amp; time
                </TableHead>
                <TableHead className="w-10 bg-muted/50 pr-5 text-xs text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
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
                      <span className="font-medium">
                        {transaction.type === "cash_in"
                          ? "Cash In"
                          : "Cash Out"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.accountLabel}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      transaction.type === "cash_out"
                        ? "text-success"
                        : "text-destructive",
                    )}
                  >
                    {transaction.type === "cash_out" ? "+" : "-"}
                    {formatPeso(transaction.amount)}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    <span className="tabular-nums">
                      {formatPeso(transaction.fee)}
                    </span>
                    {transaction.countFee && (
                      <span className="ml-1 align-middle text-[11px] font-medium text-success">
                        · counted
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatTimestampInput(transaction.timestamp)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        aria-label={`Edit ${transaction.type === "cash_in" ? "cash in" : "cash out"} of ${formatPeso(transaction.amount)} on ${transaction.accountLabel}`}
                        onClick={() => onEdit(transaction)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${transaction.type === "cash_in" ? "cash in" : "cash out"} of ${formatPeso(transaction.amount)} on ${transaction.accountLabel}`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(transaction)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
