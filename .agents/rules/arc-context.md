# ARC Project Context

This workspace contains three authoritative project documents:

- `docs/Rules.md` — project constraints, boundaries, and non-negotiable rules.
- `docs/Phases.md` — implementation phases, priorities, and feature sequencing.
- `docs/Design.md` — UI/UX system, visual direction, and design requirements.

## Context Loading Rules

Do NOT read all three documents for every task.

Load only the minimum relevant document:

- Read `Rules.md` when making architectural, product, feature, security, privacy, or behavior decisions.
- Read `Phases.md` when planning, prioritizing, implementing, or deciding what should be built next.
- Read `Design.md` only when working on UI, UX, styling, layouts, components, animations, or visual consistency.

For tasks involving multiple areas, read only the required combination.

Do not repeatedly reread a document within the same task unless necessary.

Before implementing changes:
1. Identify which project document is relevant.
2. Read only that document.
3. Follow it as the source of truth.
4. Do not implement features belonging to a future phase unless explicitly requested.

If a user request conflicts with these documents, point out the conflict before making the change.