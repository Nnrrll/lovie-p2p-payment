---
description: Create or update the project constitution and keep dependent templates in sync.
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Create or revise the active feature specification using the ratified constitution.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Load `.specify/memory/constitution.md`.
2. If the file does not exist, initialize it from `.specify/templates/constitution-template.md`.
3. Resolve placeholder values from user input and current repository context.
4. Update the constitution using concrete, testable language.
5. Sync any affected wording in:
   - `.specify/templates/spec-template.md`
   - `.specify/templates/plan-template.md`
   - `.specify/templates/tasks-template.md`
   - `.specify/templates/checklist-template.md`
6. Write the updated constitution back to `.specify/memory/constitution.md`.
7. Report version changes, affected files, and follow-up work.
