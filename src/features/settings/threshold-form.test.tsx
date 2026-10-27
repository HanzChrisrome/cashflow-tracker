import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { ThresholdForm } from "./threshold-form";

const mutateAsync = vi.fn();

vi.mock("@/hooks/use-app-settings", () => ({
  useUpdateWarningThreshold: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const toastMock = vi.mocked(toast);

beforeEach(() => {
  vi.clearAllMocks();
});

async function setThreshold(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  await user.clear(screen.getByLabelText(/Warn me at/));
  if (value) {
    await user.type(screen.getByLabelText(/Warn me at/), value);
  }
}

describe("ThresholdForm", () => {
  it("disables save until the value changes", async () => {
    const user = userEvent.setup();
    render(<ThresholdForm currentThreshold={80} />);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await setThreshold(user, "90");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  it("rejects 0", async () => {
    const user = userEvent.setup();
    render(<ThresholdForm currentThreshold={80} />);

    await setThreshold(user, "0");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Enter a percentage between 1 and 100"),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("rejects 101", async () => {
    const user = userEvent.setup();
    render(<ThresholdForm currentThreshold={80} />);

    await setThreshold(user, "101");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Enter a percentage between 1 and 100"),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("rejects decimals", async () => {
    const user = userEvent.setup();
    render(<ThresholdForm currentThreshold={80} />);

    await setThreshold(user, "12.5");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Enter a whole number")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("submits a valid value", async () => {
    mutateAsync.mockResolvedValue(90);
    const user = userEvent.setup();
    render(<ThresholdForm currentThreshold={80} />);

    await setThreshold(user, "90");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith(90);
  });
});
