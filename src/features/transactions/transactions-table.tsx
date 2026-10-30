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
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TransactionItem = {
  id: string;
  type: TransactionType;
  accountId: string;
  accountLabel: string;
  amount: string;
  fee: string;
  countFee: boolean;
  timestamp: string;
  note?: string;
  onHold: boolean;
  releasedAt?: string;
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
  onRelease,
  onDelete,
  emptyMessage = "No transactions yet.",
}: {
  transactions: TransactionItem[];
  onEdit: (transaction: TransactionItem) => void;
  onDelete: (transaction: TransactionItem) => void;
  onRelease: (transaction: TransactionItem) => void;
  emptyMessage?: string;
}) {
  const PAGE_SIZE = 10;

  const [page, setPage] = useState(1);
  const [noteTransaction, setNoteTransaction] =
    useState<TransactionItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTransactions = transactions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  const startItem = transactions.length === 0 ? 0 : startIndex + 1;

  const endItem = Math.min(startIndex + PAGE_SIZE, transactions.length);

  return (
    <>
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              {emptyMessage}
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
                  <TableHead className="hidden bg-muted/50 text-xs text-muted-foreground sm:table-cell">
                    Note
                  </TableHead>
                  <TableHead className="bg-muted/50 text-right text-xs text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="hidden bg-muted/50 text-right text-xs text-muted-foreground sm:table-cell">
                    Fee
                  </TableHead>
                  <TableHead className="hidden bg-muted/50 text-xs text-muted-foreground sm:table-cell">
                    Date &amp; time
                  </TableHead>
                  <TableHead className="w-10 bg-muted/50 pr-5 text-xs text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className={cn(
                      transaction.onHold && "bg-red-50 hover:bg-red-100",
                    )}
                  >
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
                        {transaction.onHold && (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            On hold
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{transaction.accountLabel}</div>
                      {transaction.note && (
                        <button
                          type="button"
                          onClick={() => setNoteTransaction(transaction)}
                          className="mt-0.5 text-xs font-medium text-primary underline-offset-2 hover:underline sm:hidden"
                        >
                          View note
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell w-0">
                      {transaction.note ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="max-w-45 cursor-default truncate lg:max-w-70">
                              {transaction.note}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs wrap-break-word">
                            {transaction.note}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
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
                      <br />
                      {transaction.releasedAt && (
                        <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                          Released at{" "}
                          {formatTimestampInput(transaction.releasedAt)}
                        </span>
                      )}
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
                        {transaction.onHold && (
                          <Button
                            variant="default"
                            size="sm"
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                            aria-label="Release transaction"
                            onClick={() => onRelease(transaction)}
                          >
                            Release
                          </Button>
                        )}
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
          {transactions.length > 0 && (
            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-muted/20 text-center">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {startItem}–{endItem}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {transactions.length}
                </span>{" "}
                transactions
              </p>

              <div className="flex items-center gap-2 max-sm:mx-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((previous) => Math.max(1, previous - 1))
                  }
                >
                  Previous
                </Button>

                <span className="min-w-20 text-center text-sm tabular-nums">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={noteTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setNoteTransaction(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note</DialogTitle>
            {noteTransaction && (
              <DialogDescription>
                {noteTransaction.type === "cash_in" ? "Cash In" : "Cash Out"} ·{" "}
                {formatPeso(noteTransaction.amount)} ·{" "}
                {formatTimestampInput(noteTransaction.timestamp)}
              </DialogDescription>
            )}
          </DialogHeader>
          <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap wrap-break-word text-sm">
            {noteTransaction?.note}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
