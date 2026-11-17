# Mabiz Stage 8 — Business Growth

Stage 8 adds a business-growth layer to the existing Mabiz Expo client and .NET/PostgreSQL API. It preserves the Stage 2–7 architecture, keeps the local demo provider separate from API mode, and does not add payments, AI, transaction verification, or brokerage.

## Delivered API surface

The backend adds additive growth entities and routes under `/api/v1`:

- `GET/POST /businesses/{businessId}/reviews`
- `POST /businesses/{businessId}/reviews/{reviewId}/response`
- `POST /businesses/{businessId}/reviews/{reviewId}/report`
- `GET/POST /businesses/{businessId}/milestones`
- `PATCH/DELETE /businesses/{businessId}/milestones/{milestoneId}`
- `GET /opportunities` and `GET /opportunities/{opportunityId}`
- `POST/PATCH/DELETE /businesses/{businessId}/opportunities[/{opportunityId}]`
- `POST /opportunities/{opportunityId}/enquiry`
- `POST /businesses/{businessId}/analytics/events`
- `GET /businesses/{businessId}/analytics`
- `GET /businesses/{businessId}/growth-summary`

Reviews are recipient-business scoped, limited to one review per user, reject business owners and active team members, calculate average ratings on the server, and create a Stage 7 in-app notification for the business owner. Review reporting changes the review moderation status; verified-purchase labels are not used.

Milestones are owned by a business membership, carry an explicit `IsSelfReported` value, and support public/private visibility. Public profile reads exclude private milestones for viewers without business access. Opportunities support categories, descriptions, optional budgets in KES, expiry, open/closed status, search, pagination, and an enquiry entry point that records an analytics event. No investment transaction, payment, escrow, or brokerage flow is created.

Analytics stores privacy-conscious event rows with an optional actor and optional subject reference. Dashboard aggregation returns counts for recorded events, profile views, enquiries, review counts, and average ratings for a caller-selected date range. It does not expose visitor identities or fabricate sample numbers.

## Role and visibility rules

Owners and Administrators can manage business growth data. Editors retain content-management access where the existing business permission matrix allows it. Viewers can read permitted public or member-only content but cannot create, edit, or delete growth records. Public review and milestone reads respect business visibility; private businesses remain hidden from unauthorised viewers. The existing `BusinessAccessControl` remains the source of truth.

## Client behavior

`app/business-growth.tsx` is the unified growth dashboard. It is reachable from business management and the profile business switcher. The dashboard supports selected-business isolation, API/local disclosure, date-range selection, rating/review summary, analytics, milestones, opportunities, activity, loading states, empty states, errors, retries, and links to the existing management screens.

API mode uses the Stage 8 typed service adapters. Mock-local mode remains deterministic and explicitly labels reviews, trends, milestones, and opportunities as illustrative device-only data; it never claims that those values are production analytics or verified customer activity.

## Local setup and verification

From the project root:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm exec expo export --platform web
```

For the backend, configure a disposable PostgreSQL database and run the existing solution commands after installing the .NET 10 SDK:

```bash
export Mabiz_TEST_DB='Host=localhost;Port=5432;Database=Mabiz_test;Username=Mabiz_test;Password=...'
dotnet build Mabiz.sln
dotnet test Mabiz.sln
```

The Stage 8 migration is additive and is intentionally not applied automatically to `Mabiz_dev` or production. Destructive integration tests must use only `Mabiz_test`.

## Limitations and follow-up work

This source pack includes the Stage 8 core growth layer and dashboard, but the sandbox used to prepare it did not include the .NET SDK or installed JavaScript dependencies, so compilation, automated test execution, and Expo export must be rerun in a fully provisioned environment. Physical-device push presentation, native media upload, and production deployment remain unverified.

The current milestone API stores text/date/visibility and the existing client continues to support local media previews; access-controlled milestone-media persistence and “share as business post” require an additional media/post contract. Opportunity enquiry returns a safe messaging entry point and records the analytics event; the existing Stage 6 conversation UI remains the place where a user starts or continues the actual conversation. Review moderation is represented by the report status and should be connected to a staffed moderation workflow before production launch.
