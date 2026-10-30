import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TransactionItem } from "./transactions-table";
import { RecentTransactionsCard } from "./RecentTransactionsCard";

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
    onHold: false,
    timestamp: "2026-10-25T16:05",
  },
];

function renderCard(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const transactionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/transactions",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([homeRoute, transactionsRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("RecentTransactionsCard", () => {
  it("renders the latest transactions with amounts and a view-all link", async () => {
    renderCard(<RecentTransactionsCard transactions={transactions} />);

    expect(await screen.findByText("Recent Transactions")).toBeInTheDocument();
    expect(screen.getAllByText("Cash In").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cash Out").length).toBeGreaterThan(0);
    expect(screen.getByText("-₱5,000.00")).toBeInTheDocument();
    expect(screen.getByText("+₱2,350.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });

  it("limits the number of rows shown", async () => {
    renderCard(
      <RecentTransactionsCard
        transactions={[...transactions, ...transactions]}
        limit={2}
      />,
    );

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the empty state with a link to record a transaction", async () => {
    renderCard(<RecentTransactionsCard transactions={[]} />);

    expect(await screen.findByText(/No transactions yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Record one" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });
});
