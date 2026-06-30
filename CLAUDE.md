# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

生产工艺流程追溯系统 — a lightweight production process traceability MES. Monorepo managed by pnpm workspaces. Node.js >= 22.18.0, ESM throughout (`"type": "module"`).

## Commands

All commands run from repo root unless noted.

### Development

```bash
pnpm dev:backend      # Start backend (NestJS, port 3000) + shared packages in watch mode
pnpm dev:admin        # Start admin-web (Vue 3, Vite dev server) + shared packages
pnpm dev:workstation  # Start workstation-web + shared packages
```

- Backend runs via `tsx watch src/main.ts` under `apps/backend/`
- Both frontends run via Vite dev server with HMR
- Frontend dev server proxies `/api` → `http://localhost:3000` (strips `/api` prefix)

### Build & Type Check

```bash
pnpm build            # Build all workspaces (tsc for backend/packages, vue-tsc + vite for frontends)
pnpm -r build         # Same — recursive build
```

### Testing

```bash
pnpm test             # Run all workspace tests (vitest, happy-dom environment)
```

Tests use Vitest with the shared config at `vitest.config.js` (path aliases for all `@company/*` packages, `happy-dom` environment). Currently `--passWithNoTests` is set — very few tests exist yet.

### Linting & Formatting

```bash
pnpm lint:prettier    # Format all files with Prettier
pnpm lint:eslint      # ESLint (flat config)
pnpm lint:spellcheck  # cSpell check across packages and apps
```

Pre-commit hooks via Husky + lint-staged (configured in root `package.json`).

## Architecture

### Workspace Structure

```
apps/
  backend/             # NestJS backend (Express platform)
  admin-web/           # Vue 3 management console
  workstation-web/     # Vue 3 worker/inspector terminal (minimal)
packages/
  api-contract/        # Shared TypeScript types + route constant definitions
  constants/           # Permission code constants (PERMISSIONS object)
  auth-client/         # Auth flow library (login, refresh, logout, token validation)
  request/             # Axios HTTP client wrapper
  ui/                  # Shared Vue components
  utils/               # Pure utility functions
docs/                  # SQL migrations, design specs, requirements
```

### Backend (NestJS)

**Root module** (`apps/backend/src/app.module.ts`) imports: `DatabaseModule`, `AuthModule`, `SystemModule`, `ProductModule`, `WarehouseModule`, `ProductionModule`, `OperationLogModule`. A global `AuditInterceptor` logs all non-GET write operations.

**Module structure** — each domain module follows this pattern:
- `*.controller.ts` — route handlers, decorated with `@UseGuards(PermissionGuard)` + `@RequirePermission()`
- `*.repository.ts` — database access (raw SQL via `mysql2/promise`), injected directly into controllers
- `*.utils.ts` — mapper/transform functions (DB rows → API contract types)
- `*.types.ts` — TypeScript interfaces extending `RowDataPacket` for query results

**Important:** There is no service layer in most modules. Controllers call repositories directly. The only exceptions are `AuthService` (JWT login/refresh logic) and `OperationLogService`.

**Database** — Raw SQL via `mysql2/promise`. No ORM. The `DatabaseService` (`apps/backend/src/database/database.service.ts`) provides `query()`, `execute()`, and `transaction()` (callback pattern with manual begin/commit/rollback). Shared helpers in `apps/backend/src/shared/repository.helpers.ts`: `buildFilters()`, `query()`, `execute()`, `nullableId()`, `toTinyInt()`.

**Auth** — JWT (via `jose` library): access token 15min, refresh token 7d (httpOnly cookie). RBAC: `users → user_roles → roles → role_permissions → permissions`. Permission codes use `module:resource:action` format.

### Frontend (Vue 3)

- **Element Plus** component library, **Pinia** state management, **Vue Router**
- Pages organized by domain: `views/system/`, `views/product/`, `views/warehouse/`, `views/production/`, `views/quality/`
- API calls centralized in `src/api/<module>.ts` — must use route constants from `@company/api-contract`, never hardcoded URLs
- Many pages use `PlannedBlankPage` as a stub for future implementation

### Shared Contracts

**Critical rule:** All API paths must be defined in `packages/api-contract/src/routes.ts`. All permission codes must be defined in `packages/constants/src/permissions.ts`. Both frontend and backend code must reference these shared constants — **never hardcode API paths or permission strings**.

When adding a new endpoint, you must sync these files:
1. `packages/api-contract/src/routes.ts` — route constant
2. `packages/api-contract/src/<module>.ts` — shared types (DTOs, list items, enums)
3. `packages/constants/src/permissions.ts` — permission code
4. Backend controller — `@RequirePermission(PERMISSIONS.xxx.xxx)`
5. Frontend API module — use route constants
6. Frontend router — `meta.permission` using `PERMISSIONS.xxx.xxx.page`
7. `docs/接口路由+权限编码.md` — documentation index
8. Permission SQL seed/migration scripts

## Mandatory Development Rules

These rules come from `agents.md` and must be followed:

1. **UI: Modal, not Drawer** — All create/edit/assign/confirm forms use `el-dialog` (Modal). Never use Drawer as the primary interaction pattern. Follow `design.md` for colors, typography, spacing, table/form styles, and status tags.

2. **N:N relationships use junction tables** — Never store comma-separated IDs, arrays, or JSON ID lists in a single column. Use proper junction tables (e.g., `user_roles`, `role_permissions`, `route_step_materials`).

3. **Audit fields** — Core business tables must include: `created_by`, `created_at`, `updated_by`, `updated_at`, `is_deleted`, `deleted_by`, `deleted_at`. Pure junction tables can simplify to `created_by`, `created_at`, `remark`.

4. **Soft deletes** — Never physically delete business data. Use `is_deleted` flag.

5. **Status transitions must validate** — Don't allow arbitrary status jumps. Each business entity has a defined state machine.

6. **Scope boundaries** — Do NOT expand into: full MES scheduling, equipment data collection, barcode scanning, full ERP, financial modules, complete WMS, complex approval workflows, or large-screen dashboards. This is a lightweight traceability system focused on recording key production nodes.

7. **Before creating new tables or changing schemas** — Check if a conflict exists with the database design docs in `docs/`. If there's a conflict, surface it explicitly with the conflict location, current design, what you need, and at least two resolution options. Do not silently deviate from the design docs.

## Documentation Map

| File | Purpose |
|------|---------|
| `agents.md` | AI developer rules — project scope, tech stack, UI/database/API constraints |
| `design.md` | UI design spec — colors, typography, layout, modal sizes, table/form styles |
| `docs/接口路由+权限常量开发规范.md` | API route & permission constant development standard |
| `docs/接口路由+权限编码.md` | Human-readable API index (all endpoints + permission codes) |
| `docs/newSqlDesign.md` | Database schema design (all tables, fields, relationships) |
| `docs/统一库存方案数据库迁移指南.md` | Unified inventory migration guide |
| `docs/*.sql` | SQL migration scripts |
