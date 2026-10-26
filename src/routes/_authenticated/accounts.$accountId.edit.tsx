import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AccountForm } from "@/features/accounts/AccountForm";
import { useAccount } from "@/features/accounts/hooks";
import { useProviders } from "@/features/providers/use-providers";

export const Route = createFileRoute(
  "/_authenticated/accounts/$accountId/edit",
)({
  component: EditAccountPage,
});

function EditAccountPage() {
  const { accountId } = Route.useParams();
  const navigate = useNavigate();
  const { data: account, isPending, isError, error } = useAccount(accountId);
  const {
    data: providers,
    isPending: providersPending,
    isError: providersIsError,
    error: providersError,
  } = useProviders();

  if (isPending || providersPending) {
    return <p className="text-sm text-muted-foreground">Loading account…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load the account: {error.message}
      </p>
    );
  }
  if (providersIsError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load providers: {providersError.message}
      </p>
    );
  }
  if (!account) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Account not found.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AccountForm
        account={account}
        providers={providers}
        onSaved={() => navigate({ to: "/accounts" })}
      />
    </div>
  );
}
