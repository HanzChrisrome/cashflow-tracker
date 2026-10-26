export type AccountLimits = {
  defaultAmount: number;
  maxAmount: number;
  defaultMonthlyLimit: number;
  maxMonthlyLimit: number;
  nicknameMaxLength: number;
  ownerNameMaxLength: number;
};

// Placeholder values — adjust per provider rules before rolling out.
export const ACCOUNT_LIMITS = {
  defaultAmount: 0,
  maxAmount: 10_000_000,
  defaultMonthlyLimit: 20_000,
  maxMonthlyLimit: 1_000_000,
  nicknameMaxLength: 30,
  ownerNameMaxLength: 60,
} as const satisfies AccountLimits;
