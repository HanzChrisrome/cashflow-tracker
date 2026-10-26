import { z } from "zod";
import { ACCOUNT_LIMITS, type AccountLimits } from "@/config/account-limits";
import { formatPeso } from "@/lib/format";

export function createAccountSchema(limits: AccountLimits = ACCOUNT_LIMITS) {
  return z.object({
    providerId: z.string().min(1, "Select a provider"),
    nickname: z
      .string()
      .trim()
      .min(1, "Enter a nickname")
      .max(
        limits.nicknameMaxLength,
        `Keep the nickname under ${limits.nicknameMaxLength} characters`,
      ),
    ownerName: z
      .string()
      .trim()
      .min(1, "Enter the owner name")
      .max(
        limits.ownerNameMaxLength,
        `Keep the owner name under ${limits.ownerNameMaxLength} characters`,
      ),
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
        if (amount < 0) {
          ctx.addIssue({
            code: "custom",
            message: "Amount can't be negative",
          });
          return;
        }
        if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Enter an amount with at most 2 decimals",
          });
          return;
        }
        if (amount > limits.maxAmount) {
          ctx.addIssue({
            code: "custom",
            message: `Amount can't exceed ${formatPeso(limits.maxAmount)}`,
          });
        }
      }),
    monthlyLimit: z
      .string()
      .trim()
      .min(1, "Enter a monthly limit")
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
          return;
        }
        if (amount > limits.maxMonthlyLimit) {
          ctx.addIssue({
            code: "custom",
            message: `Monthly limit can't exceed ${formatPeso(limits.maxMonthlyLimit)}`,
          });
        }
      }),
    isActive: z.boolean(),
  });
}

export type AccountFormValues = z.infer<ReturnType<typeof createAccountSchema>>;
