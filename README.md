<div align="center">

# ♿ A11y Scanner — Figma Plugin

**Catch WCAG 2.2 accessibility issues at design time, before a single line of code is written.**

[![License: MIT](https://img.shields.io/badge/License-MIT-5b6ef5.svg)](LICENSE)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2-10b981.svg)](https://www.w3.org/TR/WCAG22/)
[![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-f97316.svg)](https://figma.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-a855f7.svg)](CONTRIBUTING.md)

[Features](#-features) · [Installation](#-installation) · [Tools](#-tools) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>

---

## 🌟 Why A11y Scanner?

Accessibility issues found during QA or after launch cost **10–100× more** to fix than issues caught at design time. A11y Scanner shifts this process left — directly inside Figma — so designers and developers can collaborate on accessibility from day one.

- ✅ **Zero cost** — fully free and open source (MIT)
- ✅ **Zero backend** — runs entirely client-side, no accounts, no network calls
- ✅ **Zero setup** — pre-built `dist/code.js` included, just import `manifest.json`
- ✅ **WCAG 2.2 aligned** — covers all AA success criteria relevant to design
- ✅ **Canvas annotations** — places real Figma layers developers can inspect in Dev Mode

---

## ✨ Features

### Testing Tools — automated scanning with scored results

| Tool | WCAG | What it checks |
|---|---|---|
| **Contrast** | 1.4.3, 1.4.11, 1.4.1 | Text contrast ratios, non-text contrast, colour-only indicators |
| **Typography** | 1.4.4, 1.4.12, 1.4.10 | Fixed text containers, tight line-height, reflow at 400% zoom |
| **Touch Targets** | 2.5.8 | Interactive elements below the 24×24px minimum |
| **Component States** | 2.4.7, 4.1.2 | Component sets missing Focus or Hover variants |

### Annotation Tools — interactive, place layers directly on the canvas

| Tool | What it draws on the Figma canvas |
|---|---|
| **Alt Text** | Teal `ALT` badge + description beside each image / icon |
| **Focus Order** | Numbered indigo badges with dashed outlines on interactive elements |
| **Headings** | Orange H1–H6 tags beside heading text layers |
| **Landmarks** | Dashed border overlays + role label on semantic frame regions |

---

## 📦 Installation

### Option A — Pre-built (recommended, no Node.js needed)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/shift-left-a11y.git

# 2. Open Figma Desktop (browser doesn't support local plugins)
# 3. Main Menu → Plugins → Development → Import plugin from manifest…
# 4. Select manifest.json from the project root
# 5. Open any design file → Plugins → Development → A11y Scanner
```

### Option B — Build from source

```bash
npm install        # install dev dependencies
npm run build      # compile TypeScript → dist/code.js
npm run watch      # watch mode for development
npm run typecheck  # type-check without emitting output
```

---

## 🛠️ How Each Tool Works

### 🎨 Contrast
Calculates WCAG relative luminance for every visible text node, comparing foreground fill against the nearest ancestor background. Reports exact ratio, required threshold, and hex values. Also checks vectors/booleans explicitly named as UI controls (icon, border, focus ring…).

### Aa Typography
Checks for `textAutoResize = "NONE"` (text will clip at 200% zoom), line-height below 1× font size, significant negative letter-spacing, and fixed-width top-level frames that won't reflow on small viewports.

### 👆 Touch Targets
Identifies components and instances with button/checkbox/toggle names and checks whether their bounding box meets the WCAG 2.5.8 24×24px minimum. Skips containers and large frames automatically.

### ⚙️ Component States
Inspects component sets with interactive-sounding names. Reports sets with a Default variant but missing both Hover AND Focus — the two states most critical for keyboard and pointer accessibility.

### 🖼 Alt Text _(annotation)_
Finds image fills, vectors, and icon-named layers. Write descriptions with live best-practice linting (flags "picture of…", file extensions, character limit). Mark elements as decorative. **Add to Canvas** places a teal badge + text snippet beside each layer — visible in Dev Mode.

### ⌨️ Focus Order _(annotation)_
Collects all interactive elements, pre-sorted by reading order. Reorder with ↑↓ arrows. Mark non-focusable elements as Skip. **Apply to Canvas** draws numbered indigo badges with dashed outlines in the correct tab sequence.

### H1–6 Headings _(annotation)_
Finds text layers with heading-named styles + large-bold heuristics. Pick H1–H6 for each. **Apply to Canvas** places orange H-badges beside each text layer — the complete heading map for developers.

### ⬚ Landmarks _(annotation)_
Scans frames whose names contain landmark keywords. Assign roles (Header, Nav, Main, Footer…) from the grid or type a custom one. **Apply to Canvas** draws dashed indigo borders + role pill labels on every landmark region.

---

## 🏗️ Architecture

```
shift-left-a11y/
├── manifest.json               ← Figma plugin manifest
├── dist/
│   └── code.js                 ← Pre-built plugin sandbox entry (pure ES5)
└── src/
    ├── code.ts                 ← TypeScript source (sandbox entry)
    ├── types.ts                ← Shared TypeScript interfaces
    ├── core/
    │   ├── ruleEngine.ts       ← Rule registry, scan orchestration, scoring
    │   ├── nodeScanner.ts      ← Iterative depth-first node traversal
    │   └── issueManager.ts     ← Issue deduplication + severity sorting
    ├── rules/                  ← Individual WCAG rule modules
    │   ├── contrastRule.ts
    │   ├── nonTextContrastRule.ts
    │   ├── colorOnlyRule.ts
    │   ├── resizeTextRule.ts
    │   ├── textSpacingRule.ts
    │   ├── reflowRule.ts
    │   ├── targetSizeRule.ts
    │   ├── focusVisibleRule.ts
    │   └── stateCoverageRule.ts
    ├── utils/
    │   ├── colorUtils.ts       ← WCAG relative luminance & contrast ratio
    │   ├── wcagUtils.ts        ← Thresholds, constants, name patterns
    │   ├── nodeUtils.ts        ← Type guards, traversal helpers
    │   └── layoutUtils.ts      ← Bounding box, auto-layout detection
    ├── ui/
    │   ├── ui.html             ← Self-contained plugin iframe (CSS+JS inlined)
    │   ├── ui.css              ← Source styles (dark design system)
    │   └── ui.ts               ← Source UI logic
    └── report/
        └── reportGenerator.ts  ← JSON / CSV / plain-text export
```

### Message flow

```
┌─────────────────────────────────────────────┐
│              Figma Canvas                   │
└──────────────────┬──────────────────────────┘
                   │ node tree access
┌──────────────────▼──────────────────────────┐
│           code.js (Figma sandbox)           │
│                                             │
│  runScan()          → ScanResult            │
│  scanXxxCandidates  → candidate[]           │
│  doAnnotateXxx()    → canvas layers         │
└──────────┬──────────────────────┬───────────┘
           │    postMessage       │
    sends  │                      │  receives
           │                      │
┌──────────▼──────────────────────▼───────────┐
│           ui.html (iframe)                  │
│                                             │
│  → scan, annotate-*, highlight, export      │
│  ← scan-result, *-candidates, export-ready  │
└─────────────────────────────────────────────┘
```

### Scoring formula

```
penalty = (high issues × 10) + (medium × 5) + (low × 2)
score   = max(0, 100 − penalty)

Grade:  ≥90 → A  |  ≥75 → B  |  ≥50 → C  |  ≥30 → D  |  else → F
Risk:   ≥75 → Low  |  ≥50 → Moderate  |  ≥25 → High  |  else → Critical
```

---

## ➕ Adding a Custom Rule

1. Create `src/rules/myRule.ts`:

```typescript
import { AccessibilityIssue } from "../types";

export function checkMyRule(node: SceneNode): AccessibilityIssue | null {
  // Return null if no issue, or an issue object
  if (/* passes */) return null;

  return {
    ruleId:         "my-rule-id",
    wcagId:         "X.X.X",
    wcagLevel:      "AA",
    severity:       "high",       // "high" | "medium" | "low"
    confidence:     "high",
    nodeId:         node.id,
    nodeName:       node.name,
    description:    "What is wrong.",
    impact:         "Who is affected and how.",
    recommendation: "How to fix it.",
    metadata:       {}
  };
}
```

2. Add to `RULES` array in `dist/code.js` (and `src/code.ts`):

```javascript
var RULES = [ rContrast, /* ... */, checkMyRule ];
```

3. Map to a tool category in `ui.html`:

```javascript
var TRULES = {
  contrast: ["contrast-text", "contrast-non-text", "color-only", "my-rule-id"],
};
```

---

## ⚡ Performance Notes

- Invisible (`visible === false`) and zero-opacity nodes are **skipped**
- Traversal uses an **explicit stack** — safe for files with 1000+ nodes
- Scans are **debounced** with a 300ms delay to batch rapid triggers
- Each rule is wrapped in **try/catch** — one failing rule never stops the scan
- **No network requests** — works completely offline

---

## 🤝 Contributing

Contributions are very welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

**Good first contributions:**
- Add a new WCAG rule (see section above)
- Improve false-positive filtering on an existing rule
- Add unit tests for scoring / rule logic
- Improve plugin UI accessibility *(meta!)*

---

## 📄 License

[MIT](LICENSE) © 2025

---

## 🙏 Acknowledgements

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — W3C Web Accessibility Initiative
- [axe-core](https://github.com/dequelabs/axe-core) — inspiration for the rule engine pattern
- [Figma Plugin API](https://www.figma.com/plugin-docs/) — for making canvas annotation possible

---

<div align="center">
  <sub>Built with care for the 1.3 billion people living with disability worldwide.</sub>
</div>
