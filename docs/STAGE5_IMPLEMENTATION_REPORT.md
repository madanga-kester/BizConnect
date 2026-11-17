# Stage 5 implementation report

Prepared 2026-11-12. Every number below was produced by running the command shown, in this workspace, against the tree inside `Mabiz_stage5_source.zip`. Nothing here is inferred from the handoff document.

## 1. What the uploaded archive actually contained

The supplied `Mabiz_stage4_source.zip` is a **Stage 4 baseline**. Each Stage 5 artifact that the handoff described as already implemented was checked for directly and was absent:

| Claim in the handoff | Search in the uploaded tree | Result |
| --- | --- | --- |
| Migration `20261112182203_Stage5Catalog` | `src/Mabiz.Infrastructure/Persistence/Migrations/` | Absent; latest was `20261112173415_Stage4SocialContent` |
| `docs/STAGE5_CATALOG_MEDIA.md` | `docs/` | Absent |
| Catalogue and media entities, services, controllers | whole `src/` tree, keyword search for catalogue/media/storage | Absent |
| Local and S3-compatible storage providers | `src/Mabiz.Infrastructure/` | Absent; no `Storage` folder, no object-storage package reference |
| `Storage` configuration section | `appsettings.json`, `.env.backend.example` | Absent |
| Stage 5 tests | `tests/` | Absent |

The referenced earlier workspace (`Mabiz_stage2`) no longer exists in this environment, so there was nothing to recover. Stage 5 was therefore **implemented from scratch**, using the handoff as the specification, and the report below describes what was actually built and verified.

Baseline evidence before any change: `dotnet build` succeeded with 0 errors and 4 pre-existing `xUnit2031` warnings in `Stage3BusinessApiTests.cs`; `dotnet test` passed **50 tests** (36 unit, 14 integration).

## 2. What was implemented

Backend, on the existing stack (C#, ASP.NET Core .NET 10, EF Core 10, PostgreSQL):

- `catalog_items`, `catalog_item_media` and `media_assets` tables with 13 CHECK constraints and 12 indexes, added by the additive migration `20261112182203_Stage5Catalog` (`Up()` contains only `CreateTable` and `CreateIndex`; no drop, rename or alter anywhere).
- Products and services with `draft` → `published` → `archived` lifecycle, business-scoped slugs and SKUs, kind-specific field rules, and per-business ordering.
- Ordered galleries of up to 12 images with per-entry alt text, replaced transactionally as a set.
- Real image upload: `multipart/form-data` intake, type determined from the file signature (the declared MIME type is ignored), SHA-256 digest, dimensions read where the header exposes them, size capped by configuration.
- Two interchangeable storage providers selected by configuration: `local` filesystem and S3-compatible object storage (AWS SDK for .NET), with server-built keys that a client cannot influence and a shared key-safety check before any provider touches storage.
- An access-controlled media proxy: bytes are only ever served by the API after checking publication state or business membership, so no raw bucket or filesystem URL exists to bypass a rule.
- Public anonymous discovery with search, category, county, town, price, availability and sort filters plus detail by slug or id, restricted to published items of active public businesses.
- Catalogue permissions added to the single existing `BusinessAccessControl` matrix, so Owner/Admin/Editor/Viewer enforcement stays in one place and Stage 3 boundaries are unchanged.

Frontend, on the existing Expo/React Native/TypeScript app, without disturbing demo mode:

- Optional Stage 5 fields on `Product` and `Service`; `CatalogService` extended with status, gallery, upload and discovery operations, implemented **both** in `production-services.ts` (DTOs, explicit mappers, offset paging, absolute URL resolution against the API origin) and in `mock-services.ts` (local demo answers that never claim a server upload).
- `lib/api/catalog-media.ts` builds the multipart body per runtime and mirrors the server's intake codes.
- API-mode branches for the catalogue manager, item editor, public discovery and item detail, plus the catalogue tile in business management; inline alert text with the server code and a Retry action instead of Alert-only toasts; device-only URIs are stripped from outgoing payloads.

## 3. Verification results (actual)

| Command | Result |
| --- | ---|
| `dotnet build Mabiz.sln` | **0 errors**. A full recompile reports exactly 4 warnings, all of them the pre-existing `xUnit2031` analyser warnings in `Stage3BusinessApiTests.cs` that the Stage 4 baseline already produced; Stage 5 adds no new warning |
| `dotnet test Mabiz.sln` | **90 passed, 0 failed** - `Mabiz.UnitTests` 62, `Mabiz.IntegrationTests` 28. Re-verified after the warning cleanup above |
| New Stage 5 tests | 26 unit cases in `Stage5CatalogUnitTests.cs`, 14 integration facts in `Stage5CatalogApiTests.cs` |
| Live API smoke, 42 checks against `Mabiz_test` with startup migrations disabled | **42 passed, 0 failed**, exit 0; reproducible with `python3 scripts/stage5_smoke.py` (override with `Mabiz_API_BASE`) |
| `pnpm check` (`tsc --noEmit`) | clean, exit 0 |
| `pnpm test` | **114 passed in 16 files** (Stage 4 baseline was 98 in 15) |
| `npx expo export --platform web` | exit 0, catalogue routes present in the bundle |
| `psql -d Mabiz_test` | `catalog_item_media`, `catalog_items`, `media_assets` present; 4 migrations in `__EFMigrationsHistory` |
| `psql -d Mabiz_dev` | **0 tables** - never connected to, never migrated, never written |

Representative live status codes from the smoke run: `/health/live` and `/health/ready` 200; `/openapi/v1.json` 200 with 69 documented paths; anonymous catalogue management, media metadata and media delete 401 `UNAUTHORIZED`; anonymous draft image read 404; multipart PNG upload 201 with `contentType` from the signature and no storage key in the body; gallery create 201 with sort orders 0-2; reorder 200 preserving new order and alt texts; publish 200, then anonymous discovery, public detail and image proxy 200 with the digest as ETag; delete of an attached asset 409 `MEDIA_IN_USE`, detach then delete 204; duplicate SKU 409; product carrying a service field 422; non-image upload 422 `MEDIA_TYPE_NOT_SUPPORTED`.

## 4. Defects found and fixed during verification

Each of these was observed as a failing test or a wrong status code, not theorised.

1. The PNG dimension probe read the chunk length field instead of the chunk type, so every uploaded PNG reported null dimensions.
2. The media deletion guard used a `StringComparison` overload inside `Contains` that EF cannot translate, producing 500 instead of the intended 409.
3. Gallery replacement performed two `SaveChanges` calls and inserted children through the principal's collection navigation; the second save re-applied the parent update against a stale concurrency token and EF emitted deletes for rows it had never loaded, so reordering returned 409. Replaced with a set-based delete plus direct `DbSet` inserts.
4. Media soft-delete mutated an `AsNoTracking` entity and re-attached it as `Modified`, matching zero rows; replaced with a set-based update.
5. An unused `MediaAsset` navigation on the gallery entity was removed, which changed the model snapshot and blocked all 28 integration tests with `PendingModelChangesWarning`; the Stage 5 migration was regenerated and re-pinned to the documented identifier.
6. The create contract originally carried `kind`, which would silently default to `product` and 400 the services route for any client omitting it; kind now comes from the route only.
7. Storage-prefix sanitisation could emit empty segments that failed its own safety check; it now rebuilds from non-empty safe segments.
8. The first draft of the Stage 5 tests introduced three `CS8602` nullable-dereference warnings and three `xUnit1031` blocking-task warnings. Both were real quality signals - the dereferences would have thrown `NullReferenceException` instead of a clean assertion failure if a page ever came back null - so the tests now assert non-null before use and await instead of blocking.
9. The client-side upload pre-check hard-coded 12 MiB while the server default is 10 MiB and the configured range is 1-64 MiB, so it could block files a deployment would accept; it now pre-checks only the absolute ceiling and lets the server's own limit govern.

## 5. How to run it

```bash
# backend
export ConnectionStrings__Mabiz='Host=localhost;Port=5432;Database=Mabiz_dev;Username=...;Password=...'
export Jwt__SigningKey='...' Auth__ChallengePepper='...'
dotnet run --project src/Mabiz.Api

# integration tests (isolated, disposable database only)
export Mabiz_TEST_DB='Host=localhost;Port=5432;Database=Mabiz_test;Username=...;Password=...'
dotnet test Mabiz.sln

# frontend
pnpm install && pnpm check && pnpm test
EXPO_PUBLIC_API_BASE_URL=http://<lan-ip>:5000 pnpm expo start
```

Storage is configured through the nested `Storage` section (`Storage__Provider`, `Storage__Local__RootPath`, `Storage__S3__Endpoint`, `Storage__S3__Bucket`, `Storage__S3__AccessKey`, `Storage__S3__SecretKey`, `Storage__S3__UsePathStyle`, `Storage__MaximumUploadMebibytes`); flattened key names bind to nothing. See `docs/STAGE5_CATALOG_MEDIA.md` and `.env.backend.example`.

## 6. Known limits and remaining work

The S3 provider has been verified for configuration validation, key safety and provider selection, but **not** exercised against a live S3, MinIO, Wasabi or R2 endpoint. Images are stored verbatim: no re-encoding, resizing, thumbnails, EXIF or GPS stripping, content scanning or CDN. The Stage 4 presigned media ticket contract remains unimplemented, so large resumable uploads are still future work. Business logos and covers are still plain URL fields rather than uploaded media. Applying `20261112182203_Stage5Catalog` to `Mabiz_dev` is deliberately left as an operator step. Messaging, push, reports, verification, checkout, cart, wallet, payments and AI are outside Stage 5, and Stage 6 has not been started.
