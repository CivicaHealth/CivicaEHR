# Future role model (parking note — not a spec)

This is a discussion starter for a future, more granular permission model. It is
**not** implemented in v1 and should not block current work — it's here so the
idea isn't lost.

## Proposed roles

- **`civica_admin`**: cross-clinic platform control. Sees all clinics, all
  users, all data. Can manage users' roles and per-tool access across the
  whole platform. Roughly the existing `platform_admin`, possibly
  renamed/extended.
- **`clinic_admin`**: full rights within a single clinic — all data, all
  tools. Exists today.
- **`supervisor`**: granted access to specific tools, set per-user by a
  `civica_admin` (or `clinic_admin`). E.g. a doctor could be a `supervisor`
  for the Roster tool but not for Billing. Within a tool they're granted,
  they'd have elevated (edit) rights similar to today's editor roles.
- **`staff`**: view-only (or limited-action) access to specific tools, also
  granted per-tool. Analogous to how `front_desk` is treated as view-only for
  Roster in v1.

## Idea: data-driven per-tool permissions

Replace the current pattern of one `requiredRoles: string[]` per tool (plus
ad-hoc helpers like `canEditRoster`) with a table such as
`tool_role_permissions` (`toolSlug`, `roleName`, `canView`, `canEdit`,
`canDelete`, ...), managed by `civica_admin` via a dedicated admin tool. This
would let access be configured per clinic/tool/role without code changes and
without one-off `canEdit<Tool>` helpers scattered across `packages/permissions`.

## v1 status

Roster ships with the existing 4-role gate (`front_desk`, `clinic_admin`,
`doctor`, `nurse`) plus a single `canEditRoster` helper:
`front_desk` = view-only, the other three = edit, `platform_admin` = always
full access. `canEditRoster` should be revisited/replaced if the model above
is ever built.
