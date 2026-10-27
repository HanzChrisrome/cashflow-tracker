import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { THRESHOLD_MAX, THRESHOLD_MIN } from "@/lib/limit-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateWarningThreshold } from "@/hooks/use-app-settings";

const warningThresholdSchema = z.object({
  threshold: z
    .string()
    .trim()
    .min(1, "Enter a warning percentage")
    .superRefine((value, ctx) => {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
        ctx.addIssue({ code: "custom", message: "Enter a whole number" });
        return;
      }
      if (parsed < THRESHOLD_MIN || parsed > THRESHOLD_MAX) {
        ctx.addIssue({
          code: "custom",
          message: `Enter a percentage between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}`,
        });
      }
    }),
});

export type WarningThresholdValues = z.infer<typeof warningThresholdSchema>;

export function ThresholdForm({
  currentThreshold,
}: {
  currentThreshold: number;
}) {
  const updateThreshold = useUpdateWarningThreshold();

  const form = useForm<WarningThresholdValues>({
    resolver: zodResolver(warningThresholdSchema),
    defaultValues: { threshold: String(currentThreshold) },
  });

  async function onSubmit(values: WarningThresholdValues) {
    form.clearErrors("root");
    const next = Number(values.threshold);
    try {
      await updateThreshold.mutateAsync(next);
      toast.success("Warning threshold updated");
      form.reset({ threshold: String(next) });
    } catch {
      form.setError("root", {
        message:
          "Could not save the threshold. Check your connection and try again.",
      });
      toast.error("Could not save the threshold");
    }
  }

  const saving = form.formState.isSubmitting || updateThreshold.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Limit warnings</CardTitle>
        <CardDescription>
          Choose when accounts are flagged as near their monthly limit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warn me at (% of monthly limit)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={!form.formState.isDirty || saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
