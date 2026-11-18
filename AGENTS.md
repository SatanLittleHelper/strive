# Инструкции проекта

Отвечай всегда на русском языке.

Прочитай и соблюдай `/Users/aleksandr/.codex/RTK.md`.

<!-- ai-dev-kit:rules:start (auto-generated, do not edit — regenerate via .claude/ai-dev-kit/rules/build-agents-md.sh) -->

# Core Always-On Contract

These compact guardrails are always in context through `rules/RULES.md`. User instructions override repository rules. Process/design rules come before implementation rules.

## Required reads and gates

- Before design or an architectural decision: read `rules/skills/document-approval.md` and `rules/skills/brainstorming.md` and invoke `superpowers:brainstorming`. The resulting design spec is written in Russian — see `rules/base/workflow-and-misc.md` → "Documentation Language".
- Before writing a multi-step plan that touches test-worthy layers: first write and get approved a test plan — read `rules/skills/writing-test-plans.md` and run its review loop (unit → integration → e2e; behavior, no code; validated through `doc-review`, 3 iterations). Skip it when no layer is test-worthy.
- Before writing a multi-step plan: read `rules/skills/writing-plans.md` (a fresh draft file, after the test plan is approved when one is required) and invoke `superpowers:writing-plans`. The resulting plan document is written in Russian, except the machine-parsed markup that must stay English (`### Task N:` headings, checkboxes, `Step`/`Files`/`Global Constraints` labels) — see `rules/skills/writing-plans.md`.
- Before test-worthy implementation: read `rules/base/testing.md` and `rules/base/test-execution-policy.md`, then invoke `superpowers:test-driven-development`. Follow the testing layer table; do not expand it from a generic TDD checklist.
- Before committing or branching: read `rules/base/git-and-commits.md`. Never commit automatically.
- Before reading a known file or choosing between Bash and a dedicated tool: apply `rules/base/mcp-tool-priority.md`.
- Before claiming work complete, fixed, or passing: run the relevant checks and read/apply `rules/skills/verification-before-completion.md`.

This contract only points to the detailed files: read the one that matches the action before you act. If a routed file, skill, mod, plugin, or CLI is unavailable, name it and offer installation or repair using `rules/base/workflow-dependencies.md`. Never skip it silently, reconstruct its content from memory, or report its dependent stage as completed.

## Always-on conventions

Apply the imported naming, class-structure, file-structure, and workflow rules to TypeScript work. Apply the router for Angular/NestJS rules, roadmap work, codebase exploration, plan execution, subagents, and Plannotator.

When a task matches a situation in the routing table, apply its rule or skill, and follow the checklist of any skill you invoke. Every document that needs approval (design spec, test plan, implementation plan, roadmap, issue draft) is approved through Plannotator **without native Plan Mode** — read `rules/skills/document-approval.md`: draft in `tmp/drafts/<slug>.md`, open with `plannotator-annotate`, save to the target path only after `approved`. Do not call `EnterPlanMode`/`ExitPlanMode` for this, even if a global instruction says so. After approval, ask before starting implementation. Moving to the next planning document (design → test plan → implementation plan) is not implementation: start it automatically in a fresh draft file, without asking for confirmation.

## Autonomy

Make reversible local edits within the task on your own. Wait for confirmation before anything irreversible or visible outside the repo: deleting files beyond the task, push, PR merge, DB or infra changes, calls to external services. If a requirement is ambiguous, ask one focused question instead of guessing. On long tasks, keep a progress checklist in a file so it survives context compaction.

# Orchestrator

This file is always in context through `rules/RULES.md`. It routes work to detailed rules that are loaded only when their situation occurs. `@import` expands only inside the `RULES.md` chain; a file reached later with `Read` does not expand its own `@` references.

## Routing

| Situation | Required action |
|---|---|
| Idea, new behavior, or architecture | Read `rules/skills/brainstorming.md`, then invoke `superpowers:brainstorming`; approval per `rules/skills/document-approval.md` |
| Test plan before the implementation plan (test-worthy layers) | Read `rules/skills/writing-test-plans.md` and run its review loop (`doc-review --type=test-plan`, 3 iterations); approval per `rules/skills/document-approval.md` |
| Multi-step plan before implementation | Read `rules/skills/writing-plans.md`, then invoke `superpowers:writing-plans`; validate the draft with `doc-review --type=plan` (3 iterations) before approval per `rules/skills/document-approval.md` |
| Test scope, assertions, or coverage | Read `rules/base/testing.md` |
| Test-worthy implementation or bug fix | Read `rules/base/testing.md` and `rules/base/test-execution-policy.md`, then invoke `superpowers:test-driven-development` |
| Commit or branch | Read `rules/base/git-and-commits.md` |
| Known file path, Bash vs MCP, or dedicated-tool choice | Read `rules/base/mcp-tool-priority.md` |
| Claim work complete, fixed, or passing | Read `rules/skills/verification-before-completion.md` and run its required checks |
| Test the current changes by hand ("протестируй изменения", "test my changes") | Invoke `testing-changes` |
| Create a PR ("сделай ПР", "open a PR") | Follow instructions injected by `pr-flow`; if unavailable, read `rules/base/workflow-dependencies.md` and offer installation |
| Required skill, mod, plugin, or CLI is unavailable | Read `rules/base/workflow-dependencies.md`; name the dependency and offer installation with the exact command |
| Execute a written plan via subagents | Read `rules/skills/subagent-driven-development.md` |
| Execute a written plan with checkpoints | Read `rules/skills/executing-plans.md` |
| Long-running Plannotator process | Read `rules/skills/plannotator.md` |
| NestJS code | Read `rules/nestjs/index.md`, then the relevant topic file(s) |
| Angular code | Read `rules/angular/index.md`, then the relevant topic file(s) |
| Write a Jira task ("напиши задачу", "сделай задачу") | Invoke `jira-writer` |
| Roadmap work | Invoke `roadmap` |
| Shared vs personal file | Read `rules/base/local-vs-shared.md` |
| Artifact or temp-file location | Read `rules/base/artifacts-and-tmp.md` |

Never silently skip a missing routed skill or file. Follow `rules/base/workflow-dependencies.md`; do not reconstruct missing content from memory or claim the dependent stage was completed.

## Chaining

- Design → test plan (validated by `doc-review`, skipped when no layer is test-worthy) → implementation plan (validated by `doc-review`) → implementation via TDD when in scope → verification → commit. Each document has its own Plannotator approval cycle (`rules/skills/document-approval.md`), no native Plan Mode.
- Effort follows the stage: clarify requirements first, implement at medium effort, then switch to high (`/effort high`) to verify before the final pass; keep max for hard autonomous problems.
- For a NestJS/Angular plan, `writing-plans.md` handles stack detection and required stack reads; do not repeat them before drafting.
- For inline stack implementation outside a plan, read the relevant index and topic directly.
- TDD scope is bounded by `testing.md`'s layer table.
- Before delegation, read the project's durable context, role definition, and applicable rules; pass each subagent its goal, scope, interfaces, constraints, workflow, verification policy, and readiness criteria. Forbid commits in implementer prompts.

## Project config

When a routed rule needs a project value, read `.claude/dev-conventions.json` once. If the value is needed but absent, ask and save it; never invent it.

Keys: `ticketPrefix` (commit and branch prefix, `rules/base/git-and-commits.md`); `testing` (`kit:testing-changes` skill settings); `codex` (shared by `codex-implement` and `doc-review`: `profiles.<name>` — `codex` by default and `local` (your own OpenAI-compatible model server, shipped with `YOUR-…` placeholders to fill in), both added by `setup.sh` / `update-ai-dev-kit` — with `model`, `effort`, `timeoutMin` and a backend: inline `provider {baseUrl, envKey}`, `modelProvider` or `codexProfile`; `implement` / `review` choose the default profile per skill. The API key lives only in the env var named by `envKey`, never in this file). The skills have defaults and handle missing keys themselves, so do not ask for them.

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

| Content | File |
|---|---|
| Any type/interface, even a single one | `*.types.ts` |
| Constants used by 2+ files of the module | `*.constants.ts` (one per folder, not one per class). A constant with a single consumer stays a local `const` in that file |
| Custom error classes (2+ in the module) | `*.errors.ts`, the message lives inside the class. One error class stays in its consumer's file. No file that holds only message strings |
| Pure builders/formatters without side effects or DI | `*.helpers.ts` |
| Pure row/payload → domain mappers with no branching beyond `?? default` | `*.mapper.ts` |
| Type guards | Beside the narrowed type in `*.types.ts` |
| Class/handler | Only the class and imports |

Exception — Storybook stories: a story module and its support files (`*.stories.ts`, story-opening helpers such as `stories.ts` in an e2e `support/` folder) are not split by this table. Types, pure formatters, and the side-effecting function may stay together in one file; do not split them into `*.types.ts`/`*.helpers.ts`.

Exception — test data: values used only by tests (seeds, fixtures, test-config timeouts) stay in the test file or its test-support file and are not moved to `*.constants.ts`. Naming is optional for one-off values; see `rules/base/testing.md` → "Assertions".

Exception — API URLs: an HTTP route string (`'/api/...'`) lives only in the API service (`*.api.service.ts`) that calls it, as a literal or a local `const` of that file. Do not put it in `*.constants.ts`: the URL has one consumer, and the service is where a reader looks for it.

Keep mappers separate from helpers. Every folder that contains more than one file exposes its public API through an `index.ts`; code outside the folder imports from the folder (`../health`), never from its individual files. Files inside the same folder import one another directly. A single-file folder needs no barrel. A barrel exports only the public API; never re-export internal types. A grouping folder containing class dot-subfolders may have an aggregating `index.ts`, but siblings import one another directly to avoid cycles.

Tested units use a dot-notation subfolder and local barrel (`some-service/some-service.ts`, `.spec.ts`, `index.ts`). Untested constants/types stay flat. Exclude pure `*.mapper.ts` files from test discovery/coverage.

# Minimal Change
Applies to implementation, bug fixes, refactors, and dependency choices; design stays with brainstorming. Before writing, read the code the change touches and list every place it must reach (callers, tests, fixtures, config, exports) and what it could break for users. That is scope; extra features are not.

Take the first option that fully works:

1. Does it need to exist? Skip options, flexibility, and features nobody asked for; name them in one line.
2. Already in this codebase (helper, component, service, pattern)? Use it the way the surrounding code does.
3. Standard library or platform feature? Use it, unless the project has its own component.
4. An installed dependency? Use it. Never add a dependency for a few lines.
5. Can it be one line a reader gets at a glance? One line.
6. Otherwise, the minimum code that works.

- No abstraction, wrapper, option, config, or "for later" code nobody asked for; keep the codebase's structure.
- Bug fix: grep every caller of the function you touch, then fix the root cause once in the shared code.
- Moved or merged code keeps its error handling and validation. Of equal-size options, take the one correct on edge cases.
- A shortcut with a known limit gets a one-line comment: `// TODO: <the limit>, <when to upgrade>`.
- Tests follow `rules/base/testing.md`; this file neither adds nor removes them.

Never cut: validation at trust boundaries, error handling that prevents data loss, security, accessibility, anything the user asked for.
<!-- Adapted from https://github.com/DietrichGebert/ponytail (MIT, DietrichGebert) -->

# Workflow & Misc Code Style

## Avoid `let` with Later Reassignment

Do not declare a `let` and assign it later, including across `try/catch`. Extract the operation into a function and assign its result to a `const`. A `let` is acceptable for a genuinely loop-scoped or incremented value.

## Constants: Name Only What Needs a Name

Production code only: test code may use magic numbers and short literals freely.

- **No name needed:** self-evident literals (`slice(0, 3)`, `?? 0`, `i + 1`, `'utf-8'`, `100`) and a short string used once whose meaning is clear in place (a short error text in a one-off `throw`, a CSS class, an object key).
- **Name needed:** a numeric literal whose meaning is not obvious (durations, TTLs, intervals, retry counts, limits). Arithmetic from obvious units (`60 * 60 * 1000`) is fine, but give it a name too: `const TTL_MS = 60 * 60 * 1000`.
- **Raw SQL is always a named constant.** Used by one repository — a local `const` at the top of that repository file. Used by several files, or so many queries that the repository stops being readable — `*.constants.ts`.
- **The name is local until there is a second consumer.** A constant lives as a `const` at the top of the file that uses it. Move it to `*.constants.ts` only when a second file needs it (`rules/base/file-structure.md`). Do not create a constants file for a single use.
- **Error texts:** with custom error classes, the message lives inside the class or its factory (`*.errors.ts`, see `rules/base/file-structure.md`). Do not create a file that holds only message strings.

## No JSDoc Comments

Do not add JSDoc blocks (`/** ... */`). Use plain one-line comments only where the reason behind the code is not obvious.

## Documentation Language

- Rules and skill instructions are written in English.
- Every markdown artifact produced by `superpowers:brainstorming`, `superpowers:writing-plans`, or `roadmap` (design specs, implementation plans, roadmaps, and any step-level doc nested under them) is written entirely in Russian — headings, body text, and task descriptions alike, whatever language the user typed their request in. Code blocks, identifiers, file paths, and technical terms inside these docs stay in their original form. The only carve-out is machine-parsed plan markup (`### Task N:` headings, `- [ ]` checkboxes, `Step N` / `Files:` / `Interfaces:` / `Global Constraints` labels), which stays English — see `rules/skills/writing-plans.md` → "Exceptions: keep in English".
- Other reader-facing docs (`README`, `docs/`, other specs/design docs) are also written in Russian.
- Trigger phrases remain in their original input language, with an English duplicate when needed for matching (for example, «давай подумаем» / “let's think about this”).

# Правила для Codex

Эти адаптации дополняют общие правила кита при генерации `AGENTS.md` и применяются только в Codex.

## Планирование и ревью в Codex

В Codex требования `EnterPlanMode` и `ExitPlanMode` означают этап подготовки документа и его согласования в Plannotator. Эта адаптация имеет приоритет над требованиями общих правил кита использовать native Plan Mode.

- Самостоятельно подготовь черновик спецификации или плана в Markdown-файле и открой его на согласование через навык `plannotator-annotate`: используй инструмент Plannotator, если он доступен, иначе `plannotator annotate <path> --gate --json`.
- Сохраняй один и тот же абсолютный путь файла на протяжении всех итераций одного документа. После замечаний исправляй этот файл и открывай его повторно: история версий Plannotator позволяет смотреть дифф. Для следующего документа используй отдельный файл.
- Для CLI включай историю версий в окружении процесса: `env PLANNOTATOR_ANNOTATE_HISTORY=1 plannotator annotate <path> --gate --json`. Не меняй ради этого глобальные настройки пользователя. Первая версия создаёт основу для сравнения; дифф появляется после изменения файла и повторного открытия того же пути.
- Если песочница мешает запустить локальный сервер или записать историю Plannotator, запроси необходимые разрешения и повтори запуск. Не считай запуск без истории успешной проверкой диффа и не предлагай вместо этого переключить native Plan Mode.
- Дождись итогового решения Plannotator: `annotated` — обработай замечания и повторно открой исправленный файл; `approved` — документ согласован; `dismissed` — согласования нет. Примечания при `approved` учитывай как рекомендации, а не как запрос нового ревью. Пока CLI работает, продолжай ожидание результата: пустой вывод или таймаут опроса не означают завершение. До реализации получи явное согласование соответствующих документов.
- До согласования держи черновик во временном файле со стабильным путём. После согласования сохраняй документ в предусмотренное правилами проекта место.
- Не требуй от пользователя `/plan` ради открытия документа в Plannotator. Native Plan Mode можно использовать при наличии поддержки интерфейса; не утверждай, что он включён, без подтверждения среды.

<!-- ai-dev-kit:rules:end -->
