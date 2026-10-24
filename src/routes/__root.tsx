import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">That page doesn't exist.</p>
      <Link to="/" className="underline">
        Go home
      </Link>
    </div>
  ),
});
