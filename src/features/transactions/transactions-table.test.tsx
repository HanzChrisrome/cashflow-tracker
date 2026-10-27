import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TransactionsTable, type TransactionItem } from "./transactions-table";

const transactions: TransactionItem[] = [
  {
    id: "tx-1",
    type: "cash_in",
    accountId: "acc-gcash",
    accountLabel: "GCash · Main",
    amount: "5000",
    fee: "0",
    countFee: false,
    timestamp: "2026-10-26T10:32",
  },
  {
    id: "tx-2",
    type: "cash_out",
    accountId: "acc-maya",
    accountLabel: "Maya · Store",
    amount: "2350",
    fee: "15",
    countFee: true,
    timestamp: "2026-10-25T16:05",
  },
  {
    id: "tx-3",
    type: "cash_out",
    accountId: "acc-bpi",
    accountLabel: "BPI · Savings",
    amount: "1200",
    fee: "0",
    countFee: false,
    timestamp: "2026-10-24T09:02",
  },
];

describe("TransactionsTable", () => {
  it("renders transactions with type, account, amount, and fee", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Cash In").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cash Out").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GCash · Main").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Maya · Store").length).toBeGreaterThan(0);
    expect(screen.getByText("-₱5,000.00")).toBeInTheDocument();
    expect(screen.getByText("+₱2,350.00")).toBeInTheDocument();
    expect(screen.getByText("₱15.00")).toBeInTheDocument();
    expect(screen.getByText(/Oct 26, 2026/)).toBeInTheDocument();
  });

  it("marks counted fees in the fee column", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const counted = screen.getAllByText(/counted/);
    expect(counted).toHaveLength(1);
    expect(counted[0].closest("td")).toHaveTextContent("₱15.00");
  });

  it("calls onEdit with the transaction when its Edit button is pressed", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: /Edit/ });
    expect(editButtons).toHaveLength(transactions.length);

    await user.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(transactions[0]);
  });

  it("calls onDelete with the transaction when its Delete button is pressed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    expect(deleteButtons).toHaveLength(transactions.length);

    await user.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(transactions[0]);
  });

  it("shows the empty state when there are no transactions", () => {
    render(
      <TransactionsTable
        transactions={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });
});
