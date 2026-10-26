import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { cn } from "cn";

import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AccountCardData = {
  id: string;
  providerName: string;
  nickname: string;
  ownerName: string;
  monthlyLimit: string;
  amount: string;
  isActive: boolean;
};

export function AccountCard({ account }: { account: AccountCardData }) {
  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
          {account.providerName.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{account.providerName}</p>
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
      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
        <span
          className={cn(
            "size-1.5 rounded-full",
            account.isActive ? "bg-success" : "bg-destructive",
          )}
        />
        <span
          className={account.isActive ? "text-success" : "text-destructive"}
        >
          {account.isActive ? "Active" : "Inactive"}
        </span>
      </p>
    </div>
  );
}

export function AccountsCard({ accounts }: { accounts: AccountCardData[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            render={<Link to="/accounts/new" />}
          >
            <Plus />
            Add New
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            No accounts yet.{" "}
            <Link
              to="/accounts/new"
              className="font-medium text-primary hover:underline"
            >
              Add one
            </Link>
            .
          </p>
        ) : (
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
