import { describe, expect, it } from "vitest";
import { formatPeso, sumPeso } from "./format";

describe("format", () => {
  it("formats peso values", () => {
    expect(formatPeso("20000")).toBe("₱20,000.00");
    expect(formatPeso(12450.75)).toBe("₱12,450.75");
    expect(formatPeso(0)).toBe("₱0.00");
  });

  it("sums money as centavos to avoid floating point drift", () => {
    expect(sumPeso(["20000", "12450.75"])).toBe("₱32,450.75");
    expect(sumPeso(["0.1", "0.2"])).toBe("₱0.30");
    expect(sumPeso([])).toBe("₱0.00");
  });
});
