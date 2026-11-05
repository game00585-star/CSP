# CSP Stock Count — Codex project instructions

## Project design authority

- Preserve the existing CSP design references as the primary visual authority.
- If a project skill conflicts with a CSP reference, the CSP reference wins.
- Use a professional dark mode, modern enterprise dashboard styling, dimensional UI, and 2.5D presentation for warehouse maps and storage locations.
- Keep layouts responsive for desktop, tablet, and mobile.

## Skill routing

### `landing-page-design`

Load `.agents/skills/landing-page-design/SKILL.md` before designing, editing, styling, or reviewing web UI, page sections, components, dashboards, prototypes, landing pages, conversion copy, typography, spacing, color, motion, or responsive behavior.

Apply its rules only where they do not conflict with the approved CSP references or existing product workflows. For existing CSP screens, preserve the current information architecture and operational intent.

### `figma-designer`

Load `.agents/skills/figma-designer/SKILL.md` before creating, editing, or reviewing screens, components, variables, tokens, styles, prototypes, or design systems in Figma.

When using Figma tooling, also load any mandatory official Figma skill required by that tool. Reuse existing CSP variables, styles, and components before creating new ones.

## Protected behavior

- Do not change business logic, workflow, database structures, product data, authentication, APIs, stock counting, variance calculations, or inventory calculations unless the user explicitly requests that specific change.
- Do not invent stock, warehouse, rack, bin, lot, product, or transaction data for production features.
- Treat UI work as a presentation-layer change unless the user explicitly expands the scope.
- Inspect existing files before editing and preserve unrelated user changes.

## Implementation checks

- Verify affected desktop, tablet, and mobile layouts.
- Run the relevant lint, test, and production build commands after source changes.
- Report changed files and any checks that could not be completed.
- Do not deploy to production unless the user explicitly requests deployment.

