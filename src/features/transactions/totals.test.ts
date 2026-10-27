import { describe, expect, it } from "vitest";
import type { TransactionItem } from "./api";
import {
  customDateRange,
  filterTransactionsByRange,
  monthlyCashIn,
  percentChangeLabel,
  periodRange,
  previousPeriodRange,
  summarizeTransactions,
  transactionEffectCentavos,
} from "./totals";

const NOW = new Date(2026, 9, 26, 12, 0); // Oct 26, 2026

function tx(
  id: string,
  type: "cash_in" | "cash_out",
  amount: string,
  fee: string,
  timestamp: string,
  countFee = true,
): TransactionItem {
  return {
    id,
    type,
    accountId: "a1",
    accountLabel: "GCash · Main",
    amount,
    fee,
    countFee,
    timestamp,
  };
}

describe("summarizeTransactions", () => {
  it("sums cash in amounts and cash out amounts plus fees", () => {
    const summary = summarizeTransactions([
      tx("1", "cash_in", "100", "0", "2026-10-01T10:00"),
      tx("2", "cash_out", "50", "5", "2026-10-02T10:00"),
    ]);

    expect(summary.inCentavos).toBe(10000);
    expect(summary.outCentavos).toBe(5500);
    // Net is the balance movement: cash out minus cash in.
    expect(summary.netCentavos).toBe(-4500);
  });

  it("ignores fees that are not counted", () => {
    const summary = summarizeTransactions([
      tx("1", "cash_in", "5000", "10", "2026-10-01T10:00", false),
      tx("2", "cash_out", "2000", "10", "2026-10-02T10:00", false),
    ]);

    expect(summary.inCentavos).toBe(500000);
    expect(summary.outCentavos).toBe(200000);
  });

  it("includes counted cash in fees in the cash in total", () => {
    const summary = summarizeTransactions([
      tx("1", "cash_in", "5000", "10", "2026-10-01T10:00"),
    ]);

    expect(summary.inCentavos).toBe(501000);
  });

  it("keeps only transactions inside the range", () => {
    const summary = summarizeTransactions(
      [
        tx("1", "cash_in", "100", "0", "2026-10-01T10:00"),
        tx("2", "cash_in", "200", "0", "2026-09-30T23:59"),
        tx("3", "cash_in", "400", "0", "2026-11-01T00:00"),
      ],
      periodRange("This Month", NOW),
    );

    expect(summary.inCentavos).toBe(10000);
  });

  it("handles empty input", () => {
    const summary = summarizeTransactions([]);
    expect(summary.inCentavos).toBe(0);
    expect(summary.outCentavos).toBe(0);
    expect(summary.netCentavos).toBe(0);
  });
});

describe("periodRange", () => {
  it("returns calendar month boundaries for This Month", () => {
    const range = periodRange("This Month", NOW);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(9);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getMonth()).toBe(10);
  });

  it("returns the previous month for Last Month", () => {
    const range = periodRange("Last Month", NOW);
    expect(range.start.getMonth()).toBe(8);
    expect(range.end.getMonth()).toBe(9);
  });

  it("returns calendar year boundaries for This Year", () => {
    const range = periodRange("This Year", NOW);
    expect(range.start.getMonth()).toBe(0);
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.end.getFullYear()).toBe(2027);
  });
});

describe("previousPeriodRange", () => {
  it("returns the month before This Month", () => {
    const range = previousPeriodRange("This Month", NOW);
    expect(range.start.getMonth()).toBe(8);
    expect(range.end.getMonth()).toBe(9);
  });

  it("returns two months back for Last Month", () => {
    const range = previousPeriodRange("Last Month", NOW);
    expect(range.start.getMonth()).toBe(7);
    expect(range.end.getMonth()).toBe(8);
  });

  it("returns last year for This Year", () => {
    const range = previousPeriodRange("This Year", NOW);
    expect(range.start.getFullYear()).toBe(2025);
    expect(range.end.getFullYear()).toBe(2026);
  });
});

describe("percentChangeLabel", () => {
  it("labels an increase", () => {
    expect(percentChangeLabel(11000, 10000)).toEqual({
      label: "+10.0%",
      trend: "up",
    });
  });

  it("labels a decrease", () => {
    expect(percentChangeLabel(7500, 10000)).toEqual({
      label: "-25.0%",
      trend: "down",
    });
  });

  it("returns null when there is nothing to compare against", () => {
    expect(percentChangeLabel(5000, 0)).toBeNull();
    expect(percentChangeLabel(0, 0)).toBeNull();
  });
});

describe("transactionEffectCentavos", () => {
  it("removes the amount plus the counted fee for cash in", () => {
    expect(transactionEffectCentavos("cash_in", "100", "5", true)).toBe(-10500);
  });

  it("adds the amount plus the counted fee for cash out", () => {
    expect(transactionEffectCentavos("cash_out", "100", "5", true)).toBe(10500);
  });

  it("moves exactly the amount when the fee is not counted", () => {
    expect(transactionEffectCentavos("cash_in", "100", "5", false)).toBe(
      -10000,
    );
    expect(transactionEffectCentavos("cash_out", "100", "5", false)).toBe(
      10000,
    );
  });

  it("rounds to centavos", () => {
    expect(transactionEffectCentavos("cash_in", "0.1", "0.05", true)).toBe(-15);
  });
});

describe("filterTransactionsByRange", () => {
  const list = [
    tx("1", "cash_in", "100", "0", "2026-09-30T23:59"),
    tx("2", "cash_in", "200", "0", "2026-10-01T00:00"),
    tx("3", "cash_in", "300", "0", "2026-10-26T23:59"),
    tx("4", "cash_in", "400", "0", "2026-10-27T00:00"),
  ];

  it("keeps transactions inside the range (start inclusive, end exclusive)", () => {
    const filtered = filterTransactionsByRange(list, {
      start: new Date(2026, 9, 1),
      end: new Date(2026, 9, 27),
    });
    expect(filtered.map((transaction) => transaction.id)).toEqual(["2", "3"]);
  });

  it("allows open-ended ranges", () => {
    const fromOct2 = filterTransactionsByRange(list, {
      start: new Date(2026, 9, 2),
    });
    expect(fromOct2.map((transaction) => transaction.id)).toEqual(["3", "4"]);

    expect(filterTransactionsByRange(list)).toHaveLength(4);
  });
});

describe("customDateRange", () => {
  it("includes the whole 'to' day", () => {
    const range = customDateRange("2026-10-01", "2026-10-05");
    expect(range.start).toEqual(new Date(2026, 9, 1));
    expect(range.end).toEqual(new Date(2026, 9, 6));

    const list = [tx("1", "cash_in", "100", "0", "2026-10-05T23:59")];
    expect(filterTransactionsByRange(list, range)).toHaveLength(1);
  });

  it("leaves missing sides unbounded", () => {
    expect(customDateRange("", "2026-10-05").start).toBeUndefined();
    expect(customDateRange("2026-10-01", "").end).toBeUndefined();
  });
});

describe("monthlyCashIn", () => {
  it("buckets the last six months and highlights the current one", () => {
    const data = monthlyCashIn(
      [
        tx("1", "cash_in", "100", "0", "2026-10-05T10:00"),
        tx("2", "cash_in", "50", "0", "2026-09-05T10:00"),
        tx("3", "cash_in", "999", "0", "2026-04-30T10:00"), // outside 6 months
        tx("4", "cash_out", "70", "0", "2026-10-06T10:00"), // wrong type
      ],
      6,
      NOW,
    );

    expect(data).toHaveLength(6);
    expect(data[5]).toEqual({ month: "Oct", total: 100, highlight: true });
    expect(data[4]).toEqual({ month: "Sep", total: 50, highlight: false });
    expect(data.map((datum) => datum.total)).not.toContain(999);
    expect(data.map((datum) => datum.total)).not.toContain(70);
  });
});
