import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StatCardProps = {
  title: string;
  subtitle: string;
  amount: string;
  change?: string;
  trend?: "up" | "down";
  footerLabel: string;
  icon: LucideIcon;
  variant?: "default" | "filled";
};

export function StatCard({
  title,
  subtitle,
  amount,
  change,
  trend = "up",
  footerLabel,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const filled = variant === "filled";

  return (
    <Card
      className={cn(
        filled && "border-primary bg-primary text-primary-foreground",
      )}
    >
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                filled
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-primary-tint text-primary",
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p
                className={cn(
                  "text-xs",
                  filled
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${title}`}
                  className={cn(
                    filled &&
                      "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
                  )}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Download report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {amount}
          </p>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                filled
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-primary-tint text-primary",
              )}
            >
              {change}
              {trend === "down" ? (
                <ArrowDownRight className="size-3" />
              ) : (
                <ArrowUpRight className="size-3" />
              )}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-2 border-t bg-transparent px-5 py-3">
        <button
          type="button"
          className={cn(
            "text-xs",
            filled
              ? "text-primary-foreground/80 hover:text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:underline",
          )}
        >
          {footerLabel}
        </button>
        <ArrowRight
          className={cn(
            "ml-auto size-4",
            filled ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        />
      </CardFooter>
    </Card>
  );
}
