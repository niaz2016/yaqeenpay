Deprecation notes: seller → user

Summary
- The codebase is migrating from `seller` terminology to `user`.
- Compatibility layers (types/user, services/userService, services/userServiceSelector, components/user wrappers) have been added.

Current status
- `components/seller/index.ts` now re-exports from `components/user` wrappers to keep old import paths working.
- `components/user/*` is the canonical location for consumer imports going forward.
- Backend compatibility DTOs: `ApplyForUserRoleCommand` + handler added; existing seller endpoints continue to work.

Next steps and timeline for removal
1. Keep the compatibility re-exports (seller barrel) for one release cycle (2 weeks suggested) while all consumers migrate.
2. After consumer migration and QA, remove `components/seller/index.ts` and move implementations under `components/user/` only.
3. Remove `types/seller` (or keep as internal) after confirming the frontend imports only use `types/user`.
4. Remove `services/seller*` public exports after ensuring `services/user*` are used everywhere.

Rollback
- Reintroduce re-export files or revert the above commits if consumers still break.

Contact
- For questions, tag @team-frontend and @team-backend in the PR and include the migration plan.
