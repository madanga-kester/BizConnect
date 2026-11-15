# Stage 5: Products, services, catalogue management, image uploads and storage

Stage 5 extends the existing Stage 2/3/4 C# ASP.NET Core, EF Core and PostgreSQL backend with the business catalogue (products and services), ordered image galleries, real image byte uploads and configurable local or S3-compatible object storage. It keeps that backend authoritative for Expo and any future desktop client. The migration is additive. **It has not been applied to `bizconnect_dev`.**

## Implemented API
All routes are under `/api/v1`. Management routes require an authenticated bearer token and an active Owner, Admin or Editor membership in the business. Discovery routes are anonymous. List routes use bounded `page`/`pageSize` offsets (page size 1–100) and return `items`, `total`, `page` and `pageSize`.

| Area | Routes |
| --- | --- |
| Products (managed) | `GET/POST /businesses/{businessId}/products?status=&search=&page=&pageSize=`; `GET/PATCH/DELETE /businesses/{businessId}/products/{productId}`; `POST /businesses/{businessId}/products/{productId}/status`; `PUT /businesses/{businessId}/products/{productId}/media` |
| Services (managed) | The same seven routes with `services` and `{serviceId}` in place of `products` and `{productId}` |
| Media intake | `POST /businesses/{businessId}/media` (`multipart/form-data`, field name `file`) |
| Media access | `GET /media/{mediaId}` (metadata, authorised); `GET /media/{mediaId}/content` (image bytes, access-controlled proxy); `DELETE /media/{mediaId}` |
| Public discovery | `GET /catalogue/products` and `GET /catalogue/services` with `search`, `category`, `county`, `town`, `minPrice`, `maxPrice`, `sort=new\|price_asc\|price_desc\|title`, `page`, `pageSize`; services also accept `availability=available\|on_request\|fully_booked\|seasonal` |
| Public detail | `GET /catalogue/products/{slugOrId}` and `GET /catalogue/services/{slugOrId}`, where the segment is either the slug or the item id |

`DELETE /businesses/{businessId}/products/{productId}` archives the item (status `archived`, 204 No Content) rather than erasing it, so published history and media references survive and the item can be republished. There is no hard-delete route for catalogue items.

Kind is taken from the route segment and never from the request body, so a client cannot create a service through the products path or silently inherit the wrong kind-specific defaults by omitting the field. A body that carries `kind` is ignored.

## Catalogue validation and access control
Role checks come from the single `BusinessAccessControl` matrix that already governed Stage 3, extended with two permissions: `ManageCatalogue` and `PublishCatalogue`. Owner, Admin and Editor hold both; Viewer holds neither; a non-member receives 404 rather than 403, so a private business's existence is not disclosed.

Server-side rules that the client cannot bypass:

| Rule | Failure |
| --- | --- |
| An item needs `priceKsh`, a `priceNote`, or `priceNegotiable` | 422 `PRICE_REQUIRED` |
| Product items reject `leadTimeDays`, `durationMinutes`, `visitType` and `serviceAreas`, and always store `availabilityStatus = "available"` (stock is expressed with `stockQuantity`/`inStock`) | 422 `PRODUCT_FIELDS_INVALID` |
| Service items reject `sku`, `stockQuantity`, `inStock` and `unit`; availability is one of `available`, `on_request`, `fully_booked`, `seasonal` | 422 `SERVICE_FIELDS_INVALID`, 400 `INVALID_AVAILABILITY` |
| SKU is unique per business among non-archived items | 409 `DUPLICATE_SKU` |
| A gallery holds at most 12 images, each at most once | 400 `GALLERY_TOO_LARGE`, 400 `DUPLICATE_GALLERY_IMAGE` |
| `serviceAreas` accepts at most 20 entries and `attributes` at most 20 keys | 400 request validation |
| Gallery assets must already exist and belong to the same business | 422 `MEDIA_ASSET_NOT_USABLE` |
| An item needs a description before it can be published, and publishing needs `PublishCatalogue` | 422 `CATALOGUE_INCOMPLETE`, 403 `CATALOGUE_PUBLISH_DENIED` |
| Editing an archived item without a status change | 422 `CATALOGUE_ITEM_ARCHIVED` |
| Only an active business accepts catalogue writes | 422 `BUSINESS_ARCHIVED` |

Public discovery only ever returns items with status `published` belonging to a business that is both active and public. Drafts, archived items and every item of a private business are invisible, and a guessed slug or id for them returns the same 404 as a non-existent item, so no existence information leaks. The slug is derived from the title and is unique per business: a collision is suffixed `-2`, `-3` and so on, while duplicate titles remain allowed because only the slug is a public identifier.

## Media storage configuration
`StorageOptions` is bound from the `Storage` configuration section and selects the provider at registration time:

| Key | Default | Purpose |
| --- | --- | --- |
| `Storage:Provider` | `local` | `local` or `s3` |
| `Storage:MaximumUploadMebibytes` | `10` | Accepted range 1–64; enforced before and after the bytes are read |
| `Storage:Local:RootPath` | `App_Data/media` | Filesystem root; relative values resolve against the API content root |
| `Storage:Local:ServeThroughApiOnly` | `true` | Documents that bytes are only ever served by the API |
| `Storage:S3:Endpoint` | empty | Required for MinIO, Wasabi, Cloudflare R2 and other S3-compatible hosts; empty means real AWS S3 |
| `Storage:S3:Bucket` | empty | Required when the provider is `s3` |
| `Storage:S3:Region` | `auto` | |
| `Storage:S3:AccessKey` / `SecretKey` | empty | Required when the provider is `s3` |
| `Storage:S3:UsePathStyle` | `false` | Must be `true` for most non-AWS hosts |
| `Storage:S3:AllowInsecureEndpoint` | `false` | Permits an `http://` endpoint outside production |
| `Storage:S3:KeyPrefix` | `media` | Sanitised to non-empty alphanumeric segments |

Provider keys are supplied nested, so environment variables use the double-underscore form: `Storage__Provider`, `Storage__MaximumUploadMebibytes`, `Storage__Local__RootPath`, `Storage__S3__Endpoint`, `Storage__S3__Bucket`, `Storage__S3__Region`, `Storage__S3__AccessKey`, `Storage__S3__SecretKey`, `Storage__S3__UsePathStyle`, `Storage__S3__KeyPrefix`. A flattened name such as `Storage__S3Bucket` binds to nothing and silently leaves the section at its defaults, which is why the section is deliberately not validated with `ValidateDataAnnotations` at startup: an `s3` provider that is selected but incomplete reports `STORAGE_MISCONFIGURED` when the provider is constructed instead of blocking unrelated startup.

Object keys are built by the server as `media/{businessId:N}/{yyyy}/{MM}/{assetId:N}-{sha256[0..12]}.{ext}`. The business id, asset id and digest are all server-generated, so a client cannot influence a key. `MediaKeyBuilder.IsSafeKey` rejects absolute paths, backslashes, dot segments, empty segments and any scheme, and both providers re-check every key before touching storage. `ServeThroughApiOnly` and the key format are the same for both providers, so switching from local to S3 does not change any client-visible URL.

## Image intake and the access-controlled proxy
Uploads are read into memory with a hard ceiling of `MaximumUploadBytes + 1`, so a client that under-declares its content length cannot exceed the cap. The declared MIME type is ignored: the type comes from the file signature (JPEG SOI, PNG `\x89PNG`, WebP `RIFF....WEBP`), and the width and height are read from the image header where the format allows it. Anything that is not JPEG, PNG or WebP is rejected with 422 `MEDIA_TYPE_NOT_SUPPORTED` before a single byte is written, and a SHA-256 digest of the content is stored for ETag generation and dedupe.

Every read goes through `GET /media/{mediaId}/content`. Neither the filesystem root nor the bucket is published as a public origin, so a raw storage or CDN URL cannot be used to bypass a publication or membership check. The proxy authorises a request in this order:

1. The asset must not be soft-deleted, and its bytes must still exist (otherwise 404 `MEDIA_NOT_FOUND` or `MEDIA_CONTENT_MISSING`).
2. If the asset is attached to at least one item that is `published` and belongs to a business that is active and public, the request is allowed anonymously.
3. Otherwise an authenticated caller with catalogue read permission on the asset's business is allowed, so team members can preview their own drafts.
4. Anything else receives 404 — the same response as an unknown id.

Responses carry an ETag (the stored digest) and immutable cache headers, and range processing is enabled. Unpublishing an item therefore withdraws public access to the same image id without deleting the bytes.

`DELETE /media/{mediaId}` refuses while the asset is attached to a catalogue gallery or referenced by a Stage 4 post (409 `MEDIA_IN_USE`). Once detached it soft-deletes the record (`status = deleted`, `deletedAtUtc`) and removes the stored bytes; the set-based update avoids re-applying the concurrency token to a detached entity.

## PostgreSQL schema and constraints
The migration `20261112182203_Stage5Catalog` creates three tables and twelve indexes. It contains no `DropTable`, `DropColumn`, `DropIndex`, `AlterColumn` or `Rename` operation in `Up()`; `Down()` drops only the three new tables.

| Table | Notable constraints |
| --- | --- |
The three tables carry thirteen CHECK constraints in total - nine on `catalog_items`, three on `media_assets` and one on `catalog_item_media`. What is actually enforced in PostgreSQL:

| Table | Enforced in the database |
| --- | --- |
| `catalog_items` | CHECKs on `kind` (`product`/`service`), `status` (`draft`/`published`/`archived`), `availability_status` (the four service values), `visit_type` (`onsite`/`remote`/`hybrid` or null), `price_ksh >= 0` or null, `stock_quantity >= 0` or null, `currency = 'KES'`, that product rows leave `lead_time_days`/`duration_minutes`/`visit_type` null, and that a published row has `published_at_utc`; `service_areas` is a `text[]` column and `attributes_json` is `jsonb`; unique `(business_id, slug)` and filtered-unique `(business_id, sku)` where the sku is not null; covering indexes for management listing, public ordering by publication and status/category filtering |
| `catalog_item_media` | CHECK `sort_order >= 0`; unique `(catalog_item_id, sort_order)` so the gallery order is stable; separate index on `media_asset_id`; `ON DELETE CASCADE` from the item and `RESTRICT` from the asset, so bytes cannot be dropped out from under a gallery |
| `media_assets` | CHECKs on `provider` (`local`/`s3`), `status` (`ready`/`deleted`) and `size_bytes > 0`; `sha256` limited to 64 characters; unique `storage_key`; indexes on `(business_id, status, created_at_utc)` and `(business_id, sha256)` |

Gallery size (12 images, each once), `serviceAreas` (20 entries) and `attributes` (20 keys) are request-validation rules rather than database CHECKs; the width and height columns are nullable integers with no CHECK, because a header that does not expose dimensions is still a valid image.

FK columns are named exactly as EF conventions expect, so Stage 5 model configuration extends `AppDbContext.OnModelCreating` through `Stage5Model.Configure` (mirroring the Stage 4 split) instead of touching existing mappings. Gallery rows are written set-based — previous rows are cleared with `ExecuteDeleteAsync` and replacements are added through the `DbSet` — because reordering reuses the same `(item, sort order)` values and a second `SaveChanges` would re-apply the parent update against a stale concurrency token.

## Migration and database safety
Integration tests point at `PostgresApiFactory`, which reads `BIZCONNECT_TEST_DB`, refuses to run unless the connection string names `bizconnect_test`, drops and recreates that database, and applies every migration from scratch. The Stage 5 fixture additionally pins `Storage__Provider=local`, a per-run temp `Storage__Local__RootPath` and a 1 MiB upload cap, so test bytes never land in the repository and the size guard is exercised cheaply. `bizconnect_dev` is never written by this task; applying `20261112182203_Stage5Catalog` there is a deliberate later step:

```bash
# Development database only, once Stage 5 is accepted for that environment.
export ConnectionStrings__BizConnect='Host=localhost;Port=5432;Database=bizconnect_dev;Username=<user>;Password=<password>'
dotnet ef database update --project src/BizConnect.Infrastructure --startup-project src/BizConnect.Api
```

## Expo API integration
The Expo app keeps `mock-local` as its default and gains an API mode for the catalogue. `types/domain.ts` now carries optional Stage 5 fields (`sku`, `status`, `publishedAt`, `updatedAt` and an ordered `gallery`) on both `Product` and `Service` without disturbing the existing flat fields, so Stage 2/3/4 screens and the demo store keep compiling and behaving as before.

`lib/api/feature-contracts.ts` extends `CatalogService` with the Stage 5 operations - status change per kind, gallery replacement/reordering, direct multipart media upload, public discovery lists and public detail by slug or id - and both implementations satisfy it: `lib/api/production-services.ts` performs the HTTP calls with explicit DTOs and mappers, while `lib/services/mock-services.ts` answers the same calls from the local demo store and refuses to claim that it uploaded anything to a server.

Mappers translate `priceKsh` to `price`, keep `sku`, `status` and service `availability`, and turn the relative `accessUrl` into an absolute URL built from the configured API origin, because `MediaImage` only accepts resolvable sources. Outgoing payloads are built field by field, so a device-local `file:`, `content:`, `blob:`, `asset:`, `ph:`, `data:` or `/manus-storage/` URI cannot reach the API; those URIs are only ever inputs to the upload call. `lib/api/catalog-media.ts` builds the multipart body per runtime (a fetched Blob on web, a native `{uri, name, type}` part on device) and mirrors the server's intake codes so a doomed upload is explained before the request.

Four screens delegate to `components/api-catalog-screens.tsx` when the mode is `api`: the catalogue manager (list, filter, publish, unpublish, archive), the item editor (real upload with per-image pending state, gallery reorder with index 0 as primary, SKU for products and availability for services, save draft or publish), public discovery, and item detail (ordered gallery, 404 mapped to the existing not-found state). Each API branch renders inline `accessibilityRole="alert"` error text with the server code plus a Retry action instead of an Alert-only toast, and `app/business-management.tsx` now offers the catalogue tile in API mode as well.

## Verification and known limits
Backend, executed in this workspace:

| Check | Result |
| --- | --- |
| `dotnet build BizConnect.sln` | succeeded, 0 errors, 4 warnings (all pre-existing `xUnit2031` in `Stage3BusinessApiTests.cs`) |
| `dotnet test BizConnect.sln` | **90 passed, 0 failed** - 62 unit and 28 integration, against the isolated `bizconnect_test` database (Stage 4 baseline was 50: 36 unit and 14 integration) |
| Migration | `20261112182203_Stage5Catalog` applied from scratch by the test fixture; not applied to `bizconnect_dev` |
| Live API smoke via `scripts/stage5_smoke.py` (42 checks, startup migrations disabled, `bizconnect_test` only) | all 42 passed, exit 0: `/health/live` and `/health/ready` 200; `/openapi/v1.json` 200 with 69 documented paths including every Stage 5 route; anonymous catalogue discovery 200; anonymous catalogue management, media metadata and media delete 401 with `UNAUTHORIZED`; multipart PNG upload 201 reporting `contentType` from the signature with width and height parsed and no storage key in the body; gallery create 201 with sort orders 0-2, reorder 200 preserving new order and alt texts; publish 200 then anonymous discovery, public detail and image proxy 200 with the digest as ETag; delete of an attached asset 409 `MEDIA_IN_USE`, detach then delete 204; duplicate SKU 409; product carrying a service field 422; non-image upload 422 |

Frontend, executed in this workspace: `pnpm check` (`tsc --noEmit`) clean; `pnpm test` **114 passed in 16 files** (Stage 4 baseline 98 in 15, so the previous suites still pass and `tests/catalog-api-adapters.test.ts` adds the Stage 5 coverage: methods and paths, offset `page`/`pageSize` query, DTO to domain mapping including null price, null sku and null visit type, gallery ordering with absolute image URLs, absence of device URIs in outgoing payloads, unchanged API error passthrough, and mock mode staying local); `npx expo export --platform web` exited 0 with the catalogue routes in the bundle.

Known limits, stated plainly:

- The S3 provider is unit-tested for configuration errors, key safety and the absence of a public origin, but it has not been exercised against a live AWS S3, MinIO, Wasabi or R2 endpoint in this task. Selecting `s3` without a reachable bucket fails at startup of the provider with `STORAGE_MISCONFIGURED`.
- Image intake does not decode pixels. The type comes from the file signature; dimensions are read for every PNG, for baseline JPEG (`SOF0`/`SOF1`/`SOF2`) and for WebP `VP8X`, and are simply null for progressive JPEG and `VP8`/`VP8L` WebP, which are still accepted. There is no re-encoding, resizing, thumbnail generation or format normalisation, and no anti-virus scanning.
- Uploaded bytes are stored verbatim, so camera metadata such as EXIF GPS coordinates survives inside the served file and is visible to anyone who can read the asset. Stripping metadata at upload belongs to a later stage.
- The access proxy returns whole objects; there is no CDN layer, and `ServeThroughApiOnly` means image traffic passes through the API process.
- The Stage 4 presigned media ticket contract (`begin`/`upload`/`complete`/`resume`/`retry`/`cancel`) remains unimplemented; the mock adapters for it stay demo-only, and Stage 5 uses the single multipart route instead.
- Public discovery has no relevance ranking beyond the four fixed sort orders, and catalogue items remain scoped to `KES` pricing.
- Messaging, push, reports, verification, checkout, cart, wallet, payments and AI are outside Stage 5.
