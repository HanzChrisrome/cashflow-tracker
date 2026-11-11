import { useState } from "react";
import { Bar, BarChart, Cell, XAxis } from "recharts";

import { cn } from "cn";
import { formatPeso, sumPeso } from "@/lib/format";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { monthlyTotalsByType } from "@/features/transactions/totals";
import type { TransactionItem } from "@/features/transactions/api";
import type { TransactionType } from "@/features/transactions/schema";

export type ChartDatum = {
  month: string;
  total: number;
  highlight?: boolean;
};

const chartConfig = {
  total: { label: "Total" },
} satisfies ChartConfig;

const typeLabels: Record<TransactionType, string> = {
  cash_in: "Cash In",
  cash_out: "Cash Out",
};

export function ChartCard({
  transactions,
}: {
  transactions: TransactionItem[];
}) {
  const [type, setType] = useState<TransactionType>("cash_in");

  const data = monthlyTotalsByType(transactions, type);
  const total = sumPeso(data.map((datum) => datum.total));
  const highlighted = data.find((datum) => datum.highlight);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{typeLabels[type]}</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
        <CardAction>
          <ToggleGroup
            value={[type]}
            onValueChange={(groupValue) => {
              const next = groupValue[0];
              if (next) {
                setType(next as TransactionType);
              }
            }}
            aria-label="Toggle chart type"
            className="rounded-full bg-muted p-1"
          >
            {(["cash_in", "cash_out"] as const).map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                className={cn(
                  "h-8 rounded-full px-4 text-sm font-medium text-muted-foreground",
                  "aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover",
                )}
              >
                {typeLabels[option]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {total}
        </p>
        <div className="relative mt-4">
          {highlighted && (
            <div className="pointer-events-none absolute top-0 right-2 z-10 flex flex-col items-center">
              <div className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                {formatPeso(highlighted.total)}
              </div>
              <div className="-mt-1 size-2 rotate-45 bg-foreground" />
            </div>
          )}
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-96 w-full"
          >
            <BarChart data={data} margin={{ top: 40, bottom: 4 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary-tint)"
                    stopOpacity={0.5}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={40}>
                {data.map((datum) => (
                  <Cell
                    key={datum.month}
                    fill={
                      datum.highlight ? "var(--primary)" : "url(#barGradient)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
