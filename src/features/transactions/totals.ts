import type { TransactionItem } from "./api";
import type { TransactionType } from "./schema";

export type Period = "This Month" | "Last Month" | "This Year";

export type DateRange = { start: Date; end: Date };

export type TransactionSummary = {
  inCentavos: number;
  outCentavos: number;
  netCentavos: number;
};

export function transactionEffectCentavos(
  type: TransactionType,
  amount: string | number,
  fee: string | number,
  countFee: boolean,
): number {
  const amountCentavos = Math.round(Number(amount) * 100);
  const feePart = countFee ? Math.round(Number(fee) * 100) : 0;
  const magnitude = amountCentavos + feePart;
  return type === "cash_in" ? -magnitude : magnitude;
}

export function summarizeTransactions(
  transactions: TransactionItem[],
  range?: DateRange,
): TransactionSummary {
  let inCentavos = 0;
  let outCentavos = 0;

  for (const transaction of transactions) {
    const occurredAt = new Date(transaction.timestamp);
    if (range && (occurredAt < range.start || occurredAt >= range.end)) {
      continue;
    }

    const amount = Math.round(Number(transaction.amount) * 100);
    const feePart = transaction.countFee
      ? Math.round(Number(transaction.fee) * 100)
      : 0;

    if (transaction.type === "cash_in") {
      inCentavos += amount + feePart;
    } else {
      outCentavos += amount + feePart;
    }
  }

  // Net change to account balances: cash out credits, cash in debits.
  return { inCentavos, outCentavos, netCentavos: outCentavos - inCentavos };
}

export function periodRange(period: Period, now = new Date()): DateRange {
  if (period === "This Year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }

  const monthOffset = period === "Last Month" ? -1 : 0;
  return {
    start: new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
    end: new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1),
  };
}

export function previousPeriodRange(
  period: Period,
  now = new Date(),
): DateRange {
  if (period === "This Year") {
    return {
      start: new Date(now.getFullYear() - 1, 0, 1),
      end: new Date(now.getFullYear(), 0, 1),
    };
  }

  const monthOffset = period === "Last Month" ? -2 : -1;
  return {
    start: new Date(now.getFullYear(), now.getMonth() + monthOffset, 1),
    end: new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1),
  };
}

export function percentChangeLabel(
  currentCentavos: number,
  previousCentavos: number,
): { label: string; trend: "up" | "down" } | null {
  if (previousCentavos <= 0) {
    return null;
  }

  const percent =
    ((currentCentavos - previousCentavos) / previousCentavos) * 100;
  const sign = percent >= 0 ? "+" : "-";
  return {
    label: `${sign}${Math.abs(percent).toFixed(1)}%`,
    trend: percent >= 0 ? "up" : "down",
  };
}

export function monthlyCashIn(
  transactions: TransactionItem[],
  months = 6,
  now = new Date(),
): { month: string; total: number; highlight?: boolean }[] {
  const buckets: { month: string; total: number; highlight?: boolean }[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    const summary = summarizeTransactions(
      transactions.filter((transaction) => transaction.type === "cash_in"),
      { start, end },
    );
    buckets.push({
      month: start.toLocaleString("en-PH", { month: "short" }),
      total: summary.inCentavos / 100,
      highlight: offset === 0,
    });
  }

  return buckets;
}
