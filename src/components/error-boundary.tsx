import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";

function ErrorFallback({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred and has been reported.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <ErrorFallback reset={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

export function RouteErrorComponent({ error, reset }: ErrorComponentProps) {
  if (Sentry.isInitialized()) Sentry.captureException(error);
  return <ErrorFallback reset={reset} />;
}
