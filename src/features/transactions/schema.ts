import { z } from "zod";

import { formatPeso } from "@/lib/format";
import { transactionEffectCentavos } from "./totals";

export const TRANSACTION_TYPES = ["cash_in", "cash_out"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export function nowLocalInput(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type BalanceContextAccount = {
  id: string;
  amount: string | number;
};

export type OriginalTransactionRef = {
  accountId: string;
  type: TransactionType;
  amount: string;
  fee: string;
  countFee: boolean;
};

export type TransactionSchemaContext = {
  accounts?: BalanceContextAccount[];
  original?: OriginalTransactionRef | null;
};

export function availableCentavos(
  account: BalanceContextAccount,
  original?: OriginalTransactionRef | null,
): number {
  let centavos = Math.round(Number(account.amount) * 100);
  if (original && original.accountId === account.id) {
    centavos -= transactionEffectCentavos(
      original.type,
      original.amount,
      original.fee,
      original.countFee,
    );
  }
  return centavos;
}

export function createTransactionSchema({
  accounts = [],
  original,
}: TransactionSchemaContext = {}) {
  return z
    .object({
      type: z.enum(TRANSACTION_TYPES),
      accountId: z.string().min(1, "Select an account"),
      countFee: z.boolean(),
      amount: z
        .string()
        .trim()
        .min(1, "Enter an amount")
        .superRefine((value, ctx) => {
          const amount = Number(value);

          if (Number.isNaN(amount)) {
            ctx.addIssue({ code: "custom", message: "Enter a valid amount" });
            return;
          }
          if (amount <= 0) {
            ctx.addIssue({
              code: "custom",
              message: "Enter an amount greater than ₱0",
            });
            return;
          }
          if (!/^\d+(\.\d{1,2})?$/.test(value)) {
            ctx.addIssue({
              code: "custom",
              message: "Enter an amount with at most 2 decimals",
            });
          }
        }),
      fee: z
        .string()
        .trim()
        .min(1, "Enter a fee")
        .superRefine((value, ctx) => {
          const fee = Number(value);

          if (Number.isNaN(fee)) {
            ctx.addIssue({ code: "custom", message: "Enter a valid fee" });
            return;
          }
          if (fee < 0) {
            ctx.addIssue({
              code: "custom",
              message: "Fee can't be negative",
            });
            return;
          }
          if (!/^\d+(\.\d{1,2})?$/.test(value)) {
            ctx.addIssue({
              code: "custom",
              message: "Enter a fee with at most 2 decimals",
            });
          }
        }),
      timestamp: z
        .string()
        .min(1, "Enter a date and time")
        .refine(
          (value) => !Number.isNaN(new Date(value).getTime()),
          "Enter a valid date and time",
        ),
    })
    .superRefine((values, ctx) => {
      if (values.type === "cash_in") return;

      const account = accounts.find((item) => item.id === values.accountId);
      if (!account) return;

      const available = availableCentavos(account, original);
      const needed =
        Math.round(Number(values.amount) * 100) +
        (values.countFee ? Math.round(Number(values.fee) * 100) : 0);

      if (needed > available) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: `Not enough balance — ${formatPeso(available / 100)} available in this account`,
        });
      }
    });
}

export type TransactionFormValues = z.infer<
  ReturnType<typeof createTransactionSchema>
>;
