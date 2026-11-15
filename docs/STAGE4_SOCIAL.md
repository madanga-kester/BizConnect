# Stage 4: Social feed, posts, engagement, polls and follows

Stage 4 extends the existing Stage 2/3 C# ASP.NET Core, EF Core and PostgreSQL backend. It keeps that backend authoritative for Expo and future desktop clients; API mode does not convert unrelated local-demo screens into server features. The migration is additive. **It has not been applied to `bizconnect_dev`.**

## Implemented API

All routes below are under `/api/v1` and require an authenticated bearer token. `cursor` routes return `{ items, nextCursor }`; their `limit` is clamped to 1–100. A missing `nextCursor` means the page is exhausted. User/business relationship lists instead use bounded `page`/`pageSize` offsets (page size 1–100) and return `items`, `total`, `page`, and `pageSize`.

| Area | Routes |
| --- | --- |
| Feed | `GET /feed/for-you?cursor=&limit=20`; `GET /feed/following?cursor=&limit=20` |
| Posts | `POST /posts`; `GET /posts` (authenticated user's posts); `GET/PATCH/DELETE /posts/{postId}`; `GET /users/{userId}/posts`; `GET /businesses/{businessId}/posts` |
| Likes | `POST/DELETE /posts/{postId}/likes`; `GET /posts/{postId}/likes?cursor=&limit=50` |
| Comments and replies | `POST/GET /posts/{postId}/comments`; `POST/GET /comments/{commentId}/replies`; `PATCH/DELETE /comments/{commentId}` |
| Polls | `POST /posts/{postId}/polls`; `GET /polls/{pollId}`; `GET /polls/{pollId}/results`; `POST /polls/{pollId}/votes` |
| User follows | `GET/POST/DELETE /users/{userId}/follow`; `GET /users/{userId}/followers`; `GET /users/{userId}/following`; `GET /users/me/followers`; `GET /users/me/following` |
| Business follows | `GET/POST/DELETE /businesses/{businessId}/follow`; `GET /businesses/{businessId}/followers` |
| Moderation | `GET/POST/DELETE /moderation/blocks/{userId}`; `GET/POST/DELETE /moderation/hidden-posts/{postId}` |

Likes and follows are idempotent for repeated create/delete actions. Poll voting returns authoritative poll/options/tallies and rejects a second vote by the same account, a closed poll, or an option not belonging to that poll. A post can have at most one poll. Comments are independently paged; root comments and replies are separate routes. Editing/deleting a comment is limited to its author.

## Feed order and visibility

For You is not a recommendation or scoring algorithm: it selects public, discoverable posts and excludes posts attached to non-public businesses. Following selects posts authored by followed users or businesses, then applies the same server visibility checks. Both feeds, profile post lists, individual post reads, likes, comments, and poll reads/votes use server-side access filtering. Feed pages sort by `(CreatedAtUtc DESC, Id DESC)` and encode that key in the cursor; the unique ID tie-breaker makes paging stable when timestamps are equal. The integration suite exercises consecutive keyset pages without repeated posts.

The server enforces these boundaries regardless of client filters:

- Private personal profiles are not visible or followable through this Stage 4 API. There is **no follow-request/pending/approval lifecycle**; attempts to access or follow a private profile return not-found behavior rather than creating a request.
- Public profile posts follow their `public`, `followers`, or `private` audience; followers-only posts require a user follow. An author may read their own posts independent of audience unless that author has explicitly hidden the post for themselves.
- A private business and its posts are visible to active business members only. Public-business posts use the post audience, with followers-only posts available to a business follower or member. For You excludes non-public business posts.
- Blocks are reciprocal for visibility and interaction checks. Creating a block removes any follow in either direction between those users. Hidden posts are hidden only for the actor who hid them and are excluded from that actor's applicable post queries.
- Invalid, missing, inaccessible or blocked resources are intentionally filtered or return not-found/forbidden responses, so changing a client-supplied resource ID cannot bypass policy.

## Publishing and post/media contract

Personal posts are authored by the authenticated user. A business post supplies its `businessId`; an active Owner, Admin or Editor membership with Stage 3 `PublishPosts` permission is required. A Viewer or other unauthorized member is denied by the backend. Permission is rechecked for business post edits/deletes. Business follows are separate from personal follows.

Supported kinds are `text`, `image`, `video`, `product`, and `announcement`. Text is bounded to 5,000 characters; optional post media is a list of at most 10 HTTPS references with type, URL, alt text and sort order. Local device paths, non-HTTPS schemes and embedded URL credentials are rejected. The service stores references/metadata only: there is **no device-file upload, object storage, media processing or resumable transfer** in Stage 4. A hosted URL must exist independently; submitting a URL does not upload its underlying file. Product posts also require product JSON data.

## PostgreSQL schema and constraints

Migration `20261112173415_Stage4SocialContent` adds the following Stage 4 tables without changing or deleting Stage 2/3 tables:

- `posts`, `post_media_references`, `post_likes`, and `comments` (including self-referencing parent IDs for replies).
- `polls`, `poll_options`, and `poll_votes`.
- `user_follows`, `business_follows`, `user_blocks`, and `hidden_posts`.

Foreign keys link content to its author/business and cascade dependent post-owned records where appropriate. Composite primary keys prevent duplicate likes, user/business follows, blocks, hidden-post entries and poll votes. Poll options have a unique `(PollId, SortOrder)` index and alternate key `(PollId, Id)`; votes reference a valid option within the same poll. A unique index permits only one poll per post. Check constraints restrict post kind/audience and text size, require non-negative media order, prohibit self-follow/self-block, and prohibit a comment parenting itself. Time/keyset and relationship indexes support descending feed/post/comment paging and lookups.

`Down` drops only the Stage 4 tables. It does not drop or alter Stage 2/3 tables. Rollback would still delete Stage 4 data and is not a routine deployment step.

## Migration and database safety

Install PostgreSQL and .NET 10, configure a development database, then review the connection string before migration. The development migration command is intentionally explicit; do not point it at production or a database with valuable data until the migration has been reviewed and backed up.

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
dotnet tool install --global dotnet-ef --version 10.0.0   # if dotnet-ef is not installed
export ConnectionStrings__BizConnect='Host=localhost;Port=5432;Database=bizconnect_dev;Username=bizconnect_dev;Password=REPLACE_ME'
dotnet ef database update --project src/BizConnect.Infrastructure --startup-project src/BizConnect.Infrastructure
```

That command applies all pending migrations, including this Stage 4 migration, to the configured `ConnectionStrings__BizConnect` database. In this implementation session it was **not run against `bizconnect_dev`**; the development database was left untouched. The PostgreSQL HTTP integration fixture is isolated to `BIZCONNECT_TEST_DB` (expected database name `bizconnect_test`) and may recreate only that test database. Never set the test variable to a development connection.

## Expo API integration

The existing Expo app continues to select local demo mode by default. To opt in, configure the non-secret API origin and `EXPO_PUBLIC_API_MODE=api`; API services use the existing central `JsonApiClient`, secure session, and `BizConnectServicesProvider`. Connected screens include For You/Following, post composer/detail, personal and business profiles/posts, likes, comments/replies, polls, user/business follow actions, follower lists and hide/block controls. Server errors stay visible as errors; API mode does not fabricate mock success. The legacy local-demo store remains a separate mode.

Native API authentication should be tested with a reachable development API origin (LAN IP or tunnel as applicable). Browser account login/refresh-cookie integration is a separate limitation inherited from the existing implementation.

## Verification and known limits

Run the frontend and backend checks from the repository root:

```bash
pnpm check
pnpm test
pnpm exec expo export --platform web
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
dotnet build BizConnect.sln
# Set BIZCONNECT_TEST_DB to the isolated bizconnect_test database first.
dotnet test BizConnect.sln
```

Verification on 2026-11-12: `dotnet build BizConnect.sln` succeeded; the complete xUnit/PostgreSQL suite passed **50 tests with 0 failures** against `bizconnect_test`. Frontend verification passed `pnpm check`, **98 tests across 15 files**, and `pnpm exec expo export --platform web`. The live API smoke test (startup migration application disabled, test database only) returned 200 for `/health/ready` and `/openapi/v1.json`, and 401 for unauthenticated feed/posts requests. Coverage includes privacy, business roles, moderation, engagement, polls, self-profile routes/counts and stable cursor paging. The migration remains unapplied to `bizconnect_dev`.

Known limits: no private-profile follow requests; no Nearby feed or personalization ranking; no comment likes, post shares, server-side saves, full current-user business-following list, media upload/storage, push, real-time messaging, checkout/payments or AI. These are not claimed as Stage 4 implementations; payments, checkout, wallet and AI remain out of scope, and Stage 5 has not begun.
