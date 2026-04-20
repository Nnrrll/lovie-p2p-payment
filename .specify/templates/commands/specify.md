---
description: Create or update a feature specification from a natural-language request.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a technical plan for the active feature.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Generate a concise short name for the feature.
2. Resolve the feature directory under `specs/` using sequential numbering unless
   `.specify/feature.json` already points to an active feature.
3. Create the directory and copy `.specify/templates/spec-template.md` to `spec.md` if needed.
4. Fill `spec.md` with prioritized user stories, edge cases, requirements, success criteria, and
   assumptions.
5. Create or update `checklists/requirements.md` for specification quality.
6. Persist the active feature directory in `.specify/feature.json`.
7. Report the feature directory, spec path, and readiness for planning.
