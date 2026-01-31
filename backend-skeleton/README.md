# Optional Node Backend Skeleton

This folder is **not used by the app by default**. The production/default backend is **Lovable Cloud**.

Use this skeleton only if you later decide to deploy a separate Node/Express API.

## Structure

- `src/server.ts` – entrypoint
- `src/app.ts` – express app wiring
- `src/routes/` – route modules
- `src/controllers/` – request handlers
- `src/services/` – business logic
- `src/db/` – DB clients/adapters
- `src/middleware/` – auth/logging/error middleware
- `src/config/` – environment + config

## Notes

- Keep roles/authorization server-side.
- Do **not** rely on browser storage for admin checks.
