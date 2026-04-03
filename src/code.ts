/**
 * code.ts — Main Figma plugin entry point (runs in Figma sandbox).
 * Orchestrates scanning, highlighting, and message passing to/from the UI.
 */

import { RuleEngine } from "./core/ruleEngine";
import { ScanScope, ScanResult } from "./types";

// ─── Rules ───────────────────────────────────────────────────────────────────
import { contrastRule }         from "./rules/contrastRule";
import { nonTextContrastRule }  from "./rules/nonTextContrastRule";
import { resizeTextRule }       from "./rules/resizeTextRule";
import { textSpacingRule }      from "./rules/textSpacingRule";
import { headingRule }          from "./rules/headingRule";
import { landmarkRule }         from "./rules/landmarkRule";
import { sequenceRule }         from "./rules/sequenceRule";
import { targetSizeRule }       from "./rules/targetSizeRule";
import { focusOrderRule }       from "./rules/focusOrderRule";
import { focusVisibleRule }     from "./rules/focusVisibleRule";
import { accessibleNameRule }   from "./rules/accessibleNameRule";
import { reflowRule }           from "./rules/reflowRule";
import { stateCoverageRule }    from "./rules/stateCoverageRule";
import { colorOnlyRule }        from "./rules/colorOnlyRule";
import { placeholderLabelRule } from "./rules/placeholderLabelRule";
import { touchSpacingRule }     from "./rules/touchSpacingRule";

// ─── Report ───────────────────────────────────────────────────────────────────
import { exportJSON, exportCSV, exportSummary } from "./report/reportGenerator";

// ─── Engine setup ─────────────────────────────────────────────────────────────
const engine = new RuleEngine();
engine.registerAll([
  contrastRule,
  nonTextContrastRule,
  resizeTextRule,
  textSpacingRule,
  headingRule,
  landmarkRule,
  sequenceRule,
  targetSizeRule,
  focusOrderRule,
  focusVisibleRule,
  accessibleNameRule,
  reflowRule,
  stateCoverageRule,
  colorOnlyRule,
  placeholderLabelRule,
  touchSpacingRule,
]);

// ─── Show UI ──────────────────────────────────────────────────────────────────
figma.showUI(__html__, { width: 380, height: 600, title: "A11y Scanner" });

// ─── Debounce helper ──────────────────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debounce(fn: () => void, ms: number) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, ms);
}

// ─── Highlight overlay management ─────────────────────────────────────────────
let overlayNode: RectangleNode | null = null;

function removeOverlay() {
  if (overlayNode && overlayNode.parent) {
    overlayNode.remove();
  }
  overlayNode = null;
}

function highlightNode(nodeId: string) {
  removeOverlay();
  const target = figma.getNodeById(nodeId) as SceneNode | null;
  if (!target) return;

  figma.viewport.scrollAndZoomIntoView([target]);
  figma.currentPage.selection = [target];

  // Draw a temporary red overlay
  const ab = target.absoluteBoundingBox;
  if (!ab) return;

  const rect = figma.createRectangle();
  rect.name = "__a11y_overlay__";
  rect.x = ab.x - 2;
  rect.y = ab.y - 2;
  rect.resize(ab.width + 4, ab.height + 4);
  rect.fills = [];
  rect.strokes = [{ type: "SOLID", color: { r: 1, g: 0.2, b: 0.2 } }];
  rect.strokeWeight = 2;
  rect.dashPattern = [6, 4];
  rect.opacity = 0.9;
  figma.currentPage.appendChild(rect);
  overlayNode = rect;

  // Auto-remove after 3 s
  setTimeout(removeOverlay, 3000);
}

// ─── Message handler ──────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg: { type: string; [key: string]: unknown }) => {
  switch (msg.type) {

    case "scan": {
      const scope = (msg.scope as ScanScope) ?? "page";
      debounce(async () => {
        figma.ui.postMessage({ type: "scan-start" });
        try {
          const result: ScanResult = await engine.runScan(scope);
          figma.ui.postMessage({ type: "scan-result", result });
        } catch (err) {
          figma.ui.postMessage({ type: "scan-error", message: String(err) });
        }
      }, 300);
      break;
    }

    case "highlight": {
      const nodeId = msg.nodeId as string;
      if (nodeId) highlightNode(nodeId);
      break;
    }

    case "export": {
      const format  = msg.format as "json" | "csv" | "summary";
      const result  = msg.result as ScanResult;
      let content   = "";
      let filename  = "a11y-report";

      if (format === "json") {
        content  = exportJSON(result);
        filename = "a11y-report.json";
      } else if (format === "csv") {
        content  = exportCSV(result.issues);
        filename = "a11y-report.csv";
      } else {
        content  = exportSummary(result);
        filename = "a11y-report.txt";
      }

      figma.ui.postMessage({ type: "export-ready", content, filename });
      break;
    }

    case "close":
      removeOverlay();
      figma.closePlugin();
      break;
  }
};

figma.on("selectionchange", () => {
  figma.ui.postMessage({ type: "selection-changed", count: figma.currentPage.selection.length });
});
