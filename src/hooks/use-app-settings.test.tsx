import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { DEFAULT_WARNING_THRESHOLD } from "@/lib/limit-status";
import { useAppSettings, useUpdateWarningThreshold } from "./use-app-settings";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

const getSession = vi.mocked(supabase.auth.getSession);
const from = vi.mocked(supabase.from);

function mockSignedIn(userId = "user-1") {
  getSession.mockResolvedValue({
    data: { session: { user: { id: userId } } },
  } as never);
}

function mockSettingsRow(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  from.mockReturnValue({ select } as never);
  return { eq };
}

function mockUpsert(result: { error: unknown }) {
  const upsert = vi.fn().mockResolvedValue(result);
  from.mockReturnValue({ upsert } as never);
  return upsert;
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAppSettings", () => {
  it("reads the threshold scoped to the signed-in user", async () => {
    mockSignedIn("user-1");
    const { eq } = mockSettingsRow({
      data: { warning_threshold: 65 },
      error: null,
    });

    const { result } = renderHook(() => useAppSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(65);
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("falls back to the default when the user has no row", async () => {
    mockSignedIn("user-2");
    mockSettingsRow({ data: null, error: null });

    const { result } = renderHook(() => useAppSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(DEFAULT_WARNING_THRESHOLD);
  });

  it("exposes an error state when the request fails", async () => {
    mockSignedIn("user-3");
    mockSettingsRow({ data: null, error: new Error("boom") });

    const { result } = renderHook(() => useAppSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("boom");
  });
});

describe("useUpdateWarningThreshold", () => {
  it("upserts the threshold for the signed-in user", async () => {
    mockSignedIn("user-1");
    const upsert = mockUpsert({ error: null });

    const { result } = renderHook(() => useUpdateWarningThreshold(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(90);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        warning_threshold: 90,
        updated_at: expect.any(String),
      },
      { onConflict: "user_id" },
    );
  });

  it("rejects out-of-range thresholds before hitting the API", async () => {
    mockSignedIn("user-1");
    const upsert = mockUpsert({ error: null });

    const { result } = renderHook(() => useUpdateWarningThreshold(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync(101)).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });
});
