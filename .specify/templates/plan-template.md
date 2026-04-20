# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary

[Primary requirement plus technical approach]

## Technical Context

**Language/Version**: [e.g. TypeScript 6]  
**Primary Dependencies**: [e.g. Fastify, pg, React, Vite]  
**Storage**: [e.g. PostgreSQL]  
**Testing**: [e.g. Vitest, Supertest]  
**Target Platform**: [e.g. local Docker + modern browsers]  
**Project Type**: [e.g. web app with API and frontend package]  
**Performance Goals**: [domain-specific target]  
**Constraints**: [domain-specific constraints]  
**Scale/Scope**: [expected assignment scope]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Principle I: Active feature and story scope are defined.
- [ ] Principle II: Contract updates are identified.
- [ ] Principle III: Money movement safety is preserved.
- [ ] Principle IV: Verification paths are defined.
- [ ] Principle V: Brownfield constraints are respected.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- openapi.yaml
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|-- db/
|-- lib/
|-- repositories/
|-- services/
|-- types/
`-- ...

scripts/
tests/
|-- integration/
`-- unit/

frontend/
|-- src/
`-- ...
```

**Structure Decision**: [Describe the actual repo layout used for this feature]

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | [n/a] | [n/a] |
