import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TransactionForm,
  type TransactionFormAccount,
  type TransactionFormTransaction,
} from "./TransactionForm";
import type { TransactionFormValues } from "./schema";

export function TransactionFormDialog({
  open,
  onOpenChange,
  accounts,
  transaction,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: TransactionFormAccount[];
  transaction?: TransactionFormTransaction;
  onSaved: (values: TransactionFormValues) => void;
}) {
  const isEdit = transaction != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the cash in or cash out details."
              : "Record a cash in or cash out in a few taps."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          key={transaction?.id ?? "new"}
          accounts={accounts}
          transaction={transaction}
          onSaved={(values) => onSaved(values)}
        />
      </DialogContent>
    </Dialog>
  );
}
