import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { supabase } from "@/lib/supabase";
import { listAccounts } from "@/features/accounts/api";
import {
  listTransactions,
  releaseTransaction,
} from "@/features/transactions/api";
import type { TransactionItem } from "@/features/transactions/api";

import { nowLocalInput } from "@/features/transactions/schema";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/accounts/api", () => ({
  listAccounts: vi.fn(),
  getAccount: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
}));

vi.mock("@/features/transactions/api", () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  releaseTransaction: vi.fn(),
}));

const getSession = vi.mocked(supabase.auth.getSession);
const listAccountsMock = vi.mocked(listAccounts);
const listTransactionsMock = vi.mocked(listTransactions);
const releaseTransactionMock = vi.mocked(releaseTransaction);

const accounts = [
  {
    id: "acc-1",
    nickname: "Main",
    ownerName: "Juan Dela Cruz",
    monthlyLimit: "20000",
    amount: "5000",
    isActive: true,
    providerName: "GCash",
  },
  {
    id: "acc-2",
    nickname: "Store",
    ownerName: "Juan Dela Cruz",
    monthlyLimit: "10000",
    amount: "2000",
    isActive: false,
    providerName: "Maya",
  },
];

function tx(id: string, accountId: string, amount: string): TransactionItem {
  return {
    id,
    type: "cash_out",
    accountId,
    accountLabel: accountId === "acc-1" ? "GCash · Main" : "Maya · Store",
    amount,
    fee: "0",
    countFee: false,
    onHold: false,
    timestamp: nowLocalInput(),
  };
}

function todayBounds() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    to: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  };
}

function renderPage(initialUrl = "/transactions") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    data: { session: { user: { id: "user-1", email: "owner@example.com" } } },
  } as never);
  listAccountsMock.mockResolvedValue(accounts);
});

describe("Transactions page account filter", () => {
  it("defaults to Today and queries with today's bounds", async () => {
    listTransactionsMock.mockResolvedValue([tx("t1", "acc-1", "100")]);

    renderPage();

    expect(await screen.findByText("+₱100.00")).toBeInTheDocument();
    await waitFor(() =>
      expect(listTransactionsMock).toHaveBeenLastCalledWith(
        expect.objectContaining(todayBounds()),
      ),
    );
    expect(screen.getByLabelText("Filter by period")).toHaveTextContent(
      "Today",
    );
    expect(screen.getByLabelText("Filter by account")).toHaveTextContent(
      "All accounts",
    );
  });

  it("filters by the selected account and keeps it in the URL", async () => {
    listTransactionsMock.mockImplementation(
      async ({
        accountId,
      }: { accountId?: string; from?: Date; to?: Date } = {}) =>
        accountId === "acc-1" ? [tx("t1", "acc-1", "100")] : [],
    );

    const user = userEvent.setup();
    const router = renderPage();

    await user.click(await screen.findByLabelText("Filter by account"));
    await user.click(await screen.findByRole("option", { name: /GCash/ }));

    expect(await screen.findByText("+₱100.00")).toBeInTheDocument();
    await waitFor(() =>
      expect(listTransactionsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ accountId: "acc-1" }),
      ),
    );
    expect(router.state.location.search).toMatchObject({ account: "acc-1" });
  });

  it("clears the filter with the clear button", async () => {
    listTransactionsMock.mockImplementation(
      async ({
        accountId,
      }: { accountId?: string; from?: Date; to?: Date } = {}) =>
        accountId ? [] : [tx("t1", "acc-1", "100")],
    );

    const user = userEvent.setup();
    const router = renderPage("/transactions?account=acc-1");

    await user.click(await screen.findByLabelText("Clear account filter"));

    expect(await screen.findByText("+₱100.00")).toBeInTheDocument();
    await waitFor(() =>
      expect(listTransactionsMock).toHaveBeenLastCalledWith(
        expect.objectContaining(todayBounds()),
      ),
    );
    expect(router.state.location.search).not.toHaveProperty("account");
  });

  it("shows a friendly empty state for an account with no transactions", async () => {
    listTransactionsMock.mockImplementation(
      async ({
        accountId,
      }: { accountId?: string; from?: Date; to?: Date } = {}) =>
        accountId ? [] : [tx("t1", "acc-1", "100")],
    );

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByLabelText("Filter by account"));
    // Inactive accounts stay selectable and are marked.
    await user.click(
      await screen.findByRole("option", { name: /Maya · Store · Inactive/ }),
    );

    expect(
      await screen.findByText("No transactions for this account."),
    ).toBeInTheDocument();
  });

  it("shows a friendly empty state for today with no transactions", async () => {
    listTransactionsMock.mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("No transactions yet today."),
    ).toBeInTheDocument();
  });

  it("falls back to all accounts for an invalid id in the URL", async () => {
    listTransactionsMock.mockResolvedValue([tx("t1", "acc-1", "100")]);

    renderPage("/transactions?account=bogus");

    expect(await screen.findByText("+₱100.00")).toBeInTheDocument();
    expect(listTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining(todayBounds()),
    );
    expect(screen.getByLabelText("Filter by account")).toHaveTextContent(
      "All accounts",
    );
  });

  it("releases a held transaction through the confirm dialog", async () => {
    const user = userEvent.setup();
    releaseTransactionMock.mockResolvedValue({} as never);
    listTransactionsMock.mockResolvedValue([
      { ...tx("t1", "acc-1", "100"), onHold: true },
    ]);

    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Release transaction" }),
    );

    expect(await screen.findByText("Release transaction?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Release$/ }));

    await waitFor(() =>
      expect(releaseTransactionMock).toHaveBeenCalledWith("t1"),
    );
    expect(await screen.findByText("+₱100.00")).toBeInTheDocument();
  });

  it("opens the add-transaction dialog from the dashboard deep link", async () => {
    const user = userEvent.setup();
    listTransactionsMock.mockResolvedValue([]);
    const router = renderPage("/transactions?new=true");

    const dialog = await screen.findByRole("dialog");
    expect(
      await screen.findByRole("button", { name: "Save transaction" }),
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Add transaction");

    // Closing the dialog strips the param so a refresh won't reopen the form.
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(router.state.location.search).not.toHaveProperty("new");
    });
  });
});
