import { describe, expect, it } from "vitest";
import type { TransactionItem } from "@/features/transactions/api";
import { summarizeTransactions } from "@/features/transactions/totals";
import {
  buildFilename,
  buildReportModel,
  describePeriod,
  exceedsRowCap,
  formatGeneratedAt,
  formatPesoCentavos,
  ROW_CAP,
  slugifyLabel,
} from "./report-model";

const NOW = new Date(2026, 9, 29, 22, 15); // Oct 29, 2026 local

function tx(overrides: Partial<TransactionItem> = {}): TransactionItem {
  return {
    id: "t1",
    type: "cash_out",
    accountId: "a1",
    accountLabel: "GCash · Main",
    amount: "100",
    fee: "5",
    countFee: true,
    timestamp: "2026-10-29T10:00",
    onHold: false,
    ...overrides,
  };
}

describe("buildReportModel", () => {
  const transactions = [
    tx({
      id: "t1",
      type: "cash_in",
      amount: "500",
      fee: "10",
      countFee: false,
    }),
    tx({
      id: "t2",
      type: "cash_out",
      amount: "200",
      fee: "5",
      note: "Juan payment",
      releasedAt: "2026-10-29T11:00",
    }),
    tx({
      id: "t3",
      type: "cash_in",
      amount: "300",
      fee: "0",
      countFee: false,
      onHold: true,
    }),
  ];

  it("uses the same shared totals helper as the screen", () => {
    const model = buildReportModel({
      transactions,
      accountLabel: "All accounts",
      filter: "This Month",
      fromDate: "",
      toDate: "",
      businessName: "Juan's Store",
      now: NOW,
    });

    expect(model.summary).toEqual(summarizeTransactions(transactions));
    expect(model.count).toBe(3);
  });

  it("fills the header fields", () => {
    const model = buildReportModel({
      transactions,
      accountLabel: "GCash · Main",
      filter: "Today",
      fromDate: "",
      toDate: "",
      businessName: "Juan's Store",
      now: NOW,
    });

    expect(model.businessName).toBe("Juan's Store");
    expect(model.title).toBe("Transactions Report");
    expect(model.accountText).toBe("GCash · Main");
    expect(model.periodText).toBe("Today (Oct 29, 2026)");
    expect(model.generatedAtText).toBe("Oct 29, 2026, 10:15 PM (Asia/Manila)");
  });

  it("maps transactions to report rows", () => {
    const model = buildReportModel({
      transactions,
      accountLabel: "All accounts",
      filter: "This Month",
      fromDate: "",
      toDate: "",
      businessName: "Juan's Store",
      now: NOW,
    });

    expect(model.rows[0]).toEqual({
      dateTime: "Oct 29, 2026, 10:00 AM",
      type: "Cash In",
      account: "GCash · Main",
      note: "-",
      amount: "-₱500.00",
      fee: "₱10.00",
      status: "Completed",
    });
    expect(model.rows[1].note).toBe("Juan payment");
    expect(model.rows[1].amount).toBe("+₱200.00");
    expect(model.rows[1].status).toBe("Released");
    expect(model.rows[2].status).toBe("On Hold");
  });

  it("caps the rows at the maximum report size", () => {
    const many = Array.from({ length: ROW_CAP + 5 }, (_, index) =>
      tx({ id: `t${index}` }),
    );

    const model = buildReportModel({
      transactions: many,
      accountLabel: "All accounts",
      filter: "All Time",
      fromDate: "",
      toDate: "",
      businessName: "Juan's Store",
      now: NOW,
    });

    expect(model.rows).toHaveLength(ROW_CAP);
    expect(model.count).toBe(ROW_CAP + 5);
    expect(exceedsRowCap(model.count)).toBe(true);
    expect(exceedsRowCap(ROW_CAP)).toBe(false);
  });
});

describe("describePeriod", () => {
  it("describes each named filter with its resolved dates", () => {
    expect(describePeriod("Today", "", "", NOW)).toBe("Today (Oct 29, 2026)");
    expect(describePeriod("This Month", "", "", NOW)).toBe(
      "This Month (Oct 1 – Oct 31, 2026)",
    );
    expect(describePeriod("Last Month", "", "", NOW)).toBe(
      "Last Month (Sep 1 – Sep 30, 2026)",
    );
    expect(describePeriod("This Year", "", "", NOW)).toBe(
      "This Year (Jan 1 – Dec 31, 2026)",
    );
    expect(describePeriod("All Time", "", "", NOW)).toBe("All Time");
  });

  it("describes custom ranges with the dates used", () => {
    expect(describePeriod("Custom Range", "2026-10-01", "2026-10-15", NOW)).toBe(
      "Custom range (Oct 1 – Oct 15, 2026)",
    );
    expect(describePeriod("Custom Range", "2026-10-01", "", NOW)).toBe(
      "Custom range (from Oct 1, 2026)",
    );
    expect(describePeriod("Custom Range", "", "2026-10-15", NOW)).toBe(
      "Custom range (until Oct 15, 2026)",
    );
    expect(describePeriod("Custom Range", "", "", NOW)).toBe("Custom range");
  });
});

describe("buildFilename", () => {
  it("uses the resolved day for Today and the account slug", () => {
    expect(buildFilename("Today", "", "", "All accounts", NOW)).toBe(
      "transactions_2026-10-29_all-accounts.pdf",
    );
  });

  it("uses the inclusive date range for named periods", () => {
    expect(buildFilename("This Month", "", "", "GCash · Main", NOW)).toBe(
      "transactions_2026-10-01_to_2026-10-31_gcash-main.pdf",
    );
  });

  it("uses the picked dates for custom ranges", () => {
    expect(
      buildFilename("Custom Range", "2026-10-01", "2026-10-15", "Maya · Store"),
    ).toBe("transactions_2026-10-01_to_2026-10-15_maya-store.pdf");
  });

  it("handles open-ended custom ranges and all time", () => {
    expect(buildFilename("Custom Range", "2026-10-01", "", "All accounts")).toBe(
      "transactions_from_2026-10-01_all-accounts.pdf",
    );
    expect(buildFilename("Custom Range", "", "2026-10-15", "All accounts")).toBe(
      "transactions_until_2026-10-15_all-accounts.pdf",
    );
    expect(buildFilename("All Time", "", "", "All accounts", NOW)).toBe(
      "transactions_all-time_all-accounts.pdf",
    );
  });
});

describe("formatting helpers", () => {
  it("formats centavos as pesos with two decimals", () => {
    expect(formatPesoCentavos(0)).toBe("₱0.00");
    expect(formatPesoCentavos(500)).toBe("₱5.00");
    expect(formatPesoCentavos(-500)).toBe("-₱5.00");
    expect(formatPesoCentavos(123456)).toBe("₱1,234.56");
    expect(formatPesoCentavos(10000000)).toBe("₱100,000.00");
  });

  it("formats the generated timestamp in Asia/Manila", () => {
    expect(formatGeneratedAt(new Date("2026-10-29T14:15:00Z"))).toBe(
      "Oct 29, 2026, 10:15 PM (Asia/Manila)",
    );
    expect(formatGeneratedAt(new Date("2026-01-01T16:01:00Z"))).toBe(
      "Jan 2, 2026, 12:01 AM (Asia/Manila)",
    );
  });

  it("slugifies account labels", () => {
    expect(slugifyLabel("All accounts")).toBe("all-accounts");
    expect(slugifyLabel("GCash · Main")).toBe("gcash-main");
    expect(slugifyLabel("My Store #1!")).toBe("my-store-1");
  });
});
