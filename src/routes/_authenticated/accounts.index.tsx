import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AccountsList } from "@/features/accounts/AccountsList";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/accounts/")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your e-wallet and bank accounts.
          </p>
        </div>
        <Button
          render={<Link to="/accounts/new" />}
          className="h-10 rounded-xl"
        >
          <Plus />
          Add account
        </Button>
      </div>
      <AccountsList />
    </div>
  );
}
