import { countBySeverity } from "@/lib/scan-history";
import type { Issue } from "@/lib/types";
import { describe, expect, it } from "vitest";

describe("countBySeverity", () => {
  it("counts severities", () => {
    const issues: Issue[] = [
      {
        type: "accessibility",
        severity: "high",
        message: "a",
        selector: "a",
      },
      {
        type: "accessibility",
        severity: "high",
        message: "b",
        selector: "b",
      },
      {
        type: "accessibility",
        severity: "low",
        message: "c",
        selector: "c",
      },
    ];
    expect(countBySeverity(issues)).toEqual({
      high: 2,
      medium: 0,
      low: 1,
    });
  });
});
