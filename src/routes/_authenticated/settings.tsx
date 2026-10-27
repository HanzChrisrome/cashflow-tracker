import { createFileRoute } from "@tanstack/react-router";

import { ThresholdForm } from "@/features/settings/threshold-form";
import { useAppSettings } from "@/hooks/use-app-settings";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const settingsQuery = useAppSettings();

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Adjust your app preferences.
        </p>
      </div>
      {settingsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : settingsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load settings: {settingsQuery.error.message}
        </p>
      ) : (
        <ThresholdForm currentThreshold={settingsQuery.data} />
      )}
    </div>
  );
}
