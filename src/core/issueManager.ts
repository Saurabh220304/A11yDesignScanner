/**
 * issueManager.ts
 * Collects, deduplicates, and sorts accessibility issues.
 */

import { AccessibilityIssue } from "../types";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export class IssueManager {
  private issues: AccessibilityIssue[] = [];
  private seenKeys = new Set<string>();

  add(issue: AccessibilityIssue): void {
    const key = `${issue.ruleId}::${issue.nodeId}`;
    if (this.seenKeys.has(key)) return;
    this.seenKeys.add(key);
    this.issues.push(issue);
  }

  addMany(issues: (AccessibilityIssue | null)[]): void {
    for (const issue of issues) {
      if (issue) this.add(issue);
    }
  }

  getAll(): AccessibilityIssue[] {
    return [...this.issues].sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );
  }

  getBySeverity(severity: "high" | "medium" | "low"): AccessibilityIssue[] {
    return this.getAll().filter((i) => i.severity === severity);
  }

  clear(): void {
    this.issues = [];
    this.seenKeys.clear();
  }

  get count(): number {
    return this.issues.length;
  }
}
