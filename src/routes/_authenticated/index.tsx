import { createFileRoute, useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/login" });
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Home</h1>
      <p className="text-muted-foreground">Signed in as {session.user.email}</p>
      <Button variant="outline" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
