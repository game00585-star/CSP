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

### React Three Fiber and 3D work

For interactive 3D scenes, use `@react-three/fiber` v8 with React 18 and `three`. Do not upgrade to React Three Fiber v9 unless the application is deliberately migrated to React 19.

Use the project skills together, with clear ownership:

- Load `landing-page-design` for the surrounding web interface, responsive layout, typography, spacing, interaction states, accessibility, reduced-motion behavior, and motion timing.
- Load `figma-designer` when a Figma reference is provided. Translate its variables, components, spacing, radius, color roles, and responsive frames into reusable application tokens; the approved CSP reference remains authoritative.
- Use React Three Fiber only for the renderable scene: canvas, camera, lighting, geometry, materials, model loading, pointer interaction, and frame updates. Keep ordinary controls, forms, tables, navigation, and accessible labels in React DOM unless WebGL rendering is functionally required.

3D implementation rules:

- Build scenes as small reusable components and keep stock, warehouse, rack, bin, lot, and transaction data outside render components.
- Never invent operational data for visual completeness. Geometry and display coordinates may be separate presentation metadata linked to real entity IDs.
- Use pointer events to select real entities and pass only identifiers back to the existing application workflow.
- Avoid per-frame React state updates. Use `useFrame` and refs for animation, memoize expensive geometry and materials, dispose resources correctly, and lazy-load heavy models.
- Cap device pixel ratio where appropriate, prefer instancing for repeated objects, and verify acceptable behavior on desktop, tablet, and mobile.
- Provide a non-WebGL loading, empty, unsupported, and error state. Respect `prefers-reduced-motion` and preserve keyboard-accessible DOM alternatives for important actions.
- Before finishing, verify scene resize behavior, camera controls, pointer/touch selection, cleanup after navigation, console errors, lint, and the production build.

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

