import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ACCOUNT_LIMITS } from "@/config/account-limits";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSaveAccount } from "./hooks";
import { createAccountSchema, type AccountFormValues } from "./schema";
import type { Account } from "./api";

export function AccountForm({
  providers,
  account,
  onSaved,
}: {
  providers: { id: string; name: string }[];
  account?: Account;
  onSaved?: () => void;
}) {
  const isEdit = account != null;
  const saveAccount = useSaveAccount(account?.id);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(createAccountSchema()),
    defaultValues: account
      ? {
          providerId: account.providerId,
          nickname: account.nickname,
          ownerName: account.ownerName,
          amount: account.amount,
          monthlyLimit: account.monthlyLimit,
          isActive: account.isActive,
        }
      : {
          providerId: "",
          nickname: "",
          ownerName: "",
          amount: String(ACCOUNT_LIMITS.defaultAmount),
          monthlyLimit: String(ACCOUNT_LIMITS.defaultMonthlyLimit),
          isActive: true,
        },
  });

  async function onSubmit(values: AccountFormValues) {
    form.clearErrors("root");
    try {
      await saveAccount.mutateAsync(values);
      toast.success(isEdit ? "Account updated" : "Account added");
      onSaved?.();
    } catch {
      form.setError("root", {
        message:
          "Could not save the account. Check your connection and try again.",
      });
      toast.error("Could not save the account");
    }
  }

  const isSaving = form.formState.isSubmitting || saveAccount.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit account" : "Add account"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the wallet or bank account details."
            : "Track a new e-wallet or bank account."}
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
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    items={providers.map((provider) => ({
                      value: provider.id,
                      label: provider.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger
                        aria-label="Provider"
                        className="h-12 text-base"
                      >
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly limit</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <div className="flex h-12 items-center justify-between rounded-xl border border-border px-4">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
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
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : isEdit ? "Save changes" : "Add account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
