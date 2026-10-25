import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { LoginForm } from "./login-form";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));

const signIn = vi.mocked(supabase.auth.signInWithPassword);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("shows a message next to each field for invalid input", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={vi.fn()} />);

    // empty submit
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();

    // malformed email
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();

    expect(signIn).not.toHaveBeenCalled();
  });

  it("submits valid input with no validation messages", async () => {
    signIn.mockResolvedValue({
      data: { user: {}, session: {} },
      error: null,
    } as never);
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "owner@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "secret123",
    });
    expect(screen.queryByText("Enter your email")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enter a valid email address"),
    ).not.toBeInTheDocument();
  });

  it("shows a clear error for wrong credentials", async () => {
    signIn.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        code: "invalid_credentials",
        message: "Invalid login credentials",
      },
    } as never);
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "owner@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password",
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    render(<LoginForm onSuccess={vi.fn()} />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(password).toHaveAttribute("type", "text");
  });
});
