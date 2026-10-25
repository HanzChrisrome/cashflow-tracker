import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { useProviders } from "./use-providers";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

function mockQueryResult(result: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ order }));
  vi.mocked(supabase.from).mockReturnValue({
    select,
  } as unknown as ReturnType<typeof supabase.from>);
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useProviders", () => {
  it("returns providers on success", async () => {
    const providers = [
      { id: "1", name: "GCash" },
      { id: "2", name: "Maya" },
    ];
    mockQueryResult({ data: providers, error: null });

    const { result } = renderHook(() => useProviders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(providers);
  });

  it("exposes an error state when the request fails", async () => {
    mockQueryResult({ data: null, error: new Error("boom") });

    const { result } = renderHook(() => useProviders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("boom");
  });
});
