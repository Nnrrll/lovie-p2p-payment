---
description: Execute the planning workflow for the active feature and generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the active feature into executable tasks.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Read `.specify/feature.json` to locate the active feature directory.
2. Load `spec.md` and `.specify/memory/constitution.md`.
3. Create or update `plan.md` from `.specify/templates/plan-template.md`.
4. Resolve technical context using the real repository shape and current runtime scripts.
5. Produce:
   - `research.md`
   - `data-model.md`
   - `quickstart.md`
   - `contracts/openapi.yaml`
6. Re-run the constitution check after the design artifacts are complete.
7. Report the generated files and any gaps that block task generation.
