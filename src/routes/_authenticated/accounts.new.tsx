import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AccountForm } from "@/features/accounts/AccountForm";
import { useProviders } from "@/features/providers/use-providers";

export const Route = createFileRoute("/_authenticated/accounts/new")({
  component: NewAccountPage,
});

function NewAccountPage() {
  const navigate = useNavigate();
  const { data: providers, isPending, isError, error } = useProviders();

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading providers…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load providers: {error.message}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AccountForm
        providers={providers}
        onSaved={() => navigate({ to: "/accounts" })}
      />
    </div>
  );
}
