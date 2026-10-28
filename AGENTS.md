# Инструкции проекта

Отвечай всегда на русском языке.

Прочитай и соблюдай `/Users/aleksandr/.codex/RTK.md`.

<!-- ai-dev-kit:rules:start (auto-generated, do not edit — regenerate via .claude/ai-dev-kit/rules/build-agents-md.sh) -->

# Core Always-On Contract

These compact guardrails are always in context through `rules/RULES.md`. User instructions override repository rules. Process/design rules come before implementation rules.

## Required reads and gates

- Before design or an architectural decision: enter native Plan Mode, then read `rules/skills/brainstorming.md` and invoke `superpowers:brainstorming`. The resulting design spec is written in Russian — see `rules/base/workflow-and-misc.md` → "Documentation Language".
- Before writing a multi-step plan: read `rules/skills/writing-plans.md`, enter native Plan Mode, and invoke `superpowers:writing-plans`. The resulting plan document is written in Russian, except the machine-parsed markup that must stay English (`### Task N:` headings, checkboxes, `Step`/`Files`/`Global Constraints` labels) — see `rules/skills/writing-plans.md`.
- Before test-worthy implementation: read `rules/base/testing.md` and `rules/base/test-execution-policy.md`, then invoke `superpowers:test-driven-development`. Follow the testing layer table; do not expand it from a generic TDD checklist.
- Before committing or branching: read `rules/base/git-and-commits.md`. Never commit automatically.
- Before reading a known file or choosing between Bash and a dedicated tool: apply `rules/base/mcp-tool-priority.md`.
- Before claiming work complete, fixed, or passing: run the relevant checks and read/apply `rules/skills/verification-before-completion.md`.

This contract only points to the detailed files: read the one that matches the action before you act. If a routed file or skill is unavailable, skip it and don't reconstruct it from memory.

## Always-on conventions

Apply the imported naming, class-structure, file-structure, and workflow rules to TypeScript work. Apply the router for Angular/NestJS rules, roadmap work, codebase exploration, plan execution, subagents, and Plannotator.

When a task matches a situation in the routing table, apply its rule or skill, and follow the checklist of any skill you invoke. Keep durable markdown artifacts in Plan Mode until `ExitPlanMode` approval; after approval, ask before starting implementation. While native Plan Mode is active, end the turn with `ExitPlanMode` or `AskUserQuestion`.

## Autonomy

Make reversible local edits within the task on your own. Wait for confirmation before anything irreversible or visible outside the repo: deleting files beyond the task, push, PR merge, DB or infra changes, calls to external services. If a requirement is ambiguous, ask one focused question instead of guessing. On long tasks, keep a progress checklist in a file so it survives context compaction.

# Orchestrator

This file is always in context through `rules/RULES.md`. It routes work to detailed rules that are loaded only when their situation occurs. `@import` expands only inside the `RULES.md` chain; a file reached later with `Read` does not expand its own `@` references.

## Routing

| Situation                                                                     | Required action                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Idea, new behavior, or architecture                                           | Read `rules/skills/brainstorming.md`, then invoke `superpowers:brainstorming` in native Plan Mode                         |
| Multi-step plan before implementation                                         | Read `rules/skills/writing-plans.md`, then invoke `superpowers:writing-plans` in native Plan Mode                         |
| Test scope, assertions, or coverage                                           | Read `rules/base/testing.md`                                                                                              |
| Test-worthy implementation or bug fix                                         | Read `rules/base/testing.md` and `rules/base/test-execution-policy.md`, then invoke `superpowers:test-driven-development` |
| Commit or branch                                                              | Read `rules/base/git-and-commits.md`                                                                                      |
| Known file path, Bash vs MCP, or dedicated-tool choice                        | Read `rules/base/mcp-tool-priority.md`                                                                                    |
| Claim work complete, fixed, or passing                                        | Read `rules/skills/verification-before-completion.md` and run its required checks                                         |
| Test the current changes by hand ("протестируй изменения", "test my changes") | Invoke `testing-changes`                                                                                                  |
| Execute a written plan via subagents                                          | Read `rules/skills/subagent-driven-development.md`                                                                        |
| Execute a written plan with checkpoints                                       | Read `rules/skills/executing-plans.md`                                                                                    |
| Long-running Plannotator process                                              | Read `rules/skills/plannotator.md`                                                                                        |
| NestJS code                                                                   | Read `rules/nestjs/index.md`, then the relevant topic file(s)                                                             |
| Angular code                                                                  | Read `rules/angular/index.md`, then the relevant topic file(s)                                                            |
| Roadmap work                                                                  | Invoke `roadmap`                                                                                                          |
| Search an unfamiliar or large codebase                                        | Invoke `codebase-domain-map`, if installed, before exploration                                                            |
| Shared vs personal file                                                       | Read `rules/base/local-vs-shared.md`                                                                                      |
| Artifact or temp-file location                                                | Read `rules/base/artifacts-and-tmp.md`                                                                                    |

If a routed skill or file is missing, skip it silently and continue; never reconstruct its content from memory.

## Chaining

- Design → plan → implementation via TDD when in scope → verification → commit.
- Effort follows the stage: clarify requirements first, implement at medium effort, then switch to high (`/effort high`) to verify before the final pass; keep max for hard autonomous problems.
- For a NestJS/Angular plan, `writing-plans.md` handles stack detection and required stack reads; do not repeat them before drafting.
- For inline stack implementation outside a plan, read the relevant index and topic directly.
- TDD scope is bounded by `testing.md`'s layer table.
- Before delegation, read the project's durable context, codebase map, role definition, and applicable rules; pass each subagent its goal, scope, interfaces, constraints, workflow, verification policy, and readiness criteria. Forbid commits in implementer prompts.

## Project config

When a routed rule needs a project value, read `.claude/dev-conventions.json` once. If the value is needed but absent, ask and save it; never invent it.

# Naming

- No `Interface` suffix on interface/type names (`CreateUserRequest`, not `CreateUserRequestInterface`).
- Avoid filler words such as `Data`/`Info` when the name already conveys the meaning. Keep meaningful directional words such as `Request`/`Response`.
- Required fields precede optional fields in interfaces, types, DTOs, and class fields.
- Non-null assertion (`!`) is forbidden except the documented framework-validated DTO exception in `rules/nestjs/dto.md`; use guards or narrowed types.
- A pass-through outbound/event object is named `payload`, not `request`.
- No re-export of a variable/type under a new name for renaming's sake alone (`export const LOCAL_NAME = IMPORTED_NAME;` with no distinct value) — import and use the original name directly.

# Class Structure

- Separate guard clauses, data preparation, calls, and result handling inside methods with blank lines.
- A function, method, or constructor with 3+ parameters takes one named object parameter, destructured; define its type inline or in a nearby `*.types.ts` file.

# Splitting a Growing Module

| Content                                                                 | File                                     |
| ----------------------------------------------------------------------- | ---------------------------------------- |
| Any type/interface, even a single one                                   | `*.types.ts`                             |
| Constants                                                               | `*.constants.ts`                         |
| Pure builders/formatters without side effects or DI                     | `*.helpers.ts`                           |
| Pure row/payload → domain mappers with no branching beyond `?? default` | `*.mapper.ts`                            |
| Type guards                                                             | Beside the narrowed type in `*.types.ts` |
| Class/handler                                                           | Only the class and imports               |

Exception — Storybook stories: a story module and its support files (`*.stories.ts`, story-opening helpers such as `stories.ts` in an e2e `support/` folder) are not split by this table. Types, pure formatters, and the side-effecting function may stay together in one file; do not split them into `*.types.ts`/`*.helpers.ts`.

Exception — test data: values used only by tests (seeds, fixtures, test-config timeouts) stay in the test file or its test-support file and are not moved to `*.constants.ts`. Each still gets a name; see `rules/base/testing.md` → "Assertions".

Keep mappers separate from helpers. A barrel exports only the public API; never re-export internal types. A grouping folder containing class dot-subfolders may have an aggregating `index.ts`, but siblings import one another directly to avoid cycles.

Tested units use a dot-notation subfolder and local barrel (`some-service/some-service.ts`, `.spec.ts`, `index.ts`). Untested constants/types stay flat. Exclude pure `*.mapper.ts` files from test discovery/coverage.

# Workflow & Misc Code Style

## Avoid `let` with Later Reassignment

Do not declare a `let` and assign it later, including across `try/catch`. Extract the operation into a function and assign its result to a `const`. A `let` is acceptable for a genuinely loop-scoped or incremented value.

## No Magic Numbers

Name non-obvious numeric literals. Express durations, TTLs, intervals, and retry counts as named constants or arithmetic from obvious units (`60 * 60 * 1000`), in production and test code.

## No JSDoc Comments

Do not add JSDoc blocks (`/** ... */`). Use plain one-line comments only where the reason behind the code is not obvious.

## Documentation Language

- Rules and skill instructions are written in English.
- Every markdown artifact produced by `superpowers:brainstorming`, `superpowers:writing-plans`, or `roadmap` (design specs, implementation plans, roadmaps, and any step-level doc nested under them) is written entirely in Russian — headings, body text, and task descriptions alike, whatever language the user typed their request in. Code blocks, identifiers, file paths, and technical terms inside these docs stay in their original form. The only carve-out is machine-parsed plan markup (`### Task N:` headings, `- [ ]` checkboxes, `Step N` / `Files:` / `Interfaces:` / `Global Constraints` labels), which stays English — see `rules/skills/writing-plans.md` → "Exceptions: keep in English".
- Other reader-facing docs (`README`, `docs/`, other specs/design docs) are also written in Russian.
- Trigger phrases remain in their original input language, with an English duplicate when needed for matching (for example, «давай подумаем» / “let's think about this”).

<!-- ai-dev-kit:rules:end -->
