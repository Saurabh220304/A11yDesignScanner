🚀 Just open-sourced A11y Scanner — a free Figma plugin that catches accessibility issues before a single line of code is written.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Here's the problem I was trying to solve:

Accessibility bugs found in QA or post-launch cost 10–100× more to fix than bugs caught at the design stage. Yet most designers have no tooling to catch these issues *while* they're working.

So I built A11y Scanner — a fully free, open-source Figma plugin that brings automated WCAG 2.2 auditing directly into the design workflow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

♿ What the plugin does:

**Testing Tools** (automated scanning with a 0–100 score + A–F grade):
🎨 Contrast — checks text and non-text contrast ratios (WCAG 1.4.3 / 1.4.11)
Aa Typography — flags fixed text that clips at zoom, tight line-height, reflow issues
👆 Touch Targets — finds interactive elements below the 24×24px minimum (WCAG 2.5.8)
⚙️ Component States — detects component sets missing Focus or Hover variants

**Annotation Tools** (place real Figma layers on the canvas for dev handoff):
🖼 Alt Text — write descriptions per image/icon with live best-practice linting
⌨️ Focus Order — number interactive elements in their keyboard tab sequence
H1–6 Headings — assign heading levels and generate a heading map for developers
⬚ Landmarks — mark semantic page regions (header, nav, main, footer…) with dashed overlays

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠 Under the hood:

• Pure TypeScript source with a fully typed rule engine
• Annotation engine draws real Figma layers (visible in Dev Mode)
• Pre-built dist/code.js — no Node.js needed to get started
• Zero backend, zero accounts, works completely offline
• Tight false-positive filtering on all rules

━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 The part I'm most proud of:

The annotation tools don't just give you a checklist — they write directly onto the Figma canvas. That means developers get numbered focus-order badges, heading tags, and landmark borders right in the file they're inspecting in Dev Mode. No more post-it-note handoffs or "see the accessibility doc in Confluence."

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 Links:

→ GitHub: github.com/YOUR_USERNAME/shift-left-a11y
→ How to install: clone the repo, import manifest.json in Figma Desktop — that's it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would love feedback from designers, developers, and accessibility practitioners — especially on:
• Which rules produce false positives in your design system
• What annotation tools you wish existed but don't yet
• Whether the scoring formula reflects real-world severity well

Star ⭐ the repo if you find it useful, and PRs are very welcome.

#Accessibility #A11y #WCAG #Figma #FigmaPlugin #UXDesign #DesignSystems #OpenSource #TypeScript #InclusiveDesign #DesignTools #FrontendDevelopment #DesignDevelopment #UX #ProductDesign
