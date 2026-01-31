
Goal: Make Arise HRM production-ready by (1) eliminating build/type/test failures with strict TypeScript, (2) migrating UI layout code to the MUI v7 Grid “new API”, and (3) expanding the Lovable Cloud database to a comprehensive HRM schema (50+ tables) while keeping roles in a separate `user_roles` table and preserving security (RLS) patterns.

---

## 1) Baseline + error inventory (so we don’t miss anything)
1. Capture the current failing outputs:
   - Run TypeScript typecheck errors list (`tsc --noEmit`) and record file/line items.
   - Run `npm run build` and record build-time errors/warnings.
   - Run `npm test` and record test failures.
2. Create a “fix order” list:
   - Build blockers first (TypeScript compilation errors, missing exports/imports).
   - Then MUI Grid API type mismatches (often widespread).
   - Then test failures/mocks.
   - Then warnings/cleanup (tree-shaking, console noise where applicable).

Deliverable: A checklist of all errors grouped by category, and a tracking list to ensure we get to 0 errors.

---

## 2) Fix current known TypeScript/build blockers

### 2.1 VirtualizedTable (react-window generics)
Status: You already addressed the earlier `react-window` generics mismatch by typing `ListChildComponentProps<VirtualizedRowData<T>>` and providing explicit width via ResizeObserver.
Next steps:
- Re-run typecheck to confirm no remaining `VirtualizedTable` overload errors.
- If there are still issues:
  - Ensure `TableRowComponent` type doesn’t force `unknown` casts unnecessarily.
  - Ensure `itemData` is typed exactly as `VirtualizedRowData<T>`.

Deliverable: `VirtualizedTable.tsx` compiles with no casts-to-unknown needed for `columns`, `getRowId`, and row click handlers.

### 2.2 EmployeeCards exports/imports
Current structure suggests both:
- `src/components/employees/EmployeeCards.tsx` (default export)
- `src/components/employees/index.ts` exporting `default as EmployeeCards`
We will:
- Verify all imports across the app use the same pattern (either `import EmployeeCards from ...` or `import { EmployeeCards } from ...` but not mixed incorrectly).
- Standardize to one approach:
  - Keep default export in `EmployeeCards.tsx`
  - Re-export named in `employees/index.ts` as currently done
  - Update any incorrect imports.

Deliverable: No “export mismatch” errors anywhere.

### 2.3 StatusChip sizing props
Your `StatusChip` already uses a custom `SizeType` (`xs|sm|md|lg|xl`) and passes it through `chipSize` to a styled wrapper, which is good.
We will:
- Ensure `StatusChipProps` does not accidentally inherit MUI `ChipProps.size` and create conflicts.
- If conflicts exist, we will explicitly omit MUI’s `size` prop from forwarded props:
  - Example approach: `type StatusChipProps = Omit<ChipProps, 'size' | 'variant' | 'color'> & { size?: SizeType; variant?: ... }`
- Verify all usages like `size="sm"` remain valid.

Deliverable: `StatusChip` has zero prop-type conflicts and all usages compile.

### 2.4 Remove/replace legacy “Database” typings (multiple DB type sources)
Right now there are at least two competing “Database types”:
- `src/integrations/supabase/types.ts` (auto-generated, should be canonical for Lovable Cloud tables)
- `src/types/database.ts` (legacy, refers to `user_profiles`, role_id, etc)
This duplication creates ongoing type drift and build failures.

Plan:
- Make `src/integrations/supabase/types.ts` the only source of backend table typing.
- Replace usages of `src/types/database.ts` across the codebase with:
  - `import type { Database } from "@/integrations/supabase/types"`
- Remove any “SupabaseDatabase” alias usage that points to legacy types (e.g. in `LeaveRequestForm.tsx`).

Deliverable: One canonical DB type source, no “missing exported type” or mismatched table definitions.

---

## 3) MUI v7 Grid migration using the new Grid API (no legacy item/xs props)

You selected: “Use new MUI Grid API”.

Important fact (based on the installed MUI v7 types): `@mui/material/Grid` now expects:
- `container?: boolean`
- `size?: ResponsiveStyleValue<GridSize>` instead of `xs / sm / md / lg`
- no `item` prop

### 3.1 Migration approach
We will:
1. Identify all components using Grid with old props:
   - `item`, `xs`, `sm`, `md`, etc.
2. Convert them to the new API:
   - Replace `<Grid item xs={12} md={6}>` with something like:
     - `<Grid size={{ xs: 12, md: 6 }}>`
3. Ensure nested containers still use `container` where needed:
   - Parent: `<Grid container spacing={2}>`
   - Child items: `<Grid size={...}>` (no `item`)

### 3.2 High-priority files to migrate first
- `src/components/settings/SettingsDashboard.tsx` (currently imports `Grid` from `@mui/material`)
- `src/components/interviews/InterviewManagement.tsx` (imports `Grid` from `@mui/material/Grid`)
- `src/components/ai/AIInsights.tsx` (imports `Grid` from `@mui/material/Grid`)
- Any dashboard pages with heavy layout usage

Deliverable: All Grid usage compiles with MUI v7 types, no deprecated/legacy Grid props left.

---

## 4) Fix and re-enable tests (you chose “Fix tests too”)

We will make tests pass without excluding them from production typecheck unless absolutely necessary.

### 4.1 Align testing utilities and imports
From the earlier error log, common issues were:
- `fireEvent` not imported
- `useLeaveManagement` not imported / not mockable
- wrong component path imports (`../LeaveList` not found)
- `LeaveRequestForm` prop mismatch (`onSuccess` not in props)

Actions:
- Standardize tests to import from `@testing-library/react`:
  - `import { fireEvent } from '@testing-library/react'`
- Ensure hooks are mockable in Vitest:
  - Use `vi.mock(...)` and import the hook symbol in the test if using `vi.mocked(hookFn)`
- Ensure component paths match real files.

### 4.2 Fix LeaveRequestForm test vs component props
Current `LeaveRequestFormProps` includes `open`, `onClose`, `onSubmit`, `employeeId`, `editingRequest?`.
But tests expect `{ onSuccess, onCancel }`.

We will choose one consistent API and update both implementation and call-sites:
- Recommended: add optional callbacks to component without breaking existing usage:
  - `onSuccess?: () => void`
  - `onCancel?: () => void` (alias to `onClose`)
- Keep `onClose` required (so dialogs always close properly).
- Update tests to reflect real behavior: successful submit triggers `onSuccess` and closes dialog.

Deliverable: Tests compile and validate expected behavior.

### 4.3 Vitest config adjustments
Current `vitest.config.ts` is mostly fine.
We will:
- Confirm `setupFiles` path exists and includes `@testing-library/jest-dom`.
- Add missing DOM polyfills frequently needed by MUI:
  - `ResizeObserver`
  - `matchMedia`
- Ensure MUI X Date Pickers tests have `LocalizationProvider` wrappers in test-utils.
- Ensure chart libraries are mocked where needed.

Deliverable: `npm test` passes cleanly.

---

## 5) Full enterprise HRM backend schema (50+ tables) on Lovable Cloud

You selected: “Fix build + full schema”.

### 5.1 Security & architecture guardrails (non-negotiable)
- Roles remain in separate `user_roles` table (already present).
- We will not store plaintext passwords or password hashes in “profiles” tables.
  - Authentication must rely on the built-in authentication system.
- We will avoid implementing our own refresh tokens / session tables unless you explicitly need them for app-level auditing (and even then we’ll store only metadata, not secrets).
- RLS enabled on all tables.
- Avoid recursive RLS by using SECURITY DEFINER helper functions (you already have `has_role`, `is_admin_or_hr`, etc).

### 5.2 Migration strategy (to avoid timeouts and keep it maintainable)
We will split schema into several migrations:
1. **Core enums + shared utilities**
   - Enums: `approval_status`, `attendance_status`, `employment_status`, `employment_type`, etc.
   - Shared functions:
     - `update_updated_at_column()`
     - `has_role()`, `is_admin_or_hr()`
     - new helpers for manager/department access:
       - `is_manager_of_employee(employee_id)`
       - `is_same_department(employee_id)`
2. **Core HR tables**
   - `profiles` (or `user_profiles` if we rename carefully)
   - `employees`, `departments`, `positions`, `teams`, `employee_teams`, `office_locations`
3. **Attendance & leave**
   - `attendance_records`, `shifts`, `clock_locations`, `wfh_requests`, `wfh_policies`
   - `leave_types`, `leave_requests` (already exists, we’ll evolve it), `employee_leave_balances`, `leave_audit_log`
4. **Payroll & expenses**
   - `payroll_records`, `salary_components`, `benefit_plans`, `employee_benefits`
   - `expenses`, `expense_categories`
5. **Performance**
   - `performance_reviews`, `performance_goals`, `performance_metrics`, `competency_ratings`
6. **Recruitment & onboarding**
   - `job_postings`, `job_applications`, `candidates`, `interviews`, `job_offers` (rename from “job_positions” to avoid confusion with org positions), onboarding tables
7. **Projects, training**
   - `projects` (already exists, we’ll evolve), `project_members`
   - `training_courses`, `training_enrollments`
8. **Communication & compliance**
   - `announcements`, `announcement_reads`
   - `notifications` (already exists, we’ll evolve)
   - messaging tables: `conversations`, `conversation_participants`, `messages`
   - `documents`, `compliance_items`, `employee_compliance`
   - `audit_logs`
9. **System settings**
   - `system_settings`, `user_preferences`, etc (only if needed for UI)

Deliverable: A complete schema that matches your requested modules, created incrementally and safely.

### 5.3 RLS policy pattern to apply
For each module table:
- Employee can read “own” records (based on `employees.user_id = auth.uid()` mapping).
- HR/Admin can read/write all.
- Managers can read their direct reports (and optionally their department).
We will implement these using security definer functions to avoid recursion and to keep policies simple and consistent.

### 5.4 Evolving existing tables vs dropping
We already have: `attendance`, `leave_requests`, `notifications`, etc.
For the “full schema” we’ll prefer:
- Rename or create new tables with clear names (e.g. `attendance_records`) and gradually migrate the frontend to them.
- Or alter existing tables to match the new naming/columns.
We will decide per table based on:
- Which tables are already used by the UI.
- Whether changing them would break existing functionality.

Deliverable: No destructive changes without an explicit migration path.

---

## 6) Wiring frontend to the expanded schema (minimal but functional)
Because you want the schema “connected and working”, we’ll ensure at least these flows work end-to-end against the real backend tables:
1. Authentication → profile loading
2. Employee directory reads employees
3. Leave request creation and listing
4. Attendance clock-in/out records
5. Notifications list and mark-as-read

This phase includes:
- Updating the data-access layer to use the Lovable Cloud client (`supabase`) and the canonical generated DB types.
- Reducing reliance on the legacy `src/lib/api.ts` local backend client (or clearly separating it if it remains for some routes).

Deliverable: Core HRM flows work with real database tables.

---

## 7) Definition of “done” (what I will verify)
- `tsc --noEmit` → 0 errors
- `npm run build` → succeeds (and we will aim to eliminate warnings where feasible)
- `npm test` → all tests passing
- Preview smoke test:
  - Login page loads
  - Dashboard renders without console errors
  - Employee list loads
  - Create leave request works
  - Attendance view works

---

## Files we will likely touch (frontend)
- Layout/Grid migrations:
  - `src/components/settings/SettingsDashboard.tsx`
  - `src/components/interviews/InterviewManagement.tsx`
  - `src/components/ai/AIInsights.tsx`
  - plus any other files found using old Grid props
- Type cleanup:
  - Any files importing `src/types/database.ts`
  - `src/components/leave/LeaveRequestForm.tsx` (DB type import + props)
- Tests:
  - `src/components/leave/__tests__/*.test.tsx`
  - `src/__tests__/setup.ts` and `src/__tests__/test-utils.tsx` (polyfills/providers)

## Files we will likely touch (backend schema)
- New migration files in `supabase/migrations/*` (split into multiple steps)

---

## Risks / tradeoffs
- “0 warnings” can be affected by third-party libs (MUI, Vite, chart libs). We’ll remove what we control and reduce the rest, but we may need to agree on what counts as an acceptable warning if it’s external and non-actionable.
- Building a 50+ table schema is large; splitting migrations is essential to reduce failure risk and keep it maintainable.
- Some requested “auth tables” (refresh tokens, password_hash) should not be implemented as described because they create security and compliance risks; we’ll implement safer equivalents where needed (audit logs, preferences, etc).

