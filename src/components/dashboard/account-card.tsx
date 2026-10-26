import { Plus } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type Account = {
  provider: string;
  amount: string;
  monthlyLimit: string;
  active: boolean;
};

export const placeholderAccounts: Account[] = [
  {
    provider: "GCash",
    amount: "₱12,450.75",
    monthlyLimit: "₱20,000",
    active: true,
  },
  {
    provider: "Maya",
    amount: "₱8,203.00",
    monthlyLimit: "₱15,000",
    active: true,
  },
  {
    provider: "BPI",
    amount: "₱56,310.20",
    monthlyLimit: "₱50,000",
    active: false,
  },
  {
    provider: "BDO",
    amount: "₱23,890.00",
    monthlyLimit: "₱40,000",
    active: true,
  },
];

export function AccountCard({ account }: { account: Account }) {
  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
          {account.provider.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{account.provider}</p>
          <p className="truncate text-xs text-muted-foreground">
            Limit is {account.monthlyLimit} a month
          </p>
        </div>
      </div>
      <p className="mt-3 text-lg font-bold tracking-tight tabular-nums">
        {account.amount}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
        <span
          className={cn(
            "size-1.5 rounded-full",
            account.active ? "bg-success" : "bg-destructive",
          )}
        />
        <span className={account.active ? "text-success" : "text-destructive"}>
          {account.active ? "Active" : "Inactive"}
        </span>
      </p>
    </div>
  );
}

export function AccountsCard({
  accounts = placeholderAccounts,
}: {
  accounts?: Account[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Plus />
            Add New
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <AccountCard key={account.provider} account={account} />
        ))}
      </CardContent>
    </Card>
  );
}
