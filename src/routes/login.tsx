import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { LoginForm } from "@/features/auth/login-form";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z
      .string()
      .refine((v) => v.startsWith("/") && !v.startsWith("//"))
      .optional(),
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect: redirectTo } = Route.useSearch();

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <LoginForm onSuccess={() => router.history.push(redirectTo ?? "/")} />
    </main>
  );
}
