---
description: Generate an actionable, dependency-ordered tasks list for the active feature.
handoffs:
  - label: Implement Project
    agent: speckit.implement
    prompt: Execute the highest-priority tasks for the active feature.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Read the active feature directory from `.specify/feature.json`.
2. Load:
   - `spec.md`
   - `plan.md`
   - `research.md`
   - `data-model.md`
   - `contracts/openapi.yaml`
3. Create or update `tasks.md` using `.specify/templates/tasks-template.md`.
4. Organize tasks by user story and preserve independent testability.
5. Mark parallelizable tasks with `[P]`.
6. Include exact file paths in every task description.
7. Report total tasks, MVP scope, and parallel work opportunities.
