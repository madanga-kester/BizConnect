# Mabiz Desktop Website

The `desktop/` directory contains the dedicated desktop-first Mabiz website. It is a separate React/Vite client in the same repository and does not replace the Expo mobile application under `app/`.

## Local development

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm desktop:dev
```

Open `http://localhost:5173`. The production build is:

```bash
pnpm desktop:build
pnpm desktop:preview
```

## Configuration and modes

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=https://api.example.com
```

Demo mode is the default and is explicitly labeled in the UI. It uses deterministic local examples and local state transitions. API mode is enabled only when `VITE_API_MODE=api` and a base URL are present. It uses the existing `/api/v1` .NET endpoints, credentials-included requests, in-memory access tokens, the `/auth/csrf` token, `X-CSRF-TOKEN` headers, and server-owned HttpOnly refresh cookies. API mode never turns a failed request into a fake success.

## Routes

The desktop client serves `/`, `/discover`, `/businesses`, `/products-services`, `/opportunities`, `/messages`, `/notifications`, `/analytics`, `/settings`, `/auth/login`, and `/auth/register`. Navigation uses the browser History API and the route list is published at `public/manus-routes.json`.

## Verification

Run `pnpm check`, `pnpm desktop:build`, and the existing `pnpm test` suite when the repository environment is available. The page/control matrix is in `../docs/FUNCTIONALITY_CHECKLIST.md`; implementation caveats are in `../DESKTOP_WEBSITE_IMPLEMENTATION_REPORT.md`.
