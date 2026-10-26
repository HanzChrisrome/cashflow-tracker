import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/help-desk")({
  component: Page,
});

function Page() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold"></h1>
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </div>
  );
}
