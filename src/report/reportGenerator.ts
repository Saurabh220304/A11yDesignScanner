/**
 * reportGenerator.ts
 * Exports scan results as JSON, CSV, or plain-text summary.
 */

import { ScanResult, AccessibilityIssue } from "../types";

export function exportJSON(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportCSV(issues: AccessibilityIssue[]): string {
  const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const headers = ["Rule ID", "WCAG ID", "WCAG Level", "Severity", "Confidence", "Node Name", "Description", "Recommendation"];
  const rows = issues.map((i) => [
    escape(i.ruleId),
    escape(i.wcagId),
    escape(i.wcagLevel),
    escape(i.severity),
    escape(i.confidence),
    escape(i.nodeName),
    escape(i.description),
    escape(i.recommendation),
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function exportSummary(result: ScanResult): string {
  const high   = result.issues.filter((i) => i.severity === "high").length;
  const medium = result.issues.filter((i) => i.severity === "medium").length;
  const low    = result.issues.filter((i) => i.severity === "low").length;

  const topIssues = result.issues
    .slice(0, 5)
    .map((i, idx) => `  ${idx + 1}. [${i.severity.toUpperCase()}] ${i.description}`)
    .join("\n");

  return [
    `Accessibility Score: ${result.score}/100 (Grade ${result.grade})`,
    `Risk Level: ${result.riskLevel.toUpperCase()}`,
    `Nodes scanned: ${result.totalNodes} | Rules run: ${result.totalRulesRun}`,
    `Total issues: ${result.issues.length} (High: ${high}, Medium: ${medium}, Low: ${low})`,
    "",
    "Top issues:",
    topIssues || "  None",
  ].join("\n");
}
