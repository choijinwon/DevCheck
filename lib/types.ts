export type IssueSeverity = "high" | "medium" | "low";

export type Issue = {
  type: "accessibility";
  severity: IssueSeverity;
  message: string;
  selector: string;
};
