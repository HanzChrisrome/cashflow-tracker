import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  MoreHorizontal,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ActivityStatus = "completed" | "pending" | "failed";

export type Activity = {
  name: string;
  icon: LucideIcon;
  orderId: string;
  date: string;
  time: string;
  price: string;
  status: ActivityStatus;
};

export const placeholderActivities: Activity[] = [
  {
    name: "GCash Cash In",
    icon: ArrowDownLeft,
    orderId: "ORD-7241",
    date: "Oct 24, 2026",
    time: "10:32 AM",
    price: "₱5,000.00",
    status: "completed",
  },
  {
    name: "Maya Transfer",
    icon: ArrowUpRight,
    orderId: "ORD-7238",
    date: "Oct 23, 2026",
    time: "4:15 PM",
    price: "₱2,350.00",
    status: "pending",
  },
  {
    name: "BPI Bills Pay",
    icon: Receipt,
    orderId: "ORD-7230",
    date: "Oct 22, 2026",
    time: "9:02 AM",
    price: "₱1,200.00",
    status: "completed",
  },
  {
    name: "GCash Purchase",
    icon: ShoppingBag,
    orderId: "ORD-7225",
    date: "Oct 21, 2026",
    time: "7:48 PM",
    price: "₱860.50",
    status: "failed",
  },
  {
    name: "Maya QR Payment",
    icon: QrCode,
    orderId: "ORD-7218",
    date: "Oct 20, 2026",
    time: "12:30 PM",
    price: "₱1,500.00",
    status: "completed",
  },
  {
    name: "Salary Credit",
    icon: Banknote,
    orderId: "ORD-7210",
    date: "Oct 19, 2026",
    time: "8:00 AM",
    price: "₱42,000.00",
    status: "completed",
  },
];

const statusStyles: Record<
  ActivityStatus,
  { label: string; className: string }
> = {
  completed: { label: "Completed", className: "bg-success text-success" },
  pending: { label: "Pending", className: "bg-warning text-warning" },
  failed: { label: "Failed", className: "bg-destructive text-destructive" },
};

function StatusLabel({ status }: { status: ActivityStatus }) {
  const { label, className } = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", className)} />
      {label}
    </span>
  );
}

export function ActivitiesTable({
  activities = placeholderActivities,
}: {
  activities?: Activity[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter(
      (activity) =>
        activity.name.toLowerCase().includes(q) ||
        activity.orderId.toLowerCase().includes(q),
    );
  }, [activities, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardAction className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              aria-label="Search activities"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-48 rounded-xl border-transparent bg-muted pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 rounded-xl">
            <SlidersHorizontal />
            Filter
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 bg-muted/50 pl-5 text-xs text-muted-foreground">
                <Checkbox aria-label="Select all activities" />
              </TableHead>
              <TableHead className="bg-muted/50 text-xs text-muted-foreground">
                Activity
              </TableHead>
              <TableHead className="hidden bg-muted/50 text-xs text-muted-foreground md:table-cell">
                Order ID
              </TableHead>
              <TableHead className="bg-muted/50 text-xs text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="hidden bg-muted/50 text-xs text-muted-foreground sm:table-cell">
                Time
              </TableHead>
              <TableHead className="bg-muted/50 text-xs text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="bg-muted/50 text-xs text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-10 bg-muted/50 pr-5 text-xs text-muted-foreground">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((activity) => (
              <TableRow key={activity.orderId}>
                <TableCell className="pl-5">
                  <Checkbox aria-label={`Select ${activity.name}`} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                      <activity.icon className="size-4" />
                    </span>
                    <span className="font-medium">{activity.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {activity.orderId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {activity.date}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {activity.time}
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {activity.price}
                </TableCell>
                <TableCell>
                  <StatusLabel status={activity.status} />
                </TableCell>
                <TableCell className="pr-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${activity.name}`}
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
