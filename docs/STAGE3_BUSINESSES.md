# BizConnect Stage 3: Business Profiles, Teams and Ownership

Stage 3 extends the existing Stage 2 ASP.NET Core/EF Core/PostgreSQL backend and Expo app. It does not replace Stage 2 authentication or the local-demo mode. The server is authoritative for API-mode business profiles, memberships, invitations, roles, ownership transfers and activity records. Checkout, payments, wallet, AI and Stage 4 are not included.

## HTTP API (`/api/v1`)

All responses are JSON DTOs. Requests that require identity need a Stage 2 bearer access JWT; authorization is checked on the server for each operation. Private profiles are concealed as `404` from users without active membership. Pagination uses `page` and `pageSize`.

| Method and path | Access and behavior |
| --- | --- |
| `POST /businesses` | Authenticated user creates a business profile and its initial Owner membership. |
| `GET /businesses` | Authenticated user's active managed/member businesses. |
| `GET /businesses/{businessId}` | Public profiles are readable anonymously; private profiles require membership. |
| `PATCH /businesses/{businessId}` | Owner, Admin or Editor; profile updates are audited. |
| `DELETE /businesses/{businessId}` | Owner only; archives rather than hard-deletes the profile. |
| `GET /businesses/{businessId}/members` | Active business members; Owner, Admin, Editor or Viewer. |
| `GET /businesses/{businessId}/activity` | Owner or Admin; paged audit/activity records. |
| `POST /businesses/{businessId}/invitations` | Owner/Admin; invite an existing active BizConnect user as an assignable role. |
| `GET /businesses/{businessId}/invitations` | Owner/Admin; business invitation history. |
| `GET /businesses/me/invitations` | Authenticated recipient's pending invitations. |
| `POST /businesses/{businessId}/invitations/{invitationId}/accept` | Only the addressed recipient; accepts and grants membership. |
| `POST /businesses/{businessId}/invitations/{invitationId}/decline` | Only the addressed recipient; declines. |
| `DELETE /businesses/{businessId}/invitations/{invitationId}` | Owner/Admin within role hierarchy; cancels a pending invitation. |
| `PATCH /businesses/{businessId}/members/{userId}/role` | Owner/Admin within role hierarchy; changes an active member's role. |
| `DELETE /businesses/{businessId}/members/{userId}` | Owner/Admin within role hierarchy; revokes another member. |
| `POST /businesses/{businessId}/leave` | Non-owner member leaves and loses access; Owner must transfer ownership first. |
| `POST /businesses/{businessId}/ownership-transfers` | Current Owner requests transfer to an existing active account. |
| `GET /businesses/me/ownership-transfers` | Incoming and outgoing pending transfers for the authenticated user. |
| `POST /businesses/{businessId}/ownership-transfers/{transferId}/accept` | Only the named recipient; explicitly accepts transfer. |
| `POST /businesses/{businessId}/ownership-transfers/{transferId}/decline` | Only the named recipient; declines transfer. |
| `POST /businesses/{businessId}/ownership-transfers/{transferId}/cancel` | Requesting current Owner cancels a pending transfer. |

The business profile carries name/slug, products/services/hybrid type, category, descriptive and founder fields, county/town/neighbourhood, service areas, contact details, hours, price range, hosted logo/cover references, public/private visibility, supported social links, lifecycle status and current user's role. The profile form can preview a device-picked image locally; only hosted HTTP(S) references are sent as durable image URLs. Stage 3 does not implement binary upload or storage.

## Server-enforced permission matrix

| Role | View private profile / members | Edit profile | Manage team | View activity | Archive | Transfer ownership |
| --- | --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes; assign Admin, Editor or Viewer; manage Admin/Editor/Viewer | Yes | Yes | Yes; recipient acceptance required |
| Admin | Yes | Yes | Yes; assign/manage Editor or Viewer only | Yes | No | No |
| Editor | Yes | Yes | No | No | No | No |
| Viewer | Yes | No | No | No | No | No |
| Non-member | Public profile only | No | No | No | No | No |

The server's `BusinessAccessControl` permission matrix is authoritative. Expo checks exist for clarity, but client checks do not grant access. Admin cannot promote a member to Admin, manage the Owner, archive or transfer ownership. The Expo invitation/role controls mirror those assignment limits; the local-demo adapter remains separate and retains its demo behavior.

## Membership, invitation, transfer and audit semantics

- Creating a business atomically creates its initial Owner membership and `business.created` activity entry. A user may own/manage multiple businesses.
- Invitations are issued to existing active accounts, are pending for seven days, and are accepted or declined only by their recipient. Expired invites no longer grant access. A partial unique PostgreSQL index permits only one pending invite per business/recipient. The inviting role must be permitted to grant the selected role. API responses do not imply that an email was sent; no email provider is integrated.
- Membership is unique per business/user and can be revoked and later reactivated through an accepted invitation. Role changes, invites, acceptance/decline/cancellation, removal and leave are recorded as activity. A Viewer has read-only access to private profile and member list; API writes are rejected even if the client is bypassed.
- Only the current Owner can start a transfer, and the target must be a different existing active account. The request remains pending for seven days. The target—not the requester—must explicitly accept. On acceptance, a database transaction promotes the recipient to Owner, demotes the previous Owner to Admin, changes the business's owner field and records an audit entry together. Owner cannot leave before transferring. Pending transfer uniqueness is protected by a PostgreSQL partial unique index; acceptance uses a serializable transaction and EF concurrency tokens.
- Activity records are business-scoped and paginated. They include the actor, event type, summary and timestamp. Access to the activity route is Owner/Admin only.

## Persistence and migration

Migration `20261112163325_AddBusinessesTeamsAndOwnershipTransfers` is additive. Its `Up` creates `businesses`, `business_memberships`, `business_invitations`, `business_ownership_transfers` and `business_activity`, with foreign keys, check constraints, query indexes, uniqueness indexes and active Owner/pending invitation/pending transfer guards. It does not alter or replace Stage 2 tables. Its `Down` drops these Stage 3 tables; do not run a migration downgrade against wanted data.

The migration was applied to `bizconnect_dev` after checking the actual database name and existing history. Before applying, `__EFMigrationsHistory` contained only `20261112133346_InitialStage2`; there were 9 `AspNetUsers` and 9 `user_profiles`. Immediately after applying, both migration IDs were present, the Stage 2 counts remained 9/9 and the new Stage 3 tables were empty. Subsequent live smoke testing created two clearly synthetic development accounts and one uniquely named business; the business was archived by the API. Those smoke-test accounts and the archived smoke business remain in `bizconnect_dev`. No Stage 2 records were deleted or reset.

Apply migrations deliberately with the development connection string only after verifying the database name:

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export ConnectionStrings__BizConnect='Host=localhost;Port=5432;Database=bizconnect_dev;Username=bizconnect_dev;Password=REPLACE_ME'
# Review pending migrations first; then apply through EF Core.
dotnet ef migrations list --project src/BizConnect.Infrastructure --startup-project src/BizConnect.Infrastructure
dotnet ef database update --project src/BizConnect.Infrastructure --startup-project src/BizConnect.Infrastructure
```

Startup migration is disabled by default. Do not point integration tests at this database: the fixture drops/recreates only the database configured as `BIZCONNECT_TEST_DB`.

## Expo integration status and boundaries

With `EXPO_PUBLIC_API_MODE=api`, the existing Expo app's business list/profile hydration and identity switching, business profile create/edit form, business dashboard, team/membership/invitation screens, ownership transfer controls and activity history use typed API adapters to the C# service. API errors stay API errors; the adapter does not report local mock success. The dashboard now resolves its selected ID against the managed-business API list, so a cached local-demo seed ID does not block direct API navigation. Owner/Admin/Editor/Viewer controls are role-aware, while the backend remains decisive.

API-mode business creation/editing can persist business metadata and hosted image URLs. A picked device URI is a local preview only; Stage 3 makes no upload claim. Existing Stage 2 API login/account integration continues to work on the native Expo flow. The browser login/registration flow is still not integrated with the backend's refresh-cookie/CSRF mechanism.

Business catalogue/products/services, posts/feed, verification, milestones, analytics, messages, social graph, notifications and file uploads remain outside this Stage 3 API integration. Their local-demo flows are preserved. No checkout, payments, wallet, AI or Stage 4 work was started.

## Verification performed

Latest verification after the focused Stage 3 changes:

- `dotnet test BizConnect.sln --verbosity minimal`: build succeeded; 36 tests passed, 0 failed (unit and PostgreSQL integration). The PostgreSQL test fixture used `bizconnect_test`, confirmed distinct from `bizconnect_dev`.
- `pnpm check`: TypeScript check passed.
- `pnpm test`: 14 files, 90 tests passed.
- `pnpm exec expo export --platform web`: succeeded after the final team-role UI refinement and emitted the static Expo Web export to `dist/` (69 static routes).
- Live HTTP smoke against a local API process connected to `bizconnect_dev`: Stage 2 registration, login, profile update, preferences, refresh rotation and logout/session revocation passed; Stage 3 private profile/list, membership and activity, invitation acceptance, Viewer write denial, two-party ownership acceptance, role change from Owner to Admin, and transfer audit checks passed. The API process was stopped afterward. The smoke business was archived. Two synthetic smoke-test accounts remain in the development database.
- Concurrent duplicate invitation integration test: two simultaneous API requests resulted in one `201`, one `409`, one pending invitation and one `team.invited` activity record. There is no separate stress test for simultaneous transfer creation/acceptance or high-volume membership changes; database uniqueness and serializable acceptance are safeguards, not a claim that every race has been exhaustively tested.

## Local run

Configure `ConnectionStrings__BizConnect`, `Jwt__SigningKey` and `Auth__ChallengePepper` as described in [`STAGE2_BACKEND.md`](STAGE2_BACKEND.md); never use Expo-public variables for backend secrets. Start the API, then configure the app with a reachable API origin:

```bash
export EXPO_PUBLIC_API_MODE=api
export EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:5155
export EXPO_PUBLIC_API_VERSION_PREFIX=/api/v1
pnpm exec expo start
```

For a native simulator, use its reachable host address; a physical device needs the development computer's LAN address or a tunnel. API mode is opt-in; omit it or use `mock-local` to retain the local-demo experience. See the Stage 2 backend guide for PostgreSQL setup, migration, test isolation, secrets and API security details.
