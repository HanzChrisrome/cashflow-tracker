import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LimitAlertBanner, type LimitAlertAccount } from "./limit-alert-banner";

const accounts: LimitAlertAccount[] = [
  {
    id: "acc-1",
    providerName: "GCash",
    nickname: "Main wallet",
    monthlyLimit: "20000",
    amount: "16000", // 80% — warning at threshold 80
    isActive: true,
  },
  {
    id: "acc-2",
    providerName: "BPI",
    nickname: "Savings",
    monthlyLimit: "20000",
    amount: "21000", // 105% — reached
    isActive: true,
  },
  {
    id: "acc-3",
    providerName: "Maya",
    nickname: "Extra",
    monthlyLimit: "20000",
    amount: "100", // 0.5% — ok
    isActive: true,
  },
];

describe("LimitAlertBanner", () => {
  it("renders nothing when no account qualifies", () => {
    const { container } = render(
      <LimitAlertBanner
        accounts={[
          accounts[2],
          { ...accounts[0], amount: "100", isActive: false },
        ]}
        threshold={80}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("lists flagged accounts sorted by highest percent with the right heading", () => {
    render(<LimitAlertBanner accounts={accounts} threshold={80} />);

    expect(
      screen.getByText("2 accounts are near their limit"),
    ).toBeInTheDocument();

    const rows = screen.getAllByTestId("limit-alert-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("BPI");
    expect(rows[0]).toHaveTextContent("Savings");
    expect(rows[0]).toHaveTextContent("Limit reached");
    expect(rows[1]).toHaveTextContent("GCash");
    expect(rows[1]).toHaveTextContent("80% used");
    expect(rows[1]).toHaveTextContent("₱4,000.00 left");
  });

  it("uses the singular heading for a single flagged account", () => {
    render(
      <LimitAlertBanner accounts={[accounts[0], accounts[2]]} threshold={80} />,
    );

    expect(screen.getByText("1 account is near its limit")).toBeInTheDocument();
    expect(screen.queryByText(/2 accounts/)).not.toBeInTheDocument();
  });
});
