import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRoute,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import {
  AccountCard,
  AccountsCard,
  type AccountCardData,
} from "./account-card";

const base: AccountCardData = {
  id: "acc-1",
  providerName: "GCash",
  nickname: "Main wallet",
  ownerName: "Juan Dela Cruz",
  monthlyLimit: "20000",
  amount: "5000",
  isActive: true,
};

describe("AccountCard limit status", () => {
  it("shows no badge or progress bar when under the threshold", () => {
    render(<AccountCard account={base} threshold={80} />);

    expect(screen.queryByText("Near limit")).not.toBeInTheDocument();
    expect(screen.queryByText("Limit reached")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("of ₱20,000.00 this month")).toBeInTheDocument();
  });

  it("shows the near-limit badge, bar, and remaining at the threshold", () => {
    render(
      <AccountCard account={{ ...base, amount: "16000" }} threshold={80} />,
    );

    expect(screen.getByText("Near limit")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "80");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText(/80% used/)).toBeInTheDocument();
    expect(screen.getByText(/₱4,000\.00 left/)).toBeInTheDocument();
  });

  it("shows limit reached and over-by past 100%", () => {
    render(
      <AccountCard account={{ ...base, amount: "22000" }} threshold={80} />,
    );

    expect(screen.getByText("Limit reached")).toBeInTheDocument();
    expect(screen.getByText(/110% used/)).toBeInTheDocument();
    expect(screen.getByText(/Over by ₱2,000\.00/)).toBeInTheDocument();
  });

  it("shows limit reached with nothing left at exactly 100%", () => {
    render(
      <AccountCard account={{ ...base, amount: "20000" }} threshold={80} />,
    );

    expect(screen.getByText("Limit reached")).toBeInTheDocument();
    expect(screen.getByText(/100% used/)).toBeInTheDocument();
    expect(screen.getByText(/₱0\.00 left/)).toBeInTheDocument();
  });

  it("shows no warning and no progress bar for inactive accounts", () => {
    render(
      <AccountCard
        account={{ ...base, amount: "20000", isActive: false }}
        threshold={80}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.queryByText("Near limit")).not.toBeInTheDocument();
    expect(screen.queryByText("Limit reached")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/used/)).not.toBeInTheDocument();
  });
});

describe("AccountsCard stable height", () => {
  // The card renders router <Link>s ("Add New" / "Add one"), so mount it
  // inside a minimal memory router.
  function renderCard(ui: React.ReactNode) {
    const rootRoute = createRootRoute();
    const homeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <>{ui}</>,
    });
    const newAccountRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/accounts/new",
      component: () => null,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([homeRoute, newAccountRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    return render(<RouterProvider router={router} />);
  }

  it("reserves a fixed content area regardless of account count", async () => {
    renderCard(<AccountsCard accounts={[base]} threshold={80} />);
    await screen.findByText("Accounts");

    const content = document.querySelector('[data-slot="card-content"]');
    expect(content).not.toBeNull();
    // flex-1 fills the stretched card, content-start packs rows from the top,
    // and a min-h floor keeps the card's height with few accounts.
    expect(content).toHaveClass("flex-1", "content-start");
    expect(content?.className).toMatch(/min-h-\[/);
  });

  it("keeps account tiles at their natural height inside the reserved area", async () => {
    renderCard(
      <AccountsCard
        accounts={[base, { ...base, id: "acc-2", providerName: "Maya" }]}
        threshold={80}
      />,
    );

    const tile = (await screen.findByText("GCash")).closest(
      '[data-slot="account-tile"]',
    );
    expect(tile).not.toBeNull();
    expect(tile).not.toHaveClass("h-full");
  });

  it("centers the empty state inside the reserved area", async () => {
    renderCard(<AccountsCard accounts={[]} threshold={80} />);

    const empty = await screen.findByText(/No accounts yet/);
    expect(empty).toHaveClass("flex", "items-center", "justify-center");
    expect(empty.className).toMatch(/min-h-\[/);
  });
});
