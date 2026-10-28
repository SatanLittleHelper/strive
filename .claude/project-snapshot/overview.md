# Project Snapshot

- Generated: `2026-10-28 18:22:28 MSK`
- Repo root: `/Users/aleksandr/orca/strive`
- Purpose: fast orientation before codebase search — read this before grep/find

## `apps`

### `api`

- Source root: `src/app`
- Sections/domains:
  - `app.controller.ts`
  - `app.module.spec.ts`
  - `app.module.ts`
- Entry points:
  - `apps/api/src/main.ts`

### `web`

- Source root: `src/app`
- Sections/domains:
  - `app.config.ts`
  - `app.html`
  - `app.routes.ts`
  - `app.ts`
  - `health`
  - `home`
- Entry points:
  - `apps/web/src/main.ts`

### `web-e2e`

- Source root: `src`
- Sections/domains:
  - `app.spec.ts`

## Quick Search Commands

```bash
rg -n "<Symbol|Keyword>" apps
rg --files apps | rg "<domain-keyword>"
sed -n "1,200p" .claude/project-snapshot/overview.md
```
