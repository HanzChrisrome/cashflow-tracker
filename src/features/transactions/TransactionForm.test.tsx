import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { createTransaction, updateTransaction } from "./api";
import { createTransactionSchema } from "./schema";
import { TransactionForm } from "./TransactionForm";
import type { TransactionFormTransaction } from "./TransactionForm";

vi.mock("./api", () => ({
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createTransactionMock = vi.mocked(createTransaction);
const updateTransactionMock = vi.mocked(updateTransaction);
const toastMock = vi.mocked(toast);

const accounts = [
  { id: "a1", label: "GCash · Main", amount: "10000" },
  { id: "a2", label: "Maya · Store", amount: "5000" },
];

const existing: TransactionFormTransaction = {
  id: "tx-1",
  type: "cash_out",
  accountId: "a2",
  amount: "2350",
  fee: "15",
  countFee: true,
  timestamp: "2026-10-25T16:05",
};

function renderForm(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

async function setInput(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
) {
  await user.clear(screen.getByLabelText(label));
  if (value) {
    await user.type(screen.getByLabelText(label), value);
  }
}

async function selectAccount(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(screen.getByLabelText("Account"));
  await user.click(await screen.findByRole("option", { name: label }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TransactionForm validation", () => {
  it("shows required errors on empty submit and does not call the API", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await setInput(user, "Amount", "");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      await screen.findByText("Select an account", {
        selector: '[data-slot="form-message"]',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter an amount", {
        selector: '[data-slot="form-message"]',
      }),
    ).toBeInTheDocument();
    expect(createTransactionMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("rejects a zero amount", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    await selectAccount(user, "GCash · Main");
    await setInput(user, "Amount", "0");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));
    expect(
      await screen.findByText("Enter an amount greater than ₱0"),
    ).toBeInTheDocument();
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("sanitizes non-numeric and negative input as you type", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    const amount = screen.getByLabelText("Amount") as HTMLInputElement;
    await user.type(amount, "-a5.5.5");
    expect(amount.value).toBe("5.55");

    const fee = screen.getByLabelText("Fee") as HTMLInputElement;
    await user.type(fee, "-1");
    expect(fee.value).toBe("01");
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("blocks invalid values at the schema level", () => {
    const schema = createTransactionSchema();
    const base = {
      type: "cash_in" as const,
      accountId: "a1",
      amount: "100",
      fee: "0",
      countFee: false,
      timestamp: "2026-10-26T10:00",
    };

    expect(schema.safeParse({ ...base, amount: "" }).success).toBe(false);
    expect(schema.safeParse({ ...base, amount: "abc" }).success).toBe(false);
    expect(schema.safeParse({ ...base, amount: "-500" }).success).toBe(false);
    expect(schema.safeParse({ ...base, amount: "0" }).success).toBe(false);
    expect(schema.safeParse({ ...base, fee: "-1" }).success).toBe(false);
    expect(schema.safeParse(base).success).toBe(true);
  });

  it("blocks cash outs above the account balance at the schema level", () => {
    const schema = createTransactionSchema({
      accounts: [{ id: "a1", amount: "1000" }],
    });
    const base = {
      type: "cash_out" as const,
      accountId: "a1",
      fee: "0",
      countFee: true,
      timestamp: "2026-10-26T10:00",
    };

    const blocked = schema.safeParse({ ...base, amount: "1000.01" });
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error.issues[0].message).toBe(
        "Not enough balance — ₱1,000.00 available in this account",
      );
    }

    // Fee counts toward what needs to be available — but only when counted.
    const blockedByFee = schema.safeParse({
      ...base,
      amount: "900",
      fee: "100.01",
    });
    expect(blockedByFee.success).toBe(false);
    expect(
      schema.safeParse({
        ...base,
        amount: "900",
        fee: "100.01",
        countFee: false,
      }).success,
    ).toBe(true);

    expect(schema.safeParse({ ...base, amount: "1000" }).success).toBe(true);
  });

  it("reverses the original effect when validating edits at the schema level", () => {
    const schema = createTransactionSchema({
      accounts: [{ id: "a1", amount: "500" }],
      original: {
        accountId: "a1",
        type: "cash_out",
        amount: "2350",
        fee: "15",
        countFee: true,
      },
    });

    // Available = 500 + (2350 + 15) = 2865.
    const blocked = schema.safeParse({
      type: "cash_out",
      accountId: "a1",
      amount: "2865.01",
      fee: "0",
      countFee: false,
      timestamp: "2026-10-26T10:00",
    });
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error.issues[0].message).toBe(
        "Not enough balance — ₱2,865.00 available in this account",
      );
    }

    expect(
      schema.safeParse({
        type: "cash_out",
        accountId: "a1",
        amount: "2865",
        fee: "0",
        countFee: false,
        timestamp: "2026-10-26T10:00",
      }).success,
    ).toBe(true);
  });
});

describe("TransactionForm balance checks", () => {
  it("blocks a cash out above the account balance and makes no API call", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));
    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "10500");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      await screen.findByText(
        "Not enough balance — ₱10,000.00 available in this account",
        { selector: '[data-slot="form-message"]' },
      ),
    ).toBeInTheDocument();
    expect(createTransactionMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("blocks a cash out when the counted fee pushes it over the balance", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));
    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "9800");
    await user.type(screen.getByLabelText("Fee"), "500");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      await screen.findByText(
        "Not enough balance — ₱10,000.00 available in this account",
        { selector: '[data-slot="form-message"]' },
      ),
    ).toBeInTheDocument();
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("allows the same cash out when the fee is not counted", async () => {
    createTransactionMock.mockResolvedValue({ id: "new-tx" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));
    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "9800");
    await user.type(screen.getByLabelText("Fee"), "500");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({ countFee: false }),
    );
  });

  it("toggles the count fee checkbox", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("previews the balance after the transaction in create mode", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "500");

    expect(screen.getByText("Balance after transaction")).toBeInTheDocument();
    expect(screen.getByText("₱10,500.00")).toBeInTheDocument();
  });

  it("previews the balance after the edit, not a second transaction", async () => {
    const user = userEvent.setup();
    renderForm(
      <TransactionForm
        accounts={accounts}
        transaction={existing}
        onSaved={vi.fn()}
      />,
    );

    // Maya holds 5000, which already includes the original 2350 + 15 cash out.
    // Editing the amount down to 1000 should return the difference:
    // 5000 + 2365 (reversed) - 1015 (new) = 6350 — not 5000 - 1015.
    await setInput(user, "Amount", "1000");

    expect(screen.getByText("Balance after edit")).toBeInTheDocument();
    expect(screen.getByText("₱6,350.00")).toBeInTheDocument();
  });

  it("shows a low balance warning while typing, before submitting", async () => {
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));
    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "12000");

    expect(
      await screen.findByText("Only ₱10,000.00 available in this account"),
    ).toBeInTheDocument();
  });

  it("accounts for the original transaction when validating edits", async () => {
    const user = userEvent.setup();
    const lowBalanceAccounts = [
      { id: "a1", label: "GCash · Main", amount: "10000" },
      { id: "a2", label: "Maya · Store", amount: "500" },
    ];
    renderForm(
      <TransactionForm
        accounts={lowBalanceAccounts}
        transaction={existing}
        onSaved={vi.fn()}
      />,
    );

    // Original cash out of 2350 + 15 is returned to the balance first:
    // available = 500 + 2365 = 2865.
    await setInput(user, "Amount", "2900");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(
        "Not enough balance — ₱2,865.00 available in this account",
        { selector: '[data-slot="form-message"]' },
      ),
    ).toBeInTheDocument();
    expect(updateTransactionMock).not.toHaveBeenCalled();
  });
});

describe("TransactionForm success", () => {
  it("calls createTransaction with the entered values and defaults", async () => {
    createTransactionMock.mockResolvedValue({ id: "new-tx" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "1500.50");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createTransactionMock).toHaveBeenCalledTimes(1);
    expect(createTransactionMock).toHaveBeenCalledWith({
      type: "cash_in",
      accountId: "a1",
      amount: "1500.50",
      fee: "0",
      countFee: false,
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    });
    expect(toastMock.success).toHaveBeenCalledWith("Transaction recorded");
  });

  it("switches type to cash out and submits", async () => {
    createTransactionMock.mockResolvedValue({ id: "new-tx" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: "Cash Out" }));
    await selectAccount(user, "Maya · Store");
    await user.type(screen.getByLabelText("Amount"), "800");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "cash_out",
        accountId: "a2",
        amount: "800",
      }),
    );
  });

  it("pre-fills values in edit mode and calls updateTransaction with changes", async () => {
    updateTransactionMock.mockResolvedValue({ id: "tx-1" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(
      <TransactionForm
        accounts={accounts}
        transaction={existing}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByRole("button", { name: "Cash Out" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Account")).toHaveTextContent("Maya · Store");
    expect(screen.getByDisplayValue("2350")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-10-25T16:05")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await setInput(user, "Amount", "3000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateTransactionMock).toHaveBeenCalledTimes(1);
    expect(updateTransactionMock).toHaveBeenCalledWith("tx-1", {
      type: "cash_out",
      accountId: "a2",
      amount: "3000",
      fee: "15",
      countFee: true,
      timestamp: "2026-10-25T16:05",
    });
    expect(toastMock.success).toHaveBeenCalledWith("Transaction updated");
  });

  it("shows an error toast when saving fails", async () => {
    createTransactionMock.mockRejectedValue(new Error("boom") as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<TransactionForm accounts={accounts} onSaved={onSaved} />);

    await selectAccount(user, "GCash · Main");
    await user.type(screen.getByLabelText("Amount"), "100");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "Could not save the transaction",
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});
