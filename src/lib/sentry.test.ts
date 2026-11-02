import { beforeEach, describe, expect, it, vi } from "vitest";

const { initMock } = vi.hoisted(() => ({ initMock: vi.fn() }));

vi.mock("@sentry/react", () => ({ init: initMock }));

async function loadInitSentry() {
  const { initSentry } = await import("./sentry");
  return initSentry;
}

const DSN = "https://abc123@o0.ingest.sentry.io/1234567";

beforeEach(() => {
  initMock.mockReset();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("initSentry", () => {
  it("does not initialize without a DSN", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    vi.stubEnv("VITE_APP_ENV", "production");
    (await loadInitSentry())();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("does not initialize in development", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", DSN);
    vi.stubEnv("VITE_APP_ENV", "development");
    (await loadInitSentry())();
    expect(initMock).not.toHaveBeenCalled();
  });

  it("initializes with dsn, environment, release and scrubbing in production", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", DSN);
    vi.stubEnv("VITE_APP_ENV", "production");
    (await loadInitSentry())();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        environment: "production",
        release: expect.any(String),
        beforeSend: expect.any(Function),
      }),
    );
  });

  it("initializes with a staging environment tag", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", DSN);
    vi.stubEnv("VITE_APP_ENV", "staging");
    (await loadInitSentry())();
    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: "staging" }),
    );
  });
});
