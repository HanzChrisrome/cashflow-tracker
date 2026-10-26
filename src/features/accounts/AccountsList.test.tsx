import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listAccounts } from "./api";
import { AccountsList } from "./AccountsList";

vi.mock("./api", () => ({
  listAccounts: vi.fn(),
}));

const listAccountsMock = vi.mocked(listAccounts);

function renderAccountsList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    component: () => <AccountsList />,
  });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts/new",
    component: () => null,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts/$accountId/edit",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, newRoute, editRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/accounts"] }),
  });

  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountsList", () => {
  it("renders accounts with provider, limit, status, and edit links", async () => {
    listAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        nickname: "Main wallet",
        ownerName: "Juan Dela Cruz",
        amount: "12450.75",
        monthlyLimit: "20000",
        isActive: true,
        providerName: "GCash",
      },
      {
        id: "acc-2",
        nickname: "Savings",
        ownerName: "Maria Cruz",
        amount: "8000.50",
        monthlyLimit: "50000",
        isActive: false,
        providerName: "BPI",
      },
    ]);

    renderAccountsList();

    expect(await screen.findByText("Main wallet")).toBeInTheDocument();
    expect(screen.getByText("GCash")).toBeInTheDocument();
    expect(screen.getByText("BPI")).toBeInTheDocument();
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByText("Maria Cruz")).toBeInTheDocument();
    expect(screen.getByText("₱12,450.75")).toBeInTheDocument();
    expect(screen.getByText("₱8,000.50")).toBeInTheDocument();
    expect(screen.getByText("Limit is ₱20,000.00 a month")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();

    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks[0]).toHaveAttribute("href", "/accounts/acc-1/edit");
    expect(editLinks[1]).toHaveAttribute("href", "/accounts/acc-2/edit");
  });

  it("shows the empty state with an add link when there are no accounts", async () => {
    listAccountsMock.mockResolvedValue([]);

    renderAccountsList();

    expect(await screen.findByText("No accounts yet.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add your first account" }),
    ).toHaveAttribute("href", "/accounts/new");
  });

  it("shows an error when loading fails", async () => {
    listAccountsMock.mockRejectedValue(new Error("boom") as never);

    renderAccountsList();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load accounts: boom",
    );
  });
});
