import { Link } from "@tanstack/react-router";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAccounts } from "./hooks";

function StatusLabel({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        active ? "text-success" : "text-destructive",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-success" : "bg-destructive",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function AccountsList() {
  const { data: accounts, isPending, isError, error } = useAccounts();

  if (isPending)
    return <p className="text-sm text-muted-foreground">Loading accounts…</p>;
  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Could not load accounts: {error.message}
      </p>
    );
  }
  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No accounts yet.</p>
        <Button
          render={<Link to="/accounts/new" />}
          className="mt-4 rounded-xl"
        >
          Add your first account
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
              {account.providerName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {account.providerName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {account.nickname}
              </p>
            </div>
          </div>
          <p className="mt-3 text-base font-bold tracking-tight">
            {account.ownerName}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
            {formatPeso(account.amount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Limit is {formatPeso(account.monthlyLimit)} a month
          </p>
          <div className="mt-3 flex items-center justify-between">
            <StatusLabel active={account.isActive} />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              render={
                <Link
                  to="/accounts/$accountId/edit"
                  params={{ accountId: account.id }}
                />
              }
            >
              Edit
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
