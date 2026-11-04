import type { TransactionItem } from "@/features/transactions/api";
import { formatTimestampInput } from "@/features/transactions/transactions-table";
import {
  periodRange,
  summarizeTransactions,
  type Period,
  type TransactionSummary,
} from "@/features/transactions/totals";

export type TransactionsFilter = Period | "All Time" | "Custom Range";

export const ROW_CAP = 2000;

export function exceedsRowCap(count: number): boolean {
  return count > ROW_CAP;
}

export type ReportRow = {
  dateTime: string;
  type: string;
  account: string;
  note: string;
  amount: string;
  fee: string;
  status: string;
};

export type ReportModel = {
  businessName: string;
  title: string;
  accountText: string;
  periodText: string;
  generatedAtText: string;
  summary: TransactionSummary;
  count: number;
  rows: ReportRow[];
  filename: string;
};

const pesoNumberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const reportDateFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const reportMonthDayFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
});

const generatedAtFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatPesoCentavos(centavos: number): string {
  const sign = centavos < 0 ? "-" : "";
  return `${sign}₱${pesoNumberFormat.format(Math.abs(centavos) / 100)}`;
}

export function formatGeneratedAt(now: Date): string {
  return `${generatedAtFormat.format(now)} (Asia/Manila)`;
}

function formatDate(date: Date): string {
  return reportDateFormat.format(date);
}

function formatDateRange(start: Date, end: Date): string {
  if (start.getFullYear() === end.getFullYear()) {
    return `${reportMonthDayFormat.format(start)} – ${formatDate(end)}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function formatIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function previousDay(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return copy;
}

export function describePeriod(
  filter: TransactionsFilter,
  fromDate: string,
  toDate: string,
  now = new Date(),
): string {
  if (filter === "All Time") return "All Time";

  if (filter === "Custom Range") {
    if (fromDate && toDate) {
      return `Custom range (${formatDateRange(new Date(`${fromDate}T00:00`), new Date(`${toDate}T00:00`))})`;
    }
    if (fromDate) {
      return `Custom range (from ${formatDate(new Date(`${fromDate}T00:00`))})`;
    }
    if (toDate) {
      return `Custom range (until ${formatDate(new Date(`${toDate}T00:00`))})`;
    }
    return "Custom range";
  }

  const { start, end } = periodRange(filter, now);
  const inclusiveEnd = previousDay(end);
  const dates =
    formatIsoDate(start) === formatIsoDate(inclusiveEnd)
      ? formatDate(start)
      : formatDateRange(start, inclusiveEnd);
  return `${filter} (${dates})`;
}

function periodFilenamePart(
  filter: TransactionsFilter,
  fromDate: string,
  toDate: string,
  now: Date,
): string {
  if (filter === "All Time") return "all-time";

  if (filter === "Custom Range") {
    if (fromDate && toDate) return `${fromDate}_to_${toDate}`;
    if (fromDate) return `from_${fromDate}`;
    if (toDate) return `until_${toDate}`;
    return "custom";
  }

  const { start, end } = periodRange(filter, now);
  const inclusiveEnd = formatIsoDate(previousDay(end));
  const startIso = formatIsoDate(start);
  return startIso === inclusiveEnd
    ? startIso
    : `${startIso}_to_${inclusiveEnd}`;
}

export function slugifyLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "account"
  );
}

export function buildFilename(
  filter: TransactionsFilter,
  fromDate: string,
  toDate: string,
  accountLabel: string,
  now = new Date(),
): string {
  const periodPart = periodFilenamePart(filter, fromDate, toDate, now);
  return `transactions_${periodPart}_${slugifyLabel(accountLabel)}.pdf`;
}

function toReportRow(transaction: TransactionItem): ReportRow {
  const amountCentavos = Math.round(Number(transaction.amount) * 100);
  const feeCentavos = Math.round(Number(transaction.fee) * 100);
  const status = transaction.onHold
    ? "On Hold"
    : transaction.releasedAt
      ? "Released"
      : "Completed";

  return {
    dateTime: formatTimestampInput(transaction.timestamp),
    type: transaction.type === "cash_in" ? "Cash In" : "Cash Out",
    account: transaction.accountLabel,
    note: transaction.note?.trim() ? transaction.note : "-",
    amount: `${transaction.type === "cash_out" ? "+" : "-"}${formatPesoCentavos(amountCentavos)}`,
    fee: formatPesoCentavos(feeCentavos),
    status,
  };
}

export function buildReportModel({
  transactions,
  accountLabel,
  filter,
  fromDate,
  toDate,
  businessName,
  now = new Date(),
}: {
  transactions: TransactionItem[];
  accountLabel: string;
  filter: TransactionsFilter;
  fromDate: string;
  toDate: string;
  businessName: string;
  now?: Date;
}): ReportModel {
  return {
    businessName,
    title: "Transactions Report",
    accountText: accountLabel,
    periodText: describePeriod(filter, fromDate, toDate, now),
    generatedAtText: formatGeneratedAt(now),
    summary: summarizeTransactions(transactions),
    count: transactions.length,
    rows: transactions.slice(0, ROW_CAP).map(toReportRow),
    filename: buildFilename(filter, fromDate, toDate, accountLabel, now),
  };
}
