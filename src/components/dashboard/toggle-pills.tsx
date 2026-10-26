import { useState } from "react";
import { cn } from "cn";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TogglePillsOption = {
  value: string;
  label: string;
};

export const defaultTogglePillsOptions: TogglePillsOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function TogglePills({
  options = defaultTogglePillsOptions,
  defaultValue = "monthly",
  ariaLabel = "Toggle period",
}: {
  options?: TogglePillsOption[];
  defaultValue?: string;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        const next = groupValue[0];
        if (next) {
          setValue(next as string);
        }
      }}
      aria-label={ariaLabel}
      className="rounded-full bg-muted p-1"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "h-8 rounded-full px-4 text-sm font-medium text-muted-foreground",
            "aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
