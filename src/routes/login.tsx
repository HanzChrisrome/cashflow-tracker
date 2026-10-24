import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Login</h1>
      <Link to="/" className="underline">
        Back to home
      </Link>
    </div>
  );
}
