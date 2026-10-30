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
    onHold: false,
    releasedAt: "2026-10-26T12:00",
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
    onHold: true,
    timestamp: "2026-10-25T16:05",
    note: "Customer reference #123",
  },
  {
    id: "tx-3",
    type: "cash_out",
    accountId: "acc-bpi",
    accountLabel: "BPI · Savings",
    amount: "1200",
    fee: "0",
    countFee: false,
    onHold: false,
    timestamp: "2026-10-24T09:02",
  },
];

describe("TransactionsTable", () => {
  it("renders transactions with type, account, amount, and fee", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
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
    expect(screen.getByText(/Oct 26, 2026, 10:32/)).toBeInTheDocument();
  });

  it("badges held rows and shows the release time for released ones", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("On hold")).toBeInTheDocument();
    expect(screen.getByText(/Released at Oct 26, 2026/)).toBeInTheDocument();
  });

  it("calls onRelease for a held transaction's Release button", async () => {
    const user = userEvent.setup();
    const onRelease = vi.fn();
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={onRelease}
        onDelete={vi.fn()}
      />,
    );

    const releaseButtons = screen.getAllByRole("button", {
      name: "Release transaction",
    });
    expect(releaseButtons).toHaveLength(1);

    await user.click(releaseButtons[0]);
    expect(onRelease).toHaveBeenCalledWith(transactions[1]);
  });

  it("marks counted fees in the fee column", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const counted = screen.getAllByText(/counted/);
    expect(counted).toHaveLength(1);
    expect(counted[0].closest("td")).toHaveTextContent("₱15.00");
  });

  it("shows notes in the note column and a dash when empty", () => {
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Customer reference #123")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(2);
  });

  it("opens the note dialog from the view note button", async () => {
    const user = userEvent.setup();
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "View note" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Customer reference #123");
  });

  it("paginates transactions ten at a time", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...transactions[index % transactions.length],
      id: `tx-${index + 1}`,
    }));
    render(
      <TransactionsTable
        transactions={many}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: /Edit/ })).toHaveLength(10);
    expect(screen.getByText(/Showing/)).toHaveTextContent(
      "Showing 1–10 of 12 transactions",
    );

    const previous = screen.getByRole("button", { name: "Previous" });
    const next = screen.getByRole("button", { name: "Next" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);

    expect(screen.getAllByRole("button", { name: /Edit/ })).toHaveLength(2);
    expect(screen.getByText(/Showing/)).toHaveTextContent(
      "Showing 11–12 of 12 transactions",
    );
    expect(next).toBeDisabled();
  });

  it("calls onEdit with the transaction when its Edit button is pressed", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <TransactionsTable
        transactions={transactions}
        onEdit={onEdit}
        onRelease={vi.fn()}
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
        onRelease={vi.fn()}
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
        onRelease={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });

  it("shows a custom empty message when provided", () => {
    render(
      <TransactionsTable
        transactions={[]}
        onEdit={vi.fn()}
        onRelease={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="No transactions in this range."
      />,
    );

    expect(
      screen.getByText("No transactions in this range."),
    ).toBeInTheDocument();
  });
});
