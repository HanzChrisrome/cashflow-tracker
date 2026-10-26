import { render, screen } from "@testing-library/react";
import { Wallet } from "lucide-react";
import { describe, expect, it } from "vitest";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  const props = {
    title: "Cash In",
    subtitle: "This month",
    amount: "₱48,500.00",
    change: "+3.2%",
    footerLabel: "View transactions",
    icon: Wallet,
  };

  it("renders the title, subtitle, amount, change badge, and footer", () => {
    render(<StatCard {...props} />);

    expect(screen.getByText("Cash In")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
    expect(screen.getByText("₱48,500.00")).toBeInTheDocument();
    expect(screen.getByText("+3.2%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View transactions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actions for Cash In" }),
    ).toBeInTheDocument();
  });

  it("uses the filled variant styling when requested", () => {
    render(<StatCard {...props} variant="filled" />);

    const card = screen.getByText("₱48,500.00").closest("[data-slot='card']");
    expect(card).toHaveClass("bg-primary", "text-primary-foreground");
  });
});
