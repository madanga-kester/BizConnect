-- Extra seed data for Zawadi Mutua (zawadi@seed.bizconnect.test)
-- Run AFTER seed.sql. Safe to re-run.
BEGIN;

UPDATE public."user_profiles" SET
  "Bio"='Mama of two, honey seller and events lady from Mua Hills, Machakos. Supporting small businesses one post at a time. DM for orders and bookings!',
  "Interests"=ARRAY['farming','events','food','crafts','beauty'],
  "Avatar"='https://picsum.photos/seed/zawadi-me/200',
  "UpdatedAtUtc"=now()
WHERE "UserId"='600d6206-4ed4-5489-b622-de7cc2dd8b80';

-- user_follows
INSERT INTO public."user_follows" ("FollowerUserId", "FollowedUserId", "CreatedAtUtc") VALUES
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-19 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-17 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-18 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-16 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-17 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-15 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-16 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-15 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-13 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-14 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-12 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-13 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-11 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-10 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-10 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-08 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-09 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-07 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-08 09:00:00+00')
ON CONFLICT DO NOTHING;

-- businesses
INSERT INTO public."businesses" ("Id", "OwnerUserId", "Slug", "Name", "BusinessType", "Category", "Subcategory", "Description", "About", "Founder", "OriginStory", "County", "Town", "Neighbourhood", "ServiceAreas", "Phone", "Whatsapp", "Email", "Website", "PriceRange", "OperatingHours", "SocialLinksJson", "Logo", "Cover", "Visibility", "Status", "CreatedAtUtc", "UpdatedAtUtc", "ArchivedAtUtc", "Version") VALUES
  ('93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'mua-hills-honey', 'Mua Hills Honey & Preserves', 'products', 'Agriculture', 'Honey & Preserves', 'Pure honey, jams and dried fruit from our family farm in Mua Hills.', 'Pure honey, jams and dried fruit from our family farm in Mua Hills. We believe in quality, fair prices and treating every customer like family.', 'Zawadi Mutua', 'Started on a small family farm and a love for hosting. Word of mouth did the rest.', 'Machakos', 'Machakos Town', 'Mua Hills', ARRAY['Machakos Town','Athi River','Nairobi']::text[], '+254710008888', '+254710008888', 'hello@mua-hills-honey.test', 'https://mua-hills-honey.example.com', 'KSh KSh', 'Mon-Sat 8:00-18:00, Sun by appointment', '{"instagram": "@mua-hills-honey", "facebook": "mua-hills-honey", "tiktok": "@mua-hills-honey"}'::jsonb, 'https://picsum.photos/seed/zlogo0/200', 'https://picsum.photos/seed/zcover0/800/300', 'public', 'active', '2026-09-23 09:00:00+00', '2026-11-21 09:00:00+00', NULL, '30d1bb33-868d-5413-82bd-b43158f60299'),
  ('18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'zawadi-events-decor', 'Zawadi Events & Decor', 'services', 'Events', 'Decor & Planning', 'Weddings, baby showers and birthdays planned and decorated across Machakos.', 'Weddings, baby showers and birthdays planned and decorated across Machakos. We believe in quality, fair prices and treating every customer like family.', 'Zawadi Mutua', 'Started on a small family farm and a love for hosting. Word of mouth did the rest.', 'Machakos', 'Machakos Town', 'Machakos Town', ARRAY['Machakos Town','Athi River','Nairobi']::text[], '+254710008888', '+254710008888', 'hello@zawadi-events-decor.test', 'https://zawadi-events-decor.example.com', 'KSh KSh KSh', 'Mon-Sat 8:00-18:00, Sun by appointment', '{"instagram": "@zawadi-events-decor", "facebook": "zawadi-events-decor", "tiktok": "@zawadi-events-decor"}'::jsonb, 'https://picsum.photos/seed/zlogo1/200', 'https://picsum.photos/seed/zcover1/800/300', 'public', 'active', '2026-10-03 09:00:00+00', '2026-11-21 09:00:00+00', NULL, 'dce39d99-b285-5a31-bf22-9c0a9c0eff75')
ON CONFLICT DO NOTHING;

-- business_memberships
INSERT INTO public."business_memberships" ("Id", "BusinessId", "UserId", "Role", "GrantedByUserId", "JoinedAtUtc", "UpdatedAtUtc", "RevokedAtUtc", "Version") VALUES
  ('81b0bb34-788e-5849-848f-1cfc3d4ca7ce', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Owner', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-09-23 09:00:00+00', '2026-09-23 09:00:00+00', NULL, 'ecfc5690-ea94-5641-a981-e051c75ab3db'),
  ('ee694759-316e-5a9b-b8f4-ecc4fef4f277', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Owner', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-10-03 09:00:00+00', '2026-10-03 09:00:00+00', NULL, 'eda02d32-9972-54c9-9305-b1f4c1d547c7'),
  ('eebb91a2-f537-52a0-8e22-c0b06afe21c9', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '899a632e-c21a-571d-8821-740e44bcfe18', 'Editor', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-10-23 09:00:00+00', '2026-10-23 09:00:00+00', NULL, '55cc919b-4c0e-593d-91d7-e8fb1f280a86'),
  ('69268abc-d12d-5606-897a-9d8b42d8e224', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Admin', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-10-28 09:00:00+00', '2026-10-28 09:00:00+00', NULL, 'f00a3d4c-b310-53ac-b577-58728ca29997'),
  ('926715fd-3557-5f4a-a61b-9823b916ddb3', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'Viewer', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00', NULL, '76706419-5a27-554f-a7a8-a976d8397014')
ON CONFLICT DO NOTHING;

-- business_follows
INSERT INTO public."business_follows" ("UserId", "BusinessId", "CreatedAtUtc") VALUES
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '280488ab-1b8f-5a47-9489-ce75188f28b1', '2026-11-18 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '8aa68099-7e22-5399-a41a-b873be05ef51', '2026-11-17 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'bda8f585-3014-5f42-a7f2-40dc4427f56e', '2026-11-16 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '9326a4b1-3656-5e9c-b94e-e92c40391cbc', '2026-11-15 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '5fbd70f3-0365-5cf8-b327-324de069352a', '2026-11-14 09:00:00+00'),
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', '8398434e-ee49-5d50-9c17-c727138512b7', '2026-11-13 09:00:00+00'),
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-20 09:00:00+00'),
  ('0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-20 09:00:00+00'),
  ('899a632e-c21a-571d-8821-740e44bcfe18', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-19 09:00:00+00'),
  ('5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-18 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-17 09:00:00+00'),
  ('16fa9d0e-e941-5694-8fed-67a28a259705', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-17 09:00:00+00'),
  ('3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-16 09:00:00+00'),
  ('1db35632-758e-5f2b-a531-8623b034fcbd', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-15 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-14 09:00:00+00'),
  ('72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-14 09:00:00+00'),
  ('ca288d45-0602-5eb5-b48c-1e89b70ddf47', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-13 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-11 09:00:00+00'),
  ('1b65449c-b149-5ee8-9e89-e862b03507dd', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-11 09:00:00+00'),
  ('c63b7280-6331-5031-b04a-6f6cb293d25f', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '2026-11-10 09:00:00+00'),
  ('1154ef9b-ce5b-5802-9212-cf983c0d6db1', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '2026-11-09 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_invitations
INSERT INTO public."business_invitations" ("Id", "BusinessId", "InvitedUserId", "InvitedByUserId", "Role", "Status", "CreatedAtUtc", "ExpiresAtUtc", "RespondedAtUtc", "CancelledAtUtc", "Version") VALUES
  ('08f5307b-6ad1-56e4-926c-76546c71b53a', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Viewer', 'pending', '2026-11-21 09:00:00+00', '2026-11-28 09:00:00+00', NULL, NULL, 'f14789f6-e6d5-5a1b-9789-648ad81a103f')
ON CONFLICT DO NOTHING;

-- business_milestones
INSERT INTO public."business_milestones" ("Id", "BusinessId", "CreatedByUserId", "Title", "Description", "AchievedAtUtc", "IsSelfReported", "Visibility", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('cfb6eccf-281c-5364-b5ad-c64c1ff1a517', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'First 100 jars sold', 'Our honey sold out at the Machakos market.', '2026-11-12 09:00:00+00', true, 'public', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('55c745d3-5599-507e-9e75-dfcae7e9df2e', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Planned 20 events', 'Twenty weddings and parties decorated.', '2026-10-31 09:00:00+00', true, 'public', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('46bae8ee-e790-5ff6-9e5c-5267e7f38486', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Supplying 3 shops', 'Our preserves are now stocked in three shops.', '2026-10-19 09:00:00+00', true, 'public', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('f7144516-0d4b-5328-9373-5cdcdb09b57d', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Featured on local radio', 'Interviewed about women in business.', '2026-10-07 09:00:00+00', true, 'public', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_opportunities
INSERT INTO public."business_opportunities" ("Id", "BusinessId", "CreatedByUserId", "Title", "Description", "Category", "Budget", "Currency", "ExpiresAtUtc", "Status", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('007f9ff1-1d05-5947-9201-59814d9297f6', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Jar and label supplier', 'Looking for a supplier of 500ml glass jars and printed labels.', 'Supply', 60000.00, 'KES', '2026-12-12 09:00:00+00', 'open', '2026-11-18 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('c5807ec0-b854-5e4e-ad74-cd77e0a731c3', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Event assistants (weekends)', 'Need 3 reliable helpers for weekend decor setup.', 'Hiring', 30000.00, 'KES', '2026-12-02 09:00:00+00', 'open', '2026-11-20 09:00:00+00', '2026-11-20 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_activity
INSERT INTO public."business_activity" ("Id", "BusinessId", "ActorUserId", "EventType", "Summary", "CreatedAtUtc", "MetadataJson") VALUES
  ('76df061c-ba5f-5862-9bce-50cfc6bd991f', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'profile_updated', 'Updated business profile', '2026-11-22 09:00:00+00', '{"seed": true}'::jsonb),
  ('22cc06e0-59c0-5f12-bf11-4cdf5ef83eb8', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'item_published', 'Published a new catalog item', '2026-11-21 09:00:00+00', '{"seed": true}'::jsonb),
  ('bc1e5819-dc5f-5bb5-a721-9493e1185ca2', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'member_added', 'Added a team member', '2026-11-20 09:00:00+00', '{"seed": true}'::jsonb),
  ('f7b55929-883e-50ee-b9be-6457f2cfad74', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'hours_changed', 'Changed opening hours', '2026-11-19 09:00:00+00', '{"seed": true}'::jsonb),
  ('919a795b-3b1e-5a65-81f7-ef4a7d4ebad2', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'profile_updated', 'Updated business profile', '2026-11-18 09:00:00+00', '{"seed": true}'::jsonb),
  ('8bebbc13-3ba7-53d7-8b3b-59048847b729', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'item_published', 'Published a new catalog item', '2026-11-17 09:00:00+00', '{"seed": true}'::jsonb),
  ('c4d2d154-577a-5698-8eb4-463560720b81', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'member_added', 'Added a team member', '2026-11-16 09:00:00+00', '{"seed": true}'::jsonb),
  ('2a0f68a3-1746-5b1b-944f-c605355bb285', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'hours_changed', 'Changed opening hours', '2026-11-15 09:00:00+00', '{"seed": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- business_analytics_events
INSERT INTO public."business_analytics_events" ("Id", "BusinessId", "ActorUserId", "EventType", "SubjectType", "SubjectId", "MetadataJson", "CreatedAtUtc") VALUES
  ('9f18359f-2983-59c3-8a63-93ceab5e1b0c', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', NULL, 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-22 09:00:00+00'),
  ('6f8daa48-7629-5e36-99e0-4d621b1411a6', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-21 09:00:00+00'),
  ('7bf860e6-2c90-53e6-99bf-23287689cc09', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '16fa9d0e-e941-5694-8fed-67a28a259705', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-20 09:00:00+00'),
  ('12025b54-b827-5ebb-9606-78e54c2bcf0b', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-19 09:00:00+00'),
  ('dca0b2a0-b126-5f95-ad1d-90cf3b8580c0', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1db35632-758e-5f2b-a531-8623b034fcbd', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-18 09:00:00+00'),
  ('62446dbf-1aa4-5696-98ca-2c79186dd643', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-17 09:00:00+00'),
  ('1b8004de-abe6-5253-ab2e-43d23d9b4c33', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-16 09:00:00+00'),
  ('95dd2603-2fda-509b-a75a-fdde62922e6f', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-15 09:00:00+00'),
  ('c2647968-81cd-5517-ab22-fbec97544830', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-14 09:00:00+00'),
  ('f5be9943-58ed-5342-a208-7106eccb6f51', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-13 09:00:00+00'),
  ('8cc38de1-ea26-5972-9ced-d00422984082', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', NULL, 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-12 09:00:00+00'),
  ('2ff64183-8c16-5257-9b33-30c1b2ef973e', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-11 09:00:00+00'),
  ('888c00aa-dd19-55cc-af65-07f65045cecf', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '899a632e-c21a-571d-8821-740e44bcfe18', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-10 09:00:00+00'),
  ('a81505c7-372a-5cbc-8949-efea5b4ec7bf', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-09 09:00:00+00'),
  ('5c1a844d-323e-5d1d-bff1-59e43bf1a44c', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '16fa9d0e-e941-5694-8fed-67a28a259705', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-08 09:00:00+00'),
  ('d079c6e4-8937-5da4-a7aa-4bb927c48f04', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-07 09:00:00+00'),
  ('561d8e83-b671-5a2c-9a37-23c248321bf9', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1db35632-758e-5f2b-a531-8623b034fcbd', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-06 09:00:00+00'),
  ('a031d75c-7f59-5065-b17d-77b70a168686', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-05 09:00:00+00'),
  ('5350a5dd-7b31-5711-aabd-9f44539a4a57', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-04 09:00:00+00'),
  ('db443152-260b-59b1-b7dc-4e937eaed779', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-03 09:00:00+00'),
  ('4b6e01c8-a149-5eb0-abc7-1d0be3e47dbf', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', NULL, 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-22 09:00:00+00'),
  ('1c547f97-6675-57e1-a3f7-27d7e5d5c0e6', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-21 09:00:00+00'),
  ('d4a5f424-eefc-5454-b1b1-5dc6ed6d5eec', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-20 09:00:00+00'),
  ('b0e02837-84b6-50b1-b6a7-9a5624c891c2', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-19 09:00:00+00'),
  ('9c86e6c4-01e9-5201-a683-99fcb15bd858', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '899a632e-c21a-571d-8821-740e44bcfe18', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-18 09:00:00+00'),
  ('9f3afc27-d092-5d31-979e-e160dd055cb3', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-17 09:00:00+00'),
  ('e78fe739-32bb-55b8-a58b-13ac3e68d608', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '16fa9d0e-e941-5694-8fed-67a28a259705', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-16 09:00:00+00'),
  ('0a6c675d-dd57-5f45-9be5-dd8aa85108fc', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-15 09:00:00+00'),
  ('e926b656-390d-50bb-af10-49e50af16c56', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1db35632-758e-5f2b-a531-8623b034fcbd', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-14 09:00:00+00'),
  ('e5125a66-001e-5fb5-b151-eb4030e683ba', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-13 09:00:00+00'),
  ('6ad1aa3b-990d-53b7-b16a-0f3a1d0fbeeb', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', NULL, 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-12 09:00:00+00'),
  ('8b72cf3c-9dd9-5958-8a49-3d30ac0442de', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-11 09:00:00+00'),
  ('241114d9-3799-5b0f-a188-91ffe1b686f4', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-10 09:00:00+00'),
  ('8307bd64-8bdd-51da-a1e9-1df35d5cc501', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-09 09:00:00+00'),
  ('68a9b69c-2d33-531e-bbc8-055fc9551eda', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-08 09:00:00+00'),
  ('179e8f09-4e59-5fbf-b9b7-0570e7aead6c', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', NULL, 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-07 09:00:00+00'),
  ('8ada38a1-2dc3-5574-b4ce-2c26513d04b5', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '899a632e-c21a-571d-8821-740e44bcfe18', 'profile_view', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-06 09:00:00+00'),
  ('47bffb20-ed51-52ef-a098-77760a8ae448', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'catalog_view', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-05 09:00:00+00'),
  ('d46544d0-48b7-57e8-81b9-4c1fbf3eb618', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '16fa9d0e-e941-5694-8fed-67a28a259705', 'contact_click', 'business', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '{"seed": true}'::jsonb, '2026-11-04 09:00:00+00'),
  ('3eacf7cb-37ca-529f-9c21-fde66d9a8c6a', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'follow', 'business', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '{"seed": true}'::jsonb, '2026-11-03 09:00:00+00')
ON CONFLICT DO NOTHING;

-- media_assets
INSERT INTO public."media_assets" ("Id", "BusinessId", "UploadedByUserId", "Provider", "StorageKey", "ContentType", "SizeBytes", "Sha256", "WidthPx", "HeightPx", "Status", "CreatedAtUtc", "DeletedAtUtc", "Version") VALUES
  ('f4f3a99b-ccf0-5347-b99b-cd1e0547a571', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img0.jpg', 'image/jpeg', 150000, '9944e98ffa6b61e46057fc159b0f971475dfb0c8b2b0157b5102e643ed6f4d4b', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '6b13ca28-4471-5e9f-91d2-d8fd95ea0c30'),
  ('3d69fe4b-31fa-5442-b24a-4d63f55c4956', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img1.jpg', 'image/jpeg', 159000, '6f7b87c9be2029286bc0b35acf10c65d6667eaf784892695bcda665a997738d9', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'cc5ea91b-7179-55ab-8258-2fa337756f13'),
  ('99d748e2-3813-58a2-a727-842cee16cd70', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img2.jpg', 'image/jpeg', 168000, '7cf3c2936a5ad186ff4bfef170200947393f0a10793cc1799d99465fc2403cac', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, 'eeaf4d7b-e1e1-5718-81ce-e791aa7695a7'),
  ('7949230b-d6e6-5084-9cd5-9d03e125673f', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img3.jpg', 'image/jpeg', 177000, 'd598e1714eae69551a8d235d8838fe2bc7f54b59d8299d07b57c5ab85a13c52b', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '805fbd81-3021-5741-ae9e-c84891dd123d'),
  ('c33654ca-205c-562c-838c-78bb1ecb38e1', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img4.jpg', 'image/jpeg', 186000, 'af4327b7739c6d37057258fa95924420dea0a75ef0c92959a646765065ec4713', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '3f69f130-fb2f-557a-bc42-ee1dbaa01089'),
  ('cffdd6bd-45ba-5bd3-ad69-1a1939f1ccc5', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'local', 'seed/zawadi/img5.jpg', 'image/jpeg', 195000, 'ecd0877b6a4041a6b1e5f85ba46ad4f10cd3114e9813ad220edbbceddcd41d80', 1080, 1080, 'ready', '2026-10-23 09:00:00+00', NULL, '1bc40fdb-2dc6-5d82-afeb-ef76282e4ae7')
ON CONFLICT DO NOTHING;

-- catalog_items
INSERT INTO public."catalog_items" ("Id", "BusinessId", "CreatedByUserId", "Kind", "Title", "Slug", "Description", "Category", "Subcategory", "PriceKsh", "PriceNote", "Currency", "PriceNegotiable", "Sku", "StockQuantity", "InStock", "Unit", "AvailabilityStatus", "LeadTimeDays", "DurationMinutes", "ServiceAreas", "VisitType", "Status", "AttributesJson", "CreatedAtUtc", "UpdatedAtUtc", "PublishedAtUtc", "ArchivedAtUtc", "Version") VALUES
  ('1f404130-47e6-55eb-a3e1-e917680d2cdd', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'product', 'Raw Forest Honey (500g)', 'raw-forest-honey-500g', 'Raw Forest Honey (500g) from Mua Hills Honey & Preserves.', 'Honey', 'Raw', 750.00, 'per jar', 'KES', false, 'ZSKU-000', 15, true, 'pcs', 'available', NULL, NULL, ARRAY['Machakos Town','Athi River']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'b95d88d7-b5c8-5df0-b311-e183a3642d17'),
  ('831e81fc-d85d-503e-916b-f4b4592a501d', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'product', 'Mango Jam (300g)', 'mango-jam-300g', 'Mango Jam (300g) from Mua Hills Honey & Preserves.', 'Preserves', 'Jam', 350.00, 'per jar', 'KES', false, 'ZSKU-001', 18, true, 'pcs', 'available', NULL, NULL, ARRAY['Machakos Town','Athi River']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '1bd4ab9b-9a81-5b00-bfdb-e6c74ede4039'),
  ('6b91a077-52ec-595b-a743-b5be45a77c97', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'product', 'Dried Pawpaw Pack', 'dried-pawpaw-pack', 'Dried Pawpaw Pack from Mua Hills Honey & Preserves.', 'Dried Fruit', 'Pawpaw', 300.00, 'per pack', 'KES', false, 'ZSKU-002', 21, true, 'pcs', 'available', NULL, NULL, ARRAY['Machakos Town','Athi River']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'e918c13f-de68-594e-8ec2-bbd11d14a738'),
  ('a6903f6a-a44e-56d3-83b7-4e05220a3dd3', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'product', 'Honey Gift Hamper', 'honey-gift-hamper', 'Honey Gift Hamper from Mua Hills Honey & Preserves.', 'Gifts', 'Hampers', 2500.00, 'each', 'KES', false, 'ZSKU-003', 24, true, 'pcs', 'available', NULL, NULL, ARRAY['Machakos Town','Athi River']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '49872581-ec9d-5abd-994a-a51391565aeb'),
  ('52a1b7c6-edf3-558e-8e2c-262a4904d2ce', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'product', 'Beeswax Candles (set of 3)', 'beeswax-candles-3', 'Beeswax Candles (set of 3) from Mua Hills Honey & Preserves.', 'Home', 'Candles', 900.00, 'per set', 'KES', false, 'ZSKU-004', 27, true, 'pcs', 'available', NULL, NULL, ARRAY['Machakos Town','Athi River']::text[], NULL, 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '4abcfddd-f1dc-50bc-8425-6c065657d0aa'),
  ('04282db7-4f2b-5871-bd85-972eb5e44aa2', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'service', 'Wedding Decor Package', 'wedding-decor-package', 'Wedding Decor Package from Zawadi Events & Decor.', 'Weddings', 'Decor', 85000.00, 'from', 'KES', true, NULL, NULL, NULL, NULL, 'on_request', 7, 240, ARRAY['Machakos Town','Athi River']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'f5e4a270-5537-53a9-b63c-c216ac52c5c7'),
  ('0c537217-96a7-5526-b512-3c8051a284eb', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'service', 'Baby Shower Setup', 'baby-shower-setup', 'Baby Shower Setup from Zawadi Events & Decor.', 'Parties', 'Baby Showers', 25000.00, 'from', 'KES', true, NULL, NULL, NULL, NULL, 'on_request', 7, 240, ARRAY['Machakos Town','Athi River']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '1a294aca-83ec-532d-b577-844218f5b8d3'),
  ('e4aa41fc-6806-5391-b1df-3fa0a085cfee', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'service', 'Birthday Balloon Arch', 'birthday-balloon-arch', 'Birthday Balloon Arch from Zawadi Events & Decor.', 'Parties', 'Birthdays', 8000.00, 'from', 'KES', true, NULL, NULL, NULL, NULL, 'on_request', 7, 240, ARRAY['Machakos Town','Athi River']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, '2f3b657f-954d-59e1-90e5-c777d554bc06'),
  ('3d6ddf97-e1e0-5161-8c4c-f7dc221b9eaf', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'service', 'Event Planning (Full Day)', 'event-planning-full-day', 'Event Planning (Full Day) from Zawadi Events & Decor.', 'Planning', 'Coordination', 30000.00, 'from', 'KES', true, NULL, NULL, NULL, NULL, 'on_request', 7, 240, ARRAY['Machakos Town','Athi River']::text[], 'onsite', 'published', '{"seed": true}'::jsonb, '2026-10-13 09:00:00+00', '2026-11-19 09:00:00+00', '2026-10-13 09:00:00+00', NULL, 'ddc33382-e241-50de-93c0-da21b47a8a56')
ON CONFLICT DO NOTHING;

-- catalog_item_media
INSERT INTO public."catalog_item_media" ("Id", "CatalogItemId", "MediaAssetId", "SortOrder", "AltText", "CreatedAtUtc") VALUES
  ('99241223-8f44-57a4-b7cc-9827cf500fdf', '1f404130-47e6-55eb-a3e1-e917680d2cdd', 'f4f3a99b-ccf0-5347-b99b-cd1e0547a571', 0, 'Raw Forest Honey (500g) photo', '2026-10-13 09:00:00+00'),
  ('a0c5041f-1be8-552b-8301-0c8aa59c7688', '831e81fc-d85d-503e-916b-f4b4592a501d', '3d69fe4b-31fa-5442-b24a-4d63f55c4956', 0, 'Mango Jam (300g) photo', '2026-10-13 09:00:00+00'),
  ('a5e11abd-3cdd-5dc6-9947-a181a889e1c3', '6b91a077-52ec-595b-a743-b5be45a77c97', '99d748e2-3813-58a2-a727-842cee16cd70', 0, 'Dried Pawpaw Pack photo', '2026-10-13 09:00:00+00'),
  ('d3be892f-a08a-501c-9308-1fc8b655c4d1', 'a6903f6a-a44e-56d3-83b7-4e05220a3dd3', '7949230b-d6e6-5084-9cd5-9d03e125673f', 0, 'Honey Gift Hamper photo', '2026-10-13 09:00:00+00'),
  ('96a1dd18-65f4-56ff-9859-ac3230442a2d', '52a1b7c6-edf3-558e-8e2c-262a4904d2ce', 'c33654ca-205c-562c-838c-78bb1ecb38e1', 0, 'Beeswax Candles (set of 3) photo', '2026-10-13 09:00:00+00'),
  ('ea62621f-f725-5e82-9506-7e4918819ccd', '04282db7-4f2b-5871-bd85-972eb5e44aa2', 'cffdd6bd-45ba-5bd3-ad69-1a1939f1ccc5', 0, 'Wedding Decor Package photo', '2026-10-13 09:00:00+00'),
  ('55dddd26-ee72-534c-a59b-d6aab3074b17', '0c537217-96a7-5526-b512-3c8051a284eb', 'f4f3a99b-ccf0-5347-b99b-cd1e0547a571', 0, 'Baby Shower Setup photo', '2026-10-13 09:00:00+00'),
  ('37a51e7e-c4de-52cb-ba55-ebce869523cd', 'e4aa41fc-6806-5391-b1df-3fa0a085cfee', '3d69fe4b-31fa-5442-b24a-4d63f55c4956', 0, 'Birthday Balloon Arch photo', '2026-10-13 09:00:00+00'),
  ('292390fe-8b0d-56ed-814d-057863cd3fd7', '3d6ddf97-e1e0-5161-8c4c-f7dc221b9eaf', '99d748e2-3813-58a2-a727-842cee16cd70', 0, 'Event Planning (Full Day) photo', '2026-10-13 09:00:00+00'),
  ('75ad94c7-a34e-5676-907c-1535af643e71', '1f404130-47e6-55eb-a3e1-e917680d2cdd', '3d69fe4b-31fa-5442-b24a-4d63f55c4956', 1, 'Raw Forest Honey (500g) photo 2', '2026-10-13 09:00:00+00'),
  ('f7071ebd-bc65-59da-a484-90f05bf7d13f', '6b91a077-52ec-595b-a743-b5be45a77c97', '7949230b-d6e6-5084-9cd5-9d03e125673f', 1, 'Dried Pawpaw Pack photo 2', '2026-10-13 09:00:00+00'),
  ('a7e6e057-cfa2-5be7-b117-e3b66af4d0ce', '52a1b7c6-edf3-558e-8e2c-262a4904d2ce', 'cffdd6bd-45ba-5bd3-ad69-1a1939f1ccc5', 1, 'Beeswax Candles (set of 3) photo 2', '2026-10-13 09:00:00+00'),
  ('fd26bc33-7303-5925-941d-778bd277692f', '0c537217-96a7-5526-b512-3c8051a284eb', '3d69fe4b-31fa-5442-b24a-4d63f55c4956', 1, 'Baby Shower Setup photo 2', '2026-10-13 09:00:00+00'),
  ('0ae90fbb-26cf-58c3-88b7-e40be7b791ff', '3d6ddf97-e1e0-5161-8c4c-f7dc221b9eaf', '7949230b-d6e6-5084-9cd5-9d03e125673f', 1, 'Event Planning (Full Day) photo 2', '2026-10-13 09:00:00+00')
ON CONFLICT DO NOTHING;

-- business_reviews
INSERT INTO public."business_reviews" ("Id", "BusinessId", "ReviewerUserId", "Rating", "Comment", "Status", "OwnerResponse", "OwnerRespondedAtUtc", "OwnerRespondedByUserId", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('ad9285d9-5cc1-5995-a784-f84f59c18b0a', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '899a632e-c21a-571d-8821-740e44bcfe18', 5, 'Best honey I''ve ever had, will order again!', 'published', 'Asante sana, karibu tena!', '2026-11-21 09:00:00+00', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('2d680a9c-b8de-51b7-8fc4-eb733127cabc', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 5, 'The hamper was a perfect gift.', 'published', 'So glad she loved it!', '2026-11-21 09:00:00+00', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('5dff92d2-af1c-5671-9010-36c615e76b00', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '16fa9d0e-e941-5694-8fed-67a28a259705', 4, 'Jam is delicious, delivery took a day longer.', 'published', NULL, NULL, NULL, '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('54152081-6f6e-509e-a74b-6576f4501123', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1db35632-758e-5f2b-a531-8623b034fcbd', 5, 'Fresh and natural, nothing artificial.', 'published', NULL, NULL, NULL, '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('c723eac3-c057-5dc4-84c2-461ca0f90b15', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 5, 'Our wedding looked unreal, thank you Zawadi!', 'published', 'It was a pleasure, congratulations again!', '2026-11-21 09:00:00+00', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('5217fffa-ae2b-5039-9f99-761e1d822726', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 4, 'Beautiful baby shower setup.', 'published', NULL, NULL, NULL, '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('a54f8e37-6ee8-5aa8-abfc-1ad80ed5b4df', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 5, 'Professional and on time.', 'published', 'Thank you Samuel!', '2026-11-21 09:00:00+00', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('f555fd77-7b99-586b-897a-7c848538825a', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 3, 'Lovely decor, a bit above my budget.', 'published', 'We have lighter packages, DM us.', '2026-11-21 09:00:00+00', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('d5f60a44-8aee-56e8-b91b-c70b9fe1144d', '280488ab-1b8f-5a47-9489-ce75188f28b1', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 5, 'Their pilau at my event was a hit.', 'published', 'Asante Zawadi!', '2026-11-21 09:00:00+00', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('a65aeefc-1fae-5a40-99f7-f49c3fc06ae8', '8aa68099-7e22-5399-a41a-b873be05ef51', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 4, 'Fresh fish, fair price.', 'published', NULL, NULL, NULL, '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('8cb02099-6dd5-59be-ac1d-9caa038c2233', '5fbd70f3-0365-5cf8-b327-324de069352a', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 5, 'Gorgeous ankara pieces.', 'published', NULL, NULL, NULL, '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00')
ON CONFLICT DO NOTHING;

-- posts
INSERT INTO public."posts" ("Id", "AuthorUserId", "BusinessId", "Kind", "Audience", "Discoverable", "AllowComments", "Text", "Location", "ProductJson", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'text', 'public', true, true, 'Honey harvest day at Mua Hills! Fresh jars available from Monday.', 'Machakos', NULL, '2026-10-28 09:00:00+00', '2026-10-28 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'product', 'public', true, true, 'New: Mango Jam is back in stock. Who wants a jar?', 'Machakos', '{"name": "Mango Jam (300g)", "priceKsh": 350}'::jsonb, '2026-10-30 09:00:00+00', '2026-10-30 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'image', 'public', true, true, 'Weekend wedding setup in Athi River, so proud of the team!', 'Machakos', NULL, '2026-11-01 09:00:00+00', '2026-11-01 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'text', 'followers', true, true, 'Sunday vibes with my girls in Machakos.', 'Machakos', NULL, '2026-11-03 09:00:00+00', '2026-11-03 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'announcement', 'public', true, true, 'Baby shower packages now open for December bookings.', 'Machakos', NULL, '2026-11-05 09:00:00+00', '2026-11-05 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'product', 'public', true, true, 'Honey gift hampers for the festive season. Order early!', 'Machakos', '{"name": "Raw Forest Honey (500g)", "priceKsh": 750}'::jsonb, '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '18e86cde-24c2-5b1c-b2d9-b57dfe1bb3bc', 'video', 'public', true, true, 'Behind the scenes of our balloon arch build.', 'Machakos', NULL, '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'text', 'public', true, true, 'Thank you to everyone who supported us this year.', 'Machakos', NULL, '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'text', 'public', true, true, 'Which hamper size should we add next?', 'Machakos', NULL, '2026-11-13 09:00:00+00', '2026-11-13 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', 'image', 'public', true, true, 'Market day in Machakos, come say hi!', 'Machakos', NULL, '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_media_references
INSERT INTO public."post_media_references" ("Id", "PostId", "MediaType", "Url", "AltText", "SortOrder") VALUES
  ('80d95c9a-e135-5013-b1b6-38775d1c5dc3', '5dc76fa4-f1c5-530b-b197-0dc00e927928', 'image', 'https://picsum.photos/seed/zpost0/800/600', 'Post image', 0),
  ('443d006a-fdd2-51cc-8e5f-e79180a7945b', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', 'image', 'https://picsum.photos/seed/zpost2/800/600', 'Post image', 0),
  ('547fdd77-6597-567f-84cf-71bbab5c372e', '51a25cef-eedc-5624-8760-e17afdf7b358', 'image', 'https://picsum.photos/seed/zpost5/800/600', 'Post image', 0),
  ('a7afd452-fc47-5d9c-a469-5ec8d27c3348', 'd840e68e-9e20-5673-afb8-d9049968890d', 'image', 'https://picsum.photos/seed/zpost9/800/600', 'Post image', 0)
ON CONFLICT DO NOTHING;

-- comments
INSERT INTO public."comments" ("Id", "PostId", "AuthorUserId", "ParentCommentId", "Text", "CreatedAtUtc", "UpdatedAtUtc") VALUES
  ('9e288197-72c7-542f-b07b-2256890d4979', '5dc76fa4-f1c5-530b-b197-0dc00e927928', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, 'Love this!', '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00'),
  ('998c241c-64c5-5c19-a0d7-2e2fd97f0b61', '5dc76fa4-f1c5-530b-b197-0dc00e927928', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'Where exactly are you located?', '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00'),
  ('45fb57d9-4028-5901-86e6-4c5eb8424c64', '5dc76fa4-f1c5-530b-b197-0dc00e927928', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'Congratulations Zawadi!', '2026-11-02 09:00:00+00', '2026-11-02 09:00:00+00'),
  ('1a406d4e-0ea4-5a9b-965b-6848d2edd593', '69a92065-77a8-50b0-b966-f15d096daa31', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', NULL, 'Where exactly are you located?', '2026-11-03 09:00:00+00', '2026-11-03 09:00:00+00'),
  ('9bb494f1-9175-5e4d-b884-5353cbcaf562', '69a92065-77a8-50b0-b966-f15d096daa31', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, 'Congratulations Zawadi!', '2026-11-03 09:00:00+00', '2026-11-03 09:00:00+00'),
  ('dbec49c8-8bec-5598-b91e-fa7d6efd5b1b', '69a92065-77a8-50b0-b966-f15d096daa31', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, 'Do you deliver to Nairobi?', '2026-11-03 09:00:00+00', '2026-11-03 09:00:00+00'),
  ('48363f95-c9d0-575f-91f8-d17e075ff99b', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '16fa9d0e-e941-5694-8fed-67a28a259705', NULL, 'Congratulations Zawadi!', '2026-11-04 09:00:00+00', '2026-11-04 09:00:00+00'),
  ('54a836f7-cde8-5053-86e3-2151b75ef7da', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'Do you deliver to Nairobi?', '2026-11-04 09:00:00+00', '2026-11-04 09:00:00+00'),
  ('99228998-535e-5d50-b5d8-1015412765cb', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'Tutaonana soon.', '2026-11-04 09:00:00+00', '2026-11-04 09:00:00+00'),
  ('61e9f70e-f593-5833-96a4-e6549a144f20', '08b09864-a18b-5ace-9c41-9f42879fb13d', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, 'Do you deliver to Nairobi?', '2026-11-05 09:00:00+00', '2026-11-05 09:00:00+00'),
  ('9ee196bc-b9e3-587a-9e37-76508cf24d55', '08b09864-a18b-5ace-9c41-9f42879fb13d', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, 'Tutaonana soon.', '2026-11-05 09:00:00+00', '2026-11-05 09:00:00+00'),
  ('6e22cd39-44cc-5cb0-86a5-d80e3dff9f10', '08b09864-a18b-5ace-9c41-9f42879fb13d', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'Great prices.', '2026-11-05 09:00:00+00', '2026-11-05 09:00:00+00'),
  ('43068ca3-990c-59e7-86f4-965bf22f25a6', '6f2a990a-10a7-56cf-84b9-f37834b7f834', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, 'Tutaonana soon.', '2026-11-06 09:00:00+00', '2026-11-06 09:00:00+00'),
  ('887c0c7b-3673-5caa-bffd-e433e3a5846b', '6f2a990a-10a7-56cf-84b9-f37834b7f834', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'Great prices.', '2026-11-06 09:00:00+00', '2026-11-06 09:00:00+00'),
  ('0db76321-9280-551c-9ebd-cb5af4ffbb26', '6f2a990a-10a7-56cf-84b9-f37834b7f834', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'I want two jars please', '2026-11-06 09:00:00+00', '2026-11-06 09:00:00+00'),
  ('77777379-3c35-580b-9b0e-becfb1841c2f', '51a25cef-eedc-5624-8760-e17afdf7b358', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', NULL, 'Great prices.', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('6d674d3f-76bf-56ca-9437-7456a653b4c8', '51a25cef-eedc-5624-8760-e17afdf7b358', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'I want two jars please', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('2b4d757e-b372-5a79-8244-046e37c5f0d0', '51a25cef-eedc-5624-8760-e17afdf7b358', 'c63b7280-6331-5031-b04a-6f6cb293d25f', NULL, 'Beautiful work!', '2026-11-07 09:00:00+00', '2026-11-07 09:00:00+00'),
  ('738fcc13-9d76-574e-8526-fdff051a67ea', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, 'I want two jars please', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('18b9f0e7-bc9f-5baa-99d3-fbe587829563', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'Beautiful work!', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('6691a9ba-92e2-5efc-9009-4766821415ae', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', NULL, 'Can I book for December?', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('1aff7025-83c8-562d-a7bc-1a243738579e', '72456e92-4da9-5b89-a40c-d6aa5030dce8', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'Beautiful work!', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('3606e989-08ed-5d51-a63c-ea53a6e7b600', '72456e92-4da9-5b89-a40c-d6aa5030dce8', 'c63b7280-6331-5031-b04a-6f6cb293d25f', NULL, 'Can I book for December?', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('f9e4a886-9633-5670-82d5-59049147a3d4', '72456e92-4da9-5b89-a40c-d6aa5030dce8', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, 'Asante for the quick delivery', '2026-11-09 09:00:00+00', '2026-11-09 09:00:00+00'),
  ('a7016a67-b8dd-55c1-bd5b-100109f11dad', 'db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, 'Can I book for December?', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('d6dc62b9-823b-5338-9045-f87d342d56bb', 'db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', NULL, 'Asante for the quick delivery', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('ab1cdc58-6c95-543b-b282-b9ba80572c24', 'db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, 'Love this!', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('8952b09b-c98a-54ef-a6f2-535a192dfef3', 'd840e68e-9e20-5673-afb8-d9049968890d', 'c63b7280-6331-5031-b04a-6f6cb293d25f', NULL, 'Asante for the quick delivery', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('70efff0d-d33a-583f-ac3c-75f55af3aa9a', 'd840e68e-9e20-5673-afb8-d9049968890d', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, 'Love this!', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('02e96cee-fde0-5b3d-a8c8-3cbea911c9fe', 'd840e68e-9e20-5673-afb8-d9049968890d', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', NULL, 'Where exactly are you located?', '2026-11-11 09:00:00+00', '2026-11-11 09:00:00+00'),
  ('7b20eccd-002c-54df-8fec-0d5b2b717e09', '5dc76fa4-f1c5-530b-b197-0dc00e927928', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '9e288197-72c7-542f-b07b-2256890d4979', 'Thanks for asking, I''ll DM you the details!', '2026-11-04 09:00:00+00', '2026-11-04 09:00:00+00'),
  ('d88fbfe1-b5b5-5459-8950-bec0b2e08c07', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '48363f95-c9d0-575f-91f8-d17e075ff99b', 'Thanks for asking, I''ll DM you the details!', '2026-11-06 09:00:00+00', '2026-11-06 09:00:00+00'),
  ('dacd37ae-bab7-5bd0-ab64-be9d261b57af', '6f2a990a-10a7-56cf-84b9-f37834b7f834', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '43068ca3-990c-59e7-86f4-965bf22f25a6', 'Thanks for asking, I''ll DM you the details!', '2026-11-08 09:00:00+00', '2026-11-08 09:00:00+00'),
  ('b23b6178-6149-5f86-97b5-273769b1f712', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '738fcc13-9d76-574e-8526-fdff051a67ea', 'Thanks for asking, I''ll DM you the details!', '2026-11-10 09:00:00+00', '2026-11-10 09:00:00+00'),
  ('97b31a76-fb6a-5a80-9f09-18c2a63cd6ab', 'db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'a7016a67-b8dd-55c1-bd5b-100109f11dad', 'Thanks for asking, I''ll DM you the details!', '2026-11-12 09:00:00+00', '2026-11-12 09:00:00+00'),
  ('88caa2d2-3bfd-5cc3-b7b4-dc603a0a28d0', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Fresh produce, love it', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('c555457c-747d-51d6-b205-c882e0a50046', '4c185579-0a17-5c24-8ed2-bf6b557ead8e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'This pilau looks great', '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('fe275bdb-e4c5-5029-81ab-4e17dd074259', 'b09b420d-58e1-57ae-8208-af08c02fedb1', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Can''t wait for my order', '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00'),
  ('96b6843a-42d7-50a9-8af4-2d7eb137d5d4', 'f618e541-20c1-5132-9f3b-e57bc1058561', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Congrats on the launch', '2026-11-17 09:00:00+00', '2026-11-17 09:00:00+00'),
  ('33b7276c-cfc9-59a0-8457-1c5339b14259', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Beautiful dress', '2026-11-18 09:00:00+00', '2026-11-18 09:00:00+00'),
  ('253c7c1f-dcb2-5b05-afff-1a6a65ee1404', '4760cd0e-524d-5467-adfc-99a2652eb66e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Nice tips', '2026-11-14 09:00:00+00', '2026-11-14 09:00:00+00'),
  ('5d7580cd-4b1b-5279-b151-d6448f27c0a1', 'cd6a273b-9acc-55aa-8841-b649ca4ee628', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Great sale', '2026-11-15 09:00:00+00', '2026-11-15 09:00:00+00'),
  ('3d6148a7-478b-53f6-84f8-322274cf4acc', '4103383b-d6fa-5517-90b4-2dd868248da2', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, 'Proud of you all', '2026-11-16 09:00:00+00', '2026-11-16 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_likes
INSERT INTO public."post_likes" ("PostId", "UserId", "CreatedAtUtc") VALUES
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-22 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-20 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-19 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-17 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-16 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-13 09:00:00+00'),
  ('5dc76fa4-f1c5-530b-b197-0dc00e927928', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-11 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-20 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-19 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-17 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-16 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-14 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-11 09:00:00+00'),
  ('69a92065-77a8-50b0-b966-f15d096daa31', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-22 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-20 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-19 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-17 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-16 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-14 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-13 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-11 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-22 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-19 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-17 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-16 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-14 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-13 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-22 09:00:00+00'),
  ('08b09864-a18b-5ace-9c41-9f42879fb13d', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-20 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-17 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-16 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-14 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-13 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-11 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-20 09:00:00+00'),
  ('6f2a990a-10a7-56cf-84b9-f37834b7f834', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-19 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-17 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-16 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-14 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-13 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-11 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-22 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-20 09:00:00+00'),
  ('51a25cef-eedc-5624-8760-e17afdf7b358', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-19 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-16 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-14 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-13 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-11 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-22 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-19 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-17 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-14 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-13 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-11 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-22 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-20 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-17 09:00:00+00'),
  ('72456e92-4da9-5b89-a40c-d6aa5030dce8', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-16 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-14 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '899a632e-c21a-571d-8821-740e44bcfe18', '2026-11-13 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-11 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-22 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-20 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-19 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-17 09:00:00+00'),
  ('db52bd0c-7d24-526f-8eea-18ec4b76e3f8', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-16 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-13 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-11 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-22 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-20 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-19 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-16 09:00:00+00'),
  ('d840e68e-9e20-5673-afb8-d9049968890d', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', '2026-11-14 09:00:00+00'),
  ('0e6ceb58-cab1-58e0-b2f9-8383ac45af31', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-22 09:00:00+00'),
  ('5859850b-aa3a-5849-9961-ad4e09e20f34', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-20 09:00:00+00'),
  ('f618e541-20c1-5132-9f3b-e57bc1058561', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-18 09:00:00+00'),
  ('e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-16 09:00:00+00'),
  ('49d2c53e-20b3-5711-abf6-b967b187c3b3', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-14 09:00:00+00'),
  ('4760cd0e-524d-5467-adfc-99a2652eb66e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-21 09:00:00+00'),
  ('cd6a273b-9acc-55aa-8841-b649ca4ee628', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-19 09:00:00+00'),
  ('4103383b-d6fa-5517-90b4-2dd868248da2', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-17 09:00:00+00'),
  ('c8413767-0301-576c-bb2d-a7bfe213d0f9', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-15 09:00:00+00'),
  ('0d6e9c42-7dc0-55e5-b863-2ab25962031b', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-22 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_shares
INSERT INTO public."post_shares" ("Id", "PostId", "SharedByUserId", "CreatedAtUtc") VALUES
  ('7a650e8d-7e70-5eda-88a4-26fbce2f07f3', '5dc76fa4-f1c5-530b-b197-0dc00e927928', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-22 09:00:00+00'),
  ('2a0d0744-81e6-5655-889f-759a9aeed3b1', '69a92065-77a8-50b0-b966-f15d096daa31', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '2026-11-21 09:00:00+00'),
  ('50e52a1b-6ade-5a4f-8b9b-88c8a29af537', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '1db35632-758e-5f2b-a531-8623b034fcbd', '2026-11-20 09:00:00+00'),
  ('b4268c1b-65c5-5159-9e58-be7e47c796f6', '08b09864-a18b-5ace-9c41-9f42879fb13d', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '2026-11-19 09:00:00+00'),
  ('f44ad2ac-229d-544c-a173-7217c77f6a6f', '6f2a990a-10a7-56cf-84b9-f37834b7f834', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '2026-11-18 09:00:00+00'),
  ('8a2be11b-0097-5760-b8aa-eba18a59b020', '51a25cef-eedc-5624-8760-e17afdf7b358', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', '2026-11-17 09:00:00+00'),
  ('ec1e0ac3-fe66-554a-8756-3ee6c00b7935', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '1b65449c-b149-5ee8-9e89-e862b03507dd', '2026-11-16 09:00:00+00'),
  ('6eead55f-35ad-5681-a21d-27ef8464f964', '72456e92-4da9-5b89-a40c-d6aa5030dce8', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '2026-11-15 09:00:00+00'),
  ('8bc9df45-f514-5e51-9404-a6c143c9f2b3', 'b09b420d-58e1-57ae-8208-af08c02fedb1', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-19 09:00:00+00'),
  ('eadfb510-2890-594c-ad2a-2494e3dee892', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-20 09:00:00+00')
ON CONFLICT DO NOTHING;

-- post_tags
INSERT INTO public."post_tags" ("PostId", "TaggedUserId", "TaggedByUserId", "CreatedAtUtc") VALUES
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-12 09:00:00+00'),
  ('b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-12 09:00:00+00'),
  ('e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', '899a632e-c21a-571d-8821-740e44bcfe18', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '2026-11-17 09:00:00+00'),
  ('cd6a273b-9acc-55aa-8841-b649ca4ee628', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '2026-11-18 09:00:00+00'),
  ('5837d94d-5432-57ec-bed2-e21ad23009df', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '16fa9d0e-e941-5694-8fed-67a28a259705', '2026-11-16 09:00:00+00')
ON CONFLICT DO NOTHING;

-- polls
INSERT INTO public."polls" ("Id", "PostId", "Question", "ClosesAtUtc", "CreatedAtUtc") VALUES
  ('7919a744-1376-5898-b965-535420054d24', 'db52bd0c-7d24-526f-8eea-18ec4b76e3f8', 'Which hamper size should we add next?', '2026-11-27 09:00:00+00', '2026-11-19 09:00:00+00')
ON CONFLICT DO NOTHING;

-- poll_options
INSERT INTO public."poll_options" ("Id", "PollId", "Text", "SortOrder") VALUES
  ('f89870f0-9da9-5ebf-96b3-41b50793b071', '7919a744-1376-5898-b965-535420054d24', 'Small (1 jar)', 0),
  ('78f10a4a-2174-5bc9-9382-9d0205fb4314', '7919a744-1376-5898-b965-535420054d24', 'Medium (3 jars)', 1),
  ('e16174b8-df34-535e-82e5-1c94b0631565', '7919a744-1376-5898-b965-535420054d24', 'Large (6 jars)', 2)
ON CONFLICT DO NOTHING;

-- poll_votes
INSERT INTO public."poll_votes" ("PollId", "UserId", "OptionId", "CreatedAtUtc") VALUES
  ('7919a744-1376-5898-b965-535420054d24', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'f89870f0-9da9-5ebf-96b3-41b50793b071', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '899a632e-c21a-571d-8821-740e44bcfe18', '78f10a4a-2174-5bc9-9382-9d0205fb4314', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'e16174b8-df34-535e-82e5-1c94b0631565', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '16fa9d0e-e941-5694-8fed-67a28a259705', 'f89870f0-9da9-5ebf-96b3-41b50793b071', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '78f10a4a-2174-5bc9-9382-9d0205fb4314', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '1db35632-758e-5f2b-a531-8623b034fcbd', 'e16174b8-df34-535e-82e5-1c94b0631565', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'f89870f0-9da9-5ebf-96b3-41b50793b071', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '78f10a4a-2174-5bc9-9382-9d0205fb4314', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'f89870f0-9da9-5ebf-96b3-41b50793b071', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', 'c63b7280-6331-5031-b04a-6f6cb293d25f', '78f10a4a-2174-5bc9-9382-9d0205fb4314', '2026-11-20 09:00:00+00'),
  ('7919a744-1376-5898-b965-535420054d24', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'e16174b8-df34-535e-82e5-1c94b0631565', '2026-11-20 09:00:00+00')
ON CONFLICT DO NOTHING;

-- hidden_posts
INSERT INTO public."hidden_posts" ("UserId", "PostId", "CreatedAtUtc") VALUES
  ('600d6206-4ed4-5489-b622-de7cc2dd8b80', 'c20b6b64-abff-5b79-bf77-0a539a16d686', '2026-11-19 09:00:00+00')
ON CONFLICT DO NOTHING;

-- SavedContent
INSERT INTO public."SavedContent" ("Id", "UserId", "ContentId", "Kind", "SavedAtUtc") VALUES
  ('cfca1dae-fa43-55ad-9867-004ad6b0c4bd', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '0e6ceb58-cab1-58e0-b2f9-8383ac45af31', 0, '2026-11-22 09:00:00+00'),
  ('02c7f173-0d28-5a3d-8d06-f173b6598624', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'b09b420d-58e1-57ae-8208-af08c02fedb1', 0, '2026-11-21 09:00:00+00'),
  ('4147d55e-df34-50fc-8eab-0f6473bdc110', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'e60f7ce5-92d0-5804-bca2-7d061ab94fa3', 0, '2026-11-20 09:00:00+00'),
  ('6263f766-486d-5b33-9617-af259bdfc1d9', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '26012004-8135-577b-a852-610f4e890a09', 0, '2026-11-19 09:00:00+00'),
  ('28c20b95-7c5c-553d-84bd-1d0116ae8d66', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'cd6a273b-9acc-55aa-8841-b649ca4ee628', 0, '2026-11-18 09:00:00+00'),
  ('35820e44-2442-5e3d-8b95-280d695fdb6e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'a72d9267-5c14-5491-b2eb-b0ae53015c1d', 0, '2026-11-17 09:00:00+00')
ON CONFLICT DO NOTHING;

-- stories
INSERT INTO public."stories" ("Id", "AuthorUserId", "Text", "MediaType", "MediaUrl", "AltText", "Audience", "CreatedAtUtc", "ExpiresAtUtc") VALUES
  ('a9a02ee0-7f7b-5f41-9ca0-0ac0def2df72', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Harvest morning at the hives', 'image', 'https://picsum.photos/seed/zstory0/600/900', 'Story image', 'followers', '2026-11-22 07:00:00+00', '2026-11-23 09:00:00+00'),
  ('ee011108-df73-56b5-bb08-8a87f54326b9', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'New jam labels are here!', 'image', 'https://picsum.photos/seed/zstory1/600/900', 'Story image', 'public', '2026-11-22 05:00:00+00', '2026-11-23 09:00:00+00'),
  ('a65182b7-03fb-5557-81de-d485212da3ee', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Setting up a wedding arch', 'image', 'https://picsum.photos/seed/zstory2/600/900', 'Story image', 'public', '2026-11-22 03:00:00+00', '2026-11-23 09:00:00+00'),
  ('51c0da4d-78e5-59c9-a622-873b96ee82e8', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Market day vibes', 'image', 'https://picsum.photos/seed/zstory3/600/900', 'Story image', 'followers', '2026-11-22 01:00:00+00', '2026-11-23 09:00:00+00'),
  ('891b0a8f-1b4e-5be8-9381-5c1db8cc8033', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Packing honey hampers', 'image', 'https://picsum.photos/seed/zstory4/600/900', 'Story image', 'public', '2026-11-21 23:00:00+00', '2026-11-23 09:00:00+00'),
  ('40ad1f79-9790-563f-aeff-0ab9760c8e0b', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Behind the scenes at an event', 'image', 'https://picsum.photos/seed/zstory5/600/900', 'Story image', 'public', '2026-11-21 21:00:00+00', '2026-11-23 09:00:00+00'),
  ('cd04932a-54d7-5056-93b7-391d1a7132dc', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Thank you Machakos', 'image', 'https://picsum.photos/seed/zstory6/600/900', 'Story image', 'followers', '2026-11-21 19:00:00+00', '2026-11-23 09:00:00+00'),
  ('68f1f975-9ada-5aa7-9491-8261db883919', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Early orders open!', 'image', 'https://picsum.photos/seed/zstory7/600/900', 'Story image', 'public', '2026-11-21 17:00:00+00', '2026-11-23 09:00:00+00')
ON CONFLICT DO NOTHING;

-- story_replies
INSERT INTO public."story_replies" ("Id", "StoryId", "AuthorUserId", "Text", "CreatedAtUtc") VALUES
  ('931503ed-9bdf-5685-bb24-a2d822da2d9b', 'a9a02ee0-7f7b-5f41-9ca0-0ac0def2df72', '899a632e-c21a-571d-8821-740e44bcfe18', 'Nice!', '2026-11-22 08:00:00+00'),
  ('b2fcf1a2-e465-5e96-836a-12df22df25a2', 'ee011108-df73-56b5-bb08-8a87f54326b9', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'How much?', '2026-11-22 08:00:00+00'),
  ('7d790b9d-1c8e-5f79-9018-64e42f21cfce', 'a65182b7-03fb-5557-81de-d485212da3ee', '16fa9d0e-e941-5694-8fed-67a28a259705', 'Still available?', '2026-11-22 08:00:00+00'),
  ('95dc5f05-57dd-539e-a5e2-1024630b00a0', '51c0da4d-78e5-59c9-a622-873b96ee82e8', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'Love it', '2026-11-22 08:00:00+00'),
  ('66856d34-aad1-5600-a9fa-8cc9c91a0196', '891b0a8f-1b4e-5be8-9381-5c1db8cc8033', '1db35632-758e-5f2b-a531-8623b034fcbd', 'Can I order?', '2026-11-22 08:00:00+00'),
  ('7ff415e8-c757-5005-a064-233089ec524e', '40ad1f79-9790-563f-aeff-0ab9760c8e0b', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'Beautiful', '2026-11-22 08:00:00+00'),
  ('461b6a8c-53c3-5071-b598-58f86b3d5235', 'cd04932a-54d7-5056-93b7-391d1a7132dc', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'Nice!', '2026-11-22 08:00:00+00'),
  ('22355e5e-1964-527b-93c2-2dd2e1ec0650', '68f1f975-9ada-5aa7-9491-8261db883919', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'How much?', '2026-11-22 08:00:00+00'),
  ('1b5b07b1-0c04-5b95-93e3-ef9bed5d9960', 'a9a02ee0-7f7b-5f41-9ca0-0ac0def2df72', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'Still available?', '2026-11-22 08:00:00+00'),
  ('1f03fcb6-ba66-5b82-9d08-6da793488bb4', 'ee011108-df73-56b5-bb08-8a87f54326b9', 'c63b7280-6331-5031-b04a-6f6cb293d25f', 'Love it', '2026-11-22 08:00:00+00'),
  ('3b776862-1bf4-5636-a1bd-d9edf889d914', 'a65182b7-03fb-5557-81de-d485212da3ee', '1154ef9b-ce5b-5802-9212-cf983c0d6db1', 'Can I order?', '2026-11-22 08:00:00+00'),
  ('c6e8d6fe-efe5-555a-8b82-81069b2912ca', '51c0da4d-78e5-59c9-a622-873b96ee82e8', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'Beautiful', '2026-11-22 08:00:00+00'),
  ('a8898668-cd40-5c5d-808f-c877bb1ae228', '07e136e4-f0a4-5e23-bb84-670c7af52749', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Looks great!', '2026-11-22 07:00:00+00'),
  ('99e05e5b-1e60-5f11-859e-6caec740f6af', '05b282f3-e57d-5283-b0f4-a035945a794c', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Congrats!', '2026-11-22 07:00:00+00'),
  ('a2ed880b-3fac-5360-b10f-aeeaa13edff0', '9cbf3509-6f45-564b-aa85-a199e8960ce9', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Where is this?', '2026-11-22 07:00:00+00'),
  ('86cd08a8-4baa-520a-bd3b-dacc0e5ad8f1', '1935d644-9f7c-5a77-b968-1f666b8e8d4a', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'Nice one', '2026-11-22 07:00:00+00')
ON CONFLICT DO NOTHING;

-- conversations
INSERT INTO public."conversations" ("Id", "Kind", "CreatedByUserId", "BusinessId", "CatalogItemId", "DirectUserLowId", "DirectUserHighId", "CatalogueTitleSnapshot", "CreatedAtUtc", "UpdatedAtUtc", "LastMessageAtUtc", "LastMessagePreview", "IsBlocked", "BlockedByUserId", "BlockedAtUtc") VALUES
  ('eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', 'direct', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, NULL, '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, '2026-11-13 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', 'Of course! I''ll deliver to Westlands.', false, NULL, NULL),
  ('75b23577-ad67-5c72-8b50-bb655ec53eca', 'direct', '1db35632-758e-5f2b-a531-8623b034fcbd', NULL, NULL, '1db35632-758e-5f2b-a531-8623b034fcbd', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, '2026-11-14 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', 'Yes, travel costs apply. I''ll send a quote.', false, NULL, NULL),
  ('5253769c-e7f8-5f7c-9b1d-b6312903f706', 'direct', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', NULL, NULL, '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', '600d6206-4ed4-5489-b622-de7cc2dd8b80', NULL, '2026-11-15 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', 'Aww thank you Grace, anytime!', false, NULL, NULL),
  ('340c6b8d-c022-5598-84e0-84e0470aac06', 'business', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '93129555-bd4c-5d32-b8d5-c4db1ccaf8b8', '1f404130-47e6-55eb-a3e1-e917680d2cdd', NULL, NULL, 'Raw Forest Honey (500g)', '2026-11-19 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', 'Is the honey available in 1kg jars?', false, NULL, NULL)
ON CONFLICT DO NOTHING;

-- conversation_participants
INSERT INTO public."conversation_participants" ("Id", "ConversationId", "UserId", "Kind", "JoinedAtUtc", "LastDeliveredAtUtc", "LastReadAtUtc", "ArchivedAtUtc") VALUES
  ('80d27ff9-95ee-5073-ae9e-fb0616b68484', 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'direct', '2026-11-13 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('51843102-3447-53d0-9291-7080dea1f90d', 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'direct', '2026-11-13 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('28deebc4-1164-5910-aee7-21e6110dd2db', '75b23577-ad67-5c72-8b50-bb655ec53eca', '1db35632-758e-5f2b-a531-8623b034fcbd', 'direct', '2026-11-14 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('51c704d3-4320-5524-96ad-133b0faa0ef5', '75b23577-ad67-5c72-8b50-bb655ec53eca', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'direct', '2026-11-14 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('7c503167-6fca-58a5-bec7-25dce5780d64', '5253769c-e7f8-5f7c-9b1d-b6312903f706', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'direct', '2026-11-15 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('68179446-3cb0-5be2-8fb3-4e780e040eb4', '5253769c-e7f8-5f7c-9b1d-b6312903f706', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'direct', '2026-11-15 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('06675a08-7d5c-518d-94a9-b919210864e0', '340c6b8d-c022-5598-84e0-84e0470aac06', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'buyer', '2026-11-19 09:00:00+00', '2026-11-21 09:00:00+00', '2026-11-21 09:00:00+00', NULL),
  ('02624967-156f-57bb-a3f7-53fee1b427ab', '340c6b8d-c022-5598-84e0-84e0470aac06', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'business_agent', '2026-11-19 09:00:00+00', '2026-11-21 09:00:00+00', NULL, NULL)
ON CONFLICT DO NOTHING;

-- conversation_messages
INSERT INTO public."conversation_messages" ("Id", "ConversationId", "SenderUserId", "ClientMessageId", "Text", "CreatedAtUtc") VALUES
  ('05f6a007-a85c-5d63-af7c-f35e3d0d44f4', 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'b4f19bbe-9baf-5466-82e8-a5d3d93abf3c', 'Hi Zawadi, can I get 3 jars of honey for Saturday?', '2026-11-13 09:00:00+00'),
  ('1305ca67-3647-534d-a084-9fedb042fa5c', 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '39fcc6ff-ed04-5d3d-a899-4ea9c410ab9f', 'Of course! I''ll deliver to Westlands.', '2026-11-14 09:00:00+00'),
  ('5f5e37f7-4212-567d-a064-e47e0f1822c8', '75b23577-ad67-5c72-8b50-bb655ec53eca', '1db35632-758e-5f2b-a531-8623b034fcbd', 'b32d2abb-599c-55a1-9283-d0e4f9b56e8e', 'Are you doing a decor setup in Eldoret?', '2026-11-14 09:00:00+00'),
  ('234ca723-68dd-54a5-9ecf-1f2c99b61ed3', '75b23577-ad67-5c72-8b50-bb655ec53eca', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '91bc4541-2572-54c3-932a-686004a4282b', 'Yes, travel costs apply. I''ll send a quote.', '2026-11-15 09:00:00+00'),
  ('c77de2be-76ed-5cac-a651-8de61bce4f98', '5253769c-e7f8-5f7c-9b1d-b6312903f706', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'b7c14634-9d96-551d-991b-a6165fea0366', 'Thanks for the amazing wedding decor!', '2026-11-15 09:00:00+00'),
  ('d700ab06-6ef7-54a6-b407-f51b878b3835', '5253769c-e7f8-5f7c-9b1d-b6312903f706', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'f499b0e1-a9e3-5cfc-aa22-6b840d5986a3', 'Aww thank you Grace, anytime!', '2026-11-16 09:00:00+00'),
  ('5663b30f-b6bf-58fb-b6c2-e20c1bf0f567', '340c6b8d-c022-5598-84e0-84e0470aac06', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', '0e43ae24-08e0-5018-b4ba-b7fd3093e21e', 'Is the honey available in 1kg jars?', '2026-11-20 09:00:00+00'),
  ('ac967240-78c0-5c0b-882f-951b90f0b2fb', '340c6b8d-c022-5598-84e0-84e0470aac06', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '8cab2906-2c91-5204-85e4-5ce2edde1cf8', 'Yes! 1kg is KSh 1,300.', '2026-11-21 09:00:00+00')
ON CONFLICT DO NOTHING;

-- user_notifications
INSERT INTO public."user_notifications" ("Id", "RecipientUserId", "ActorUserId", "Type", "Title", "Body", "TargetType", "TargetId", "BusinessId", "PostId", "ConversationId", "CatalogItemId", "IdempotencyKey", "InAppVisible", "CreatedAtUtc", "ReadAtUtc", "DismissedAtUtc") VALUES
  ('3b921488-a817-5abd-b172-8ca9887418ae', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '899a632e-c21a-571d-8821-740e44bcfe18', 'new_follower', 'New follower', 'Someone started following you', 'user', '899a632e-c21a-571d-8821-740e44bcfe18', NULL, NULL, NULL, NULL, 'seed-zn-0', true, '2026-11-22 09:00:00+00', NULL, NULL),
  ('cb312367-1acd-57b5-ab06-13d585a914e4', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '5dee0008-bc2b-578d-8bfa-3ee29563f7ab', 'post_like', 'New like', 'Someone liked your post', 'post', '69a92065-77a8-50b0-b966-f15d096daa31', NULL, '69a92065-77a8-50b0-b966-f15d096daa31', NULL, NULL, 'seed-zn-1', true, '2026-11-22 06:00:00+00', NULL, NULL),
  ('6bfc5fca-9f35-5a12-9e91-729f8b33c799', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '16fa9d0e-e941-5694-8fed-67a28a259705', 'comment', 'New comment', 'Someone commented on your post', 'post', 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', NULL, 'b4e3b6ba-d71b-51fb-83b0-28ddc85c06a0', NULL, NULL, 'seed-zn-2', true, '2026-11-22 03:00:00+00', NULL, NULL),
  ('b4d61b9f-ea57-52eb-b31d-e33724990071', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'message', 'New message', 'Someone sent you a message', 'conversation', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', NULL, NULL, 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', NULL, 'seed-zn-3', true, '2026-11-22 00:00:00+00', NULL, NULL),
  ('c02ef74a-ad30-5647-954b-086fef8d5eab', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '1db35632-758e-5f2b-a531-8623b034fcbd', 'business_update', 'Business update', 'Someone A business you follow posted', 'business', '1db35632-758e-5f2b-a531-8623b034fcbd', '8398434e-ee49-5d50-9c17-c727138512b7', NULL, NULL, NULL, 'seed-zn-4', true, '2026-11-21 21:00:00+00', NULL, NULL),
  ('571426b7-dc32-5d0d-bd06-57992632218e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '1b65449c-b149-5ee8-9e89-e862b03507dd', 'new_follower', 'New follower', 'Someone started following you', 'user', '1b65449c-b149-5ee8-9e89-e862b03507dd', NULL, NULL, NULL, NULL, 'seed-zn-5', true, '2026-11-21 18:00:00+00', '2026-11-21 19:00:00+00', NULL),
  ('7d096c6f-0cc4-575b-a3ed-97da86f7c39e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '3c6486c7-45fb-5b63-bcbd-f54d14b70b38', 'post_like', 'New like', 'Someone liked your post', 'post', 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', NULL, 'e81dcbcb-9e5b-5700-b1c6-863c394cf2bf', NULL, NULL, 'seed-zn-6', true, '2026-11-21 15:00:00+00', '2026-11-21 16:00:00+00', NULL),
  ('76a7d573-4d17-5eb6-8ad3-6b120e0602c5', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '72a4a5ba-8855-5e87-9f67-6d7c8cce3dd2', 'comment', 'New comment', 'Someone commented on your post', 'post', '72456e92-4da9-5b89-a40c-d6aa5030dce8', NULL, '72456e92-4da9-5b89-a40c-d6aa5030dce8', NULL, NULL, 'seed-zn-7', true, '2026-11-21 12:00:00+00', '2026-11-21 13:00:00+00', NULL),
  ('3abbf06a-5a82-5e30-b681-c56fdd45bb78', '600d6206-4ed4-5489-b622-de7cc2dd8b80', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', 'business_update', 'Business update', 'Someone A business you follow posted', 'business', '0a01159e-dcef-5f08-b424-36ed2f9fd0cf', '280488ab-1b8f-5a47-9489-ce75188f28b1', NULL, NULL, NULL, 'seed-zn-8', true, '2026-11-21 09:00:00+00', '2026-11-21 10:00:00+00', NULL),
  ('f8414917-259c-5b3c-9144-0e55a306b89e', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', 'message', 'New message', 'Someone sent you a message', 'conversation', 'ca288d45-0602-5eb5-b48c-1e89b70ddf47', NULL, NULL, 'eecc1d23-fbe6-56c2-9a7c-05e4e051ae12', NULL, 'seed-zn-9', true, '2026-11-21 06:00:00+00', '2026-11-21 07:00:00+00', NULL)
ON CONFLICT DO NOTHING;

-- user_devices
INSERT INTO public."user_devices" ("Id", "UserId", "DeviceIdentifier", "Platform", "DeviceName", "CreatedAtUtc", "LastSeenAtUtc", "RevokedAtUtc", "PushTokenEncrypted", "PushTokenHash", "PushTokenUpdatedAtUtc") VALUES
  ('bf8767f1-e6bb-5c69-a52b-746c8b77e818', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'seed-device-zawadi-phone', 'android', 'Samsung Galaxy A14', '2026-10-13 09:00:00+00', '2026-11-22 09:00:00+00', NULL, 'enc-zawadi-1', '0c5ac354b2a56ae3171707ece6c411f81e3a0fbb5e0b8661c75c0497f91ccb7a', '2026-11-22 09:00:00+00'),
  ('8ce1123c-c779-54a6-abbe-79c73d975b40', '600d6206-4ed4-5489-b622-de7cc2dd8b80', 'seed-device-zawadi-web', 'web', 'Chrome on Windows', '2026-11-02 09:00:00+00', '2026-11-20 09:00:00+00', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

COMMIT;