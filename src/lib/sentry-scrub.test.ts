import type * as Sentry from "@sentry/react";
import { describe, expect, it } from "vitest";
import { scrubEvent } from "./sentry-scrub";

function makeEvent(
  overrides: Partial<Sentry.ErrorEvent> = {},
): Sentry.ErrorEvent {
  return {
    message: "Payment of ₱1,234.50 failed",
    exception: {
      values: [{ type: "Error", value: "Top-up of ₱500 rejected" }],
    },
    extra: {},
    ...overrides,
  } as Sentry.ErrorEvent;
}

describe("scrubEvent", () => {
  it("redacts peso amounts and emails in the message", () => {
    const event = scrubEvent(
      makeEvent({
        message: "Transfer ₱2,000 to juan.delacruz@gmail.com failed",
      }),
    );
    expect(event.message).not.toContain("₱");
    expect(event.message).not.toContain("juan.delacruz@gmail.com");
    expect(event.message).toContain("[amount]");
    expect(event.message).toContain("[email]");
  });

  it("redacts peso amounts in exception values", () => {
    const event = scrubEvent(
      makeEvent({
        exception: {
          values: [{ type: "Error", value: "Amount ₱99.99 is invalid" }],
        },
      }),
    );
    expect(event.exception?.values?.[0]?.value).toBe(
      "Amount [amount] is invalid",
    );
  });

  it("redacts sensitive keys in extra, nested objects and arrays", () => {
    const event = scrubEvent(
      makeEvent({
        extra: {
          amount: 1500,
          account_name: "GCash",
          balance: "₱9,999",
          keep: "not sensitive",
          nested: { email: "a@b.com", note: "ok" },
          list: [{ owner: "juan" }, { memo: "fine" }],
        },
      }),
    );
    expect(event.extra).toEqual({
      amount: "[redacted]",
      account_name: "[redacted]",
      balance: "[redacted]",
      keep: "not sensitive",
      nested: { email: "[redacted]", note: "ok" },
      list: [{ owner: "[redacted]" }, { memo: "fine" }],
    });
  });

  it("scrubs breadcrumb messages and data", () => {
    const event = scrubEvent(
      makeEvent({
        breadcrumbs: [
          {
            message: "clicked pay ₱300",
            data: { nickname: "BDO Savings", step: "confirm" },
          },
        ],
      }),
    );
    expect(event.breadcrumbs?.[0]?.message).toBe("clicked pay [amount]");
    expect(event.breadcrumbs?.[0]?.data).toEqual({
      nickname: "[redacted]",
      step: "confirm",
    });
  });

  it("removes the user object and cookies", () => {
    const event = scrubEvent(
      makeEvent({
        user: { email: "juan@delacruz.com", id: "user-1" },
        request: { cookies: { session: "secret" }, url: "/accounts?id=7" },
      }),
    );
    expect(event.user).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.url).toBe("/accounts");
  });

  it("leaves non-sensitive events untouched", () => {
    const event = scrubEvent(
      makeEvent({ message: "Network request failed", extra: { status: 500 } }),
    );
    expect(event.message).toBe("Network request failed");
    expect(event.extra).toEqual({ status: 500 });
  });
});
