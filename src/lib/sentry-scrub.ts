import type * as Sentry from "@sentry/react";

const SENSITIVE_KEYS =
  /amount|balance|fee|limit|account|nickname|owner|email|phone|password|token/i;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const PESO_AMOUNT = /₱\s?[\d,]+(\.\d+)?/g;

function scrub(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(EMAIL, "[email]").replace(PESO_AMOUNT, "[amount]");
  }
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) =>
        SENSITIVE_KEYS.test(k) ? [k, "[redacted]"] : [k, scrub(v)],
      ),
    );
  }
  return value;
}

export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  delete event.user; // no user object at all
  delete event.request?.cookies;
  if (event.request?.url) event.request.url = event.request.url.split("?")[0];
  event.message = event.message && (scrub(event.message) as string);
  event.exception?.values?.forEach((e) => {
    if (e.value) e.value = scrub(e.value) as string;
  });
  event.breadcrumbs = event.breadcrumbs?.map((b) => ({
    ...b,
    message: b.message && (scrub(b.message) as string),
    data: b.data && (scrub(b.data) as Record<string, unknown>),
  }));
  event.extra = scrub(event.extra) as typeof event.extra;
  event.contexts = scrub(event.contexts) as typeof event.contexts;
  return event;
}
