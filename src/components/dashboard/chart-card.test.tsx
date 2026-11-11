import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { TransactionItem } from "@/features/transactions/api";
import { ChartCard } from "./chart-card";

// NOW pinned inside the current month bucket: use dynamic "today" so the
// test never goes stale across month boundaries.
function thisMonthDay(day: number) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T10:00`;
}

const transactions: TransactionItem[] = [
  {
    id: "tx-1",
    type: "cash_in",
    accountId: "acc-1",
    accountLabel: "GCash · Main",
    amount: "1000",
    fee: "0",
    countFee: false,
    onHold: false,
    timestamp: thisMonthDay(5),
  },
  {
    id: "tx-2",
    type: "cash_out",
    accountId: "acc-1",
    accountLabel: "GCist · Main",
    amount: "400",
    fee: "0",
    countFee: false,
    onHold: false,
    timestamp: thisMonthDay(6),
  },
];

function cardTitle() {
  const title = document.querySelector('[data-slot="card-title"]');
  expect(title).not.toBeNull();
  return title!;
}

describe("ChartCard", () => {
  it("defaults to cash in and shows its total", async () => {
    render(<ChartCard transactions={transactions} />);

    // The total appears in both the headline and the current-month bubble.
    expect((await screen.findAllByText("₱1,000.00")).length).toBeGreaterThan(0);
    expect(cardTitle()).toHaveTextContent("Cash In");
  });

  it("toggles to cash out and recomputes the total", async () => {
    const user = userEvent.setup();
    render(<ChartCard transactions={transactions} />);

    expect((await screen.findAllByText("₱1,000.00")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));

    expect((await screen.findAllByText("₱400.00")).length).toBeGreaterThan(0);
    expect(screen.queryByText("₱1,000.00")).not.toBeInTheDocument();
    expect(cardTitle()).toHaveTextContent("Cash Out");
  });
});
