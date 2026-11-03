import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AppErrorBoundary,
  RouteErrorComponent,
} from "./error-boundary";

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  isInitialized: vi.fn(() => true),
}));

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  captureException: sentryMocks.captureException,
  isInitialized: sentryMocks.isInitialized,
}));

let shouldThrow = false;

function Flaky() {
  if (shouldThrow) throw new Error("kaboom");
  return <p>Recovered</p>;
}

beforeEach(() => {
  sentryMocks.captureException.mockClear();
  sentryMocks.isInitialized.mockReturnValue(true);
});

describe("AppErrorBoundary", () => {
  it("shows a friendly fallback when a child throws", () => {
    shouldThrow = true;
    render(
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    shouldThrow = false;
  });

  it("recovers when the user clicks Try again", async () => {
    shouldThrow = true;
    render(
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>,
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});

describe("RouteErrorComponent", () => {
  it("reports the error and shows a friendly fallback", () => {
    const error = new Error("route boom");
    render(<RouteErrorComponent error={error} reset={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(sentryMocks.captureException).toHaveBeenCalledWith(error);
  });

  it("skips reporting when Sentry is not initialized", () => {
    sentryMocks.isInitialized.mockReturnValue(false);
    render(<RouteErrorComponent error={new Error("dev boom")} reset={vi.fn()} />);
    expect(sentryMocks.captureException).not.toHaveBeenCalled();
  });
});
