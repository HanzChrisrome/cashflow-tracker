import { Bar, BarChart, Cell, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export type ChartDatum = {
  month: string;
  total: number;
  highlight?: boolean;
};

export const placeholderChartData: ChartDatum[] = [
  { month: "May", total: 18200 },
  { month: "Jun", total: 22400 },
  { month: "Jul", total: 19800 },
  { month: "Aug", total: 26500 },
  { month: "Sep", total: 23900 },
  { month: "Oct", total: 42300, highlight: true },
];

const chartConfig = {
  total: { label: "Cash In" },
} satisfies ChartConfig;

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH")}`;
}

export function ChartCard({
  data = placeholderChartData,
  total = "₱153,100",
}: {
  data?: ChartDatum[];
  total?: string;
}) {
  const highlighted = data.find((datum) => datum.highlight);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cash In</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
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
            className="aspect-auto h-56 w-full"
          >
            <BarChart data={data} margin={{ top: 40, bottom: 4 }}>
              <defs>
                <linearGradient
                  id="cashInBarGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
                      datum.highlight
                        ? "var(--primary)"
                        : "url(#cashInBarGradient)"
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
