import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TogglePills } from "./toggle-pills";

describe("TogglePills", () => {
  it("renders both options with the default active", () => {
    render(<TogglePills />);

    const monthly = screen.getByRole("button", { name: "Monthly" });
    const yearly = screen.getByRole("button", { name: "Yearly" });
    expect(monthly).toHaveAttribute("aria-pressed", "true");
    expect(yearly).toHaveAttribute("aria-pressed", "false");
  });

  it("activates the clicked option", async () => {
    const user = userEvent.setup();
    render(<TogglePills />);

    await user.click(screen.getByRole("button", { name: "Yearly" }));

    expect(screen.getByRole("button", { name: "Yearly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Monthly" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
