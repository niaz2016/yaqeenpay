# Backend Migration Plan — seller → user

Goal
- Safely migrate backend code, DTOs, API contracts, and database schema (if needed) from "seller" terminology to the unified "user" concept used in the frontend. Avoid breaking running clients; perform migration in stages with compatibility layers and feature flags where appropriate.

Assumptions
- Frontend has been migrated to use `user` compatibility barrels and adapters while backend still uses `Seller` naming in DTOs and DB columns.
- We will not change API request/response JSON property names until both frontend and backend agree on a cutover plan.
- All changes will go through code review and staged releases (dev → staging → production).

High-level strategy
1. Non-breaking adapters in backend: add `User*` DTOs and mapping layers that map to the existing `Seller*` DTOs/entities without changing JSON payloads.
2. API compatibility: keep public API JSON stable. If renaming request/response property names is required, support both old and new names in deserialization (e.g., using JSON aliases) and introduce new names in responses behind a feature flag.
3. Database changes (optional): avoid renaming DB columns without a migration window. If column rename is required, add shadow columns and keep both columns populated during the transition; switch reads to new columns and later drop old columns after verification.
4. Deprecation & removal: after a monitoring window and consumer updates, remove backward-compatibility code and consolidated names across the codebase.

Detailed steps
Phase 0 — Preparation
- Inventory: enumerate all backend types, controllers, and database columns referencing `Seller*` (models, DTOs, enums, API docs). Create a single spreadsheet or PR description listing files and endpoints.
- Tests: ensure automated tests (unit/integration) exist for affected endpoints and add tests covering both old and new naming if applicable.
- Communication: notify API consumers and internal teams about the planned change and timeline.

Phase 1 — Add backend compatibility adapters (non-breaking)
- Create new DTOs and request/response models with `User*` names alongside existing `Seller*` models. Example:
  - Keep `SellerRegistrationRequest` and add `UserRegistrationRequest` which maps to the same properties.
- Add mapping functions or use mapping libraries (AutoMapper for .NET) to convert between `User*` and `Seller*` domain/entities.
- Update internal service method overloads that accept both `Seller*` and `User*` DTOs and delegate to the same logic.
- Keep controller routes and JSON shape unchanged. The new DTOs are for developer ergonomics only.

Phase 2 — API aliasing / graceful JSON rename (only if necessary)
- If changing JSON property names (e.g., renaming `sellerId` → `userId`), do the following:
  - Update model binding to accept both property names using serialization attributes, e.g., in .NET use [JsonPropertyName] plus a custom converter or accept both fields in the DTO and map accordingly.
  - Start returning responses with both names (preferred) or behind a response-version/feature-flag header. Example response contains both `sellerId` and `userId` (temporarily) so both clients can parse.
  - Monitor consumer logs and errors.

Phase 3 — Deployment & verification
- Deploy changes to a staging environment. Exercise both old and new code paths via automated tests and manual smoke tests (including the frontend integration).
- Deploy to production during a maintenance window if necessary and monitor logs, error rates, and API usage for any breaking clients.

Phase 4 — Switch internal reads/writes gradually
- If DB changes required (column rename):
  - Add new column(s) `user_id` (nullable) and update write paths to populate both `seller_id` and `user_id`.
  - Run backfill job to populate `user_id` from existing `seller_id` for historical data.
  - Switch reads in application code to prefer `user_id` while still falling back to `seller_id`.
  - After monitoring window and consumer updates, remove old reads and drop old `seller_id` column in a separate migration.

Phase 5 — Remove aliases and finalize names
- Once all consumers (frontend and third parties) are confirmed to use new names, remove the `Seller*` DTOs/aliases and internal mapping code.
- Remove dual fields in JSON responses and database columns.
- Update API docs and changelog.

Rollback strategy
- If errors observed after deployment, roll back the application changes. Because the plan emphasizes backward compatibility and not changing JSON shape initially, rollback should be straightforward.
- For DB schema changes: perform reversible migrations (add columns first, backfill, then swap reads, and only finally drop old columns). Keep rollbacks ready for each migration step.

Testing checklist
- Unit tests for mappers/converters covering both `Seller*` and `User*` DTOs.
- Integration tests hitting the real controllers ensuring both JSON shapes (if dual JSON support is added) are accepted.
- End-to-end smoke tests with the migrated frontend running against staging.

Observability & monitoring
- Increase logging during rollout for affected endpoints (including payloads where safe) to detect mismatches.
- Use metrics (error rate, 4xx/5xx, latency) and alert if they spike.

Notes & recommendations
- Prefer code-level aliasing and mapping rather than changing DB or JSON immediately.
- If you have API versioning in place, consider introducing a v2 where new naming is used and keep v1 intact until consumers move.
- Document the field mapping thoroughly for API consumers.

Deliverables
- This `Backend-Migration-Plan.md` (this file)
- A follow-up PR template that includes: inventory, step-by-step migration plan for the PR, rollback steps, and test plan.

---

If you'd like, I can now:
- Generate the PR template file and open the next batch of code edits to implement some of the adapter DTOs in the backend project (`Backend/`), or
- Start preparing specific mapping code for the most critical endpoints (e.g., WithdrawalsController, SellerRegistrationController) in a follow-up commit.

Which do you prefer?