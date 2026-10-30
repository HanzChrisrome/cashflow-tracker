import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/format";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  availableCentavos,
  createTransactionSchema,
  nowLocalInput,
  TRANSACTION_TYPES,
  type TransactionFormValues,
  type TransactionType,
} from "./schema";
import { useSaveTransaction } from "./hooks";
import { transactionEffectCentavos } from "./totals";
import { Textarea } from "@/components/ui/textarea";

export type TransactionFormAccount = {
  id: string;
  label: string;
  amount: string;
};

export type TransactionFormTransaction = {
  id: string;
  releasedAt?: string;
} & TransactionFormValues;

const typeLabels: Record<TransactionType, string> = {
  cash_in: "Cash In",
  cash_out: "Cash Out",
};

function TypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Transaction type"
      className="grid grid-cols-2 gap-2"
    >
      {TRANSACTION_TYPES.map((type) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(type)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl border text-base font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? type === "cash_out"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {type === "cash_out" ? (
              <ArrowDownLeft className="size-4" />
            ) : (
              <ArrowUpRight className="size-4" />
            )}
            {typeLabels[type]}
          </button>
        );
      })}
    </div>
  );
}

function handleDecimalInput(value: string, onChange: (value: string) => void) {
  let cleaned = value.replace(/[^\d.]/g, "");

  const decimalIndex = cleaned.indexOf(".");

  if (decimalIndex !== -1) {
    cleaned =
      cleaned.slice(0, decimalIndex + 1) +
      cleaned.slice(decimalIndex + 1).replace(/\./g, "");
  }

  onChange(cleaned);
}

export function TransactionForm({
  accounts,
  transaction,
  onSaved,
}: {
  accounts: TransactionFormAccount[];
  transaction?: TransactionFormTransaction;
  onSaved?: (values: TransactionFormValues) => void;
}) {
  const isEdit = transaction != null;
  const saveTransaction = useSaveTransaction(transaction?.id);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(
      createTransactionSchema({ accounts, original: transaction }),
    ),
    defaultValues: transaction
      ? {
          type: transaction.type,
          accountId: transaction.accountId,
          amount: transaction.amount,
          fee: transaction.fee,
          timestamp: transaction.timestamp,
          countFee: transaction.countFee,
          note: transaction.note,
          onHold: transaction.onHold,
        }
      : {
          type: "cash_in",
          accountId: "",
          amount: "",
          fee: "0",
          timestamp: nowLocalInput(),
          countFee: false,
          note: "",
          onHold: false,
        },
  });

  async function onSubmit(values: TransactionFormValues) {
    form.clearErrors("root");
    try {
      await saveTransaction.mutateAsync(values);
      toast.success(isEdit ? "Transaction updated" : "Transaction recorded");
      onSaved?.(values);
    } catch {
      form.setError("root", {
        message:
          "Could not save the transaction. Check your connection and try again.",
      });
      toast.error("Could not save the transaction");
    }
  }

  const isSaving = form.formState.isSubmitting || saveTransaction.isPending;

  const watchedType = useWatch({ control: form.control, name: "type" });
  const watchedAccountId = useWatch({
    control: form.control,
    name: "accountId",
  });
  const watchedAmount = useWatch({ control: form.control, name: "amount" });
  const watchedFee = useWatch({ control: form.control, name: "fee" });
  const watchedCountFee = useWatch({
    control: form.control,
    name: "countFee",
  });
  const selectedAccount = accounts.find(
    (account) => account.id === watchedAccountId,
  );

  let lowBalanceWarning: string | null = null;
  let balanceAfterCentavos: number | null = null;
  if (
    selectedAccount &&
    watchedAmount &&
    !Number.isNaN(Number(watchedAmount))
  ) {
    // Start from the balance with the original transaction's effect reversed
    balanceAfterCentavos =
      availableCentavos(selectedAccount, transaction) +
      transactionEffectCentavos(
        watchedType,
        watchedAmount,
        watchedFee || "0",
        watchedCountFee,
      );
  }

  if (
    watchedType === "cash_in" &&
    selectedAccount &&
    watchedAmount &&
    !Number.isNaN(Number(watchedAmount))
  ) {
    const available = availableCentavos(selectedAccount, transaction) / 100;
    const needed =
      Number(watchedAmount) + (watchedCountFee ? Number(watchedFee || 0) : 0);
    if (needed > available) {
      lowBalanceWarning = `Only ${formatPeso(available)} available in this account`;
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <TypeToggle
                  value={field.value}
                  onChange={(type) => {
                    field.onChange(type);
                    if (type === "cash_in") form.setValue("onHold", false);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select
                  items={accounts.map((account) => ({
                    value: account.id,
                    label: account.label,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger
                      aria-label="Account"
                      className="h-12 text-base"
                    >
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Show current amount of the selected account in the form and the amount result when the transaction is approved. */}
          {selectedAccount && (
            <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-card px-4 py-2">
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className="text-lg font-medium">
                {formatPeso(selectedAccount.amount)}
              </p>
              {balanceAfterCentavos !== null && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isEdit
                      ? "Balance after edit"
                      : "Balance after transaction"}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-medium",
                      watchedType === "cash_out"
                        ? "text-success"
                        : "text-destructive",
                    )}
                  >
                    {formatPeso(balanceAfterCentavos / 100)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  autoFocus
                  className="h-12 text-base"
                  value={field.value}
                  onChange={(event) =>
                    handleDecimalInput(event.target.value, field.onChange)
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              {lowBalanceWarning && (
                <p className="text-xs font-medium text-warning">
                  {lowBalanceWarning}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="h-12 text-base"
                  value={field.value}
                  onChange={(event) =>
                    handleDecimalInput(event.target.value, field.onChange)
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countFee"
          render={({ field }) => (
            <FormItem>
              <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-4 py-2">
                <div className="min-w-0">
                  <FormLabel className="text-base">
                    Count fee toward balance
                  </FormLabel>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedType === "cash_out" && (
          <FormField
            control={form.control}
            name="onHold"
            render={({ field }) => (
              <FormItem>
                <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-4 py-2">
                  <div className="min-w-0">
                    <FormLabel className="text-base text-red-700">
                      Hold this cash out
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={Boolean(transaction?.releasedAt)}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional note"
                  className="h-24 text-base"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timestamp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date &amp; time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="h-12 text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={isSaving}
        >
          {isSaving
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Save transaction"}
        </Button>
      </form>
    </Form>
  );
}
