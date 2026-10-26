import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { ACCOUNT_LIMITS } from "@/config/account-limits";
import { createAccountSchema } from "./schema";
import { createAccount, updateAccount, type Account } from "./api";
import { AccountForm } from "./AccountForm";

vi.mock("./api", () => ({
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createAccountMock = vi.mocked(createAccount);
const updateAccountMock = vi.mocked(updateAccount);
const toastMock = vi.mocked(toast);

const providers = [
  { id: "p1", name: "GCash" },
  { id: "p2", name: "Maya" },
];

const existingAccount: Account = {
  id: "acc-1",
  providerId: "p1",
  nickname: "Old name",
  ownerName: "Juan Dela Cruz",
  amount: "12450.75",
  monthlyLimit: "20000.00",
  isActive: false,
};

function renderForm(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

async function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText("Provider"));
  await user.click(await screen.findByRole("option", { name: "GCash" }));
  await user.type(screen.getByLabelText("Nickname"), "Main wallet");
  await user.type(screen.getByLabelText("Owner name"), "Juan Dela Cruz");
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountForm", () => {
  it("shows required errors on empty submit and does not call the API", async () => {
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={vi.fn()} />);

    await setInput(user, "Monthly limit", "");
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(
      await screen.findByText("Select a provider", {
        selector: '[data-slot="form-message"]',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a nickname")).toBeInTheDocument();
    expect(screen.getByText("Enter the owner name")).toBeInTheDocument();
    expect(screen.getByText("Enter a monthly limit")).toBeInTheDocument();
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("rejects a negative monthly limit", async () => {
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={vi.fn()} />);

    await fillValidFields(user);
    await setInput(user, "Monthly limit", "-500");
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(
      await screen.findByText("Enter an amount greater than ₱0"),
    ).toBeInTheDocument();
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("rejects a zero monthly limit", async () => {
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={vi.fn()} />);

    await fillValidFields(user);
    await setInput(user, "Monthly limit", "0");
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(
      await screen.findByText("Enter an amount greater than ₱0"),
    ).toBeInTheDocument();
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric monthly limit", async () => {
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={vi.fn()} />);

    await fillValidFields(user);
    await setInput(user, "Monthly limit", "abc");
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(await screen.findByText("Enter a valid amount")).toBeInTheDocument();
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("rejects a negative amount", async () => {
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={vi.fn()} />);

    await fillValidFields(user);
    await setInput(user, "Amount", "-100");
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(
      await screen.findByText("Amount can't be negative"),
    ).toBeInTheDocument();
    expect(createAccountMock).not.toHaveBeenCalled();
  });

  it("calls createAccount with the entered values and calls onSaved", async () => {
    createAccountMock.mockResolvedValue({ id: "new-1" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={onSaved} />);

    await fillValidFields(user);
    await user.click(screen.getByRole("button", { name: "Add account" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(createAccountMock).toHaveBeenCalledTimes(1);
    expect(createAccountMock).toHaveBeenCalledWith({
      providerId: "p1",
      nickname: "Main wallet",
      ownerName: "Juan Dela Cruz",
      amount: "0",
      monthlyLimit: "20000",
      isActive: true,
    });
    expect(toastMock.success).toHaveBeenCalledWith("Account added");
  });

  it("pre-fills values in edit mode and calls updateAccount with changes", async () => {
    updateAccountMock.mockResolvedValue({ id: "acc-1" } as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(
      <AccountForm
        providers={providers}
        account={existingAccount}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByDisplayValue("Old name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20000.00")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toHaveTextContent("GCash");

    await user.clear(screen.getByLabelText("Nickname"));
    await user.type(screen.getByLabelText("Nickname"), "New name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateAccountMock).toHaveBeenCalledTimes(1);
    expect(updateAccountMock).toHaveBeenCalledWith("acc-1", {
      providerId: "p1",
      nickname: "New name",
      ownerName: "Juan Dela Cruz",
      amount: "12450.75",
      monthlyLimit: "20000.00",
      isActive: false,
    });
    expect(toastMock.success).toHaveBeenCalledWith("Account updated");
  });

  it("shows an error toast when saving fails", async () => {
    createAccountMock.mockRejectedValue(new Error("boom") as never);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm(<AccountForm providers={providers} onSaved={onSaved} />);

    await fillValidFields(user);
    await user.click(screen.getByRole("button", { name: "Add account" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith("Could not save the account");
    expect(onSaved).not.toHaveBeenCalled();
  });
});

describe("createAccountSchema limits", () => {
  it("respects an injected limits object instead of hardcoded values", () => {
    const strict = createAccountSchema({
      ...ACCOUNT_LIMITS,
      maxMonthlyLimit: 5_000,
      nicknameMaxLength: 5,
    });
    const values = {
      providerId: "p1",
      nickname: "abc",
      ownerName: "Juan Dela Cruz",
      amount: "0",
      monthlyLimit: "6000",
      isActive: true,
    };

    expect(strict.safeParse(values).success).toBe(false);
    expect(createAccountSchema().safeParse(values).success).toBe(true);

    const tooLongNickname = strict.safeParse({
      ...values,
      monthlyLimit: "100",
      nickname: "toolong",
    });
    expect(tooLongNickname.success).toBe(false);

    const overCustomMax = strict.safeParse({
      ...values,
      nickname: "abc",
    });
    expect(overCustomMax.success).toBe(false);
    if (!overCustomMax.success) {
      expect(overCustomMax.error.issues[0].message).toContain("₱5,000.00");
    }
  });
});
