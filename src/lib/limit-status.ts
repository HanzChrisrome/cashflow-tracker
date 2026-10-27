export const DEFAULT_WARNING_THRESHOLD = 80;
export const THRESHOLD_MIN = 1;
export const THRESHOLD_MAX = 100;

export type LimitStatus = "ok" | "warning" | "reached" | "inactive";

export type LimitStatusResult = {
  percent: number;
  remaining: number;
  overBy: number;
  status: LimitStatus;
};

function toNumber(value: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getLimitStatus({
  amount,
  limit,
  threshold = DEFAULT_WARNING_THRESHOLD,
  isActive,
}: {
  amount: number | string;
  limit: number | string;
  threshold?: number | string;
  isActive: boolean;
}): LimitStatusResult {
  if (!isActive) {
    return { percent: 0, remaining: 0, overBy: 0, status: "inactive" };
  }

  const used = toNumber(amount);
  const cap = toNumber(limit);
  const warnAt = toNumber(threshold);

  if (cap <= 0) {
    return { percent: 0, remaining: 0, overBy: 0, status: "ok" };
  }

  // Compare via multiplication to avoid float division edge cases.
  if (used * 100 >= 100 * cap) {
    return {
      percent: (used / cap) * 100,
      remaining: 0,
      overBy: used - cap,
      status: "reached",
    };
  }

  if (used * 100 >= warnAt * cap) {
    return {
      percent: (used / cap) * 100,
      remaining: cap - used,
      overBy: 0,
      status: "warning",
    };
  }

  return {
    percent: (used / cap) * 100,
    remaining: cap - used,
    overBy: 0,
    status: "ok",
  };
}
