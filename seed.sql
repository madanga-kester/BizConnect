-- BizConnect seed data (generated from your schema.sql)
-- Safe to re-run: every INSERT uses ON CONFLICT DO NOTHING.
-- Seed users log in with *@seed.bizconnect.test / Password123!
BEGIN;

-- AspNetRoles
INSERT INTO public."AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp") VALUES
  ('14258b20-f7d1-564e-9147-7b5453bc8f95', 'Admin', 'ADMIN', '81e2bbeb-c279-57b3-88f6-a8a5611fe78c'),
  ('37e8980e-17e7-5587-9603-64080e60d6c1', 'User', 'USER', '35d64c89-9c51-5ab0-aeb4-00a653ade621'),
  ('c0cdc816-b5e5-570d-a00a-4587047b31f2', 'BusinessOwner', 'BUSINESSOWNER', 'ca5e06c8-c5df-5c7d-bf28-1bc580864119')
ON CONFLICT DO NOTHING;

-- AspNetUsers
INSERT INTO public."AspNetUsers" ("Id", "IsActive", "CreatedAtUtc", "LastSignedInAtUtc", "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed", "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumber", "PhoneNumberConfirmed", "TwoFactorEnabled", "LockoutEnd", "LockoutEnabled", "AccessFailedCount") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', true, '2026-08-24 09:00:00+00', '2026-11-22 09:00:00+00', 'wanjiku@seed.bizconnect.test', 'WANJIKU@SEED.BIZCONNECT.TEST', 'wanjiku@seed.bizconnect.test', 'WANJIKU@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '92BB532E6509561FBAA04730FCC47E49', '21458c55-ecac-5bb4-b141-c363aed205ed', '+254710000000', true, false, NULL, true, 0),
  ('899a632e-c21a-571d-8821-740e44bcfe18', true, '2026-08-29 09:00:00+00', '2026-11-21 09:00:00+00', 'brianotieno@seed.bizconnect.test', 'BRIANOTIENO@SEED.BIZCONNECT.TEST', 'brianotieno@seed.bizconnect.test', 'BRIANOTIENO@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '58280DE3DC855B2E8276720ED6C8FF27', '76f80776-9571-55de-b28b-9b9e10d5b71b', '+254710001111', true, false, NULL, true, 0),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', true, '2026-09-03 09:00:00+00', '2026-11-20 09:00:00+00', 'aminah@seed.bizconnect.test', 'AMINAH@SEED.BIZCONNECT.TEST', 'aminah@seed.bizconnect.test', 'AMINAH@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '90DD02B5C57857E8AD37927175D44BED', '4feeb78a-e4a2-5dae-b278-b42c61f9854a', '+254710002222', false, false, NULL, true, 0),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', true, '2026-09-08 09:00:00+00', '2026-11-19 09:00:00+00', 'kevinmw@seed.bizconnect.test', 'KEVINMW@SEED.BIZCONNECT.TEST', 'kevinmw@seed.bizconnect.test', 'KEVINMW@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '417EE898E1EF5E3FA0A3A7C74649A714', '279e4b0c-b455-53e4-9e01-456febe40dd0', '+254710003333', true, false, NULL, true, 0),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', true, '2026-09-13 09:00:00+00', '2026-11-18 09:00:00+00', 'gracea@seed.bizconnect.test', 'GRACEA@SEED.BIZCONNECT.TEST', 'gracea@seed.bizconnect.test', 'GRACEA@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', 'CF7D2F3F793F5DE2BD61E7C2EA3D2511', '6e906638-eee2-572f-a7ff-ef6d28308b45', '+254710004444', true, false, NULL, true, 0),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', true, '2026-09-18 09:00:00+00', '2026-11-17 09:00:00+00', 'dkiprop@seed.bizconnect.test', 'DKIPROP@SEED.BIZCONNECT.TEST', 'dkiprop@seed.bizconnect.test', 'DKIPROP@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', 'F9ED4C6357BA5C368999D62E4C3FE6A7', '3222f3a9-e63b-596a-a0de-10f81d66b76b', '+254710005555', false, false, NULL, true, 0),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', true, '2026-09-23 09:00:00+00', '2026-11-16 09:00:00+00', 'faithnjeri@seed.bizconnect.test', 'FAITHNJERI@SEED.BIZCONNECT.TEST', 'faithnjeri@seed.bizconnect.test', 'FAITHNJERI@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', 'CCE32CD00CE755F4A898C14CDA0128D0', '7662eec1-29fd-5211-bdcc-c66f563ce748', '+254710006666', true, false, NULL, true, 0),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', true, '2026-09-28 09:00:00+00', '2026-11-15 09:00:00+00', 'samomondi@seed.bizconnect.test', 'SAMOMONDI@SEED.BIZCONNECT.TEST', 'samomondi@seed.bizconnect.test', 'SAMOMONDI@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '539CA67B071F5288996D2D9C8069F979', '75ccb49a-31f6-5d8d-b5ac-8554a9fb7711', '+254710007777', true, false, NULL, true, 0),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', true, '2026-10-03 09:00:00+00', '2026-11-14 09:00:00+00', 'zawadi@seed.bizconnect.test', 'ZAWADI@SEED.BIZCONNECT.TEST', 'zawadi@seed.bizconnect.test', 'ZAWADI@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', 'DCFCF60A2DE351C7A7EC5CC995FF1488', 'e118cc78-c1de-544f-8e08-df69ffb90970', '+254710008888', false, false, NULL, true, 0),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', true, '2026-10-08 09:00:00+00', '2026-11-13 09:00:00+00', 'pwafula@seed.bizconnect.test', 'PWAFULA@SEED.BIZCONNECT.TEST', 'pwafula@seed.bizconnect.test', 'PWAFULA@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '943CFC81A355525DA417EB759864BBB4', '45b5e9c7-38e2-5efe-a94b-24e0357dbe88', '+254710009999', true, false, NULL, true, 0),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', true, '2026-10-13 09:00:00+00', '2026-11-12 09:00:00+00', 'lilianc@seed.bizconnect.test', 'LILIANC@SEED.BIZCONNECT.TEST', 'lilianc@seed.bizconnect.test', 'LILIANC@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '248562C3CCCD5B3986DD70C6A6172E76', '3448243d-5fdf-58ff-abc0-47ede4322ec3', '+254710011110', true, false, NULL, true, 0),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', true, '2026-10-18 09:00:00+00', '2026-11-11 09:00:00+00', 'hassanabdi@seed.bizconnect.test', 'HASSANABDI@SEED.BIZCONNECT.TEST', 'hassanabdi@seed.bizconnect.test', 'HASSANABDI@SEED.BIZCONNECT.TEST', true, 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', 'ED482AF0FBDB5CCD91BB3C39406BF187', 'ae1b22d1-39e5-57af-af18-a4d77163c544', '+254710012221', false, false, NULL, true, 0)
ON CONFLICT DO NOTHING;

-- AspNetUserRoles
INSERT INTO public."AspNetUserRoles" ("UserId","RoleId")
SELECT u."Id", r."Id" FROM public."AspNetUsers" u CROSS JOIN public."AspNetRoles" r
WHERE (u."Email" = 'wanjiku@seed.bizconnect.test' AND r."NormalizedName" IN ('ADMIN','USER'))
   OR (u."Email" LIKE '%@seed.bizconnect.test' AND u."Email" <> 'wanjiku@seed.bizconnect.test' AND r."NormalizedName" = 'USER')
ON CONFLICT DO NOTHING;

INSERT INTO public."AspNetRoleClaims" ("RoleId","ClaimType","ClaimValue")
SELECT "Id",'permission','moderate_content' FROM public."AspNetRoles" WHERE "NormalizedName"='ADMIN'
AND NOT EXISTS (SELECT 1 FROM public."AspNetRoleClaims" c WHERE c."RoleId"="AspNetRoles"."Id" AND c."ClaimValue"='moderate_content');

INSERT INTO public."AspNetUserClaims" ("UserId","ClaimType","ClaimValue")
SELECT "Id",'county','Nairobi' FROM public."AspNetUsers" WHERE "Email"='wanjiku@seed.bizconnect.test'
AND NOT EXISTS (SELECT 1 FROM public."AspNetUserClaims" c WHERE c."UserId"="AspNetUsers"."Id" AND c."ClaimType"='county');

-- AspNetUserLogins
INSERT INTO public."AspNetUserLogins" ("LoginProvider", "ProviderKey", "ProviderDisplayName", "UserId") VALUES
  ('Google', 'seed-google-1001', 'Google', '899a632e-c21a-571d-8821-740e44bcfe18'),
  ('Google', 'seed-google-1002', 'Google', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38')
ON CONFLICT DO NOTHING;

-- AspNetUserTokens
INSERT INTO public."AspNetUserTokens" ("UserId", "LoginProvider", "Name", "Value") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '[AspNetUserStore]', 'AuthenticatorKey', 'SEEDAUTHKEYJBSWY3DPEHPK3PXP')
ON CONFLICT DO NOTHING;

-- user_profiles
INSERT INTO public."user_profiles" ("Id", "UserId", "Username", "UsernameNormalized", "Name", "Bio", "Avatar", "County", "Town", "Neighbourhood", "Interests", "PrivateProfile", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('1e87e4da-8df9-59f7-b1cc-6ed7b72352d7', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'wanjiku', 'wanjiku', 'Wanjiku Kamau', 'Hi, I''m Wanjiku from Westlands. Supporting local businesses.', 'https://picsum.photos/seed/bz0/200', 'Nairobi', 'Westlands', 'Parklands', ARRAY['fashion','food','events']::text[], false, '2026-08-24 09:00:00+00', '2026-11-22 09:00:00+00'),
  ('eab169c3-b32d-55cc-87d3-c08f382e9581', '899a632e-c21a-571d-8821-740e44bcfe18', 'brian.otieno', 'brian.otieno', 'Brian Otieno', 'Hi, I''m Brian from Kisumu Central. Supporting local businesses.', 'https://picsum.photos/seed/bz1/200', 'Kisumu', 'Kisumu Central', 'Milimani', ARRAY['beauty','fashion','transport']::text[], false, '2026-08-29 09:00:00+00', '2026-11-21 09:00:00+00'),
  ('82138cca-bee8-50a5-b63c-53d18398a1c6', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'amina.h', 'amina.h', 'Amina Hassan', 'Hi, I''m Amina from Nyali. Supporting local businesses.', 'https://picsum.photos/seed/bz2/200', 'Mombasa', 'Nyali', 'Nyali', ARRAY['tech','events','food']::text[], false, '2026-09-03 09:00:00+00', '2026-11-20 09:00:00+00'),
  ('8f272e7d-6117-5f36-b62c-d3630db9a1ad', '16fa9d0e-e941-5694-8fed-67a28a259705', 'kevin.mw', 'kevin.mw', 'Kevin Mwangi', 'Hi, I''m Kevin from Nakuru East. Supporting local businesses.', 'https://picsum.photos/seed/bz3/200', 'Nakuru', 'Nakuru East', 'Section 58', ARRAY['fashion','beauty','farming']::text[], false, '2026-09-08 09:00:00+00', '2026-11-19 09:00:00+00'),
  ('ec35ca27-6952-541f-833b-1e259d049848', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'grace.a', 'grace.a', 'Grace Achieng', 'Hi, I''m Grace from Kilimani. Supporting local businesses.', 'https://picsum.photos/seed/bz4/200', 'Nairobi', 'Kilimani', 'Kilimani', ARRAY['food','crafts','transport']::text[], false, '2026-09-13 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('cd442b81-eb47-5cac-90b8-87a37e32dd56', '1db35632-758e-5f2b-a531-8623b034fcbd', 'dkiprop', 'dkiprop', 'Daniel Kiprop', 'Hi, I''m Daniel from Eldoret. Supporting local businesses.', 'https://picsum.photos/seed/bz5/200', 'Uasin Gishu', 'Eldoret', 'Elgon View', ARRAY['farming','fashion','beauty']::text[], false, '2026-09-18 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('284eada0-d432-5f26-a652-217c2c4c0610', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'faith.njeri', 'faith.njeri', 'Faith Njeri', 'Hi, I''m Faith from Thika. Supporting local businesses.', 'https://picsum.photos/seed/bz6/200', 'Kiambu', 'Thika', 'Makongeni', ARRAY['food','beauty','fashion']::text[], false, '2026-09-23 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('f35ad699-b834-562f-a105-1e8e36509189', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'sam.omondi', 'sam.omondi', 'Samuel Omondi', 'Hi, I''m Samuel from Embakasi. Supporting local businesses.', 'https://picsum.photos/seed/bz7/200', 'Nairobi', 'Embakasi', 'Pipeline', ARRAY['transport','fashion','farming']::text[], false, '2026-09-28 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('442b497c-c031-5669-ac69-5e33b8276903', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'zawadi', 'zawadi', 'Zawadi Mutua', 'Hi, I''m Zawadi from Machakos Town. Supporting local businesses.', 'https://picsum.photos/seed/bz8/200', 'Machakos', 'Machakos Town', 'Mua Hills', ARRAY['beauty','transport','food']::text[], false, '2026-10-03 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('a832f186-db9a-58f4-83dd-fe4e1e197e50', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'pwafula', 'pwafula', 'Peter Wafula', 'Hi, I''m Peter from Kakamega Town. Supporting local businesses.', 'https://picsum.photos/seed/bz9/200', 'Kakamega', 'Kakamega Town', 'Milimani', ARRAY['tech','events','farming']::text[], true, '2026-10-08 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('a700a0a6-e01c-5e90-b0ee-213d036605e5', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'lilian.c', 'lilian.c', 'Lilian Chebet', 'Hi, I''m Lilian from Kericho Town. Supporting local businesses.', 'https://picsum.photos/seed/bz10/200', 'Kericho', 'Kericho Town', 'Kapkugerwet', ARRAY['events','tech','fashion']::text[], false, '2026-10-13 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('0678f7ea-5c60-506b-82c1-635e552c6572', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'hassan.abdi', 'hassan.abdi', 'Hassan Abdi', 'Hi, I''m Hassan from Eastleigh. Supporting local businesses.', 'https://picsum.photos/seed/bz11/200', 'Nairobi', 'Eastleigh', 'Eastleigh North', ARRAY['farming','transport','tech']::text[], false, '2026-10-18 09:00:00+00', '2026-11-11 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_preferences
INSERT INTO public."user_preferences" ("UserId", "Locale", "TimeZone", "Theme", "ShareLocation", "ReducedDataUsage", "AutoplayVideos", "UpdatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'sw-KE', 'Africa/Nairobi', 'light', true, true, false, '2026-11-22 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', 'en-KE', 'Africa/Nairobi', 'dark', false, false, true, '2026-11-21 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'en-KE', 'Africa/Nairobi', 'system', true, false, false, '2026-11-20 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', 'en-KE', 'Africa/Nairobi', 'light', false, false, true, '2026-11-19 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'sw-KE', 'Africa/Nairobi', 'dark', true, false, false, '2026-11-18 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', 'en-KE', 'Africa/Nairobi', 'system', false, true, true, '2026-11-17 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'en-KE', 'Africa/Nairobi', 'light', true, false, false, '2026-11-16 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'en-KE', 'Africa/Nairobi', 'dark', false, false, true, '2026-11-15 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'sw-KE', 'Africa/Nairobi', 'system', true, false, false, '2026-11-14 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', 'en-KE', 'Africa/Nairobi', 'light', false, false, true, '2026-11-13 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', 'en-KE', 'Africa/Nairobi', 'dark', true, true, false, '2026-11-12 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'en-KE', 'Africa/Nairobi', 'system', false, false, true, '2026-11-11 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_notification_preferences
INSERT INTO public."user_notification_preferences" ("UserId", "InAppEnabled", "EmailEnabled", "PushEnabled", "NewFollowers", "Messages", "BusinessUpdates", "UpdatedAtUtc", "BusinessTeamActivity", "Comments", "Likes") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', true, true, true, true, true, true, '2026-11-22 09:00:00+00', true, true, false),
  ('899a632e-c21a-571d-8821-740e44bcfe18', true, false, true, true, true, true, '2026-11-21 09:00:00+00', true, true, true),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', true, true, true, true, true, true, '2026-11-20 09:00:00+00', true, true, true),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', true, false, true, true, true, true, '2026-11-19 09:00:00+00', true, true, false),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', true, true, true, true, true, true, '2026-11-18 09:00:00+00', true, true, true),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', true, false, true, true, true, true, '2026-11-17 09:00:00+00', true, true, true),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', true, true, true, true, true, true, '2026-11-16 09:00:00+00', true, true, false),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', true, false, true, true, true, true, '2026-11-15 09:00:00+00', true, true, true),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', true, true, true, true, true, true, '2026-11-14 09:00:00+00', true, true, true),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', true, false, true, true, true, true, '2026-11-13 09:00:00+00', true, true, false),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', true, true, true, true, true, true, '2026-11-12 09:00:00+00', true, true, true),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', true, false, true, true, true, true, '2026-11-11 09:00:00+00', true, true, true)
ON CONFLICT DO NOTHING;

-- MenuSettings
INSERT INTO public."MenuSettings" ("UserId", "TextSize", "HighContrast", "ProfileVisibility", "MessagePermission", "StoryReplyPermission", "CommentPermission", "TagPermission", "MentionPermission", "SharingPermission", "AllowPostResharing", "AllowStorySharing", "AllowExternalSharing", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'small', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, false, '2026-09-03 09:00:00+00', '2026-11-22 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', 'medium', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-21 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'large', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-20 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', 'small', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-19 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'medium', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, false, '2026-09-03 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', 'large', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'small', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'medium', true, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'large', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, false, '2026-09-03 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', 'small', false, 'followers', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', 'medium', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'large', false, 'public', 'everyone', 'everyone', 'everyone', 'followers', 'everyone', 'everyone', true, true, true, '2026-09-03 09:00:00+00', '2026-11-11 09:00:00+00')
ON CONFLICT DO NOTHING;

-- MenuActivityEvents
INSERT INTO public."MenuActivityEvents" ("Id", "UserId", "EventType", "SubjectType", "SubjectId", "MetadataJson", "CreatedAtUtc") VALUES
  ('08d1963b-4fc0-5dc3-8dbb-36a12da8a19e', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'menu_opened', 'Profile', '899a632e-c21a-571d-8821-740e44bcfe18', '{"source": "seed", "n": 0}', '2026-11-22 09:00:00+00'),
  ('90b351fc-29a4-580a-b689-750137d6df71', '899a632e-c21a-571d-8821-740e44bcfe18', 'settings_changed', 'Profile', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '{"source": "seed", "n": 1}', '2026-11-21 09:00:00+00'),
  ('f066c600-4ba4-5dc5-9099-e4984fd2dce0', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'profile_viewed', 'Profile', '16fa9d0e-e941-5694-8fed-67a28a259705', '{"source": "seed", "n": 2}', '2026-11-20 09:00:00+00'),
  ('1a772111-2107-5a2a-a14a-424b8863bae3', '16fa9d0e-e941-5694-8fed-67a28a259705', 'help_opened', 'Profile', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '{"source": "seed", "n": 3}', '2026-11-19 09:00:00+00'),
  ('10e5f747-c357-5cfe-ba1a-fdcbaa9a7bfb', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'menu_opened', 'Profile', '1db35632-758e-5f2b-a531-8623b034fcbd', '{"source": "seed", "n": 4}', '2026-11-18 09:00:00+00'),
  ('a870ae22-631e-5fcc-b06c-6f4bc3af6287', '1db35632-758e-5f2b-a531-8623b034fcbd', 'settings_changed', 'Profile', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '{"source": "seed", "n": 5}', '2026-11-17 09:00:00+00'),
  ('32926911-e8a1-5b09-a9d4-7981c98247bc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'profile_viewed', 'Profile', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '{"source": "seed", "n": 6}', '2026-11-16 09:00:00+00'),
  ('674d915d-4923-5511-abbb-e46269796797', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'help_opened', 'Profile', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '{"source": "seed", "n": 7}', '2026-11-15 09:00:00+00'),
  ('520ded6d-0245-59b6-acc7-721767755968', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'menu_opened', 'Profile', '1b65449c-b149-5ee8-9e89-e862b03507dd', '{"source": "seed", "n": 8}', '2026-11-14 09:00:00+00'),
  ('1becdcfa-3df0-587b-adb8-66d96ac6bcbe', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'settings_changed', 'Profile', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '{"source": "seed", "n": 9}', '2026-11-13 09:00:00+00'),
  ('fc446979-9964-556d-b18c-1cd84f757587', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'profile_viewed', 'Profile', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '{"source": "seed", "n": 10}', '2026-11-12 09:00:00+00'),
  ('a4c7fb02-1fbf-502e-8641-934c4f776c9b', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'help_opened', 'Profile', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '{"source": "seed", "n": 11}', '2026-11-11 09:00:00+00'),
  ('d5f80641-44c0-59fd-a89b-eadb8956b644', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'menu_opened', 'Profile', '899a632e-c21a-571d-8821-740e44bcfe18', '{"source": "seed", "n": 12}', '2026-11-10 09:00:00+00'),
  ('47e33d1d-32ec-5f83-beac-3b4ee6182470', '899a632e-c21a-571d-8821-740e44bcfe18', 'settings_changed', 'Profile', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '{"source": "seed", "n": 13}', '2026-11-09 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_devices
INSERT INTO public."user_devices" ("Id", "UserId", "DeviceIdentifier", "Platform", "DeviceName", "CreatedAtUtc", "LastSeenAtUtc", "RevokedAtUtc", "PushTokenEncrypted", "PushTokenHash", "PushTokenUpdatedAtUtc") VALUES
  ('6bfba01b-0745-5e7b-bee9-eed584be619b', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'seed-device-000', 'android', 'Tecno Spark 10', '2026-09-23 09:00:00+00', '2026-11-22 09:00:00+00', NULL, 'enc-seed-token-0', '29dc2498b9fc450aeb3b6813a3431c3d5b3241f85c23ea01ce05cbfc0c0e515b', '2026-11-22 09:00:00+00'),
  ('ee208e9e-69ba-5e09-8be3-7e4fe60d6bab', '899a632e-c21a-571d-8821-740e44bcfe18', 'seed-device-001', 'ios', 'iPhone 13', '2026-09-23 09:00:00+00', '2026-11-21 09:00:00+00', NULL, 'enc-seed-token-1', 'af1356144957561136c5dc29b1ea073eee280bb587bdea19f8b7ce9e197114fa', '2026-11-21 09:00:00+00'),
  ('b0c88b49-2a7f-5bcb-bb09-c37dd54e138e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'seed-device-002', 'web', 'Chrome on Windows', '2026-09-23 09:00:00+00', '2026-11-20 09:00:00+00', NULL, 'enc-seed-token-2', 'a9c0dd4b246ead1398d74109b2f2139bbcf89a89e0810803a8939b3986579bb8', '2026-11-20 09:00:00+00'),
  ('d29ba820-093c-5d5f-974c-08c0bc62abd5', '16fa9d0e-e941-5694-8fed-67a28a259705', 'seed-device-003', 'android', 'Tecno Spark 10', '2026-09-23 09:00:00+00', '2026-11-19 09:00:00+00', NULL, 'enc-seed-token-3', '675408584d7263e293f470a54e0681751028fabee5ce794793bc9ec2dc0a2b02', '2026-11-19 09:00:00+00'),
  ('bfcc71ab-2256-5203-9775-0f5547a71ee9', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'seed-device-004', 'ios', 'iPhone 13', '2026-09-23 09:00:00+00', '2026-11-18 09:00:00+00', NULL, 'enc-seed-token-4', 'a4122172407607cb05f79b07b3f18326a96cc38bf9016bc4df34e94ec368eabe', '2026-11-18 09:00:00+00'),
  ('16b387fc-7d94-5684-86fc-e7e56141e738', '1db35632-758e-5f2b-a531-8623b034fcbd', 'seed-device-005', 'web', 'Chrome on Windows', '2026-09-23 09:00:00+00', '2026-11-17 09:00:00+00', NULL, 'enc-seed-token-5', 'facc1064d55360164a256005a9785df788f23a1a98c498a9ce5c98a93b84f17f', '2026-11-17 09:00:00+00'),
  ('4253fe37-397e-5fb7-9f0c-1d78ec9a7ed9', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'seed-device-006', 'android', 'Tecno Spark 10', '2026-09-23 09:00:00+00', '2026-11-16 09:00:00+00', NULL, 'enc-seed-token-6', '5fd522de0a1f0ced7dc34c48c509f15a2f4629b870804b0cd154e232bcbc63a1', '2026-11-16 09:00:00+00'),
  ('40d0cb94-4c99-59ac-8013-850189364e68', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'seed-device-007', 'ios', 'iPhone 13', '2026-09-23 09:00:00+00', '2026-11-15 09:00:00+00', NULL, 'enc-seed-token-7', 'dc74ca25fcb53dbb1a9a11ec9be9c497b251f6f7eaf3934fd42fa47f414f976e', '2026-11-15 09:00:00+00'),
  ('967488c5-71be-5da6-8641-17e607a96c5a', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'seed-device-008', 'web', 'Chrome on Windows', '2026-09-23 09:00:00+00', '2026-11-14 09:00:00+00', NULL, 'enc-seed-token-8', '4e51df2ef8ebef13d1e73b8c9d7f62a79eeb5042e933a52ececfe53d2342916e', '2026-11-14 09:00:00+00'),
  ('708e81ad-8129-5b68-99ac-0da5c3f7db70', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'seed-device-009', 'android', 'Tecno Spark 10', '2026-09-23 09:00:00+00', '2026-11-13 09:00:00+00', NULL, 'enc-seed-token-9', 'f87b4a0e7194f2f6e20f185f6e83f996c8ae692cc0c3499addd9b16aa2efd1ed', '2026-11-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_sessions
INSERT INTO public."user_sessions" ("Id", "UserId", "CreatedAtUtc", "LastSeenAtUtc", "ExpiresAtUtc", "RevokedAtUtc", "DeviceLabel", "UserAgent") VALUES
  ('677b7d83-e7e1-53dc-96a1-1727cb65a455', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-12 09:00:00+00', '2026-11-22 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'Pixel 7', 'BizConnect/1.0 (seed)'),
  ('17b9d890-4128-55dc-a01a-9ff8a221bc12', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-12 09:00:00+00', '2026-11-21 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'iPhone 13', 'BizConnect/1.0 (seed)'),
  ('fd64bbc7-5a20-5b94-9380-2aa5d03eb8ce', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-12 09:00:00+00', '2026-11-20 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'Chrome', 'BizConnect/1.0 (seed)'),
  ('21f99590-eb85-5ae4-8eab-23bcd0113f82', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-12 09:00:00+00', '2026-11-19 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'Pixel 7', 'BizConnect/1.0 (seed)'),
  ('fc492ef6-7337-5a22-803f-364ef96ea3bb', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-12 09:00:00+00', '2026-11-18 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'iPhone 13', 'BizConnect/1.0 (seed)'),
  ('94e47ac3-e292-5ffb-8fa1-cab1a082883c', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-12 09:00:00+00', '2026-11-17 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'Chrome', 'BizConnect/1.0 (seed)'),
  ('dce93be9-7101-5999-a868-16af689fd55c', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-12 09:00:00+00', '2026-11-16 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'Pixel 7', 'BizConnect/1.0 (seed)'),
  ('ca2dceda-8f73-51f2-a5ce-7a215edcdda3', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-12 09:00:00+00', '2026-11-15 09:00:00+00', '2026-12-12 09:00:00+00', NULL, 'iPhone 13', 'BizConnect/1.0 (seed)')
ON CONFLICT DO NOTHING;

-- refresh_tokens
INSERT INTO public."refresh_tokens" ("Id", "SessionId", "TokenHash", "CreatedAtUtc", "ExpiresAtUtc", "ConsumedAtUtc", "RevokedAtUtc", "ReplacedByTokenId") VALUES
  ('7e0f6305-2a08-5a65-904c-16ea350d1bb4', '677b7d83-e7e1-53dc-96a1-1727cb65a455', 'b629adbf3fb17fcfdfb0d232ce04ebd59cd3a296d2b89c1cb8eb27ad73e6cdfc', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('a14854b5-9aba-5f62-974a-815592c8f112', '17b9d890-4128-55dc-a01a-9ff8a221bc12', '91ad63a321c9197d8c6d663d490550a271cf13289d9d777a6356a01de668e0d6', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('6fbca789-7c88-5703-90e8-001aa6a41b43', 'fd64bbc7-5a20-5b94-9380-2aa5d03eb8ce', 'c0e97770cb8ca533fc0e7afb33cd317f29644165a122a6e08b753264de4f4c41', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('22095195-9a6d-547a-ac0f-8448b403c47e', '21f99590-eb85-5ae4-8eab-23bcd0113f82', '8751b252d7358dbaa2944d25ab5cd217ff5ba925326d8308f67b669e3177d4c7', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('f4041435-56b8-5101-9743-3ad23d08ebc3', 'fc492ef6-7337-5a22-803f-364ef96ea3bb', '6d058e0f87ae4ae0bcc50b7e4361b0246527f51968f82ac4a61e10824d24dc07', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('a8e9febb-0c9b-5d44-b69e-836467c35ed9', '94e47ac3-e292-5ffb-8fa1-cab1a082883c', '48cfbdd220c6a9e883304986f450dd35f0bdcf4398732d320d630f07fcf7c2f6', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('37de4a17-090e-544f-876f-1919cbae5ca5', 'dce93be9-7101-5999-a868-16af689fd55c', '5a8740fd8697fd72ee2bdddb5aa1d114ae14ce44cd8a1a81d715dd684099d171', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL),
  ('b718d6e1-6fde-5aba-b622-eb74995bd72a', 'ca2dceda-8f73-51f2-a5ce-7a215edcdda3', 'a8ec4721a60b8d226e66b230f82da9599337647fb9bd59f36aea137e095cf471', '2026-11-12 09:00:00+00', '2026-12-12 09:00:00+00', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- password_history_entries
INSERT INTO public."password_history_entries" ("Id", "UserId", "PasswordHash", "CreatedAtUtc") VALUES
  ('3d66ca1c-c7b9-5b02-935e-3ccf51f12821', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00'),
  ('d101f394-ea93-505d-bea0-c3d66a2f9278', '899a632e-c21a-571d-8821-740e44bcfe18', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00'),
  ('dda314bf-7e21-5112-a571-8904b5827df0', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00'),
  ('1ec17223-187a-5d3d-9015-577c7b77803b', '16fa9d0e-e941-5694-8fed-67a28a259705', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00'),
  ('3bfca3eb-fa8e-58ab-ae96-be0c00f45a25', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00'),
  ('25404e56-76af-55a4-a0ab-51ff467a324c', '1db35632-758e-5f2b-a531-8623b034fcbd', 'AQAAAAEAACcQAAAAED8xHLksC9QqMpjlxchlygoWhn6OxNABgNeBaLFwu1hqaWcozDfxfz3gEgcH51uhiw==', '2026-09-03 09:00:00+00')
ON CONFLICT DO NOTHING;

-- password_reset_requests
INSERT INTO public."password_reset_requests" ("Id", "UserId", "CodeHash", "CreatedAtUtc", "ExpiresAtUtc", "ConsumedAtUtc", "FailedAttempts") VALUES
  ('9fd9c4a7-43ad-539d-ba32-7651694f6160', '16fa9d0e-e941-5694-8fed-67a28a259705', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-11-20 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-20 09:00:00+00', 0),
  ('3c30121d-5658-583f-840f-6098f2b584f1', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5', '2026-11-22 08:00:00+00', '2026-11-23 09:00:00+00', NULL, 1)
ON CONFLICT DO NOTHING;

-- email_verification_challenges
INSERT INTO public."email_verification_challenges" ("Id", "UserId", "Email", "Purpose", "CodeHash", "CreatedAtUtc", "ExpiresAtUtc", "ConsumedAtUtc", "FailedAttempts") VALUES
  ('9586fc5a-d2f7-5009-afc8-94178f7a473d', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'wanjiku@seed.bizconnect.test', 'signup', 'a0073846cd42b3996ec83fe0604e6a9f71e336726fab3a6ee1cf5963ffee8d4d', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('a00720ad-6b0c-5d85-9128-52c8f04afcf4', '899a632e-c21a-571d-8821-740e44bcfe18', 'brianotieno@seed.bizconnect.test', 'signup', 'b0c82a3ade3497964cb8034be915da179459287823d92b5717e6d642784c50e6', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('f2219d81-501e-5fa0-b197-d1f7906d2fbf', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'aminah@seed.bizconnect.test', 'signup', '1248b7c394ca668965c78ca5d6f28406098181e5d99ea9424f39c4d7cbacf376', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('6f8d671a-6979-520c-817c-ec26c1f21574', '16fa9d0e-e941-5694-8fed-67a28a259705', 'kevinmw@seed.bizconnect.test', 'signup', 'fdf5ccb269a3aa419efdca65c4fac01a6cfe85d897de938d27e673762f497f1c', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('4ddbf50d-17c5-5845-8ba2-3e68e278b23e', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'gracea@seed.bizconnect.test', 'signup', 'ed8c033fe2b4cf0aaa5c47f03c927cf8d6329a5536834c9a83ab7caafe959c11', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0)
ON CONFLICT DO NOTHING;

-- phone_verification_challenges
INSERT INTO public."phone_verification_challenges" ("Id", "UserId", "PhoneNumber", "Purpose", "CodeHash", "CreatedAtUtc", "ExpiresAtUtc", "ConsumedAtUtc", "FailedAttempts") VALUES
  ('6802ef7e-75c0-5c2e-8f79-bdd3f796aa4a', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '+254710000000', 'signup', 'c0658ca8808f153c64ac3eacac248f168c6536253f06d0114fd63aa1f02a4375', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('fa562276-ca11-52a5-a2d3-d086fbb028bc', '899a632e-c21a-571d-8821-740e44bcfe18', '+254710001111', 'signup', '406a0588403185cc1733c40c02d078e887bf5af6cdbf27fc1e16f1ae2e27f97b', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('60e49d04-99e2-5590-84fb-a12d5910e0cf', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '+254710002222', 'signup', 'ed89b36b3302f5b9e66c8a2f784af3f8a5cbdeea479511cee08bf85b2e1e61a1', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', NULL, 0),
  ('c7a57585-689c-54dd-8704-8d224318dc08', '16fa9d0e-e941-5694-8fed-67a28a259705', '+254710003333', 'signup', 'b0c1f2ce176631e5f7fa6f8e25356877543c49e743f929fc01c801de20f8803e', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0),
  ('ef145333-b114-56c7-a088-4832de4d3efe', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '+254710004444', 'signup', '67d84eae58548108226e8fe046faa8602d59b715ca5660f97d703d60c83b18bb', '2026-09-23 09:00:00+00', '2026-09-24 09:00:00+00', '2026-09-23 09:00:00+00', 0)
ON CONFLICT DO NOTHING;

-- AccountDataExportRequests
INSERT INTO public."AccountDataExportRequests" ("Id", "UserId", "Status", "DownloadTokenProtected", "RequestedAtUtc", "CompletedAtUtc", "ExpiresAtUtc") VALUES
  ('c3624b45-556f-5b8d-8d81-19e996488efa', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'completed', 'protected-seed-token', '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00', '2026-11-29 09:00:00+00'),
  ('7c98b7b1-ba6f-5a6b-809d-a6926a17032d', '1db35632-758e-5f2b-a531-8623b034fcbd', 'pending', NULL, '2026-11-22 07:00:00+00', NULL, NULL)
ON CONFLICT DO NOTHING;

-- AccountDeletionRequests
INSERT INTO public."AccountDeletionRequests" ("Id", "UserId", "Status", "RequestedAtUtc", "ConfirmedAtUtc", "ScheduledDeletionAtUtc", "CanceledAtUtc") VALUES
  ('e95b864f-b8c3-5479-a050-837f14c6c7cc', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'canceled', '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00', '2026-12-02 09:00:00+00', '2026-11-03 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_blocks
INSERT INTO public."user_blocks" ("BlockerUserId", "BlockedUserId", "CreatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-07 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_follows
INSERT INTO public."user_follows" ("FollowerUserId", "FollowedUserId", "CreatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-18 09:00:00+00'),
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-14 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-18 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-14 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-10 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-14 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-10 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-18 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-14 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-10 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-18 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-10 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-14 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-10 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-06 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-14 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-06 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-14 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-10 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-06 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-14 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-10 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-10 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-06 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-02 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-10 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-06 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-10 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-06 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-02 09:00:00+00')
ON CONFLICT DO NOTHING;

-- SubscriptionPlans
INSERT INTO public."SubscriptionPlans" ("Id", "Code", "DisplayName", "Currency", "MonthlyPrice", "YearlyPrice", "IsActive") VALUES
  ('6a59a409-d56a-595e-bd58-22d7d20b0ae6', 'seed_free', 'Free', 'KES', 0.00, 0.00, true),
  ('9d760cd4-be0f-5297-b3ea-c1aaf5955a74', 'seed_pro', 'Business Pro', 'KES', 999.00, 9990.00, true),
  ('453dd6b8-eb5c-52fb-bb87-b7de7549d0e5', 'seed_plus', 'Business Plus', 'KES', 2499.00, 24990.00, true)
ON CONFLICT DO NOTHING;

-- UserSubscriptions
INSERT INTO public."UserSubscriptions" ("Id", "UserId", "PlanId", "Status", "BillingCycle", "CurrentPeriodEndsAtUtc", "CanceledAtUtc", "Provider", "ProviderSubscriptionId", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('9f1c54b9-adbc-5b14-9675-ea0a16f23cc5', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '9d760cd4-be0f-5297-b3ea-c1aaf5955a74', 1, 0, '2026-12-12 09:00:00+00', NULL, 'mpesa', 'seed-sub-001', '2026-10-13 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('aa6995dc-8e82-5567-a1d8-a24a4b885bac', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '453dd6b8-eb5c-52fb-bb87-b7de7549d0e5', 1, 1, '2027-06-10 09:00:00+00', NULL, 'card', 'seed-sub-002', '2026-06-15 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('ca8eef31-c91a-5970-8d59-a49184c2636e', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '6a59a409-d56a-595e-bd58-22d7d20b0ae6', 1, 0, NULL, NULL, NULL, NULL, '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00')
ON CONFLICT DO NOTHING;

-- SupportTickets
INSERT INTO public."SupportTickets" ("Id", "UserId", "Subject", "Message", "Status", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('42292ee3-274c-5c1c-915b-ccd01176aef6', '899a632e-c21a-571d-8821-740e44bcfe18', 'Can''t upload logo', 'My business logo fails to upload on Android.', 0, '2026-11-12 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('f9d7e6b2-b946-55e9-83a5-0cc29ed5bd38', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'Change phone number', 'How do I change my verified phone number?', 1, '2026-11-13 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('c56f5b84-561a-5d85-ae8c-b91ed1b1d6be', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Payment failed', 'M-Pesa payment was deducted but plan not upgraded.', 2, '2026-11-14 09:00:00+00', '2026-11-19 09:00:00+00'),
  ('477912e5-970d-5380-9885-bab845726dba', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Report a review', 'A review on my page is abusive, please look.', 0, '2026-11-15 09:00:00+00', '2026-11-20 09:00:00+00'),
  ('34b1a7c7-55fd-54ef-9e66-907cb9484a06', '1db35632-758e-5f2b-a531-8623b034fcbd', 'Delivery question', 'How can customers see my delivery areas?', 1, '2026-11-16 09:00:00+00', '2026-11-21 09:00:00+00')
ON CONFLICT DO NOTHING;

-- SavedContent
INSERT INTO public."SavedContent" ("Id", "UserId", "ContentId", "Kind", "SavedAtUtc") VALUES
  ('2cbdb75c-a374-56f1-a27f-c6488c44fcd0', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', 0, '2026-11-22 09:00:00+00'),
  ('8b75c10e-dc52-5fa3-adc9-d067391294b8', '899a632e-c21a-571d-8821-740e44bcfe18', '5859850b-aa3a-5849-9961-ad4e09e20f34', 0, '2026-11-21 09:00:00+00'),
  ('9d4cb524-150d-55bb-8011-7f0c485e7004', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'f618e541-20c1-5132-9f3b-e57bc1058561', 0, '2026-11-20 09:00:00+00'),
  ('982a6f89-152e-52fe-8458-30a060476bf4', '16fa9d0e-e941-5694-8fed-67a28a259705', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', 0, '2026-11-19 09:00:00+00'),
  ('5d0db8ed-69ff-55cc-80c2-8b67da886436', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '49d2c53e-20b3-5711-abf6-b967b187c3b3', 0, '2026-11-18 09:00:00+00'),
  ('255d2d39-3722-533e-8208-8d2fb0434a01', '1db35632-758e-5f2b-a531-8623b034fcbd', '4760cd0e-524d-5467-adfc-99a2652eb66e', 0, '2026-11-17 09:00:00+00'),
  ('c8853f1d-039b-52f1-b25c-67f73f80e90b', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'cd6a273b-9acc-55aa-8841-b649ca4ee628', 0, '2026-11-16 09:00:00+00'),
  ('42997f53-30e4-5e90-8ca3-acd7b276fa76', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '4103383b-d6fa-5517-90b4-2dd868248da2', 0, '2026-11-15 09:00:00+00'),
  ('ce9369f1-9faa-5b64-8c53-80bd03dd6b71', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'c8413767-0301-576c-bb2d-a7bfe213d0f9', 0, '2026-11-14 09:00:00+00'),
  ('a2a28d00-7de0-56bd-a487-4f1abc6a4cee', '1b65449c-b149-5ee8-9e89-e862b03507dd', '0d6e9c42-7dc0-55e5-b863-2ab25962031b', 0, '2026-11-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- businesses
INSERT INTO public."businesses" ("Id", "OwnerUserId", "Slug", "Name", "BusinessType", "Category", "Subcategory", "Description", "About", "Founder", "OriginStory", "County", "Town", "Neighbourhood", "ServiceAreas", "Phone", "Whatsapp", "Email", "Website", "PriceRange", "OperatingHours", "SocialLinksJson", "Logo", "Cover", "Visibility", "Status", "CreatedAtUtc", "UpdatedAtUtc", "ArchivedAtUtc", "Version") VALUES
  ('280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'mama-njeris-kitchen', 'Mama Njeri''s Kitchen', 'hybrid', 'Food & Beverage', 'Catering', 'Mama Njeri''s Kitchen - trusted local catering in Westlands.', 'Mama Njeri''s Kitchen serves customers across Nairobi with quality and fair prices.', 'Wanjiku Kamau', 'Started in Parklands to serve neighbours, and grew by word of mouth.', 'Nairobi', 'Westlands', 'Parklands', ARRAY['Westlands','Nairobi']::text[], '+254710000000', '+254710000000', 'hello@mama-njeris-kitchen.test', 'https://mama-njeris-kitchen.example.com', 'KSh KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@mama-njeris-kitchen", "facebook": "mama-njeris-kitchen"}'::jsonb, 'https://picsum.photos/seed/logo0/200', 'https://picsum.photos/seed/cover0/800/300', 'public', 'active', '2026-09-13 09:00:00+00', '2026-11-22 09:00:00+00', NULL, 'e11c7488-d925-52cb-b1ed-63314e2d8d2c'),
  ('8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'lake-basin-fresh-fish', 'Lake Basin Fresh Fish', 'products', 'Food & Beverage', 'Fish Market', 'Lake Basin Fresh Fish - trusted local fish market in Kisumu Central.', 'Lake Basin Fresh Fish serves customers across Kisumu with quality and fair prices.', 'Brian Otieno', 'Started in Milimani to serve neighbours, and grew by word of mouth.', 'Kisumu', 'Kisumu Central', 'Milimani', ARRAY['Kisumu Central','Kisumu']::text[], '+254710001111', '+254710001111', 'hello@lake-basin-fresh-fish.test', 'https://lake-basin-fresh-fish.example.com', 'KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@lake-basin-fresh-fish", "facebook": "lake-basin-fresh-fish"}'::jsonb, 'https://picsum.photos/seed/logo1/200', 'https://picsum.photos/seed/cover1/800/300', 'public', 'active', '2026-09-16 09:00:00+00', '2026-11-21 09:00:00+00', NULL, '28297021-8138-5635-88ba-af19d9c8c170'),
  ('bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'coastal-glow-salon', 'Coastal Glow Salon', 'services', 'Beauty', 'Salon', 'Coastal Glow Salon - trusted local salon in Nyali.', 'Coastal Glow Salon serves customers across Mombasa with quality and fair prices.', 'Amina Hassan', 'Started in Nyali to serve neighbours, and grew by word of mouth.', 'Mombasa', 'Nyali', 'Nyali', ARRAY['Nyali','Mombasa']::text[], '+254710002222', '+254710002222', 'hello@coastal-glow-salon.test', 'https://coastal-glow-salon.example.com', 'KSh KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@coastal-glow-salon", "facebook": "coastal-glow-salon"}'::jsonb, 'https://picsum.photos/seed/logo2/200', 'https://picsum.photos/seed/cover2/800/300', 'public', 'active', '2026-09-19 09:00:00+00', '2026-11-20 09:00:00+00', NULL, '5ca3006a-9870-582c-b1bc-d778a80bb2b2'),
  ('9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'rift-tech-repairs', 'Rift Tech Repairs', 'services', 'Technology', 'Phone Repair', 'Rift Tech Repairs - trusted local phone repair in Nakuru East.', 'Rift Tech Repairs serves customers across Nakuru with quality and fair prices.', 'Kevin Mwangi', 'Started in Section 58 to serve neighbours, and grew by word of mouth.', 'Nakuru', 'Nakuru East', 'Section 58', ARRAY['Nakuru East','Nakuru']::text[], '+254710003333', '+254710003333', 'hello@rift-tech-repairs.test', 'https://rift-tech-repairs.example.com', 'KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@rift-tech-repairs", "facebook": "rift-tech-repairs"}'::jsonb, 'https://picsum.photos/seed/logo3/200', 'https://picsum.photos/seed/cover3/800/300', 'public', 'active', '2026-09-22 09:00:00+00', '2026-11-19 09:00:00+00', NULL, '35ecbdf5-3210-553a-821f-e88ea278b843'),
  ('5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'kilimani-threads', 'Kilimani Threads', 'products', 'Fashion', 'Boutique', 'Kilimani Threads - trusted local boutique in Kilimani.', 'Kilimani Threads serves customers across Nairobi with quality and fair prices.', 'Grace Achieng', 'Started in Kilimani to serve neighbours, and grew by word of mouth.', 'Nairobi', 'Kilimani', 'Kilimani', ARRAY['Kilimani','Nairobi']::text[], '+254710004444', '+254710004444', 'hello@kilimani-threads.test', 'https://kilimani-threads.example.com', 'KSh KSh KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@kilimani-threads", "facebook": "kilimani-threads"}'::jsonb, 'https://picsum.photos/seed/logo4/200', 'https://picsum.photos/seed/cover4/800/300', 'public', 'active', '2026-09-25 09:00:00+00', '2026-11-18 09:00:00+00', NULL, '4c698c43-6222-5f4f-ab81-be5756a5a580'),
  ('8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'eldoret-grain-hub', 'Eldoret Grain Hub', 'products', 'Agriculture', 'Grains', 'Eldoret Grain Hub - trusted local grains in Eldoret.', 'Eldoret Grain Hub serves customers across Uasin Gishu with quality and fair prices.', 'Daniel Kiprop', 'Started in Elgon View to serve neighbours, and grew by word of mouth.', 'Uasin Gishu', 'Eldoret', 'Elgon View', ARRAY['Eldoret','Uasin Gishu']::text[], '+254710005555', '+254710005555', 'hello@eldoret-grain-hub.test', 'https://eldoret-grain-hub.example.com', 'KSh', 'Mon-Sat 8:00-18:00', '{"instagram": "@eldoret-grain-hub", "facebook": "eldoret-grain-hub"}'::jsonb, 'https://picsum.photos/seed/logo5/200', 'https://picsum.photos/seed/cover5/800/300', 'public', 'active', '2026-09-28 09:00:00+00', '2026-11-17 09:00:00+00', NULL, '539e338b-31a6-5eb0-900d-ef257c1eaaaf')
ON CONFLICT DO NOTHING;

-- business_memberships
INSERT INTO public."business_memberships" ("Id", "BusinessId", "UserId", "Role", "GrantedByUserId", "JoinedAtUtc", "UpdatedAtUtc", "RevokedAtUtc", "Version") VALUES
  ('c4d249e0-3d54-5f91-880b-e56eff5f87cd', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'Owner', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-09-13 09:00:00+00', '2026-09-23 09:00:00+00', NULL, '6254eaca-aee3-5d4a-b009-b5c6e6dfe623'),
  ('8ac8103e-0efc-5e0f-85b8-462250f799ca', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'Owner', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-09-16 09:00:00+00', '2026-09-23 09:00:00+00', NULL, 'd304c6d8-4d0a-5714-8303-c91226e37e64'),
  ('14723299-4c91-5135-83b7-4332167020cd', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'Owner', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-09-19 09:00:00+00', '2026-09-23 09:00:00+00', NULL, 'e000fda5-8d00-5046-a057-77641a5ee541'),
  ('ffc561b6-2f86-5da9-a834-8426213fe43e', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Owner', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-09-22 09:00:00+00', '2026-09-23 09:00:00+00', NULL, '5e3c60ee-44f5-57d4-a4b8-609b0fe8f260'),
  ('8cb4da54-7419-54f4-b95b-994d21456d29', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Owner', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-09-25 09:00:00+00', '2026-09-23 09:00:00+00', NULL, '720ad428-18e9-5d07-9736-1bc6c8395e25'),
  ('ada3b9c4-010a-51a6-9639-de3f30f2eade', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'Owner', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-09-28 09:00:00+00', '2026-09-23 09:00:00+00', NULL, 'f364687e-6074-5226-8ffb-2fc50bce11d4'),
  ('383bd041-f29c-5f00-befa-7c92455d54bb', '280488ab-1b8f-5a47-9489-ce75188f28b1', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Admin', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-10-13 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '557cfa1c-348c-5f5c-8cb2-d5237b984c37'),
  ('54ba4bd7-3250-5e65-a6aa-18c35a35adb6', '280488ab-1b8f-5a47-9489-ce75188f28b1', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'Editor', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-10-18 09:00:00+00', '2026-10-18 09:00:00+00', NULL, '16f46a8e-1eeb-5fda-b492-a0c07ab3cedb'),
  ('a77648da-23b7-5d20-a6e3-71053c1b9ae5', '5fbd70f3-0365-5cf8-b327-324de069352a', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Viewer', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00', NULL, '4d5ba182-cf06-59d8-b4f3-c6233e3036cc')
ON CONFLICT DO NOTHING;

-- business_invitations
INSERT INTO public."business_invitations" ("Id", "BusinessId", "InvitedUserId", "InvitedByUserId", "Role", "Status", "CreatedAtUtc", "ExpiresAtUtc", "RespondedAtUtc", "CancelledAtUtc", "Version") VALUES
  ('f1bfddfc-a940-5871-bfb0-d579a9c17051', '8aa68099-7e22-5399-a41a-b873be05ef51', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '899a632e-c21a-571d-8821-740e44bcfe18', 'Editor', 'pending', '2026-11-20 09:00:00+00', '2026-11-27 09:00:00+00', NULL, NULL, 'ac274cd5-81b3-5afe-8df0-a9cae2924977'),
  ('426b0ddc-8431-5fa4-b9c2-822dd4edcefe', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '1b65449c-b149-5ee8-9e89-e862b03507dd', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'Viewer', 'declined', '2026-11-10 09:00:00+00', '2026-11-17 09:00:00+00', '2026-11-12 09:00:00+00', NULL, '9d9e8cc1-ff5a-53bf-bd32-ba937447a61b'),
  ('c4eb5d85-ddcf-5575-83ce-8c1239f42838', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Admin', 'cancelled', '2026-11-07 09:00:00+00', '2026-11-14 09:00:00+00', NULL, '2026-11-08 09:00:00+00', 'd3d1a18c-313d-52d1-bd81-92e53acbbee3')
ON CONFLICT DO NOTHING;

-- business_ownership_transfers
INSERT INTO public."business_ownership_transfers" ("Id", "BusinessId", "FromUserId", "ToUserId", "RequestedByUserId", "Status", "CreatedAtUtc", "ExpiresAtUtc", "RespondedAtUtc", "CancelledAtUtc", "Version") VALUES
  ('796c6a91-09bc-50c3-9795-c6d4606f8541', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '1db35632-758e-5f2b-a531-8623b034fcbd', 'pending', '2026-11-21 09:00:00+00', '2026-11-28 09:00:00+00', NULL, NULL, '43d7104a-5dcd-53fc-90b8-adb8c23da7b0'),
  ('7cb14298-39ed-5a2f-9b88-417209f20e3d', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '16fa9d0e-e941-5694-8fed-67a28a259705', 'cancelled', '2026-10-23 09:00:00+00', '2026-10-30 09:00:00+00', NULL, '2026-10-24 09:00:00+00', 'e0d0a712-2227-58e7-ab0c-c514fbd7d705')
ON CONFLICT DO NOTHING;

-- business_follows
INSERT INTO public."business_follows" ("UserId", "BusinessId", "CreatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '2026-11-19 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '2026-11-19 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', '8398434e-ee49-5d50-9c17-c727138512b7', '2026-11-16 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '8aa68099-7e22-5399-a41a-b873be05ef51', '2026-11-19 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '5fbd70f3-0365-5cf8-b327-324de069352a', '2026-11-16 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '280488ab-1b8f-5a47-9489-ce75188f28b1', '2026-11-19 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '2026-11-16 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '8398434e-ee49-5d50-9c17-c727138512b7', '2026-11-13 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '8aa68099-7e22-5399-a41a-b873be05ef51', '2026-11-16 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '5fbd70f3-0365-5cf8-b327-324de069352a', '2026-11-13 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '280488ab-1b8f-5a47-9489-ce75188f28b1', '2026-11-16 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '2026-11-13 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '2026-11-13 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', '8398434e-ee49-5d50-9c17-c727138512b7', '2026-11-10 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '8aa68099-7e22-5399-a41a-b873be05ef51', '2026-11-13 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '5fbd70f3-0365-5cf8-b327-324de069352a', '2026-11-10 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '280488ab-1b8f-5a47-9489-ce75188f28b1', '2026-11-13 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '2026-11-10 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '2026-11-10 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', '8398434e-ee49-5d50-9c17-c727138512b7', '2026-11-07 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '8aa68099-7e22-5399-a41a-b873be05ef51', '2026-11-10 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '5fbd70f3-0365-5cf8-b327-324de069352a', '2026-11-07 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_activity
INSERT INTO public."business_activity" ("Id", "BusinessId", "ActorUserId", "EventType", "Summary", "CreatedAtUtc", "MetadataJson") VALUES
  ('0c3f5915-4f77-5832-a6a9-b4f874c15239', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'profile_updated', 'Updated business profile', '2026-11-22 09:00:00+00', '{"seed": true, "i": 0}'::jsonb),
  ('cb80280e-b18d-5b88-ad6e-fffa3b43b96f', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'item_published', 'Published a new catalog item', '2026-11-21 09:00:00+00', '{"seed": true, "i": 1}'::jsonb),
  ('05bec26d-07fd-582d-9dc5-754243931e7e', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'member_added', 'Added a team member', '2026-11-20 09:00:00+00', '{"seed": true, "i": 2}'::jsonb),
  ('6afaff94-074d-5de7-bd38-2eec5bd001de', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'hours_changed', 'Changed opening hours', '2026-11-19 09:00:00+00', '{"seed": true, "i": 3}'::jsonb),
  ('eafd2a31-9a1a-526f-8214-f7f1877ea988', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'profile_updated', 'Updated business profile', '2026-11-18 09:00:00+00', '{"seed": true, "i": 4}'::jsonb),
  ('8c3d757b-5886-552f-a692-b681105ba62b', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'item_published', 'Published a new catalog item', '2026-11-17 09:00:00+00', '{"seed": true, "i": 5}'::jsonb),
  ('09152994-9dce-5c40-8917-a1d10571e66f', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'member_added', 'Added a team member', '2026-11-16 09:00:00+00', '{"seed": true, "i": 6}'::jsonb),
  ('b89c1b44-7d17-52e8-bd00-e6880e73e2fe', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'hours_changed', 'Changed opening hours', '2026-11-15 09:00:00+00', '{"seed": true, "i": 7}'::jsonb),
  ('dcb9d838-6cac-5cf4-993d-0d1cc4e84aa2', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'profile_updated', 'Updated business profile', '2026-11-14 09:00:00+00', '{"seed": true, "i": 8}'::jsonb),
  ('fd03b9a2-674a-5054-b4cd-10a74453d83f', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'item_published', 'Published a new catalog item', '2026-11-13 09:00:00+00', '{"seed": true, "i": 9}'::jsonb),
  ('a3a75f43-55b6-500b-b4e1-6a444fbd15b8', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'member_added', 'Added a team member', '2026-11-12 09:00:00+00', '{"seed": true, "i": 10}'::jsonb),
  ('1e53daae-fc8b-55a7-912a-928a3dd29f59', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'hours_changed', 'Changed opening hours', '2026-11-11 09:00:00+00', '{"seed": true, "i": 11}'::jsonb)
ON CONFLICT DO NOTHING;

-- business_analytics_events
INSERT INTO public."business_analytics_events" ("Id", "BusinessId", "ActorUserId", "EventType", "SubjectType", "SubjectId", "MetadataJson", "CreatedAtUtc") VALUES
  ('e7d27db5-a7d5-57fe-9852-69043a7b21f5', '280488ab-1b8f-5a47-9489-ce75188f28b1', NULL, 'profile_view', 'business', '280488ab-1b8f-5a47-9489-ce75188f28b1', '{"seed": true}'::jsonb, '2026-11-22 09:00:00+00'),
  ('636cb223-a3af-5f13-bc6c-0e963e285f12', '8aa68099-7e22-5399-a41a-b873be05ef51', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'catalog_view', 'business', '8aa68099-7e22-5399-a41a-b873be05ef51', '{"seed": true}'::jsonb, '2026-11-21 09:00:00+00'),
  ('a36d215b-767c-5627-925e-14ff351d5bcf', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '1db35632-758e-5f2b-a531-8623b034fcbd', 'contact_click', 'business', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '{"seed": true}'::jsonb, '2026-11-20 09:00:00+00'),
  ('ce372f85-bac5-52cc-8252-752ff1ff034d', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'follow', 'business', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '{"seed": true}'::jsonb, '2026-11-19 09:00:00+00'),
  ('ae8d7eda-8e6f-5c73-b91b-f488a50c9ab1', '5fbd70f3-0365-5cf8-b327-324de069352a', NULL, 'profile_view', 'business', '5fbd70f3-0365-5cf8-b327-324de069352a', '{"seed": true}'::jsonb, '2026-11-18 09:00:00+00'),
  ('511c3d08-319b-523f-a110-cebe03aa8863', '8398434e-ee49-5d50-9c17-c727138512b7', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'catalog_view', 'business', '8398434e-ee49-5d50-9c17-c727138512b7', '{"seed": true}'::jsonb, '2026-11-17 09:00:00+00'),
  ('6b856c58-de2f-5f34-a7b6-dd9f1ab66d62', '280488ab-1b8f-5a47-9489-ce75188f28b1', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'contact_click', 'business', '280488ab-1b8f-5a47-9489-ce75188f28b1', '{"seed": true}'::jsonb, '2026-11-16 09:00:00+00'),
  ('c3a3e7d4-3db0-5e0d-b727-aa924ca2f603', '8aa68099-7e22-5399-a41a-b873be05ef51', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'follow', 'business', '8aa68099-7e22-5399-a41a-b873be05ef51', '{"seed": true}'::jsonb, '2026-11-15 09:00:00+00'),
  ('63c3ea8d-f484-5600-bfc8-a365e5017ee5', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', NULL, 'profile_view', 'business', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '{"seed": true}'::jsonb, '2026-11-14 09:00:00+00'),
  ('bd5c0e93-6109-50d9-ac46-df5421abfbcd', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'catalog_view', 'business', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '{"seed": true}'::jsonb, '2026-11-13 09:00:00+00'),
  ('b266062f-f3a1-5ed8-b67f-cade91884aa8', '5fbd70f3-0365-5cf8-b327-324de069352a', '899a632e-c21a-571d-8821-740e44bcfe18', 'contact_click', 'business', '5fbd70f3-0365-5cf8-b327-324de069352a', '{"seed": true}'::jsonb, '2026-11-12 09:00:00+00'),
  ('5707621d-7269-5802-bcc2-3d7013f8bda7', '8398434e-ee49-5d50-9c17-c727138512b7', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'follow', 'business', '8398434e-ee49-5d50-9c17-c727138512b7', '{"seed": true}'::jsonb, '2026-11-11 09:00:00+00'),
  ('aefeec24-b58d-5505-8fa5-ec2f8a2c2d5d', '280488ab-1b8f-5a47-9489-ce75188f28b1', NULL, 'profile_view', 'business', '280488ab-1b8f-5a47-9489-ce75188f28b1', '{"seed": true}'::jsonb, '2026-11-10 09:00:00+00'),
  ('a02f59ef-64e6-5f77-a2b7-7776f07ff156', '8aa68099-7e22-5399-a41a-b873be05ef51', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'catalog_view', 'business', '8aa68099-7e22-5399-a41a-b873be05ef51', '{"seed": true}'::jsonb, '2026-11-09 09:00:00+00'),
  ('198d71d6-c4cb-53f4-be70-95bcb0d2fc35', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '1db35632-758e-5f2b-a531-8623b034fcbd', 'contact_click', 'business', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '{"seed": true}'::jsonb, '2026-11-22 09:00:00+00'),
  ('7434c6b3-3c7e-525b-8467-3ed430803258', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'follow', 'business', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '{"seed": true}'::jsonb, '2026-11-21 09:00:00+00'),
  ('2d59c90a-85b8-5061-8fba-6e6d46664285', '5fbd70f3-0365-5cf8-b327-324de069352a', NULL, 'profile_view', 'business', '5fbd70f3-0365-5cf8-b327-324de069352a', '{"seed": true}'::jsonb, '2026-11-20 09:00:00+00'),
  ('59c10447-e06e-5b54-b6b6-ab38e316c5bb', '8398434e-ee49-5d50-9c17-c727138512b7', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'catalog_view', 'business', '8398434e-ee49-5d50-9c17-c727138512b7', '{"seed": true}'::jsonb, '2026-11-19 09:00:00+00'),
  ('3f51c7bf-8dd4-5e91-ad94-674fe6416fe9', '280488ab-1b8f-5a47-9489-ce75188f28b1', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'contact_click', 'business', '280488ab-1b8f-5a47-9489-ce75188f28b1', '{"seed": true}'::jsonb, '2026-11-18 09:00:00+00'),
  ('4a3db683-ee52-5bbd-80fc-7d448006c80c', '8aa68099-7e22-5399-a41a-b873be05ef51', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'follow', 'business', '8aa68099-7e22-5399-a41a-b873be05ef51', '{"seed": true}'::jsonb, '2026-11-17 09:00:00+00'),
  ('c56ff160-d1a4-56ec-a9d5-95d438ac8d1c', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', NULL, 'profile_view', 'business', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '{"seed": true}'::jsonb, '2026-11-16 09:00:00+00'),
  ('4d1515d2-bba8-53ee-b80e-48b9f6c64a0b', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'catalog_view', 'business', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '{"seed": true}'::jsonb, '2026-11-15 09:00:00+00'),
  ('501d972f-ceee-5f66-9190-2c4f380d8ccf', '5fbd70f3-0365-5cf8-b327-324de069352a', '899a632e-c21a-571d-8821-740e44bcfe18', 'contact_click', 'business', '5fbd70f3-0365-5cf8-b327-324de069352a', '{"seed": true}'::jsonb, '2026-11-14 09:00:00+00'),
  ('26b0196b-b23e-548d-9da1-6c3115792f49', '8398434e-ee49-5d50-9c17-c727138512b7', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'follow', 'business', '8398434e-ee49-5d50-9c17-c727138512b7', '{"seed": true}'::jsonb, '2026-11-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_milestones
INSERT INTO public."business_milestones" ("Id", "BusinessId", "CreatedByUserId", "Title", "Description", "AchievedAtUtc", "IsSelfReported", "Visibility", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('82ee401f-17a3-5b2e-8a5f-57181e41a4ce', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'First 100 customers', 'Reached 100 happy customers.', '2026-10-23 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00'),
  ('b5e21c0f-8470-5ede-b67a-f1092e9aef35', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'Opened second branch', 'Expanded to a new location.', '2026-10-13 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00'),
  ('08d911e2-a695-528c-a4d1-bc6ce19fdd5e', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '1 year in business', 'Celebrated our first anniversary.', '2026-10-03 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00'),
  ('ed20ea88-1436-52de-a9d4-75964ef8a75a', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Hired 5 staff', 'Grew the team to five.', '2026-09-23 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00'),
  ('06b2daaf-9b25-54e4-9c20-fb566de38f23', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Featured locally', 'Mentioned by a local radio station.', '2026-09-13 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00'),
  ('844d7433-aa68-5b84-be7d-5f2aa6deeea7', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', '500 followers', 'Hit 500 followers on BizConnect.', '2026-09-03 09:00:00+00', true, 'public', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_opportunities
INSERT INTO public."business_opportunities" ("Id", "BusinessId", "CreatedByUserId", "Title", "Description", "Category", "Budget", "Currency", "ExpiresAtUtc", "Status", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('2940f33f-c9b9-5e6c-8f16-6eedbb931956', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'Wedding catering supplier', 'Looking for a reliable supplier of fresh vegetables for events.', 'Supply', 150000.00, 'KES', '2026-12-22 09:00:00+00', 'open', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('7e88a4ea-5769-5e3a-a5c3-ad0f79342fba', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Freelance photographer', 'Need a photographer for our new collection shoot.', 'Services', 40000.00, 'KES', '2026-12-06 09:00:00+00', 'open', '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00'),
  ('079bdc19-c7a6-5860-975a-5efe404e19bd', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Parts distributor', 'Seeking phone screen distributor in Nakuru.', 'Supply', NULL, 'KES', '2026-11-20 09:00:00+00', 'closed', '2026-10-23 09:00:00+00', '2026-11-20 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_reviews
INSERT INTO public."business_reviews" ("Id", "BusinessId", "ReviewerUserId", "Rating", "Comment", "Status", "OwnerResponse", "OwnerRespondedAtUtc", "OwnerRespondedByUserId", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('58922793-bd9c-5085-96e5-a42159dc7f87', '280488ab-1b8f-5a47-9489-ce75188f28b1', '899a632e-c21a-571d-8821-740e44bcfe18', 5, 'Best pilau in Westlands, delivery was quick!', 'published', 'Asante sana, karibu tena!', '2026-11-21 09:00:00+00', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('a539139f-970c-574b-aafb-197884803515', '280488ab-1b8f-5a47-9489-ce75188f28b1', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 4, 'Great food, slightly late once.', 'published', NULL, NULL, NULL, '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('8495b580-27b2-52a3-a10a-a91c32da1553', '8aa68099-7e22-5399-a41a-b873be05ef51', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 5, 'Fresh tilapia every time.', 'published', 'Thank you for the support!', '2026-11-21 09:00:00+00', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('4b195061-fee2-560a-8930-98b0c354d725', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '16fa9d0e-e941-5694-8fed-67a28a259705', 4, 'Lovely braids and friendly staff.', 'published', NULL, NULL, NULL, '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('8c3e9b6a-7384-5531-9448-15407945b1ee', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 5, 'Fixed my screen in 30 minutes.', 'published', NULL, NULL, NULL, '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('7424ec93-a644-5c2a-b164-6c37bb5a2510', '5fbd70f3-0365-5cf8-b327-324de069352a', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 3, 'Nice outfits but pricey.', 'published', 'We have a sale coming soon.', '2026-11-21 09:00:00+00', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('c277200e-0d2a-500e-8a49-ebb1894bb05f', '8398434e-ee49-5d50-9c17-c727138512b7', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 4, 'Good quality maize flour.', 'published', NULL, NULL, NULL, '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('0e7f0dc3-6c1c-57ee-9114-a7aec2f04814', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 2, 'Waited too long for my appointment.', 'reported', NULL, NULL, NULL, '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00')
ON CONFLICT DO NOTHING;

-- media_assets
INSERT INTO public."media_assets" ("Id", "BusinessId", "UploadedByUserId", "Provider", "StorageKey", "ContentType", "SizeBytes", "Sha256", "WidthPx", "HeightPx", "Status", "CreatedAtUtc", "DeletedAtUtc", "Version") VALUES
  ('7e30fb91-a3a6-5787-88cf-a1402fcba2d3', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'local', 'seed/biz0/img0.jpg', 'image/jpeg', 120000, 'cce45ee70ff6bc059e3adefbb5f20c92c3e9bebd8ef9aa6faea843decee4a8a8', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '2c14505f-e3fc-59e1-bcc9-5f6c97db0b68'),
  ('14e1be07-e8c3-5460-b557-e7b47959d312', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'local', 'seed/biz1/img1.jpg', 'image/jpeg', 127777, '8f1967171fe855974b530a3d82a377a568f9df1cfe39b324ea755017c63343ab', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '464dd98f-90d4-520e-ade9-762b59c6de7e'),
  ('c40ebf9a-a1e1-5085-89d5-05ffb79875f1', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'local', 'seed/biz2/img2.jpg', 'image/jpeg', 135554, 'a23bec3f1fd9fb92ce3f5d7f415db07749707f7c53dacbb2bd570b68c14f8bd3', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '2070a29e-554d-50fd-bbb7-005fd15234d1'),
  ('dc1a442b-22b0-5fc5-b4e8-eb8cb2509049', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'local', 'seed/biz3/img3.jpg', 'image/jpeg', 143331, '5dc545f302a37709e3aa4fda65d518eafbcec404d10b8dbb185c702d2921c380', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'd745531a-bedd-50b8-9cbe-9e5eec613300'),
  ('d1539242-a77d-577a-baaa-cb648310efa8', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'local', 'seed/biz4/img4.jpg', 'image/jpeg', 151108, '0241c20fa1cab65d2609d52bbecfb7db69e50817ec2da80aa8113e9078acfb6f', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'ceee15a1-7dd9-5cd5-bd81-3c101c985ae5'),
  ('21d00a32-aa51-5cae-9c26-e2889c5422a2', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'local', 'seed/biz5/img5.jpg', 'image/jpeg', 158885, '928148cfa9fefa108a999ee77309e6d15955c707d2fafd1f3ec96b3087d224b7', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'c137fa84-c32c-5d1b-a579-b68902300433'),
  ('de0c1e97-0b5e-54f2-a85a-fe65ad472e64', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'local', 'seed/biz0/img6.jpg', 'image/jpeg', 166662, '5401bacb2358ed35c30758d2d5baf2831fd8f7e63b0651cbdd446476ff1cec3d', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'c47c0e2f-8c5e-55df-af7e-2ac3105befc9'),
  ('dae34e2b-673d-5e0d-8fe8-066cf1697813', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'local', 'seed/biz1/img7.jpg', 'image/jpeg', 174439, '6d85bf39d3992b5435d9c1db56e0388c0b153ab89eaf83d32a9969ef0a7f0131', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '7cb90296-22a0-523d-8f86-9a9c50a9c66f')
ON CONFLICT DO NOTHING;

-- catalog_items
INSERT INTO public."catalog_items" ("Id", "BusinessId", "CreatedByUserId", "Kind", "Title", "Slug", "Description", "Category", "Subcategory", "PriceKsh", "PriceNote", "Currency", "PriceNegotiable", "Sku", "StockQuantity", "InStock", "Unit", "AvailabilityStatus", "LeadTimeDays", "DurationMinutes", "ServiceAreas", "VisitType", "Status", "AttributesJson", "CreatedAtUtc", "UpdatedAtUtc", "PublishedAtUtc", "ArchivedAtUtc", "Version") VALUES
  ('3868d979-2792-5943-9f2f-7f2cf4836263', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'product', 'Pilau (Family Pack)', 'pilau-family-pack', 'Pilau (Family Pack) from Mama Njeri''s Kitchen.', 'Food', 'Meals', 850.00, 'per pack', 'KES', true, 'SKU-000', 20, true, 'pcs', 'available', NULL, NULL, ARRAY['Westlands']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '902a8187-64da-5718-8b83-e33754c6dfbc'),
  ('a604a6c3-7b02-5288-a8e9-c29587ddb2dc', '280488ab-1b8f-5a47-9489-ce75188f28b1', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'service', 'Event Catering (50 guests)', 'event-catering-50', 'Event Catering (50 guests) from Mama Njeri''s Kitchen.', 'Catering', 'Events', 35000.00, 'from', 'KES', false, NULL, NULL, NULL, NULL, 'available', 2, 60, ARRAY['Westlands']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '2398189f-0c80-581a-8249-3a1830eb71cf'),
  ('87f4a95f-fc1e-5330-92d0-c2660e804e8c', '8aa68099-7e22-5399-a41a-b873be05ef51', '899a632e-c21a-571d-8821-740e44bcfe18', 'product', 'Fresh Tilapia (1kg)', 'fresh-tilapia-1kg', 'Fresh Tilapia (1kg) from Lake Basin Fresh Fish.', 'Fish', 'Fresh', 450.00, 'per kg', 'KES', false, 'SKU-002', 22, true, 'pcs', 'available', NULL, NULL, ARRAY['Kisumu Central']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '1edf83a1-6a28-5b91-9097-a050cccfce4e'),
  ('78385bd3-97f7-5d33-81b2-c80bb645c3d1', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'service', 'Box Braids', 'box-braids', 'Box Braids from Coastal Glow Salon.', 'Hair', 'Braiding', 2500.00, 'from', 'KES', true, NULL, NULL, NULL, NULL, 'available', 2, 60, ARRAY['Nyali']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '80e3f7d0-074c-5c94-abf2-d4d98b31022b'),
  ('59e826be-3b19-578b-94ae-a06ee1bb5e71', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'service', 'Screen Replacement', 'screen-replacement', 'Screen Replacement from Rift Tech Repairs.', 'Repairs', 'Phones', 3500.00, 'from', 'KES', false, NULL, NULL, NULL, NULL, 'available', 2, 60, ARRAY['Nakuru East']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '06a22f9e-fa3c-503b-90c6-172daa860109'),
  ('28bd9fde-3c1c-564a-ad68-a7cb611a25d7', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'product', 'Ankara Dress', 'ankara-dress', 'Ankara Dress from Kilimani Threads.', 'Clothing', 'Dresses', 3200.00, 'each', 'KES', false, 'SKU-005', 25, true, 'pcs', 'available', NULL, NULL, ARRAY['Kilimani']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'a4a81b3c-83a1-5ff8-93f2-db080dcab2ae'),
  ('a764105f-a4c7-5cc6-8b45-cff16c7ef84f', '5fbd70f3-0365-5cf8-b327-324de069352a', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'product', 'Kitenge Shirt', 'kitenge-shirt', 'Kitenge Shirt from Kilimani Threads.', 'Clothing', 'Shirts', 2200.00, 'each', 'KES', true, 'SKU-006', 26, true, 'pcs', 'available', NULL, NULL, ARRAY['Kilimani']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'dd5d9bbc-05f9-5c5b-a61c-79a954bbea7d'),
  ('43a4687e-2017-5f14-95e4-596b21f3f5c6', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'product', 'Maize Flour (2kg)', 'maize-flour-2kg', 'Maize Flour (2kg) from Eldoret Grain Hub.', 'Grains', 'Flour', 210.00, 'per pack', 'KES', false, 'SKU-007', 27, true, 'pcs', 'available', NULL, NULL, ARRAY['Eldoret']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '8faeb008-ba29-5bfe-8646-82ca07f381a8'),
  ('ddd08036-5ebd-50a7-8a52-1d712e66cf76', '8398434e-ee49-5d50-9c17-c727138512b7', '1db35632-758e-5f2b-a531-8623b034fcbd', 'product', 'Dry Maize (90kg bag)', 'dry-maize-90kg', 'Dry Maize (90kg bag) from Eldoret Grain Hub.', 'Grains', 'Raw', 4800.00, 'per bag', 'KES', false, 'SKU-008', 28, true, 'pcs', 'available', NULL, NULL, ARRAY['Eldoret']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '5aad36c6-6140-5abc-8a70-6d8c828502b8'),
  ('5a110c00-3042-5919-8140-34d0fbc503a5', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '16fa9d0e-e941-5694-8fed-67a28a259705', 'service', 'Phone Diagnostics', 'phone-diagnostics', 'Phone Diagnostics from Rift Tech Repairs.', 'Repairs', 'Diagnostics', 500.00, 'flat', 'KES', true, NULL, NULL, NULL, NULL, 'available', 2, 60, ARRAY['Nakuru East']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-17 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '77c8bf43-18c0-5570-8b53-9597665be407')
ON CONFLICT DO NOTHING;

-- catalog_item_media
INSERT INTO public."catalog_item_media" ("Id", "CatalogItemId", "MediaAssetId", "SortOrder", "AltText", "CreatedAtUtc") VALUES
  ('5137be1d-4ef7-549f-a5df-cd9ce59852a8', '3868d979-2792-5943-9f2f-7f2cf4836263', '7e30fb91-a3a6-5787-88cf-a1402fcba2d3', 0, 'Pilau (Family Pack) photo', '2026-10-13 09:00:00+00'),
  ('5a38d1a9-f56a-54c9-843f-a8cc26d68638', 'a604a6c3-7b02-5288-a8e9-c29587ddb2dc', '14e1be07-e8c3-5460-b557-e7b47959d312', 0, 'Event Catering (50 guests) photo', '2026-10-13 09:00:00+00'),
  ('7a623a75-f5fe-5d5a-87d3-40e0418e1379', '87f4a95f-fc1e-5330-92d0-c2660e804e8c', 'c40ebf9a-a1e1-5085-89d5-05ffb79875f1', 0, 'Fresh Tilapia (1kg) photo', '2026-10-13 09:00:00+00'),
  ('b7bfd6c0-3854-5778-b281-91f30fe7c45d', '78385bd3-97f7-5d33-81b2-c80bb645c3d1', 'dc1a442b-22b0-5fc5-b4e8-eb8cb2509049', 0, 'Box Braids photo', '2026-10-13 09:00:00+00'),
  ('ca59b80c-64da-5eed-9b0c-d6bef55ec827', '59e826be-3b19-578b-94ae-a06ee1bb5e71', 'd1539242-a77d-577a-baaa-cb648310efa8', 0, 'Screen Replacement photo', '2026-10-13 09:00:00+00'),
  ('a981eac8-a4e5-5f3f-896b-f5b1214b2b82', '28bd9fde-3c1c-564a-ad68-a7cb611a25d7', '21d00a32-aa51-5cae-9c26-e2889c5422a2', 0, 'Ankara Dress photo', '2026-10-13 09:00:00+00'),
  ('cd0d63f3-fed2-5bfd-88b2-259b80bd96ae', 'a764105f-a4c7-5cc6-8b45-cff16c7ef84f', 'de0c1e97-0b5e-54f2-a85a-fe65ad472e64', 0, 'Kitenge Shirt photo', '2026-10-13 09:00:00+00'),
  ('25b6b22d-c62f-59ec-a3f5-ee8043caaf14', '43a4687e-2017-5f14-95e4-596b21f3f5c6', 'dae34e2b-673d-5e0d-8fe8-066cf1697813', 0, 'Maize Flour (2kg) photo', '2026-10-13 09:00:00+00'),
  ('530daab9-0625-5a64-b403-769d54d60fb6', 'ddd08036-5ebd-50a7-8a52-1d712e66cf76', '7e30fb91-a3a6-5787-88cf-a1402fcba2d3', 0, 'Dry Maize (90kg bag) photo', '2026-10-13 09:00:00+00'),
  ('3f3968c5-ad61-577f-8e04-af3e96844c15', '5a110c00-3042-5919-8140-34d0fbc503a5', '14e1be07-e8c3-5460-b557-e7b47959d312', 0, 'Phone Diagnostics photo', '2026-10-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- posts
INSERT INTO public."posts" ("Id", "AuthorUserId", "BusinessId", "Kind", "Audience", "Discoverable", "AllowComments", "Text", "Location", "ProductJson", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '280488ab-1b8f-5a47-9489-ce75188f28b1', 'text', 'followers', true, true, 'Fresh stock just landed! Come visit us this weekend.', 'Westlands', NULL, '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00'),
  ('4c185579-0a17-5c24-8ed2-bf6b557ead8e', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, 'image', 'public', true, true, 'Thank you for 500 followers, tuko pamoja!', 'Kisumu Central', NULL, '2026-11-03 09:00:00+00', '2026-11-03 09:00:00+00'),
  ('5859850b-aa3a-5849-9961-ad4e09e20f34', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', 'product', 'public', true, true, 'New menu item launching Friday, who''s coming?', 'Nyali', '{"name": "Fresh Tilapia (1kg)", "priceKsh": 450}'::jsonb, '2026-11-04 09:00:00+00', '2026-11-04 09:00:00+00'),
  ('b09b420d-58e1-57ae-8208-af08c02fedb1', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'announcement', 'public', true, true, 'Tips for starting a small business in Nairobi.', 'Nakuru East', NULL, '2026-11-05 09:00:00+00', '2026-11-05 09:00:00+00'),
  ('f618e541-20c1-5132-9f3b-e57bc1058561', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '5fbd70f3-0365-5cf8-b327-324de069352a', 'video', 'public', true, true, 'Weekend sale: 20% off all items.', 'Kilimani', NULL, '2026-11-06 09:00:00+00', '2026-11-06 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'text', 'public', true, true, 'Proud of our team this month.', 'Eldoret', NULL, '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '280488ab-1b8f-5a47-9489-ce75188f28b1', 'image', 'public', true, true, 'Looking for a reliable supplier, DM me.', 'Thika', NULL, '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('c20b6b64-abff-5b79-bf77-0a539a16d686', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'product', 'followers', true, true, 'Throwback to our first day of business.', 'Embakasi', '{"name": "Maize Flour (2kg)", "priceKsh": 210}'::jsonb, '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('49d2c53e-20b3-5711-abf6-b967b187c3b3', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', 'announcement', 'public', true, true, 'Which flavour should we add next?', 'Machakos Town', NULL, '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('26012004-8135-577b-a852-610f4e890a09', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'video', 'public', true, true, 'Karibu to our new shop in town!', 'Kakamega Town', NULL, '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('4760cd0e-524d-5467-adfc-99a2652eb66e', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '5fbd70f3-0365-5cf8-b327-324de069352a', 'text', 'public', true, true, 'Fresh stock just landed! Come visit us this weekend.', 'Kericho Town', NULL, '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('02d8812a-1115-5b12-9dfe-0cd4961402f8', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', NULL, 'image', 'public', true, true, 'Thank you for 500 followers, tuko pamoja!', 'Eastleigh', NULL, '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('cd6a273b-9acc-55aa-8841-b649ca4ee628', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '280488ab-1b8f-5a47-9489-ce75188f28b1', 'product', 'public', true, true, 'New menu item launching Friday, who''s coming?', 'Westlands', '{"name": "Fresh Tilapia (1kg)", "priceKsh": 450}'::jsonb, '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('e1fed6ce-236c-5980-a7fa-48c2c7c79bdb', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, 'announcement', 'public', true, true, 'Tips for starting a small business in Nairobi.', 'Kisumu Central', NULL, '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('4103383b-d6fa-5517-90b4-2dd868248da2', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', 'video', 'followers', true, true, 'Weekend sale: 20% off all items.', 'Nyali', NULL, '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('a72d9267-5c14-5491-b2eb-b0ae53015c1d', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'text', 'public', true, true, 'Proud of our team this month.', 'Nakuru East', NULL, '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('c8413767-0301-576c-bb2d-a7bfe213d0f9', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '5fbd70f3-0365-5cf8-b327-324de069352a', 'image', 'public', true, true, 'Looking for a reliable supplier, DM me.', 'Kilimani', NULL, '2026-11-18 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('051b6b4b-089a-5dc9-9edb-20a2fe0afde2', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'product', 'public', true, true, 'Throwback to our first day of business.', 'Eldoret', '{"name": "Maize Flour (2kg)", "priceKsh": 210}'::jsonb, '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00'),
  ('0d6e9c42-7dc0-55e5-b863-2ab25962031b', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '280488ab-1b8f-5a47-9489-ce75188f28b1', 'announcement', 'public', true, true, 'Which flavour should we add next?', 'Thika', NULL, '2026-11-20 09:00:00+00', '2026-11-20 09:00:00+00'),
  ('d39128dd-b101-5d7b-a48b-ab2dd6c3ee46', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'video', 'public', true, true, 'Karibu to our new shop in town!', 'Embakasi', NULL, '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_media_references
INSERT INTO public."post_media_references" ("Id", "PostId", "MediaType", "Url", "AltText", "SortOrder") VALUES
  ('89d905d6-5aeb-5a19-9f4c-7b70afd4a246', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', 'image', 'https://picsum.photos/seed/post1/800/600', 'Post image', 0),
  ('8eb8d7e3-903e-5472-b55f-88cc9e2398c1', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', 'image', 'https://picsum.photos/seed/post6/800/600', 'Post image', 0),
  ('c4b8cc28-2499-5bca-b2ed-021b3892a53c', '02d8812a-1115-5b12-9dfe-0cd4961402f8', 'image', 'https://picsum.photos/seed/post11/800/600', 'Post image', 0),
  ('0f37d6ec-7909-5de1-8694-894eb992801c', 'c8413767-0301-576c-bb2d-a7bfe213d0f9', 'image', 'https://picsum.photos/seed/post16/800/600', 'Post image', 0)
ON CONFLICT DO NOTHING;

-- comments
INSERT INTO public."comments" ("Id", "PostId", "AuthorUserId", "ParentCommentId", "Text", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('7fdb4a58-c9b7-52b9-84dc-bcf251e49ec9', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', NULL, 'Love this!', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('0646a2e3-a20e-528c-b9cd-81beeaec21b5', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'Where are you located?', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('f22feab6-2915-5a40-8318-ab771e6e57c9', '5859850b-aa3a-5849-9961-ad4e09e20f34', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, 'Congratulations!', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('e2e817c7-3d61-57e1-abc8-f6fe764fe3c8', 'b09b420d-58e1-57ae-8208-af08c02fedb1', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'Do you deliver?', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('b6f523b6-778f-5dfb-acc7-959e37998e5c', 'f618e541-20c1-5132-9f3b-e57bc1058561', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, 'Tutaonana soon.', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('b82373b2-4c0e-5b33-8030-1286a49d9412', '5837d94d-5432-57ec-bed2-e21ad23009df', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'Great prices.', '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('bc7f2325-51d1-5f06-9ff3-3e56320025e6', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Love this!', '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('eef631f0-d52b-5796-9ec7-d4d79b9b77b1', 'c20b6b64-abff-5b79-bf77-0a539a16d686', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'Where are you located?', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('69e3c8d3-5ad6-59b8-a756-f218d0c3604b', '49d2c53e-20b3-5711-abf6-b967b187c3b3', 'c63b7280-6331-5031-b04a-6f6cb293d25f', NULL, 'Congratulations!', '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('9d7dba97-661a-5674-a8f7-97b5879ac07b', '26012004-8135-577b-a852-610f4e890a09', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', NULL, 'Do you deliver?', '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('8b89fffa-725f-5482-96ac-243800cad9f0', '4760cd0e-524d-5467-adfc-99a2652eb66e', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, 'Tutaonana soon.', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('0c96a816-e83d-5444-9936-ddf5cccb0240', '02d8812a-1115-5b12-9dfe-0cd4961402f8', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, 'Great prices.', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('5ef7f536-d45d-5fce-be98-8a508120728f', 'cd6a273b-9acc-55aa-8841-b649ca4ee628', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', NULL, 'Love this!', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('690e015f-85ef-5c56-bcdd-1d025ce76be9', 'e1fed6ce-236c-5980-a7fa-48c2c7c79bdb', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'Where are you located?', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('d458e2c1-bfb2-563e-b606-9b3980d4d90e', '4103383b-d6fa-5517-90b4-2dd868248da2', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, 'Congratulations!', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('ce24a3d0-0e22-5687-9030-93ebecc46253', 'a72d9267-5c14-5491-b2eb-b0ae53015c1d', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'Do you deliver?', '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('cf2547de-6db6-5853-b5d9-796893e75a04', 'c8413767-0301-576c-bb2d-a7bfe213d0f9', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, 'Tutaonana soon.', '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('3113c51e-1c83-518e-939d-34478386afcc', '051b6b4b-089a-5dc9-9edb-20a2fe0afde2', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'Great prices.', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('b670371a-fe73-510d-9fda-30d2fc58fd95', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '1db35632-758e-5f2b-a531-8623b034fcbd', '7fdb4a58-c9b7-52b9-84dc-bcf251e49ec9', 'Thanks for asking, we''ll reply by DM!', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('6ae05852-45ad-5bc6-8d2c-717aa1493d98', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '0646a2e3-a20e-528c-b9cd-81beeaec21b5', 'Thanks for asking, we''ll reply by DM!', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('313dcf1b-1331-51de-9855-41e0af018e6a', '5859850b-aa3a-5849-9961-ad4e09e20f34', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'f22feab6-2915-5a40-8318-ab771e6e57c9', 'Thanks for asking, we''ll reply by DM!', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('bc58d60d-0aaa-56a4-8410-abf495ebbbbc', 'b09b420d-58e1-57ae-8208-af08c02fedb1', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'e2e817c7-3d61-57e1-abc8-f6fe764fe3c8', 'Thanks for asking, we''ll reply by DM!', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_likes
INSERT INTO public."post_likes" ("PostId", "UserId", "CreatedAtUtc") VALUES
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-22 09:00:00+00'),
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-17 09:00:00+00'),
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-12 09:00:00+00'),
  ('4c185579-0a17-5c24-8ed2-bf6b557ead8e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-19 09:00:00+00'),
  ('4c185579-0a17-5c24-8ed2-bf6b557ead8e', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-14 09:00:00+00'),
  ('5859850b-aa3a-5849-9961-ad4e09e20f34', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-16 09:00:00+00'),
  ('5859850b-aa3a-5849-9961-ad4e09e20f34', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-11 09:00:00+00'),
  ('b09b420d-58e1-57ae-8208-af08c02fedb1', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-18 09:00:00+00'),
  ('b09b420d-58e1-57ae-8208-af08c02fedb1', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-13 09:00:00+00'),
  ('b09b420d-58e1-57ae-8208-af08c02fedb1', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-08 09:00:00+00'),
  ('f618e541-20c1-5132-9f3b-e57bc1058561', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-15 09:00:00+00'),
  ('f618e541-20c1-5132-9f3b-e57bc1058561', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-10 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-17 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-12 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-22 09:00:00+00'),
  ('e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-14 09:00:00+00'),
  ('e60f7ce5-92d0-5804-bca2-7d061ab94fa3', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-09 09:00:00+00'),
  ('c20b6b64-abff-5b79-bf77-0a539a16d686', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-11 09:00:00+00'),
  ('c20b6b64-abff-5b79-bf77-0a539a16d686', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-21 09:00:00+00'),
  ('49d2c53e-20b3-5711-abf6-b967b187c3b3', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-13 09:00:00+00'),
  ('49d2c53e-20b3-5711-abf6-b967b187c3b3', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-08 09:00:00+00'),
  ('49d2c53e-20b3-5711-abf6-b967b187c3b3', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-18 09:00:00+00'),
  ('26012004-8135-577b-a852-610f4e890a09', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-10 09:00:00+00'),
  ('26012004-8135-577b-a852-610f4e890a09', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-20 09:00:00+00'),
  ('4760cd0e-524d-5467-adfc-99a2652eb66e', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-12 09:00:00+00'),
  ('4760cd0e-524d-5467-adfc-99a2652eb66e', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-22 09:00:00+00'),
  ('4760cd0e-524d-5467-adfc-99a2652eb66e', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-17 09:00:00+00'),
  ('02d8812a-1115-5b12-9dfe-0cd4961402f8', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-09 09:00:00+00'),
  ('02d8812a-1115-5b12-9dfe-0cd4961402f8', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-19 09:00:00+00'),
  ('cd6a273b-9acc-55aa-8841-b649ca4ee628', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-21 09:00:00+00'),
  ('cd6a273b-9acc-55aa-8841-b649ca4ee628', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-16 09:00:00+00'),
  ('e1fed6ce-236c-5980-a7fa-48c2c7c79bdb', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-08 09:00:00+00'),
  ('e1fed6ce-236c-5980-a7fa-48c2c7c79bdb', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-18 09:00:00+00'),
  ('e1fed6ce-236c-5980-a7fa-48c2c7c79bdb', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-13 09:00:00+00'),
  ('4103383b-d6fa-5517-90b4-2dd868248da2', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-20 09:00:00+00'),
  ('4103383b-d6fa-5517-90b4-2dd868248da2', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-15 09:00:00+00'),
  ('a72d9267-5c14-5491-b2eb-b0ae53015c1d', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-22 09:00:00+00'),
  ('a72d9267-5c14-5491-b2eb-b0ae53015c1d', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-17 09:00:00+00'),
  ('a72d9267-5c14-5491-b2eb-b0ae53015c1d', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-12 09:00:00+00'),
  ('c8413767-0301-576c-bb2d-a7bfe213d0f9', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-19 09:00:00+00'),
  ('c8413767-0301-576c-bb2d-a7bfe213d0f9', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-14 09:00:00+00'),
  ('051b6b4b-089a-5dc9-9edb-20a2fe0afde2', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-16 09:00:00+00'),
  ('051b6b4b-089a-5dc9-9edb-20a2fe0afde2', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-11 09:00:00+00'),
  ('0d6e9c42-7dc0-55e5-b863-2ab25962031b', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-18 09:00:00+00'),
  ('0d6e9c42-7dc0-55e5-b863-2ab25962031b', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-13 09:00:00+00'),
  ('0d6e9c42-7dc0-55e5-b863-2ab25962031b', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-08 09:00:00+00'),
  ('d39128dd-b101-5d7b-a48b-ab2dd6c3ee46', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-15 09:00:00+00'),
  ('d39128dd-b101-5d7b-a48b-ab2dd6c3ee46', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-10 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_shares
INSERT INTO public."post_shares" ("Id", "PostId", "SharedByUserId", "CreatedAtUtc") VALUES
  ('e056b12c-b5cf-52d5-b504-e64b20062919', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-22 09:00:00+00'),
  ('eacae4a9-374d-5982-b4b9-80a79fa0289d', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-21 09:00:00+00'),
  ('684bae43-5acd-55b6-b2cb-d5701a480884', '5859850b-aa3a-5849-9961-ad4e09e20f34', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-20 09:00:00+00'),
  ('866f7598-4728-5282-a684-6a5b3410ae42', 'b09b420d-58e1-57ae-8208-af08c02fedb1', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-19 09:00:00+00'),
  ('29466248-5878-5383-a3d2-029bec54e994', 'f618e541-20c1-5132-9f3b-e57bc1058561', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-18 09:00:00+00'),
  ('9ddd8aff-ee1a-52a6-8b5c-f35a75730fc5', '5837d94d-5432-57ec-bed2-e21ad23009df', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-17 09:00:00+00'),
  ('b4f355b7-6fc1-552a-8f09-6fb59d9bb510', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-16 09:00:00+00'),
  ('c4288fd7-412c-5ee6-a631-22446d150f3b', 'c20b6b64-abff-5b79-bf77-0a539a16d686', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-15 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_tags
INSERT INTO public."post_tags" ("PostId", "TaggedUserId", "TaggedByUserId", "CreatedAtUtc") VALUES
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '899a632e-c21a-571d-8821-740e44bcfe18', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-22 09:00:00+00'),
  ('4c185579-0a17-5c24-8ed2-bf6b557ead8e', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-21 09:00:00+00'),
  ('5859850b-aa3a-5849-9961-ad4e09e20f34', '16fa9d0e-e941-5694-8fed-67a28a259705', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-20 09:00:00+00'),
  ('b09b420d-58e1-57ae-8208-af08c02fedb1', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-19 09:00:00+00'),
  ('f618e541-20c1-5132-9f3b-e57bc1058561', '1db35632-758e-5f2b-a531-8623b034fcbd', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-18 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-17 09:00:00+00')
ON CONFLICT DO NOTHING;

-- hidden_posts
INSERT INTO public."hidden_posts" ("UserId", "PostId", "CreatedAtUtc") VALUES
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'b09b420d-58e1-57ae-8208-af08c02fedb1', '2026-11-18 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '2026-11-20 09:00:00+00')
ON CONFLICT DO NOTHING;

-- polls
INSERT INTO public."polls" ("Id", "PostId", "Question", "ClosesAtUtc", "CreatedAtUtc") VALUES
  ('7accae09-51f3-5567-80e8-33b7af387221', '49d2c53e-20b3-5711-abf6-b967b187c3b3', 'Which flavour next?', '2026-11-29 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '26012004-8135-577b-a852-610f4e890a09', 'Best day for weekend sale?', '2026-11-29 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '4760cd0e-524d-5467-adfc-99a2652eb66e', 'Preferred delivery time?', '2026-11-29 09:00:00+00', '2026-11-16 09:00:00+00')
ON CONFLICT DO NOTHING;

-- poll_options
INSERT INTO public."poll_options" ("Id", "PollId", "Text", "SortOrder") VALUES
  ('29c9bd97-68d6-51c7-8440-eef348fc32e5', '7accae09-51f3-5567-80e8-33b7af387221', 'Mango', 0),
  ('e74b1478-e6bc-5037-b411-62bbf74e35a6', '7accae09-51f3-5567-80e8-33b7af387221', 'Passion', 1),
  ('c5f8473d-5bb0-50ab-84a8-05a35d63af40', '7accae09-51f3-5567-80e8-33b7af387221', 'Coconut', 2),
  ('a3973baf-64b0-5641-9fed-11b0718be486', '8a060ed9-81ab-5707-beec-5446083cd8ea', 'Friday', 0),
  ('c68c3129-6afb-57e3-ab74-8a1b30dc64d9', '8a060ed9-81ab-5707-beec-5446083cd8ea', 'Saturday', 1),
  ('4942a76c-893f-5902-b3d4-2a597941ba6d', '8a060ed9-81ab-5707-beec-5446083cd8ea', 'Sunday', 2),
  ('024f079f-4c8f-54cd-acb3-e644cebdaf9d', '04a367e8-a458-5679-8d55-326d36f80db7', 'Morning', 0),
  ('4941382c-21f9-5077-bea5-921bcafcaab1', '04a367e8-a458-5679-8d55-326d36f80db7', 'Afternoon', 1),
  ('998d59ee-3a89-573e-9af8-f9ccccd53672', '04a367e8-a458-5679-8d55-326d36f80db7', 'Evening', 2)
ON CONFLICT DO NOTHING;

-- poll_votes
INSERT INTO public."poll_votes" ("PollId", "UserId", "OptionId", "CreatedAtUtc") VALUES
  ('7accae09-51f3-5567-80e8-33b7af387221', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '29c9bd97-68d6-51c7-8440-eef348fc32e5', '2026-11-19 09:00:00+00'),
  ('7accae09-51f3-5567-80e8-33b7af387221', '899a632e-c21a-571d-8821-740e44bcfe18', 'e74b1478-e6bc-5037-b411-62bbf74e35a6', '2026-11-19 09:00:00+00'),
  ('7accae09-51f3-5567-80e8-33b7af387221', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'c5f8473d-5bb0-50ab-84a8-05a35d63af40', '2026-11-19 09:00:00+00'),
  ('7accae09-51f3-5567-80e8-33b7af387221', '16fa9d0e-e941-5694-8fed-67a28a259705', '29c9bd97-68d6-51c7-8440-eef348fc32e5', '2026-11-19 09:00:00+00'),
  ('7accae09-51f3-5567-80e8-33b7af387221', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'e74b1478-e6bc-5037-b411-62bbf74e35a6', '2026-11-19 09:00:00+00'),
  ('7accae09-51f3-5567-80e8-33b7af387221', '1db35632-758e-5f2b-a531-8623b034fcbd', 'c5f8473d-5bb0-50ab-84a8-05a35d63af40', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'a3973baf-64b0-5641-9fed-11b0718be486', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '899a632e-c21a-571d-8821-740e44bcfe18', 'c68c3129-6afb-57e3-ab74-8a1b30dc64d9', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '4942a76c-893f-5902-b3d4-2a597941ba6d', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '16fa9d0e-e941-5694-8fed-67a28a259705', 'a3973baf-64b0-5641-9fed-11b0718be486', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'c68c3129-6afb-57e3-ab74-8a1b30dc64d9', '2026-11-19 09:00:00+00'),
  ('8a060ed9-81ab-5707-beec-5446083cd8ea', '1db35632-758e-5f2b-a531-8623b034fcbd', '4942a76c-893f-5902-b3d4-2a597941ba6d', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '024f079f-4c8f-54cd-acb3-e644cebdaf9d', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '899a632e-c21a-571d-8821-740e44bcfe18', '4941382c-21f9-5077-bea5-921bcafcaab1', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '998d59ee-3a89-573e-9af8-f9ccccd53672', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '16fa9d0e-e941-5694-8fed-67a28a259705', '024f079f-4c8f-54cd-acb3-e644cebdaf9d', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '4941382c-21f9-5077-bea5-921bcafcaab1', '2026-11-19 09:00:00+00'),
  ('04a367e8-a458-5679-8d55-326d36f80db7', '1db35632-758e-5f2b-a531-8623b034fcbd', '998d59ee-3a89-573e-9af8-f9ccccd53672', '2026-11-19 09:00:00+00')
ON CONFLICT DO NOTHING;

-- stories
INSERT INTO public."stories" ("Id", "AuthorUserId", "Text", "MediaType", "MediaUrl", "AltText", "Audience", "CreatedAtUtc", "ExpiresAtUtc") VALUES
  ('07e136e4-f0a4-5e23-bb84-670c7af52749', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'Good morning Nairobi!', 'image', 'https://picsum.photos/seed/story0/600/900', 'Story image', 'followers', '2026-11-22 06:00:00+00', '2026-11-23 09:00:00+00'),
  ('05b282f3-e57d-5283-b0f4-a035945a794c', '899a632e-c21a-571d-8821-740e44bcfe18', 'New arrivals today', 'image', 'https://picsum.photos/seed/story1/600/900', 'Story image', 'public', '2026-11-22 05:00:00+00', '2026-11-23 09:00:00+00'),
  ('9cbf3509-6f45-564b-aa85-a199e8960ce9', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'Behind the scenes', 'image', 'https://picsum.photos/seed/story2/600/900', 'Story image', 'followers', '2026-11-22 04:00:00+00', '2026-11-23 09:00:00+00'),
  ('1935d644-9f7c-5a77-b968-1f666b8e8d4a', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Weekend vibes', 'image', 'https://picsum.photos/seed/story3/600/900', 'Story image', 'public', '2026-11-22 03:00:00+00', '2026-11-23 09:00:00+00'),
  ('8898d149-c51d-5dde-ba2e-46c790ffdafb', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Fresh catch!', 'image', 'https://picsum.photos/seed/story4/600/900', 'Story image', 'followers', '2026-11-22 02:00:00+00', '2026-11-23 09:00:00+00'),
  ('2053002d-9855-5816-8190-2d437f2d2798', '1db35632-758e-5f2b-a531-8623b034fcbd', 'Open till late', 'image', 'https://picsum.photos/seed/story5/600/900', 'Story image', 'public', '2026-11-22 01:00:00+00', '2026-11-23 09:00:00+00'),
  ('9bb9da4d-8608-5e80-8861-5180d4ab009d', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'Thank you all', 'image', 'https://picsum.photos/seed/story6/600/900', 'Story image', 'followers', '2026-11-22 00:00:00+00', '2026-11-23 09:00:00+00'),
  ('650d1a4e-4a87-52c0-b8be-07d60f76ee3d', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'Throwback', 'image', 'https://picsum.photos/seed/story7/600/900', 'Story image', 'public', '2026-11-21 23:00:00+00', '2026-11-23 09:00:00+00')
ON CONFLICT DO NOTHING;

-- story_replies
INSERT INTO public."story_replies" ("Id", "StoryId", "AuthorUserId", "Text", "CreatedAtUtc") VALUES
  ('9b4193c0-1759-5cb7-bcca-e55cc8f81097', '07e136e4-f0a4-5e23-bb84-670c7af52749', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Nice!', '2026-11-22 08:00:00+00'),
  ('1f4c32b3-2b58-5801-a2cd-37a306e88f47', '05b282f3-e57d-5283-b0f4-a035945a794c', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'How much?', '2026-11-22 08:00:00+00'),
  ('464970d4-cf8d-5e0a-bb4a-53ff21f9c7a9', '9cbf3509-6f45-564b-aa85-a199e8960ce9', '1db35632-758e-5f2b-a531-8623b034fcbd', 'Still available?', '2026-11-22 08:00:00+00'),
  ('a7912912-dbdf-5985-a6d0-4e4ef66353b4', '1935d644-9f7c-5a77-b968-1f666b8e8d4a', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'Love it', '2026-11-22 08:00:00+00'),
  ('97b8d5c4-81a0-5c9c-812d-299062778a38', '8898d149-c51d-5dde-ba2e-46c790ffdafb', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'Nice!', '2026-11-22 08:00:00+00'),
  ('a3e95c4c-d1d8-5fa2-927f-984a9f053c11', '2053002d-9855-5816-8190-2d437f2d2798', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'How much?', '2026-11-22 08:00:00+00')
ON CONFLICT DO NOTHING;

-- conversations
INSERT INTO public."conversations" ("Id", "Kind", "CreatedByUserId", "BusinessId", "CatalogItemId", "DirectUserLowId", "DirectUserHighId", "CatalogueTitleSnapshot", "CreatedAtUtc", "UpdatedAtUtc", "LastMessageAtUtc", "LastMessagePreview", "IsBlocked", "BlockedByUserId", "BlockedAtUtc") VALUES
  ('7883926c-278b-5290-aef1-aa5da1e7d6eb', 'direct', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, NULL, '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, '2026-11-12 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', 'See you Saturday!', false, NULL, NULL),
  ('d7fbb707-1524-5163-bd86-59a88125e870', 'business', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '5fbd70f3-0365-5cf8-b327-324de069352a', '28bd9fde-3c1c-564a-ad68-a7cb611a25d7', NULL, NULL, 'Ankara Dress', '2026-11-16 09:00:00+00', '2026-11-20 09:00:00+00', '2026-11-20 09:00:00+00', 'Is it available in size M?', false, NULL, NULL),
  ('21f196af-3467-5adf-a65e-692c0353cef7', 'business', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '280488ab-1b8f-5a47-9489-ce75188f28b1', NULL, NULL, NULL, NULL, '2026-11-18 09:00:00+00', '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00', 'Do you deliver to Embakasi?', false, NULL, NULL)
ON CONFLICT DO NOTHING;

-- conversation_participants
INSERT INTO public."conversation_participants" ("Id", "ConversationId", "UserId", "Kind", "JoinedAtUtc", "LastDeliveredAtUtc", "LastReadAtUtc", "ArchivedAtUtc") VALUES
  ('117d852f-3fbf-5320-895c-38a6ff34576f', '7883926c-278b-5290-aef1-aa5da1e7d6eb', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'direct', '2026-11-12 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('06f99909-b46c-5e76-a954-2db59b23d5db', '7883926c-278b-5290-aef1-aa5da1e7d6eb', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'direct', '2026-11-12 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('bbf97a37-1233-50ae-a356-d19d3792af9a', 'd7fbb707-1524-5163-bd86-59a88125e870', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'buyer', '2026-11-16 09:00:00+00', '2026-11-20 09:00:00+00', '2026-11-20 09:00:00+00', NULL),
  ('284df7c1-0234-553a-a400-baf4a8ad732e', 'd7fbb707-1524-5163-bd86-59a88125e870', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'business_agent', '2026-11-16 09:00:00+00', '2026-11-20 09:00:00+00', NULL, NULL),
  ('3354f614-7e10-52f0-8786-de5d10d33622', '21f196af-3467-5adf-a65e-692c0353cef7', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'buyer', '2026-11-18 09:00:00+00', '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00', NULL),
  ('d80f35f4-7500-5442-b345-82d5fc355470', '21f196af-3467-5adf-a65e-692c0353cef7', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'business_agent', '2026-11-18 09:00:00+00', '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00', NULL)
ON CONFLICT DO NOTHING;

-- conversation_messages
INSERT INTO public."conversation_messages" ("Id", "ConversationId", "SenderUserId", "ClientMessageId", "Text", "CreatedAtUtc") VALUES
  ('dd4b281c-5b26-51ad-98c3-d2bb78a55f7e', '7883926c-278b-5290-aef1-aa5da1e7d6eb', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '218869f1-ee30-591c-9bf0-c8a44e5cf37d', 'Hey Grace, are we still on for Saturday?', '2026-11-12 09:00:00+00'),
  ('8e54c4a2-d5d2-5104-b9a7-f4946c90f494', '7883926c-278b-5290-aef1-aa5da1e7d6eb', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '606d62cc-e1a6-5450-a9fd-f554008f73d3', 'Yes! See you Saturday!', '2026-11-13 09:00:00+00'),
  ('f4eda942-43f7-55ba-b8d5-68e3357b7b6d', 'd7fbb707-1524-5163-bd86-59a88125e870', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '559e1f04-1e7a-5a0b-bb15-952ba509314f', 'Hello, is the Ankara dress available?', '2026-11-14 09:00:00+00'),
  ('d024c46e-c268-54ea-9dd4-d9d76fcf1902', 'd7fbb707-1524-5163-bd86-59a88125e870', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'dae8eaa4-4b6b-5dc8-92b1-2c90322bbf81', 'Yes it is. Which size?', '2026-11-15 09:00:00+00'),
  ('c230735f-e7cb-5059-a80e-0c9b2d41d31e', 'd7fbb707-1524-5163-bd86-59a88125e870', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'd63e4e65-fa1f-5a40-9184-513efd86076c', 'Is it available in size M?', '2026-11-16 09:00:00+00'),
  ('bd78fe57-1b1a-5109-893a-b4ff182d4f67', '21f196af-3467-5adf-a65e-692c0353cef7', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '12016993-96eb-57ed-8de8-c58a919b893a', 'Do you deliver to Embakasi?', '2026-11-17 09:00:00+00'),
  ('2ed9d6d9-9c2f-52e7-b1ac-f372a7257eaf', '21f196af-3467-5adf-a65e-692c0353cef7', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '325780b6-0f4b-50a8-af52-ca6b6f559aab', 'Yes, KSh 200 delivery fee.', '2026-11-18 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_notifications
INSERT INTO public."user_notifications" ("Id", "RecipientUserId", "ActorUserId", "Type", "Title", "Body", "TargetType", "TargetId", "BusinessId", "PostId", "ConversationId", "CatalogItemId", "IdempotencyKey", "InAppVisible", "CreatedAtUtc", "ReadAtUtc", "DismissedAtUtc") VALUES
  ('48e44359-1b13-5213-ae46-65e1e180d1b9', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '16fa9d0e-e941-5694-8fed-67a28a259705', 'new_follower', 'New follower', 'Someone started following you', 'user', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, NULL, NULL, NULL, 'seed-ntf-0', true, '2026-11-22 09:00:00+00', NULL, NULL),
  ('cb30dca5-6acc-55d5-aa6a-34ef080eab7e', '899a632e-c21a-571d-8821-740e44bcfe18', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'post_like', 'New like', 'Someone liked your post', 'post', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', NULL, '4c185579-0a17-5c24-8ed2-bf6b557ead8e', NULL, NULL, 'seed-ntf-1', true, '2026-11-21 09:00:00+00', '2026-11-22 09:00:00+00', NULL),
  ('c2c86e7a-3aa1-5702-8d70-6f65d4af3454', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '1db35632-758e-5f2b-a531-8623b034fcbd', 'comment', 'New comment', 'Someone commented on your post', 'post', '5859850b-aa3a-5849-9961-ad4e09e20f34', NULL, '5859850b-aa3a-5849-9961-ad4e09e20f34', NULL, NULL, 'seed-ntf-2', true, '2026-11-20 09:00:00+00', NULL, NULL),
  ('54c6dfa7-9df3-5ad0-8651-e89ee963efd6', '16fa9d0e-e941-5694-8fed-67a28a259705', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'message', 'New message', 'Someone sent you a message', 'conversation', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, NULL, '7883926c-278b-5290-aef1-aa5da1e7d6eb', NULL, 'seed-ntf-3', true, '2026-11-19 09:00:00+00', '2026-11-20 09:00:00+00', NULL),
  ('c6cbc94c-d687-55bc-a3b7-f4855099bd79', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'business_update', 'Business update', 'Someone A business you follow posted', 'business', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '5fbd70f3-0365-5cf8-b327-324de069352a', NULL, NULL, NULL, 'seed-ntf-4', true, '2026-11-18 09:00:00+00', NULL, NULL),
  ('927f1b82-be92-5d62-a882-0a42847cda70', '1db35632-758e-5f2b-a531-8623b034fcbd', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'new_follower', 'New follower', 'Someone started following you', 'user', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, NULL, NULL, NULL, 'seed-ntf-5', true, '2026-11-17 09:00:00+00', '2026-11-18 09:00:00+00', NULL),
  ('ec9ead86-de7f-5bf0-b343-2b583028325b', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'post_like', 'New like', 'Someone liked your post', 'post', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', NULL, 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', NULL, NULL, 'seed-ntf-6', true, '2026-11-16 09:00:00+00', NULL, NULL),
  ('dc1a80aa-1e80-5e7b-b0e5-a9873229493b', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'comment', 'New comment', 'Someone commented on your post', 'post', 'c20b6b64-abff-5b79-bf77-0a539a16d686', NULL, 'c20b6b64-abff-5b79-bf77-0a539a16d686', NULL, NULL, 'seed-ntf-7', true, '2026-11-15 09:00:00+00', '2026-11-16 09:00:00+00', NULL),
  ('315e4264-a2f1-5437-8920-b22415aed327', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'message', 'New message', 'Someone sent you a message', 'conversation', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', NULL, NULL, '7883926c-278b-5290-aef1-aa5da1e7d6eb', NULL, 'seed-ntf-8', true, '2026-11-14 09:00:00+00', NULL, NULL),
  ('265a11ee-3f85-5d5b-8773-1fade24ec444', '1b65449c-b149-5ee8-9e89-e862b03507dd', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'business_update', 'Business update', 'Someone A business you follow posted', 'business', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', NULL, NULL, NULL, 'seed-ntf-9', true, '2026-11-13 09:00:00+00', '2026-11-14 09:00:00+00', NULL)
ON CONFLICT DO NOTHING;

-- notification_deliveries
INSERT INTO public."notification_deliveries" ("Id", "NotificationId", "DeviceId", "Channel", "IdempotencyKey", "Status", "AttemptCount", "AvailableAtUtc", "LockedUntilUtc", "CompletedAtUtc", "ProviderReceiptId", "CreatedAtUtc", "UpdatedAtUtc", "LastError") VALUES
  ('69f12a50-442f-5b45-842c-f978c390f495', '48e44359-1b13-5213-ae46-65e1e180d1b9', '6bfba01b-0745-5e7b-bee9-eed584be619b', 'push', 'seed-delivery-0', 'accepted', 1, '2026-11-22 09:00:00+00', NULL, '2026-11-22 09:00:00+00', 'rcpt-0', '2026-11-22 09:00:00+00', '2026-11-22 09:00:00+00', NULL),
  ('6a71e05c-0c80-5316-ba08-6e5f416aacff', 'cb30dca5-6acc-55d5-aa6a-34ef080eab7e', NULL, 'realtime', 'seed-delivery-1', 'pending', 0, '2026-11-21 09:00:00+00', NULL, NULL, NULL, '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('46f3d30f-a45f-5fe0-8525-b210ff7379d7', 'c2c86e7a-3aa1-5702-8d70-6f65d4af3454', 'b0c88b49-2a7f-5bcb-bb09-c37dd54e138e', 'push', 'seed-delivery-2', 'accepted', 1, '2026-11-20 09:00:00+00', NULL, '2026-11-20 09:00:00+00', NULL, '2026-11-20 09:00:00+00', '2026-11-20 09:00:00+00', NULL),
  ('95b079a8-3ce5-573a-b39f-2233f00dfce0', '54c6dfa7-9df3-5ad0-8651-e89ee963efd6', NULL, 'realtime', 'seed-delivery-3', 'suppressed', 1, '2026-11-19 09:00:00+00', NULL, '2026-11-19 09:00:00+00', NULL, '2026-11-19 09:00:00+00', '2026-11-19 09:00:00+00', NULL),
  ('274cfd09-5baa-5a3d-a696-701a8f80fba6', 'c6cbc94c-d687-55bc-a3b7-f4855099bd79', 'bfcc71ab-2256-5203-9775-0f5547a71ee9', 'push', 'seed-delivery-4', 'accepted', 1, '2026-11-18 09:00:00+00', NULL, '2026-11-18 09:00:00+00', NULL, '2026-11-18 09:00:00+00', '2026-11-18 09:00:00+00', NULL),
  ('903323cc-c3ac-5dbc-8ef7-4e97c9b924e8', '927f1b82-be92-5d62-a882-0a42847cda70', NULL, 'realtime', 'seed-delivery-5', 'accepted', 1, '2026-11-17 09:00:00+00', NULL, '2026-11-17 09:00:00+00', 'rcpt-5', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00', NULL),
  ('2708138f-ee14-5928-8b94-6c29d3f3851b', 'ec9ead86-de7f-5bf0-b343-2b583028325b', '4253fe37-397e-5fb7-9f0c-1d78ec9a7ed9', 'push', 'seed-delivery-6', 'pending', 0, '2026-11-16 09:00:00+00', NULL, NULL, NULL, '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00', NULL),
  ('fedce5f6-3b77-5f72-9ec4-4dd66ae040a4', 'dc1a80aa-1e80-5e7b-b0e5-a9873229493b', NULL, 'realtime', 'seed-delivery-7', 'accepted', 1, '2026-11-15 09:00:00+00', NULL, '2026-11-15 09:00:00+00', NULL, '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00', NULL),
  ('b2f8903d-6f4a-5c8a-bf75-26018ce3d420', '315e4264-a2f1-5437-8920-b22415aed327', '967488c5-71be-5da6-8641-17e607a96c5a', 'push', 'seed-delivery-8', 'suppressed', 1, '2026-11-14 09:00:00+00', NULL, '2026-11-14 09:00:00+00', NULL, '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00', NULL),
  ('f4b09455-6aeb-5765-8441-73f9215f0657', '265a11ee-3f85-5d5b-8773-1fade24ec444', NULL, 'realtime', 'seed-delivery-9', 'accepted', 1, '2026-11-13 09:00:00+00', NULL, '2026-11-13 09:00:00+00', NULL, '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00', NULL)
ON CONFLICT DO NOTHING;

COMMIT;