import { ProvidersList } from "@/features/providers/providers-list";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Home</h1>
      <Link to="/login" className="underline">
        Go to login
      </Link>
      <Link to="/demo" className="underline">
        View component demo
      </Link>
      <ProvidersList />
    </div>
  );
}
