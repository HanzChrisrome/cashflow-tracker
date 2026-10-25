import { useProviders } from "./use-providers";

export function ProvidersList() {
  const { data, isPending, isError, error } = useProviders();

  if (isPending) return <p>Loading providers…</p>;
  if (isError)
    return <p role="alert">Could not load providers: {error.message}</p>;
  if (data.length === 0) return <p>No providers yet.</p>;

  return (
    <ul>
      {data.map((provider) => (
        <li key={provider.id}>{provider.name}</li>
      ))}
    </ul>
  );
}
