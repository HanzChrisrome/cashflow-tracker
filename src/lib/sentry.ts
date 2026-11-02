import * as Sentry from "@sentry/react";
import { scrubEvent } from "@/lib/sentry-scrub";

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.VITE_APP_ENV ?? "development";

export function initSentry() {
  // No DSN = Sentry is off. This covers local dev.
  if (!dsn || environment === "development") return;

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_APP_VERSION,
    beforeSend: scrubEvent,
  });
}
