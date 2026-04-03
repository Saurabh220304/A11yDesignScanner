# Contributing to A11y Scanner

Thank you for your interest in contributing! This document explains how to get started.

---

## Getting started

### Prerequisites
- Node.js 18+
- Figma Desktop app (required for local plugin testing)
- Basic familiarity with TypeScript and the Figma Plugin API

### Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/shift-left-a11y.git
cd shift-left-a11y

# 3. Install dependencies
npm install

# 4. Start watch mode
npm run watch

# 5. Load in Figma Desktop
#    Plugins → Development → Import plugin from manifest → select manifest.json
#    The plugin will auto-reload when you save files (refresh the plugin panel)
```

---

## How to contribute

### 🐛 Reporting a bug
Open a GitHub issue using the **Bug Report** template. Include:
- Figma file structure that triggers the issue (if possible, share a link)
- Expected behaviour vs actual behaviour
- Screenshot of the plugin panel if relevant

### 💡 Requesting a feature
Open a GitHub issue using the **Feature Request** template. Describe:
- The accessibility problem you're trying to solve
- The WCAG success criterion it relates to (if applicable)
- Any mockups or references you have in mind

### 🔧 Submitting a pull request

1. Create a feature branch: `git checkout -b feat/my-rule-name`
2. Make your changes
3. Run `npm run typecheck` — fix any type errors
4. Test the plugin manually in Figma Desktop
5. Commit with a clear message: `feat: add placeholder label rule (WCAG 1.3.1)`
6. Push and open a PR against `main`

---

## Adding a new scanning rule

Rules live in `src/rules/`. Each rule is a single function:

```typescript
// src/rules/myRule.ts
import { AccessibilityIssue } from "../types";

export function checkMyRule(node: SceneNode): AccessibilityIssue | null {
  // Return null → no issue
  // Return an object → issue found

  if (node.type !== "TEXT") return null; // guard early

  // ... your detection logic ...

  return {
    ruleId:         "my-rule",          // unique kebab-case ID
    wcagId:         "1.4.3",            // WCAG success criterion
    wcagLevel:      "AA",               // "A" | "AA" | "AAA"
    severity:       "high",             // "high" | "medium" | "low"
    confidence:     "high",             // how certain is this flag?
    nodeId:         node.id,
    nodeName:       node.name,
    description:    "Short description of what's wrong.",
    impact:         "Who is affected and how.",
    recommendation: "Concrete fix instruction.",
    metadata:       { /* any extra diagnostic data */ }
  };
}
```

Then register it in `dist/code.js` (and `src/code.ts`):

```javascript
var RULES = [
  rContrast, rNonTextContrast, /* ... */,
  checkMyRule   // ← add here
];
```

And map it to a UI tool in `ui.html`:

```javascript
var TRULES = {
  contrast: ["contrast-text", "contrast-non-text", "color-only", "my-rule"],
};
```

### Rule quality checklist
- [ ] Returns `null` (not an issue object) for all non-applicable node types — guard early
- [ ] Skips invisible nodes and zero-opacity nodes
- [ ] Has a meaningful `confidence` value — use `"low"` if the detection is heuristic
- [ ] `description` describes the specific problem (not the rule name)
- [ ] `recommendation` gives a concrete, actionable fix
- [ ] Does not use `async/await`, `const/let`, arrow functions, `Object.values`, `??`, `?.`, or `padStart` (Figma sandbox is ES5-level)
- [ ] Tested on real Figma files with both true positives and false negatives checked

---

## Code style

- **TypeScript source** (`src/`) — use TypeScript features freely; the build handles transpilation
- **Pre-built output** (`dist/code.js`) — must stay pure ES5 (no `const`, `let`, `=>`, `async/await`, `Object.values`, `??`, `?.`, `padStart`)
- **No external runtime dependencies** — keep the plugin self-contained
- **Comments** — add a JSDoc comment to any public function
- Keep functions small and single-purpose

---

## Commit message convention

```
type: short description (present tense, lowercase)

Examples:
feat: add colour-only indicator rule (WCAG 1.4.1)
fix: skip zero-opacity nodes in contrast check
docs: update contributing guide with ES5 constraints
refactor: extract luminance formula to colorUtils
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## Questions?

Open a GitHub Discussion or ping the maintainers in the issue tracker. We're friendly, promise. 🙂
