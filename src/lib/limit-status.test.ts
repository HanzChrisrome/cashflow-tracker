import { describe, expect, it } from "vitest";
import { DEFAULT_WARNING_THRESHOLD, getLimitStatus } from "./limit-status";

describe("getLimitStatus", () => {
  it("returns ok below the threshold (79.99%)", () => {
    const result = getLimitStatus({
      amount: 79.99,
      limit: 100,
      threshold: 80,
      isActive: true,
    });
    expect(result.status).toBe("ok");
    expect(result.percent).toBeCloseTo(79.99, 2);
    expect(result.remaining).toBeCloseTo(20.01, 2);
    expect(result.overBy).toBe(0);
  });

  it("returns warning at exactly the threshold (80%)", () => {
    const result = getLimitStatus({
      amount: 80,
      limit: 100,
      isActive: true,
    });
    expect(result.status).toBe("warning");
    expect(result.percent).toBe(80);
    expect(result.remaining).toBe(20);
    expect(result.overBy).toBe(0);
  });

  it("returns warning at 99%", () => {
    const result = getLimitStatus({
      amount: 99,
      limit: 100,
      isActive: true,
    });
    expect(result.status).toBe("warning");
  });

  it("returns reached at exactly 100% with nothing left", () => {
    const result = getLimitStatus({
      amount: 100,
      limit: 100,
      isActive: true,
    });
    expect(result.status).toBe("reached");
    expect(result.remaining).toBe(0);
    expect(result.overBy).toBe(0);
  });

  it("returns reached over 100% with overBy", () => {
    const result = getLimitStatus({
      amount: 120,
      limit: 100,
      isActive: true,
    });
    expect(result.status).toBe("reached");
    expect(result.percent).toBe(120);
    expect(result.remaining).toBe(0);
    expect(result.overBy).toBeCloseTo(20, 6);
  });

  it("returns ok for a zero limit without dividing by zero", () => {
    const result = getLimitStatus({
      amount: 50,
      limit: 0,
      isActive: true,
    });
    expect(result.status).toBe("ok");
    expect(Number.isFinite(result.percent)).toBe(true);
    expect(result.percent).toBe(0);
    expect(result.overBy).toBe(0);
  });

  it("returns ok for an empty limit string", () => {
    const result = getLimitStatus({
      amount: "50",
      limit: "",
      isActive: true,
    });
    expect(result.status).toBe("ok");
    expect(result.percent).toBe(0);
  });

  it("returns inactive regardless of usage", () => {
    const result = getLimitStatus({
      amount: 500,
      limit: 100,
      isActive: false,
    });
    expect(result.status).toBe("inactive");
  });

  it("accepts numeric strings", () => {
    const result = getLimitStatus({
      amount: "16000",
      limit: "20000",
      isActive: true,
    });
    expect(result.status).toBe("warning");
    expect(result.percent).toBe(80);
    expect(result.remaining).toBe(4000);
  });

  it("respects a custom threshold", () => {
    const warning = getLimitStatus({
      amount: 50,
      limit: 100,
      threshold: 50,
      isActive: true,
    });
    expect(warning.status).toBe("warning");

    const ok = getLimitStatus({
      amount: 49.99,
      limit: 100,
      threshold: 50,
      isActive: true,
    });
    expect(ok.status).toBe("ok");
  });

  it("defaults the threshold to DEFAULT_WARNING_THRESHOLD", () => {
    expect(DEFAULT_WARNING_THRESHOLD).toBe(80);
    const result = getLimitStatus({
      amount: 100,
      limit: 125,
      isActive: true,
    });
    expect(result.status).toBe("warning");
  });
});
