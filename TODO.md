# BizConnect implementation checklist

This is a historical acceptance checklist containing status snapshots from earlier frontend phases; its legacy checkboxes and notes may predate Stages 2–6. Implemented backend stages are documented in [`docs/STAGE2_BACKEND.md`](docs/STAGE2_BACKEND.md), [`docs/STAGE3_BUSINESSES.md`](docs/STAGE3_BUSINESSES.md), [`docs/STAGE4_SOCIAL.md`](docs/STAGE4_SOCIAL.md), [`docs/STAGE5_CATALOG_MEDIA.md`](docs/STAGE5_CATALOG_MEDIA.md) and [`docs/STAGE6_MESSAGING.md`](docs/STAGE6_MESSAGING.md). Do not infer that unchecked historical items were re-tested in the Stage 6 task. Unconnected product backends remain unimplemented, and local mock actions must still be labeled as local demonstrations.

## Current backend stage snapshot

- **Stage 2:** Identity/authentication, profile, preferences and device APIs remain implemented.
- **Stage 3:** Business profiles, memberships, invitations, ownership transfers, activity and server role enforcement remain implemented.
- **Stage 4:** For You/Following feeds, posts, likes, comments/replies, polls, user/business follows, follower lists, and server-side privacy/block/hide enforcement are implemented; existing Expo screens/adapters are connected in explicit API mode. The additive migration `20261112173415_Stage4SocialContent` is generated but has not been applied to `bizconnect_dev`.
- **Stage 5:** Products and services with draft/published/archived lifecycle, business-scoped catalogue management, ordered image galleries, real image upload, local and S3-compatible storage behind an access-controlled media proxy, and anonymous public discovery are implemented in the C# API and connected in Expo API mode. The additive migration `20261112182203_Stage5Catalog` is generated and applied from scratch by the test fixture but has not been applied to `bizconnect_dev`.
- **Stage 6:** Persistent direct and business conversations, catalogue-linked enquiries, paginated REST history, read/delivery receipts, archive/block controls, authenticated SignalR and API-mode inbox/chat/enquiry UI are implemented. The additive migration `20261113031519_Stage6MessagingEnquiries` is included and test-applied only to `bizconnect_test`; it has not been applied to `bizconnect_dev`.
- **Remaining boundaries:** New follow requests to private profiles, media transcoding/EXIF stripping/CDN/resumable uploads, push, reports/verification, checkout, payments, wallets, AI and desktop-web product workflows are not implemented. Stage 6 does not include message attachments or external email/SMS/push delivery.

## Original BizConnect specification

### [x] Original BizConnect specification setup

# PROJECT: BIZCONNECT
## Complete Mobile Application Frontend Development

Act as a senior product designer, senior React Native engineer and mobile application architect.

I want you to design and develop a complete, production-quality mobile application called **BizConnect**.

This is not a simple prototype, landing page or static UI demonstration. Build a fully navigable and interactive mobile application frontend with realistic user journeys, reusable components, consistent design patterns and a scalable project structure.

The application should be designed for Android and iOS, with Kenya as its initial target market and the ability to expand internationally.

IMPORTANT: Develop the FRONTEND ONLY at this stage. Do not build the backend, database or payment processing system. However, structure the frontend so that it can later integrate cleanly with an ASP.NET Core Web API and PostgreSQL database.

---

### [x] 1. PRODUCT VISION

# 1. PRODUCT VISION

BizConnect is a social business discovery and entrepreneurship platform that connects:

1. Business owners who want to showcase and grow their businesses.
2. Buyers who want to discover products, services and businesses.
3. Individuals who want to learn about entrepreneurship and discover businesses they may want to start.

The platform combines:

- Social networking.
- Business discovery.
- Location-based discovery.
- Business profiles.
- Short-form business videos.
- Product and service catalogues.
- Entrepreneurial storytelling.
- Buyer-seller communication.
- Community engagement.

The central idea is:

"Discover businesses. Connect with entrepreneurs. Get inspired to build something."

The application should feel like a modern combination of a social media platform, a business directory and an entrepreneurial community.

Do not make it look like a conventional e-commerce application.

The social feed and business discovery experience must be central to the product.

### [x] 2. TECHNOLOGY REQUIREMENTS

# 2. TECHNOLOGY REQUIREMENTS

Use:

- React Native.
- Expo.
- TypeScript.
- Expo Router for navigation.
- A scalable component-based architecture.
- React hooks.
- Secure and maintainable state management.
- Expo-compatible libraries for camera, media selection, location and notifications.
- Native mobile layouts optimised for Android and iOS.

Use current stable, mutually compatible package versions.

Avoid unnecessary dependencies.

Use a clean separation between:

- Screens.
- Components.
- Navigation.
- Hooks.
- Services.
- Types.
- Mock data.
- Theme and design system.
- Utilities.

Create a central API service layer with mock implementations for now.

All mock data must be structured so that it can later be replaced with real ASP.NET Core API responses without rewriting the screens.

Do not hardcode mock business data directly into individual screen components.

### [x] 3. BRAND IDENTITY AND DESIGN DIRECTION

# 3. BRAND IDENTITY AND DESIGN DIRECTION

Brand name: BizConnect.

Brand personality:

- Modern.
- Professional.
- Entrepreneurial.
- Trustworthy.
- Vibrant.
- Community-driven.
- Innovative.

Design a distinctive visual identity for BizConnect.

Use a premium modern design language.

Suggested colours:

- Primary: Deep navy blue.
- Secondary: Emerald green.
- Accent: Warm orange.
- Background: Soft off-white.
- Cards: White.
- Primary text: Dark charcoal.
- Secondary text: Muted grey.

Use consistent typography, spacing, border radii, shadows and iconography.

The interface should feel premium without being unnecessarily complicated.

Design principles:

- Mobile-first.
- Clean and intuitive.
- Visual storytelling.
- Excellent image presentation.
- Easy navigation.
- Accessible contrast.
- Responsive layouts.
- Consistent components.
- Minimal unnecessary decoration.

Create a reusable design system with colour tokens, typography scales, spacing tokens, button variants, input styles and card styles.

### [x] 4. MAIN APPLICATION NAVIGATION

# 4. MAIN APPLICATION NAVIGATION

Create a bottom navigation bar with these sections:

1. Home
2. Discover
3. Create
4. Stories
5. Profile

Messages and notifications should be accessible from the appropriate screens through header icons.

The navigation must work correctly.

Each tab should lead to a complete screen, not an empty placeholder.

### [x] 5. AUTHENTICATION SCREENS

# 5. AUTHENTICATION SCREENS

Create the following screens:

- Welcome screen.
- Onboarding screens.
- Registration.
- Login.
- Forgot password.
- Password reset.
- OTP verification interface.
- User profile setup.

Registration should collect:

- Full name.
- Username.
- Email.
- Phone number.
- Password.
- County.
- Town.
- Profile picture.

Allow users to select their interests:

- Shopping.
- Entrepreneurship.
- Fashion.
- Technology.
- Food.
- Beauty.
- Agriculture.
- Services.
- Other business categories.

IMPORTANT:

Every user should have one account.

Users should be able to browse businesses, interact with content and create their own business profiles.

Do not permanently restrict someone to being a buyer or seller.

### [x] 6. HOME SCREEN - SOCIAL FEED

# 6. HOME SCREEN - SOCIAL FEED

This is one of the most important parts of the application.

Create a modern social feed inspired by the usability of Instagram, TikTok and other modern social platforms, but with a unique business-focused identity.

The home screen should include:

HEADER:
- BizConnect logo.
- Search icon.
- Notification icon.
- Message icon.
- User profile shortcut.

CONTENT:

Create a horizontal business stories section.

Show followed businesses and entrepreneurs with profile images.

Below that, create feed filters:

- For You.
- Following.
- Nearby.

The main feed should support:

- Text posts.
- Image posts.
- Video posts.
- Product showcases.
- Business updates.
- Entrepreneurial experiences.
- Promotional posts.

Every post should display:

- Profile image.
- Business or user name.
- Verification badge where applicable.
- Username.
- Location.
- Post time.
- Post content.
- Image or video.
- Like count.
- Comment count.
- Share action.
- Save action.

Include a visible Follow button where appropriate.

Add a business contact action on relevant business posts.

The feed should use realistic sample Kenyan businesses and entrepreneurs.

Do not use generic lorem ipsum content.

### [x] 7. DISCOVER SCREEN

# 7. DISCOVER SCREEN

This screen helps users discover businesses.

Create a dedicated discovery experience.

Include:

SEARCH:
- Search businesses.
- Search products.
- Search services.
- Search entrepreneurs.
- Search business categories.

CATEGORY EXPLORATION:

Include categories such as:

- Fashion.
- Food and restaurants.
- Beauty and cosmetics.
- Electronics.
- Agriculture.
- Furniture.
- Construction.
- Education.
- Technology.
- Transport.
- Professional services.
- Health and wellness.
- Entertainment.
- Home services.
- Retail.

LOCATION DISCOVERY:

Include:

- Near Me.
- Nairobi.
- Mombasa.
- Kisumu.
- Nakuru.
- Eldoret.
- Other counties.

Allow users to filter by county, town and neighbourhood.

Create a map discovery interface with business location markers.

Also create a list-based discovery view.

BUSINESS CARDS:

Each business card should show:

- Business logo.
- Cover image.
- Business name.
- Category.
- Location.
- Short description.
- Verification status.
- Followers.
- Follow action.
- View business action.

Include sections such as:

- Popular near you.
- Trending businesses.
- Recently joined businesses.
- Recommended for you.
- Businesses worth discovering.

The interface should look visually rich and professional.

### [x] 8. BUSINESS PROFILE SCREENS

# 8. BUSINESS PROFILE SCREENS

Build a complete business profile experience.

Every business should have a dedicated public profile.

PROFILE HEADER:

- Business cover image.
- Business logo.
- Business name.
- Verification badge.
- Business category.
- Location.
- Follow button.
- Contact button.
- Share button.

BUSINESS INFORMATION:

- About the business.
- Founder information.
- Business history.
- How the business started.
- What makes the business unique.
- Business achievements.
- Operating hours.
- Service areas.
- Contact details.

PROFILE TABS:

1. Overview.
2. Posts.
3. Videos.
4. Products.
5. Services.
6. Our Story.

Allow users to browse the different sections.

Include a product catalogue with product cards.

Include service cards.

Include a business location section.

Create a visually appealing business profile that gives customers a reason to explore and trust the business.

### [x] 9. BUSINESS CREATION AND MANAGEMENT

# 9. BUSINESS CREATION AND MANAGEMENT

Create a complete business registration and management flow.

A logged-in user should be able to select "Create Business".

BUSINESS REGISTRATION:

Step 1: Basic details
- Business name.
- Business category.
- Business description.
- Business logo.
- Cover image.

Step 2: Business story
- How the business started.
- Why it was started.
- Founder information.
- Challenges faced.
- Achievements.

Step 3: Products and services
- Add products.
- Add services.
- Product images.
- Descriptions.
- Prices.
- Availability.

Step 4: Location
- Country.
- County.
- Town.
- Neighbourhood.
- Map location.
- Service areas.

Step 5: Contact information
- Business phone.
- WhatsApp.
- Email.
- Website.
- Social media links.

Step 6: Preview and publish.

Allow users to save incomplete business profiles and continue later.

BUSINESS OWNER DASHBOARD:

Create a dashboard containing:

- Business overview.
- Profile views.
- Post engagement.
- Followers.
- Video views.
- Product views.
- Customer enquiries.
- Recent activity.

Add management sections for:

- Edit business profile.
- Manage posts.
- Manage videos.
- Manage products.
- Manage services.
- Manage business stories.
- Manage business locations.

Use realistic mock analytics.

### [x] 10. CREATE CONTENT EXPERIENCE

# 10. CREATE CONTENT EXPERIENCE

Create a complete content publishing interface.

Users should be able to create content as themselves or select one of their businesses.

CONTENT TYPES:

- Text.
- Image.
- Video.
- Product showcase.
- Business announcement.
- Business story.

Allow users to:

- Write captions.
- Upload images.
- Select videos.
- Add hashtags.
- Add location.
- Tag businesses.
- Preview posts.
- Publish posts.
- Save drafts.

Provide appropriate validation and loading states.

The interface should feel simple and intuitive.

Include a media selection interface and video preview.

Use Expo-compatible media selection functionality.

### [x] 11. BUSINESS STORIES SECTION

# 11. BUSINESS STORIES SECTION

This is a signature feature of BizConnect.

Create a dedicated section called "Business Stories".

The goal is to inspire people to understand how businesses are built.

Include categories:

- How I Started.
- Startup Capital.
- My First Customer.
- Business Challenges.
- Lessons Learned.
- Business Growth.
- Behind the Business.
- Business Opportunities.

Create story cards containing:

- Founder profile.
- Business name.
- Cover image.
- Story title.
- Short introduction.
- Industry.
- Reading or viewing duration.

Create a detailed story view.

A story should support:

- Written content.
- Images.
- Videos.
- Founder biography.
- Business journey timeline.
- Startup capital information.
- Challenges.
- Lessons.
- Advice for aspiring entrepreneurs.

Users should be able to:

- Like stories.
- Comment.
- Share.
- Save.
- Follow the founder.
- Visit the founder's business profile.

Include a section called "Businesses You Can Learn From".

### [x] 12. VIDEO EXPERIENCE

# 12. VIDEO EXPERIENCE

Video is an important part of BizConnect.

Create a dedicated vertical video discovery experience.

The video interface should include:

- Full-screen vertical videos.
- Business or creator profile information.
- Captions.
- Like button.
- Comment button.
- Share button.
- Follow button.
- View business button.
- Location.
- Video description.

Support mock video content.

Implement video playback controls using an Expo-compatible video library.

Optimise the UI for smooth scrolling and avoid loading every video simultaneously.

Include sensible loading and error states.

### [x] 13. PRODUCTS AND SERVICES

# 13. PRODUCTS AND SERVICES

Create product and service browsing screens.

PRODUCT CARDS:

- Product image.
- Product name.
- Business name.
- Price in KSh.
- Description.
- Availability.
- Location.

PRODUCT DETAIL:

- Image gallery.
- Product description.
- Seller information.
- Price.
- Availability.
- Contact seller button.
- WhatsApp contact shortcut.
- Visit business profile button.

SERVICES:

- Service name.
- Description.
- Business information.
- Price or price range.
- Service location.
- Contact action.

IMPORTANT:

BizConnect is not processing payments in this first release.

Do not implement checkout, shopping carts or payment gateways.

The goal is to connect buyers directly with sellers.

### [x] 14. MESSAGING

# 14. MESSAGING

Create a complete messaging frontend.

Include:

- Conversation list.
- Chat screen.
- Message bubbles.
- Timestamps.
- Text input.
- Image attachment interface.
- Message status indicators.
- Business enquiry shortcuts.

Allow users to start conversations from business profiles and product details.

Use mock conversations for now.

Structure the messaging service so it can later integrate with ASP.NET Core SignalR.

### [x] 15. USER PROFILE

# 15. USER PROFILE

Create a personal profile screen.

Include:

- Profile picture.
- Name.
- Username.
- Biography.
- Location.
- Followers.
- Following.
- Posts.
- Saved content.
- Followed businesses.

Include profile actions:

- Edit profile.
- View my businesses.
- Create business.
- Saved posts.
- Saved businesses.
- Settings.

Users should be able to manage their personal and business identities separately.

### [x] 16. NOTIFICATIONS

# 16. NOTIFICATIONS

Create a notification centre.

Include:

- New followers.
- Likes.
- Comments.
- Replies.
- Business enquiries.
- Messages.
- Business updates.

Add read/unread states.

Include a notification settings interface.

### [x] 17. SEARCH

# 17. SEARCH

Implement a global search experience.

Users should be able to search:

- Businesses.
- People.
- Products.
- Services.
- Posts.
- Videos.
- Business stories.

Include search suggestions, recent searches and category filters.

Use mock search results.

### [x] 18. SETTINGS AND ACCOUNT MANAGEMENT

# 18. SETTINGS AND ACCOUNT MANAGEMENT

Create:

- Account settings.
- Edit personal profile.
- Privacy settings.
- Location permissions.
- Notification preferences.
- Blocked users.
- Security settings.
- Change password interface.
- Help and support.
- About BizConnect.
- Terms and conditions.
- Privacy policy.
- Logout.

Include confirmation dialogs for destructive actions.

### [x] 19. ADMIN AND MODERATION CONSIDERATIONS

# 19. ADMIN AND MODERATION CONSIDERATIONS

Do not build a separate backend admin application at this stage.

However, include frontend interfaces and interaction points for:

- Reporting a post.
- Reporting a business.
- Reporting a user.
- Blocking a user.
- Business verification status.
- Content moderation status.

These should be structured for future backend integration.

### [x] 20. MOCK DATA REQUIREMENTS

# 20. MOCK DATA REQUIREMENTS

Create realistic mock data using Kenyan businesses and locations.

Include examples such as:

- A Nairobi clothing boutique.
- A Mombasa seafood restaurant.
- A Kisumu cosmetics business.
- A Nakuru furniture workshop.
- An Eldoret agricultural business.
- A Nairobi technology startup.
- A local bakery.
- A beauty salon.

Use realistic KSh pricing.

Create several businesses with different categories, founders, stories, products, services and posts.

Make the application feel populated from the first launch.

Avoid lorem ipsum.

Keep all mock data in dedicated files.

### [x] 21. FUNCTIONAL REQUIREMENTS

# 21. FUNCTIONAL REQUIREMENTS

Every major button and interaction should work in the frontend.

Examples:

- Follow and unfollow.
- Like and unlike.
- Add and view comments.
- Save and unsave.
- Search and filter.
- Navigate between screens.
- Create a post.
- Select images and videos.
- Preview content.
- Create a business profile.
- Edit a business profile.
- Add products.
- Add services.
- Open business details.
- Start a mock conversation.
- Send mock messages.
- Update personal profile.
- Open notifications.
- Change settings.

Persist suitable mock user actions locally so that the application maintains its state between launches where appropriate.

Do not make buttons that appear functional but do nothing.

Use realistic loading, empty, success and error states.

### [x] 22. ARCHITECTURE AND CODE QUALITY

# 22. ARCHITECTURE AND CODE QUALITY

Organise the application into a scalable structure.

Suggested structure:

src/
  app/
  components/
    common/
    navigation/
    business/
    posts/
    products/
    stories/
    messaging/
    discovery/
  screens/
    auth/
    home/
    discover/
    business/
    stories/
    videos/
    products/
    messaging/
    profile/
    settings/
  hooks/
  services/
    api/
    auth/
    business/
    posts/
    products/
    messaging/
    media/
    notifications/
  store/
  types/
  data/
  theme/
  utils/

You may improve this structure where necessary.

Requirements:

- Strong TypeScript typing.
- Reusable components.
- Clean separation of concerns.
- Consistent error handling.
- Form validation.
- Accessible controls.
- No unnecessary duplicated code.
- No giant screen components.
- No hardcoded API URLs throughout the application.
- Centralised environment configuration.
- Maintainable navigation.
- Appropriate state management.

Create an API abstraction layer with mock services and clearly documented integration points for the future ASP.NET Core backend.

### [x] 23. IMPORTANT DEVELOPMENT RULES

# 23. IMPORTANT DEVELOPMENT RULES

1. Build the actual application, not just design mockups.
2. Do not stop after creating the welcome screen.
3. Do not omit any major module described in this specification.
4. Every main navigation tab must work.
5. Use consistent mock data across the entire application.
6. Ensure screens connect logically through navigation.
7. Ensure forms accept input and perform frontend validation.
8. Ensure buttons perform their intended frontend actions.
9. Do not implement a fake backend.
10. Do not implement payments.
11. Do not expose secrets or API keys.
12. Do not compromise the architecture to make the initial implementation easier.
13. Prioritise performance, accessibility and maintainability.
14. Optimise for Android while maintaining iOS compatibility.

### [x] 24. FINAL DELIVERABLES

# 24. FINAL DELIVERABLES

I expect you to deliver:

1. A complete React Native Expo application.
2. All major screens described in this specification.
3. A complete navigation system.
4. A reusable component library.
5. A consistent design system.
6. Realistic Kenyan mock data.
7. Working frontend interactions.
8. Mock authentication and user sessions.
9. Mock business management.
10. Mock posts, products and messaging.
11. Local persistence where appropriate.
12. A clean and scalable folder structure.
13. An environment configuration example.
14. A README with installation and execution instructions.
15. Documentation identifying all future ASP.NET Core API integration points.

Before declaring the project complete:

- Verify that the application starts successfully.
- Check the main navigation.
- Test the major user journeys.
- Check forms and interactions.
- Check Android and iOS layout compatibility.
- Resolve build errors.
- Remove broken routes and dead buttons.
- Ensure all major screens are implemented.

The finished application should look and feel like a serious, modern, launch-ready social business discovery product.

**FINAL PRODUCT PRINCIPLE:**

BizConnect should make it easy for someone to discover a business, understand its story, see what it offers, connect with its owner and become inspired to start something of their own.

Build the complete frontend with this vision as the guiding principle.

## Additional BizConnect requirements

### [x] Additional BizConnect requirements setup

# ADDITIONAL PRODUCT AND TECHNICAL REQUIREMENTS – BIZCONNECT

These requirements extend the original BizConnect specification. They are mandatory and must be incorporated into the existing application without removing any previously specified functionality.

### [x] 1. MULTIPLE BUSINESS OWNERSHIP

## 1. MULTIPLE BUSINESS OWNERSHIP

- One user can create and manage multiple businesses.
- Users can switch between their personal profile and business identities.
- Each business must have independent content, products, services, followers, analytics and settings.
- Support business team members.
- Define Owner, Administrator and Content Manager permissions.
- Allow business owners to invite and remove team members.
- Prevent unauthorised users from editing business information.

### [x] 2. ADVANCED SOCIAL RELATIONSHIPS

## 2. ADVANCED SOCIAL RELATIONSHIPS

- Users can follow individuals and businesses independently.
- Display followers and following lists.
- Implement follow and unfollow interactions.
- Provide a Following feed.
- Support post sharing and saving.
- Support comment replies.
- Include user mentions and hashtags.
- Include appropriate empty states for users with no followers or posts.

### [x] 3. ADVANCED BUSINESS DISCOVERY

## 3. ADVANCED BUSINESS DISCOVERY

Implement advanced filtering and sorting:

- Business name.
- Category and subcategory.
- County.
- Town.
- Neighbourhood.
- Nearby businesses.
- Price range.
- Rating.
- Verification status.
- Recently registered.
- Most popular.
- Most followed.

Allow browsing without registration. Require authentication for actions such as posting, following, commenting, saving and messaging.

### [x] 4. BUSINESS VERIFICATION

## 4. BUSINESS VERIFICATION

Implement a complete frontend verification workflow.

Include:

- Submit verification request.
- Upload supporting documents.
- Verification status.
- Pending, approved and rejected states.
- Verification history.
- Explanation for rejected requests.
- Verified business badge.

Never automatically mark businesses as verified.

### [x] 5. BUSINESS IDEAS AND OPPORTUNITIES

## 5. BUSINESS IDEAS AND OPPORTUNITIES

Create an additional dedicated section called Business Ideas & Opportunities.

Allow users to explore:

- Businesses to start with limited capital.
- Business startup requirements.
- Estimated startup costs.
- Equipment and resources needed.
- Skills required.
- Industry opportunities.
- Advice from experienced entrepreneurs.
- Founder-submitted lessons and experiences.

Allow users to save and share business ideas.

Clearly distinguish estimated and user-submitted information from verified facts.

### [x] 6. BUSINESS MILESTONES

## 6. BUSINESS MILESTONES

Allow business owners to document their business growth through a timeline.

Support:

- Business launch.
- First customer.
- First employee.
- First physical location.
- New branch.
- New product launch.
- Business expansion.
- Major achievements.

Each milestone should support a date, description, image or video.

Display milestones on the business profile.

### [x] 7. API INTEGRATION READINESS

## 7. API INTEGRATION READINESS

Prepare the frontend for a future ASP.NET Core Web API integration.

- Create strongly typed TypeScript models.
- Centralise API configuration.
- Separate API services from presentation components.
- Implement mock service adapters.
- Define consistent request and response contracts.
- Support pagination and infinite scrolling.
- Implement authentication session handling.
- Handle API errors consistently.
- Include loading, empty, success and failure states.
- Avoid hardcoding mock data inside screens.
- Document all backend integration requirements.

Do not create a fake backend or claim that mock operations are real server operations.

### [ ] 8. NETWORK AND PERFORMANCE OPTIMISATION

## 8. NETWORK AND PERFORMANCE OPTIMISATION

Optimise for Kenyan mobile network conditions.

- Lazy-load images and videos.
- Compress media before upload where appropriate.
- Support resumable or retryable uploads.
- Cache appropriate content.
- Implement reduced-data settings.
- Allow users to control video autoplay.
- Avoid unnecessary background requests.
- Provide clear offline states.
- Support pull-to-refresh.
- Use pagination for large feeds.
- Optimise scrolling and media playback.


_Status: Partial. Expo Image caching and local image compression, reduced-data/autoplay controls, offline feedback, pull-to-refresh and feed pagination are implemented. Feed pagination limits initial social posts, but directory and video surfaces do not yet provide full viewport-based lazy loading; resumable/retryable upload transport is also intentionally not implemented because this project is frontend-only and no selected media is sent anywhere. Keep open until lazy media loading is improved and a future storage/API adapter supplies upload retry/resume._

### [x] 9. PRIVACY AND SECURITY

## 9. PRIVACY AND SECURITY

Implement appropriate frontend privacy controls.

- Public and private personal profiles.
- Message permissions.
- Block and unblock users.
- Hide precise personal location.
- Secure authentication token storage.
- Session expiration handling.
- Logout.
- Account deletion interface.
- Personal data export interface.
- Permission-based access to camera, media and location.
- Confirmation for destructive operations.

### [x] 10. CONTENT MODERATION

## 10. CONTENT MODERATION

Provide interfaces for:

- Reporting posts.
- Reporting videos.
- Reporting businesses.
- Reporting users.
- Reporting comments.
- Blocking users.
- Hiding content.
- Reviewing moderation status.
- Displaying community guidelines.

Include appropriate confirmation and feedback states.

### [x] 11. LANGUAGE AND LOCALISATION

## 11. LANGUAGE AND LOCALISATION

Prepare the application for:

- English.
- Swahili.

Include:

- Centralised translation resources.
- Language selection.
- Kenyan Shilling currency formatting.
- Kenyan phone number formatting.
- Kenyan counties and towns.
- Local date and time formatting.

Keep localisation extensible for future African markets.

### [x] 12. ADDITIONAL SCREENS

## 12. ADDITIONAL SCREENS

Include the following screens and interfaces:

- Saved businesses.
- Saved stories.
- Recently viewed businesses.
- Followers and following.
- Business team management.
- Business verification.
- Business milestones.
- Business analytics.
- Draft posts.
- Search history.
- Account privacy.
- Data export.
- Account deletion.
- Help centre.
- Community guidelines.

### [ ] 13. TESTING AND DELIVERY REQUIREMENTS

## 13. TESTING AND DELIVERY REQUIREMENTS

Before completing development:

- Verify every major navigation route.
- Test all major forms.
- Test business creation and editing.
- Test personal and business profile switching.
- Test post creation and publishing.
- Test media selection and preview.
- Test likes, comments and follows.
- Test location filtering.
- Test product and service browsing.
- Test messaging.
- Test business verification interfaces.
- Test error, loading and empty states.
- Check TypeScript compilation.
- Check application startup.
- Check Android and iOS compatibility.
- Remove broken routes and non-functional buttons.

Provide a complete README, installation instructions, environment configuration example, application architecture documentation and a list of future API integration points.

IMPORTANT: Preserve every feature from the original specification. Do not simplify the application by removing modules to make development easier.

The objective is to deliver a comprehensive, coherent and extensible BizConnect mobile frontend, not a collection of disconnected demonstration screens.

_Status: Partial. TypeScript, ESLint, all 44 tests, Expo dependency compatibility and Web/Android/iOS bundle exports pass. In addition to the feed, Discover and management-route checks already noted, a real-input Preview walkthrough now covers invalid/valid local OTP, profile setup, text-post preview/publish and the six-step business form. Remaining: exhaustive interaction coverage plus physical-device checks for camera, location, notifications, SecureStore and video playback. Native release builds were not run; keep this outcome open._

## Phase 2 requirements from the attached specification (acceptance clauses preserved from the source)

### [x] Phase 2 scope and preservation constraints

## PROJECT INSTRUCTIONContinue development of the existing BizConnect React Native application.You are working on an existing project, not starting a new one.Your responsibility is to inspect, improve, complete and test the current implementation based on the requirements below.**CRITICAL: DO NOT REBUILD THE APPLICATION FROM SCRATCH.**Preserve all existing functionality, screens, navigation, business logic, design components, branding, mock data, and implemented features unless a change is necessary to correct a confirmed issue.Do not remove existing functionality to simplify implementation. Do not replace completed features with static mockups or placeholder screens.The objective is to turn the current feature-rich prototype into a reliable, fully functional frontend that is ready for future ASP.NET Core backend integration.---
_Status: Complete. The existing Expo project and features were inspected and retained; implementation continues in place without a rebuild._

### [x] Phase 2.1: FIRST: INSPECT THE EXISTING PROJECT


Before modifying anything:

1. Inspect the entire existing project structure.
2. Read README.md, TODO.md and plan.md.
3. Inspect the navigation architecture, screens, components, state management, local persistence, API contracts and mock services.
4. Identify the existing implementation of each requirement in this prompt.
5. Distinguish between:
   - Fully implemented functionality.
   - Partially implemented functionality.
   - UI-only demonstrations.
   - Missing functionality.
   - Confirmed defects.
6. Produce an internal implementation plan based on the actual code.

Do not assume that a feature is missing merely because it is not immediately visible. Inspect its implementation first.

Avoid duplicating existing functionality.


_Status: Complete. Project tree, docs, navigation, screens/components, store/persistence, API contracts and mock services were inspected; implementation states and confirmed defects are recorded in plan.md._

### [ ] Phase 2.2: FIX PRIVACY AND MODERATION ENFORCEMENT


Privacy settings and moderation actions must produce consistent behaviour throughout the application.

Implement and verify:

#### Hidden content
- Hidden posts must disappear from every relevant public-facing feed.
- Hidden content must not reappear after navigating between screens.
- Hidden posts must remain hidden after application restart when local persistence is available.
- Ensure the hidden-content rules are applied consistently to feed recommendations and other post-discovery surfaces.

#### Blocked users
- Blocking a user must affect relevant social interactions across the application.
- Blocked users should not appear in normal discovery recommendations or social feeds where they are not permitted.
- Prevent messaging between blocked users.
- Prevent blocked users from interacting with the blocking user's content where applicable.
- Provide a working unblock action.
- Update the interface immediately after blocking or unblocking.

#### Privacy settings
- Apply public/private profile settings consistently.
- Enforce message permissions.
- Respect content visibility settings.
- Ensure private or restricted information is not exposed through unrelated screens.
- Keep personal location information private by default.

#### Moderation
- Reporting posts, comments, videos, businesses and users must create persistent local report records.
- Show confirmation after a report is submitted.
- Prevent duplicate submissions where appropriate.
- Provide appropriate report statuses.
- Preserve the existing moderation dashboard.

Do not represent local moderation as a real server-side investigation or enforcement action.


_Status: Partial. Shared `utils/privacy-policy.ts` now enforces hidden-post, blocked-owner, private-profile and message rules across the audited Home, Discover, search, people, business, product, story, video, saved, follower, report and conversation surfaces. Local moderation persists reports and block/hide state, deduplicates active reports, and has unit regressions for private messaging, block/unblock relationship cleanup and visible-post filtering. Remaining: exhaustive device-level interaction checks across every moderation entry point; keep open._

### [x] Phase 2.3: IMPROVE AUTHENTICATION AND ONBOARDING


The current authentication experience is a frontend demonstration.

Improve its structure while maintaining the existing screens and design.

Requirements:

- Registration must have proper form validation.
- Login must validate the required fields.
- Password visibility controls must work.
- Password confirmation must be checked during registration.
- Phone numbers must support Kenyan formats.
- OTP input must validate the expected format.
- OTP verification must not pretend that a real SMS was sent or validated.
- Clearly separate demo authentication from future server authentication.
- Do not mark a user as fully authenticated before the required onboarding or demo verification steps are completed.
- Implement proper logout and session-clearing behaviour.
- Handle expired sessions and unauthenticated navigation.
- Prevent access to protected screens when no valid local session exists.

Prepare the authentication service for future ASP.NET Core Identity and JWT integration.

Never store passwords or authentication secrets in plaintext local storage.

Use Expo-compatible secure storage for sensitive session credentials when applicable.


_Status: Complete for the frontend-only demo. Registration/login validation, Kenyan phone formatting, password confirmation/visibility, staged local registration → OTP → profile setup, protected-route/session guards, logout and expiry/clear behavior are implemented. A real-input Preview walkthrough confirmed invalid OTP feedback, successful `123456` transition to profile setup and local session activation; unit tests cover field rules and session expiry/logout. No SMS, identity provider or server account is created; production authentication remains future backend work._

### [ ] Phase 2.4: COMPLETE THE DISCOVERY EXPERIENCE


The current map experience is a location-card preview rather than a real geographic map.

Improve it.

#### Map experience
- Implement an actual interactive map using an Expo-compatible mapping solution.
- Display business pins using available location data.
- Allow users to select a business pin.
- Display a business preview when a pin is selected.
- Support switching between map and list views.
- Include appropriate location-permission handling.
- Provide a useful fallback when location permission is denied.
- Do not invent precise coordinates for businesses.

If a real map cannot be implemented in the current environment, retain the existing location-list experience but clearly label it as a temporary map-unavailable fallback. Do not claim that a geographic map is implemented.

#### Discovery filters

Ensure the following filters actually change the displayed results:

- Business name.
- Category.
- County.
- Town.
- Nearby.
- Price range where applicable.
- Rating where applicable.
- Verified businesses.
- New businesses.
- Popular businesses.
- Followed businesses.

Filters must work together rather than operating independently.

Search and filters must have loading, empty and error states.


_Status: Partial. Combined discovery filters, blocked-owner exclusion, county/town/neighbourhood selection, nearby permission/fallback handling and location chips remain in place; the map view is now explicitly labelled a temporary map-unavailable location-list fallback and does not claim to render a geographic map or invent coordinates. Combined filters and empty results are covered by tests. Remaining: native permission/device checks and any approved real-map integration; keep open._

### [ ] Phase 2.5: IMPROVE SOCIAL FEED AND CONTENT MANAGEMENT


Preserve the existing feed experience and improve its reliability.

Requirements:

- For You, Following and Nearby feeds must return appropriately filtered content.
- Hidden posts must be excluded.
- Blocked-user content must respect privacy and blocking rules.
- Likes must update correctly.
- Comments must be saved and displayed correctly.
- Follow and unfollow must work consistently.
- Save and unsave posts must persist.
- Hashtags and mentions must be handled consistently.
- Report and hide actions must work.
- Pull-to-refresh must work.
- Pagination must not create duplicate posts.
- Empty and loading states must be implemented.
- Refreshing or reopening the app must not unexpectedly reset persistent interactions.

#### Content creation

Verify the complete content creation process for:

- Text posts.
- Image posts.
- Video posts.
- Product posts.
- Business announcements.
- Business stories.

Include:

- Media selection.
- Preview.
- Caption.
- Hashtags.
- Location.
- Draft saving.
- Draft editing.
- Post publishing in demo mode.
- Appropriate validation.
- Upload and processing states.

Make it clear when content is only saved locally and has not been published to a real server.


_Status: Partial. Shared privacy filtering covers feed and discovery selectors; local interactions, comments/replies, drafts, moderation and pagination use typed persistent store boundaries and have domain tests. A real-input Preview walkthrough exercised text-post composition, preview and local publish/feed update. Image/video picker and playback paths were not validated on physical devices; keep open for those media journeys and broad route checks._

### [ ] Phase 2.6: COMPLETE BUSINESS MANAGEMENT


Verify the entire business lifecycle.

Users must be able to:

- Create a business.
- Edit business information.
- Update business images.
- Set business categories.
- Add business locations.
- Manage products.
- Manage services.
- View business analytics.
- View business posts.
- Manage business stories.
- Switch between personal and business identities.
- Manage multiple businesses.
- Invite and manage team members through the demo interface.

Verify the existing Owner, Admin and Content Manager permissions.

Do not allow the interface to present a user with actions they are not authorised to perform under the local role model.

Ensure that switching businesses updates the correct business information throughout the application.


_Status: Partial. Authorization/ownership gates cover business editing, catalogue, milestones and verification; unit tests cover owned creation, edits, multiple-business identity selection and role restrictions. A real-input Preview walkthrough completed all six local business-creation steps, including KSh product/contact fields and local save. Remaining: exhaustive identity/team/service/media edits on device; all writes stay local and do not publish to a server._

### [ ] Phase 2.7: IMPROVE MEDIA AND PERFORMANCE


Improve frontend performance without sacrificing existing features.

Implement or improve:

- Efficient image rendering.
- Image lazy-loading where supported.
- Image caching.
- Thumbnail usage.
- Efficient video playback.
- Appropriate video loading states.
- Pagination for long feeds.
- Avoid unnecessary component re-renders.
- Avoid duplicate API or mock-service requests.
- Efficient list rendering.
- Appropriate memory management for media-heavy screens.
- Reduced-data behaviour.
- Autoplay preferences.
- Network error handling.

For future uploads, prepare interfaces for:

- Upload progress.
- Upload cancellation.
- Retry handling.
- Resumable uploads.
- Secure direct-to-object-storage uploads.

Do not pretend that resumable server uploads work when no upload backend exists.


_Status: Partial. Existing caching, reduced-data/autoplay preference, feed pagination, pull-to-refresh, local media-selection feedback and API media-upload contracts remain in place. No media is uploaded and retry/resume/cancellation are not claimed as implemented; they require the future storage/API adapter. Physical-device video, memory/network and upload behavior remain unverified; keep open._

### [ ] Phase 2.8: COMPLETE MESSAGING AND NOTIFICATIONS


#### Messaging
Verify:

- Conversation creation.
- Conversation lists.
- Message sending in demo mode.
- Message history.
- Unread message indicators.
- Conversation navigation.
- Blocked-user restrictions.
- Empty states.
- Loading states.
- Error states.

Make it clear that local demo messages are not delivered to real users.

Prepare the messaging architecture for future SignalR integration.

#### Notifications
Verify:

- Notification lists.
- Read and unread states.
- Mark as read.
- Mark all as read.
- Notification navigation.
- Empty states.
- Notification preferences.

Prepare the architecture for future push notifications without claiming that real push delivery is active.


_Status: Partial. Shared message permission checks are enforced at list, detail, start and send boundaries; permitted conversations are marked read, blocked/private threads are filtered, and local delivery copy is explicit. Notification read/read-all actions and preferences remain local. Unit tests cover conversation/message restrictions and moderation. SignalR delivery and push notifications do not exist; device-level navigation checks remain._

### [x] Phase 2.9: IMPROVE API INTEGRATION READINESS


The application will eventually connect to an ASP.NET Core Web API built with .NET 10 LTS.

Do not implement the backend in this phase.

Improve the existing frontend integration architecture.

Requirements:

1. Keep API configuration centralised.
2. Keep API services separate from screens.
3. Maintain clear TypeScript interfaces for API requests and responses.
4. Separate mock services from production API services.
5. Avoid embedding mock data directly inside screen components.
6. Support authentication headers.
7. Support token refresh integration.
8. Handle HTTP errors consistently.
9. Support pagination.
10. Support loading and error states.
11. Support file-upload progress.
12. Keep business, user, post, product, story and messaging models consistent.

Create or refine service contracts for:

- Authentication.
- User profiles.
- Business management.
- Business memberships.
- Business discovery.
- Posts and feeds.
- Comments and reactions.
- Products and services.
- Business stories.
- Messaging.
- Notifications.
- Verification.
- Moderation.
- Media uploads.

Document the expected API request and response structures.

Do not invent real API endpoints and present them as existing backend functionality.

The frontend must continue to run independently using its mock implementation.


_Status: Complete for frontend integration readiness. Central API configuration, typed domain/result/page/error contracts, separated mock service, feature service interfaces, auth/token-refresh HTTP scaffold and media upload contract notes are present. Root `API_INTEGRATION.md` documents proposed ASP.NET Core/.NET 10, PostgreSQL, object-storage and SignalR domains/endpoints, envelopes, pagination, auth, media, messaging and notification integration. UI remains local/mock; no proposed endpoint is described as deployed._

### [ ] Phase 2.10: USER EXPERIENCE AND INTERFACE QUALITY


Preserve the established BizConnect visual identity.

Do not redesign the entire application unnecessarily.

Improve consistency across:

- Spacing.
- Typography.
- Buttons.
- Cards.
- Forms.
- Modals.
- Navigation.
- Loading indicators.
- Empty states.
- Error messages.
- Confirmation dialogs.

Verify that:

- Buttons have meaningful actions.
- Forms validate correctly.
- Navigation does not lead to broken routes.
- Modals can be opened and closed correctly.
- Long content does not overflow.
- Keyboard interactions work properly.
- Screens remain usable on different Android and iOS screen sizes.
- Accessibility labels are present where appropriate.

Maintain English and Swahili localisation readiness.

Maintain Kenyan phone number formatting, Kenyan locations and KSh currency formatting.


_Status: Partial. Existing BizConnect design system and accessible shared forms/components are preserved; validation, route guards, explicit local-demo copy and empty/error/fallback states were improved. Real-input browser checks exercised onboarding, OTP rejection/acceptance, text-post preview/publish and the six-step business form. Full Android/iOS screen-size, camera/location permission, keyboard and accessibility device checks remain; keep open._

### [x] Phase 2.11: AUTOMATED TESTING


Add meaningful tests for the actual BizConnect application.

Do not rely exclusively on tests inherited from the starter project.

At minimum, implement automated tests covering:

#### Authentication
- Registration validation.
- Login validation.
- Logout.
- Protected navigation.

#### Business management
- Business creation.
- Business editing.
- Multiple-business switching.
- Role-based permissions.

#### Social functionality
- Feed filtering.
- Follow and unfollow.
- Like and unlike.
- Comment creation.
- Save and unsave.
- Hidden content filtering.
- Blocked-user restrictions.

#### Discovery
- Search.
- Category filters.
- Location filters.
- Combined filters.
- Empty results.

#### Content
- Draft creation.
- Draft editing.
- Post creation.
- Validation.
- Media-selection error handling.

#### Messaging and moderation
- Conversation creation.
- Message restrictions.
- Report submission.
- Block and unblock.

Use an appropriate testing framework compatible with the existing project.

Do not skip tests merely to obtain a passing test result.


_Status: Complete for the requested automated frontend test scope. `pnpm test -- --reporter=dot` passed all 44 tests in four files, including registration/login/OTP, local-session expiry/logout, protected/onboarding routes, business create/edit/role/identity behavior, privacy and moderation, discovery filters, social records/drafts, media error handling and message restrictions. No tests are skipped._

### [ ] Phase 2.12: BUILD AND PLATFORM VERIFICATION


Run the available checks after implementation:

- Dependency and lockfile consistency.
- TypeScript type checking.
- Linting.
- Unit tests.
- Integration tests where applicable.
- Expo development startup.
- Expo web export if supported.
- Android build verification.
- iOS build verification where the environment supports it.

Do not claim that Android or iOS builds succeeded unless they were actually executed successfully.

Document any checks that could not be performed because of environment limitations.

Fix errors introduced by your changes.

Do not conceal warnings or failed checks.


_Status: Partial. Current `pnpm check`, `pnpm lint`, the 44-test suite and `pnpm exec expo install --check` pass. Expo Web, Android and iOS JavaScript bundle exports complete; Metro `/status` and root return HTTP 200 on fixed port 8081. Native Android/iOS release builds and physical-device behavior were not executed. Existing tool warnings remain documented in the handoff; keep open until supported native build/device checks._

### [x] Phase 2.13: DOCUMENTATION


Update the project documentation.

README.md must explain:

- What BizConnect does.
- Current frontend capabilities.
- What is still a local demonstration.
- Installation.
- Environment configuration.
- Development startup.
- Available scripts.
- Testing.
- Build instructions.
- Project structure.
- API integration architecture.

Update TODO.md to reflect actual completion status.

Create or update an API_INTEGRATION.md document describing:

- Expected backend domains.
- Frontend service contracts.
- Authentication integration.
- Media upload integration.
- Messaging integration.
- Notification integration.
- Error handling.
- Pagination.
- Required backend endpoints, clearly labelled as proposed contracts rather than existing endpoints.


_Status: Complete. `README.md` documents the product, local-only boundary, install/env/start/scripts/build/test commands, architecture, privacy and limits. Root `API_INTEGRATION.md` is the proposed backend contract; this `TODO.md` now records evidence and unresolved checks while retaining all source acceptance clauses._

### [ ] Phase 2.14: STRICT DELIVERY REQUIREMENTS


This task is not complete when the screens merely look correct.

The task is complete only when:

1. Existing functionality has been preserved.
2. Identified defects have been corrected.
3. Incomplete frontend behaviours have been implemented where possible.
4. Privacy and moderation behaviour is consistent.
5. Core user journeys have been tested.
6. The application builds successfully wherever the environment permits.
7. No broken navigation or nonfunctional buttons remain in the implemented scope.
8. Mock functionality is clearly distinguished from real server functionality.
9. API integration documentation is available.
10. The project is ready for a separate backend integration phase.

Do not stop after producing an implementation plan.

Do not return only a report.

Make the actual code changes, run the available checks and update the documentation.


_Status: Partial, not claimed fully complete. Existing functionality was retained, confirmed privacy/onboarding defects were fixed, and automated checks plus real-input browser journeys pass; local demo actions are explicitly distinguished from server operations. Remaining acceptance work is the open native/device and exhaustive route/action validation above; no backend behavior is claimed. Continue from this state rather than rebuilding._

### [ ] Phase 2 final report requirements


At the end, provide a clear report containing:

1. Features improved.
2. Bugs fixed.
3. New functionality implemented.
4. Files and major modules changed.
5. Tests added.
6. Tests executed and their actual results.
7. Build results.
8. Remaining limitations.
9. Features that still require a backend.
10. Recommended next development phase.

**FINAL PRIORITY: Deliver a stable, thoroughly tested BizConnect frontend while preserving the existing project and all of its implemented functionality.**


## Phase 3 — Native Mobile Completion and Frontend Stabilisation

Source: user-provided Phase 3 assessment, `/home/ubuntu/upload/pasted_content_2.txt` and repeated in `/home/ubuntu/upload/pasted_content_3.txt`. Continue the existing app; do not start backend development during this phase.

### [ ] Phase 3.1: Implement the interactive geographic discovery map

- Implement an actual interactive geographic map for business discovery.
- Show business pins and allow selection to display a business preview and open its profile.
- Allow switching between map and list experiences.
- Respect location permissions; provide a useful fallback if permission is denied.
- Preserve the privacy and blocked-owner filters.
- Use only explicitly verified coordinates; do not invent precise business coordinates. Businesses without a verified coordinate must remain discoverable in the list and be clearly identified as not mapped.

_Status: Partial. The native map uses `react-native-maps` 1.29.11, recommended by Expo SDK 58 and included in Expo Go. It retains map/list switching, sourced marker selection, business previews/profile routes, blocked-owner filtering, and visible not-mapped businesses. Pins are source-attributed OpenStreetMap neighbourhood/district/city centroids returned by Photon; they are explicitly approximate public-area markers, not verified business-premises coordinates, and no precise storefront coordinates are invented. Web Preview click-through passed for map/list toggle, fallback copy, mapped rows and the Kivuli Studio profile route. Native marker gestures/rendering and permission-denied “Near me” still require device verification._

### [ ] Phase 3.2: Complete native UI and user-journey verification

- Complete broader UI and user-journey testing; test buttons, modals, navigation transitions and media-selection flows, not only domain tests.
- Verify Android and iOS physical-device behaviour where available, especially camera/gallery permissions, video selection and playback, location permissions, SecureStore, keyboard behaviour and responsiveness across screen sizes.
- Improve accessibility and responsive behaviour, including meaningful accessibility labels and usable layout at different device sizes.
- Report every unavailable physical-device or native check as not verified; do not infer device behavior from Web Preview or JavaScript bundles.

_Status: Partial. A post-hydration Web Preview interaction pass exercised the Discover map/list toggle, fallback and profile navigation. The user’s iPhone-shaped Preview screenshot exposed that the root can supply a 16 px placeholder inset; the prior wrapper honored that value but it was insufficient for a Dynamic Island. The shared `Page` now applies the actual top inset directly, with a 59 px fallback when the placeholder remains on native iOS or a narrow embedded phone Preview; desktop Web and Android are unchanged. Home, Stories and Profile all use this shared page. TypeScript, lint, 54 tests, dependency validation and Web/Android/iOS JS exports passed after the change. The actual device appearance, camera/gallery, location permission denial, SecureStore and native keyboard/responsive behavior still need Android/iOS hardware verification._

### [ ] Phase 3.3: Improve Android performance and compatibility

- Improve Android performance and compatibility without removing existing product behavior.
- Review long lists, maps, images, video and interactions for efficient rendering and memory use.
- Exercise the available Android Expo JavaScript bundle and supported diagnostics; do not claim native release-build/device performance without a real build or device.

_Status: Partial. Changed the video feed to a virtualized `FlatList` with only the visible clip eligible to play, pauses offscreen players, sizes cards to the window, reports player errors, and suppresses autoplay under reduced-data mode. The Android JavaScript export passed. No Android APK/AAB, physical-device memory/performance profile or native map-tile check was run._

### [ ] Phase 3.4: Stabilise image and video handling

- Test image and video selection and preview in their actual supported platform flows.
- Verify camera/gallery permission handling, selection cancellation/error feedback, playback/loading/error states, memory/performance behavior, and reduced-data/autoplay preferences where the environment permits.
- Keep the local-demo boundary: selected media is not server-uploaded, and no real upload/resume/retry or cross-user delivery may be claimed.

_Status: Partial. Existing media cancellation/permission/error regression tests pass; image selection keeps local compression, and video player failures now have an explicit retry/error state. Android/iOS picker, camera, playback and permission behavior could not be physically exercised here. No upload, resume, server sync or external delivery was added._

### [x] Phase 3.5: Clean source and review starter infrastructure

- Remove unnecessary generated files and review starter infrastructure.
- Exclude Expo caches/device state and build output from clean source-control delivery.
- Distinguish the managed starter `server/`, Drizzle schema/config and database libraries from the future BizConnect ASP.NET Core backend; do not treat them as the business backend, route product actions through them, or delete required starter infrastructure without validating the Mobile template.

_Status: Complete. `.expo/` and `dist/` are ignored; `git ls-files` found no tracked Expo cache/device-state, Android/iOS generated directories, bundles or APK/AAB/IPA artifacts. Reviewed the existing `server/`, Drizzle config/schema, database dependencies and tRPC links; retained them because they are managed-starter infrastructure. README and API integration docs explicitly distinguish them from the future BizConnect ASP.NET Core backend._

### [ ] Phase 3.6: Finalise Android/iOS application identity

- Before release, establish and configure the permanent Android application ID, iOS bundle identifier and associated deep-link scheme.
- Update native configuration, deep-link handling and release documentation consistently.
- Do not guess owner-controlled identifiers; preserve the current managed starter values until the owner supplies and approves permanent values.

_Status: Open—owner input required. `app.config.ts` keeps the existing generated Android package, iOS bundle identifier and `manus…` scheme unchanged. No permanent owner-approved identifiers were supplied, so no guess or irreversible identity change was made._

### [ ] Phase 3.7: Produce a clean, reproducible release-build handoff

- Provide reproducible lockfile-based dependency setup, deterministic config validation and the documented build path.
- Prepare the project for a clean Android and iOS release build and hand off through the supported Expo Dashboard native build flow.
- Report JavaScript bundle exports separately from native release artifacts; claim APK/AAB/TestFlight success only after an actual managed build result.
- Clearly state remaining platform/device blockers and the exact next action required to obtain native artifacts.

_Status: Partial. Lockfile-pinned setup and Dashboard native-build guidance remain documented. Under Expo SDK 58, `pnpm check`, `pnpm lint`, `pnpm test` (8 files, 59 tests), `expo install --check`, Expo Doctor (20/20), Expo config validation, `git diff --check`, and Web/Android/iOS JavaScript exports passed. Lint and Vitest emitted non-failing Node module-type and Vite CJS deprecation advisories. No APK/AAB, iOS archive/TestFlight artifact or agent-controlled physical-device run was created; permanent IDs and a restricted Android Maps key are still prerequisites for a release-ready map._

### [x] Phase 3.8: Keep API integration deferred

- Do not start ASP.NET Core backend development or connect the mobile screens to that backend in Phase 3.
- Preserve the frontend local-demo behavior and clearly disclose that actions are not server-synced.
- Keep the API architecture as proposed integration contracts; the HTTP transport and typed service adapters exist but remain disconnected from interactive screens, and this is not evidence of a live backend.
- Do not confuse the Manus starter server/Drizzle infrastructure with the intended BizConnect ASP.NET Core service.

_Status: Complete for Phase 3 scope. No ASP.NET Core backend was started and no screen was connected to the starter API or database. Local-demo actions remain device-local; `API_INTEGRATION.md` stays a proposal. The HTTP transport supports CRUD and all 19 typed service domains now have adapter structures, but the Create screens still use the local app store and no remote endpoint is available. The starter API/Drizzle setup is documented separately._

### Phase 3 final report requirements

Report: features improved; defects corrected; new functionality; files/modules changed; tests added; exact checks and results; bundle/native build results; device tests performed and not performed; remaining limitations; backend work explicitly deferred; permanent application-identity inputs still needed; recommended next step. Preserve all Phase 2 history and acceptance criteria.


### [x] Phase 3.9: Upgrade the existing app for Expo Go SDK 58 compatibility

- Upgrade the existing BizConnect project from Expo SDK 57 to SDK 58 so it matches the user's installed Expo Go SDK 58.
- Align Expo-managed packages to the SDK 58-compatible versions and update the package manifest and lockfile using the project's pnpm workflow.
- Apply only the Expo Router and React Native API migrations required by SDK 58; preserve existing routes, design, local-demo behavior, generated Android/iOS identifiers, app scheme and static Web behavior.
- Preserve the fixed Metro/Web Preview port 8081 and starter API port 3000; do not add or connect a backend, do not create native release builds and do not publish.
- Run TypeScript, ESLint, the Vitest suite, Expo dependency compatibility and SDK diagnostics, and Web/Android/iOS JavaScript bundle exports; report each result accurately and distinguish bundles from native artifacts.

_Status: Complete for the requested SDK migration. The project is now on Expo `~58.0.23`, Expo Router `~58.0.30` and React Native `0.88.1`, with SDK 58-managed dependencies and Metro `0.87.1` aligned. `pnpm check`, `pnpm lint`, all 59 tests across 8 files, `expo install --check`, Expo Doctor (20/20), public Expo config validation and `git diff --check` pass. Web, Android and iOS JavaScript exports pass; none is a native release artifact. Metro `/status` and the Web root return HTTP 200 on 8081, the starter API remains on 3000, and the user confirmed Expo Go opens the app using the refreshed QR. Lint and Vitest emit non-failing Node module-type and Vite CJS deprecation advisories. No backend, native release build or publication was created; actual device connection and hardware-only checks remain open under Phase 3.2/3.4._

### [x] Phase 3.10: Add a persisted app-wide dark theme

- Add an accessible, clearly selected Light/Dark appearance choice in Settings.
- Preserve the current Light appearance as the default and apply Dark styling across the app's main tabs and secondary routes, shared surfaces and controls, text, form fields, bottom navigation and status bar; theme the Web discovery fallback and native map appearance where the platform supports it.
- Use a true-black Dark canvas (`#000000`) and neutral charcoal surfaces (`#0A0A0A`–`#171717`), not green-tinted large backgrounds. The bottom navigation background and border must switch with Light/Dark, and active/inactive icons and labels must remain legible.
- Save the choice as `appearance: "light" | "dark"` in the existing local-demo settings. Retain it across app restart and sign-out; legacy saved data with a missing or invalid appearance must default to Light without discarding other saved demo data; deleting local demo data resets Light.
- Keep this preference app-scoped: do not alter the phone's device-wide appearance, add a System option, add a backend, or change existing demo/auth/privacy behavior.

_Status: Complete for the implementation and checks. The Dark palette now uses a true-black canvas (`#000000`) and neutral charcoal surfaces (`#0A0A0A`/`#141414`) rather than green-blue backgrounds. The tab layout subscribes to ThemeProvider and explicitly selects a black bar with a neutral border in Dark while retaining the white Light bar; active/inactive icon and label colors remain visible. The native map's Dark style is neutral charcoal too. Regression tests cover the exact Light/Dark bar colors and palette tokens. `pnpm check`, `pnpm lint`, all 59 tests, Expo SDK alignment and Web/Android/iOS JavaScript exports pass; Metro `/status` and the Web root return HTTP 200 on 8081, and the port-3000 starter API remains the expected placeholder. The user should reload Expo Go after the Metro watcher restart; no post-fix device screenshot has been confirmed. No native release artifact, backend or publication was created._


### [x] Phase 3.11: Add truthful skeleton loading and comprehensive empty states

- Add reusable, theme-aware skeleton layouts with accessible loading labels; use the existing `hasHydrated` state to show a feed-shaped skeleton only while the local AsyncStorage store is actually hydrating. Do not add artificial delays or represent synchronous filtering/search over local demo data as a remote loading request.
- Retain operation-specific loading indicators for genuine pending form/media actions, and keep skeletons static/reduced-motion safe.
- Reuse the shared `EmptyState` component and provide useful, action-oriented empty states for Home's For You/Following/Nearby feeds, filtered business discovery, founder stories, search results by selected category, conversations (distinguishing no conversations from no query matches), notifications, saved posts/stories/businesses/ideas, business profile products/services and post comments.
- Distinguish an empty collection from a search/filter with no matches; offer appropriate next steps such as discovering businesses, clearing a query/filter, browsing all stories, or signing in. Do not expose owner-only creation actions to guests.
- Preserve all local-demo behavior, authentication/privacy rules, theme responsiveness and the explicit mock-frontend/future-backend boundary.

_Status: Complete. `ThemeAwareApp` now waits for the actual `hasHydrated` signal and presents a screen-reader-labelled static feed skeleton while AsyncStorage loads; reusable feed/card/story-row/list-row skeleton shapes are available, with no artificial delay. Genuine form-action spinners remain unchanged. Shared theme-aware `EmptyState` now covers the Home feed filters, business discovery, founder-story categories, search/no-recent-search results, inbox and first-message thread, notifications, saved content, business product/service catalogues and post comments. Empty Saved Posts and Stories include direct Browse feed/Stories actions; saved Businesses and Ideas link to Discover/opportunities. Other existing protected-route empty states remain. Query/filter no-results are distinguished from empty collections and actions stay within the current auth/privacy boundary. `pnpm check`, `pnpm lint`, all 59 tests, Expo dependency alignment, Web/Android/iOS JavaScript exports, live Web/Metro checks and `git diff --check` passed. No remote loading, new backend behavior or native release artifact was introduced._


## Phase 3.12: Remaining frontend engineering and final sign-off

### [x] 3.12.1 Complete the reusable HTTP transport
_Progress: Complete. The CRUD/auth transport, standardized error handling, cancellation, pagination contracts and single-flight refresh are implemented; `pnpm check` and the API adapter tests passed._
- Implement GET, POST, PUT, PATCH and DELETE in the centralized client, with JSON bodies, query parameters, custom headers, bearer authentication, request timeout, AbortController cancellation, consistent parsing, centralized HTTP/network/auth errors, request IDs/debug context and pagination.
- Prepare access/refresh token and expiry handling, eligible 401 retry, session expiry/clearing and single-flight refresh when several requests fail together. Keep the refresh contract configurable and document it; do not invent an existing refresh endpoint or reuse the eight-hour local demo marker/OTP as production credentials.
- Preserve stable error codes, field validation details, server/client request IDs and truthful `source`; do not expose tokens, signed URLs, provider secrets or stack traces.

### [ ] 3.12.2 Add upload transport and central service registration
_Progress: Partial. All 19 typed production and deterministic mock service domains, the mode-aware provider, secure session storage and progress/cancellation upload transport exist. Current screens still use `hooks/use-app-store.tsx`; UI/service migration and live backend connection remain open. Upload retry resends the whole file; byte-resume is not implemented or claimed._
- Support multipart and direct-to-object-storage transport for business profile images, business cover images, user profile images, post images, videos, product images, business story media and verification documents. Support metadata, progress where the selected React Native networking layer supports it, cancellation, failure handling and retry integration. Do not claim resumable upload unless the compatible server upload protocol exists and is implemented.
- Provide a centralized, React-Native-compatible `BizConnectServices` registration/factory so mode changes do not require editing individual screens. Screens must use feature services/hooks rather than calling the HTTP client directly. Keep API configuration centralized.
- Provide contract-conforming mock and production implementations for authentication, users, business management/memberships, discovery, feeds/posts, comments/reactions, catalogue, stories/opportunities, messaging, notifications, verification, moderation and media uploads. Preserve the mock-first local demo; production adapters must not fake successful responses or convert an API error into local success. Proposed routes remain proposals until implemented by the backend.

### [ ] 3.12.3 Expand deterministic user-journey coverage
_Progress: Partial. The consolidated Playwright journey passes guest business discovery, local registration/demo OTP/profile setup, local text publishing, poll creation/voting, Social Story/Highlight creation, six-step business creation, product/service/offer/event/community-opportunity publishing, local follow/enquiry messaging and persisted neutral-black navigation. Broader logout/session-expiry, team, map, privacy and moderation cases above remain open; it is one bundled E2E spec, not exhaustive platform coverage._
- Keep all existing tests; use testing tools compatible with the existing Expo SDK/React Native version and do not add conflicting dependencies or skip failures. Use deterministic fixtures and no real external services. Distinguish unit, integration, UI/E2E and unavailable physical-device coverage; test important loading, empty and error states.
- Cover authentication: registration/login validation, demo OTP, profile setup, successful logout, expired sessions and protected navigation.
- Cover business journeys: create/edit business, add locations, create products/services, switch multiple businesses and personal/business identities, team member management and role restrictions.
- Cover social journeys: view Home, switch For You/Following/Nearby, create post, save/edit draft, like, comment, follow user/business, save/unsave, hide content and block/unblock users.
- Cover discovery: search businesses, category/location/combined filters, open business profiles, map/list switching, select markers/open previews, businesses without coordinates and denied location permission.
- Cover messaging/notifications: create conversations, send demo messages, view history, blocked restrictions, notification lists, mark read and follow notification navigation.
- Cover privacy/moderation: private profile visibility, hidden content filtering, blocked-user restrictions, message permissions, report submission, unblock, logout and session cleanup.

### [ ] 3.12.4 Complete the interaction defect audit
_Progress: Partial. The audit found and fixed nested business-card navigation/follow controls and verified the listed journeys. An exhaustive interaction pass over every implemented route and control remains open._
- Inspect every implemented screen for buttons without actions, incorrect routes, broken modals, forms that do not validate, actions that do not update state, state lost unexpectedly, missing loading/empty/error feedback, duplicate submissions and incorrect post-action navigation.
- Verify every implemented control has a meaningful outcome. Prioritize business create/edit, identity switching, post creation/drafts, product management, business stories, discovery filters/map, messaging, notifications, privacy and moderation. Preserve the design system and do not add unnecessary screens.

### [ ] 3.12.5 Finish native configuration
_Progress: Partial. SDK 58 app configuration, permissions/plugins, SecureStore and Web/Android/iOS JavaScript exports are in place. The generated iOS/Android identifiers remain as supplied by the fixed Mobile starter; native release builds, fresh physical-device checks and signing/map-key validation were not performed._
- Review Android application ID and iOS bundle identifier; replace temporary Manus-generated identifiers with consistent documented BizConnect placeholders in reverse-domain format, without claiming ownership of a real domain. Keep them easy to replace before production publishing.
- Document the required Android Google Maps API key and environment-based configuration; never commit a private key. Explain restriction by application identifier and signing certificate; handle missing/invalid configuration gracefully.
- Verify Android permissions, iOS usage descriptions, camera/media/location/notification permissions, SecureStore, deep links, app/adaptive icons, splash screen and orientation. Do not request permissions unnecessarily and do not claim physical-device testing unless performed.

### [ ] 3.12.6 Review and improve Android performance
_Progress: Static code review complete; physical low-end Android profiling remains open. Home grows rendered feed cards incrementally (initial three, then two per near-end scroll), the video feed uses a virtualized FlatList with a 3-screen render window, two-item batches, Android clipping and active-item-only playback, and `expo-image` uses memory/disk caching while reduced-data mode suppresses selected imagery/autoplay. Camera, gallery, map gestures, memory, frame rate, thermal behavior and network recovery were not benchmarked on hardware; there is no generated `android/` native project in this managed starter._
- Review Home feed, video feed, business discovery/map/profile, catalogues, messaging and media selection for modern and lower-end Android devices.
- Improve virtualized lists, image loading/cache, video loading/playback and off-screen pausing, memory usage, unnecessary rerenders, navigation responsiveness, reduced-data mode, network recovery and media selection. Avoid unnecessary large downloads and complicated abstractions without a measurable benefit.

### [ ] 3.12.7 Prepare a clean reproducible source project
_Progress: In progress. A sanitized 200-file source ZIP is available at `/home/ubuntu/bizconnect-phase3-source.zip`; it excludes `.expo`, dependencies, build output, Playwright artifacts and local environment files. The archive was extracted; with pnpm 9.12.0, `pnpm install --frozen-lockfile --prefer-offline`, TypeScript and 70 unit tests passed. The required server/Drizzle starter infrastructure was retained. Metro startup was verified on the working project, but startup from the clean extraction remains unverified._
- Exclude `.expo` cache/device-state files, build output, temporary logs and local environment secrets from the final delivery ZIP. Preserve application source, lockfiles, required assets, API contracts, tests and documentation.
- Review starter server/Drizzle infrastructure and remove it only if proven unnecessary; do not remove required mobile infrastructure.
- Verify a clean checkout can install from the committed lockfile and start using documented commands. Create a clean source ZIP that excludes generated/private files.

### [x] 3.12.8 Run reproducible checks and report build levels accurately
_Progress: Complete. With pnpm 9.12.0, `pnpm install --frozen-lockfile --prefer-offline`, clean-extract TypeScript and 70 unit tests passed; lint, six Playwright journey steps, Expo Web/Android/iOS JavaScript exports, and Metro/API listener checks passed. No native release build was run because the fixed Expo Mobile workflow does not support release builds inside Sandbox; `PHASE3_HANDOFF.md` distinguishes JS exports, native builds and device verification._
- Identify pnpm and the committed lockfile; perform a clean frozen-lockfile install; check dependency consistency. Run TypeScript, lint, unit, integration and available E2E checks; run Expo startup, Web export, Android JS bundle and iOS JS bundle verification where supported.
- Attempt native Android/iOS build verification only where the environment and supported workflow allow it. Distinguish JavaScript bundle, Expo export, native build and physical-device verification. Document exact SDK/credential/OS limitations and do not hide errors or claim one level as another.

### [x] 3.12.9 Complete future API integration documentation
_Progress: Complete for the documented adapter boundary. `API_INTEGRATION.md`, `docs/backend-integration.md` and `PHASE3_HANDOFF.md` describe 19 service domains, proposed routes, envelopes, pagination, sessions, upload limits, checks, local-demo boundary and remaining backend work._
- Update `API_INTEGRATION.md` with central configuration; authentication; users; business management/memberships; discovery; feed/posts/interactions; catalogue; stories; messaging; notifications; verification; moderation; media upload; request/response examples; pagination; error envelopes; token expiry/refresh; and upload workflow.
- Clearly mark each route as a proposed contract until it exists in the ASP.NET Core backend. Update README and TODO to reflect actual implementation, checks, native limitations and remaining requirements.

### [x] 3.13.1 Compact the Home header and consolidate secondary navigation
_Progress: Complete. Home now uses a styled BizConnect wordmark with no logo mark or greeting; Search stays visible, Videos/Notifications/Messages are in a compact More menu with unread state, and the profile shortcut remains. The menu dismisses by outside press, Escape and native back, uses theme tokens, and leaves bottom navigation unchanged. TypeScript, lint, all 70 unit tests, six Playwright journey steps and `git diff --check` passed._
- Remove the Home greeting and its supporting greeting copy. Show the styled BizConnect name without the logo mark in the Home header.
- Keep Search as the visible primary header action. Move Videos, Notifications and Messages into a compact More dropdown; keep each destination working and retain an unread-notification indicator.
- Make the dropdown dismissible, accessible by labels and keyboard/native back behavior, and visually consistent with both light and neutral-black dark themes. Preserve the existing bottom navigation.


### [x] 3.13.2 Redesign the Create experience as a useful, honest content studio
_Progress: Complete for the requested studio redesign and truthful local-demo behavior. Create now has personal/business identity selection, accessible format selection, post composer and media previews, details, preview/publish/draft actions, Stories and business-publishing entry points, plus management links for catalogue, milestones, business profiles, ideas, drafts and My Content. Detailed remaining 3.14 requirements are tracked below rather than implied complete. `pnpm check`, `pnpm lint`, 78 Vitest tests and the expanded Playwright journey pass; Expo device JavaScript exports and physical-device/media checks remain governed by Phase 3 limitations._
- Organize creation around the supplied feature brief: personal posts and media; stories; business content; products and services; founder stories and milestones; ideas/opportunities; events and offers; publishing controls; and managing drafts or published content.
- Preserve and improve the working local post composer, personal/business identity selection, image/video selection and preview, location and business tagging, draft saving, and publish feedback. Keep demo-only persistence clearly stated.
- Surface existing creation/management flows for drafts, business profiles, products/services, milestones and opportunities through clear, working entry points. Clearly distinguish locally implemented Story publishing, polls, events/offers, Highlights and multi-asset previews from future AI assistance, scheduling, real remote uploads, and server publication; never claim local demo content is shared or server-synced.
- Use accessible, responsive, one-handed mobile controls and the shared Light/neutral-black Dark theme. Preserve working Expo Router navigation and validated form behavior.


### [ ] 3.14 Complete Create-system feature upgrade
_Progress: In progress; all shipped scope remains local-demo-only. Added a 24-hour Social Story composer with captions/stickers, media previews and audiences; Story Highlight creation/viewer; poll creation/voting with multi-select tallies; event, offer and community-opportunity create/edit/delete flows; dedicated product/service creation with preview; gallery/camera selection validation and video preview; and a React Native Web nested-button fix on founder-story cards. Added typed `SocialStoriesService` and `ListingsService` production REST skeletons plus local in-memory service adapters, extended `PostsService` for poll voting and full post creation fields, and documented proposed routes. Both Stories index and direct Story viewer use shared audience/block/expiry enforcement; an independent audit also found and fixed direct service lookup bypass plus expired-offer `active` status, with regressions. Offer date/order and opportunity expiry input validation reject malformed data. Automated E2E traverses text post, poll/vote, Story/Highlight, six-step business creation, product, service, offer, event, opportunity, messaging and theme journeys. Latest checks: TypeScript passed; ESLint passed with only the existing Node module-type advisory; 11 Vitest files / 78 tests passed; consolidated Playwright journey passed (1 spec); Expo Web, Android JavaScript and iOS JavaScript exports passed. Physical-device/media checks remain unverified. Remaining: not every original required scenario has dedicated E2E/device coverage; physical camera/gallery and video behaviour, upload transport failure/retry/resume, native Android/iOS performance profiling, full Highlight collection/cover/emoji editing, AI assistance, scheduled publishing, backend-mode screen integration and remote synchronization are not verified or implemented as live server functionality. Keep the original verbatim acceptance scope below; do not mark Phase 3.14 complete until remaining criteria are resolved or explicitly accepted as out of scope._

#### Original acceptance brief (verbatim)

# BIZCONNECT — COMPLETE CREATE PAGE FEATURE UPGRADE

## OBJECTIVE

Upgrade the existing BizConnect Create page into a comprehensive content creation and business publishing system.

The current Create page already supports basic text posts, photo posts, video posts, product showcases, business announcements, founder stories, identity selection, hashtags, locations, previews, drafts and other existing functionality.

Your task is to COMPLETE the remaining functionality, not rebuild the application.

**IMPORTANT: Work directly inside the existing BizConnect project. Do not generate a new project, replace the application architecture, redesign unrelated screens or remove existing functionality.**

First inspect the existing project structure, Create page, navigation, state management, storage, media handling, business management, products, services, opportunities, events and existing APIs. Understand how everything currently works before making changes.

---

# 1. EXPAND THE CONTENT CREATION SYSTEM

Support the following content types:

### Personal content
- Text posts.
- Single-photo posts.
- Multiple-photo posts and carousels.
- Video posts.
- Questions.
- Polls.
- Personal experiences.
- Opinions and discussions.
- Recommendations.
- Educational content.
- Tutorials and guides.
- Achievements.
- Customer appreciation posts.
- Challenges and competitions.

### Business content
- Business announcements.
- Business updates.
- Product launches.
- New arrivals.
- Service announcements.
- Promotions.
- Discounts and offers.
- Customer testimonials.
- Business achievements.
- Behind-the-scenes content.
- Business news.
- Business notices.
- Business events.
- New branch announcements.

Every post must support the appropriate content fields, media, identity, visibility and publishing controls.

# 2. IMPLEMENT A COMPLETE STORY CREATION SYSTEM

The existing founder-story format must not be confused with actual social media Stories.

Implement a dedicated Stories creation experience.

Features:
- Create personal stories.
- Create business stories.
- Capture photos using the camera.
- Record videos.
- Upload photos and videos.
- Add text overlays.
- Add captions.
- Add stickers and emojis.
- Add location stickers.
- Mention users and businesses.
- Add interactive polls.
- Add question stickers.
- Add links.
- Add audio or music where licensing and platform support permit.
- Preview stories before publishing.
- Select the audience.
- Publish stories.
- View published stories.
- Create story highlights.
- Organise highlights into collections.
- Edit highlight titles and covers.
- Remove stories and highlights.

Stories should have an appropriate expiration lifecycle, normally 24 hours, while highlights remain accessible until removed.

Do not implement Stories as ordinary permanent feed posts.

# 3. IMPLEMENT POLLS AND INTERACTIVE POSTS

Users should be able to:
- Create a poll.
- Enter a question.
- Add multiple answer options.
- Set poll duration.
- Allow one or multiple selections where appropriate.
- Preview the poll.
- Publish it.
- View voting results.
- Participate in other users' polls.
- Prevent duplicate voting where the poll permits only one vote.
- Display participation statistics.

Also support question posts and feedback requests.

# 4. COMPLETE VIDEO AND MEDIA CREATION

Upgrade media handling to support:

- Camera capture.
- Photo gallery selection.
- Video gallery selection.
- Multiple image uploads.
- Image reordering.
- Image cropping.
- Image previews.
- Basic image adjustments and filters where supported.
- Video recording.
- Video trimming.
- Video cover selection.
- Video previews.
- Captions and subtitles.
- Text overlays.
- Media compression.
- Upload progress.
- Upload cancellation.
- Retry failed uploads.
- Media validation.
- File size and format restrictions.
- Appropriate error messages.

Ensure video playback, media selection and upload handling work on supported Android and iOS devices.

# 5. IMPLEMENT DIRECT PRODUCT AND SERVICE CREATION

Users should be able to create products and services directly from the Create page without being forced to leave the creation workflow.

### Product creation
Include:
- Product name.
- Description.
- Category.
- Multiple images.
- Product video.
- Price in KSh.
- Discounted price.
- Product variations.
- Sizes and colours.
- Stock availability.
- Product specifications.
- Collection and delivery information.
- Location.
- Business association.
- Preview and publishing.

### Service creation
Include:
- Service name.
- Description.
- Category.
- Images and videos.
- Pricing.
- Pricing model.
- Service area.
- Availability.
- Working hours.
- Service duration.
- Booking and enquiry instructions.
- Business association.
- Preview and publishing.

Support editing, archiving and deleting products and services through their appropriate management workflows.

Reuse the existing catalogue infrastructure rather than creating duplicate product or service systems.

# 6. IMPLEMENT BUSINESS OFFERS AND PROMOTIONS

Allow business owners to create:

- Discounts.
- Limited-time offers.
- Seasonal promotions.
- Bundle offers.
- Coupon promotions.
- Free delivery announcements.
- Clearance sales.
- Special deals.
- Product-specific promotions.
- Service-specific promotions.

Fields should include:
- Offer title.
- Description.
- Promotional image.
- Original price where applicable.
- Discounted price where applicable.
- Start date.
- Expiry date.
- Terms and conditions.
- Associated business.
- Associated products or services.

Display offer status and expiry information appropriately.

# 7. IMPLEMENT BUSINESS EVENTS

Allow users to create:
- Networking events.
- Workshops.
- Training sessions.
- Business meetups.
- Product launches.
- Webinars.
- Promotional events.
- Entrepreneurship events.

Include:
- Event title.
- Description.
- Cover image.
- Event category.
- Date and time.
- Physical or online location.
- Registration instructions.
- Contact information.
- Associated business.
- Preview and publishing.

Ensure events connect properly to the existing event discovery experience where available.

# 8. IMPLEMENT BUSINESS OPPORTUNITY PUBLISHING

Create dedicated publishing workflows for:

- Business ideas.
- Startup opportunities.
- Partnership requests.
- Collaboration requests.
- Investment-related opportunities.
- Supplier requests.
- Distributor opportunities.
- Franchise opportunities.
- Mentorship requests.
- Mentorship offers.
- Job opportunities.
- Business advice requests.
- Market-gap discoveries.
- Requests for business feedback.

Each opportunity should support:
- Title.
- Description.
- Opportunity category.
- Associated business or personal identity.
- Location.
- Relevant requirements.
- Contact or enquiry instructions.
- Images where appropriate.
- Expiry date where appropriate.
- Publishing and editing.

For investment-related opportunities, include appropriate disclosures, moderation and restrictions on misleading financial promises. Do not imply guaranteed returns.

Connect opportunity creation to the existing BizConnect opportunities discovery system.

# 9. EXPAND BUSINESS STORYTELLING

Create guided storytelling experiences for:

- How I started.
- Why I started.
- How I raised startup capital.
- My first customer.
- My first sale.
- My biggest business challenge.
- Lessons I learned.
- My biggest business mistake.
- My growth journey.
- Behind my business.
- Advice for aspiring entrepreneurs.
- Business success stories.
- Business failures and recovery.
- My business expansion journey.

Include optional guided questions to help users tell their stories.

Allow text, images and videos.

Stories should be associated with the appropriate personal or business identity and should be publishable to the appropriate feed.

# 10. EXPAND BUSINESS MILESTONE CREATION

Allow business owners to create milestones such as:

- Business launched.
- First customer.
- First sale.
- First employee.
- First physical location.
- First product launch.
- First service launch.
- New branch.
- Business anniversary.
- Major partnership.
- Business expansion.
- Reaching a business target.
- Other custom achievements.

Support:
- Milestone title.
- Description.
- Date.
- Images or video.
- Associated business.
- Preview.
- Publishing.

Connect to the existing business milestone and timeline functionality.

# 11. IMPLEMENT AI CREATION ASSISTANCE

Add an optional AI writing assistant inside the creation experience.

Support:
- Generate captions.
- Improve captions.
- Rewrite content.
- Fix grammar.
- Generate hashtags.
- Generate product descriptions.
- Generate service descriptions.
- Generate business announcements.
- Generate promotional content.
- Turn rough ideas into structured posts.
- Generate founder stories.
- Suggest business content topics.
- Generate poll questions.
- Generate milestone descriptions.

Users must always be able to edit AI-generated content before publishing.

Do not expose API keys in frontend code.

If an AI backend is not configured, provide an honest unavailable state or a clearly identified local demonstration. Never pretend an AI request succeeded when it did not.

# 12. COMPLETE THE SHARED PUBLISHING CONTROLS

All appropriate creation workflows should support:

- Personal identity selection.
- Business identity selection.
- Switching between managed businesses.
- Branch selection where relevant.
- Caption and description editing.
- Media management.
- Hashtags.
- User mentions.
- Business tagging.
- Location tagging.
- Audience selection.
- Public and private visibility where applicable.
- Comment permissions.
- Sharing permissions.
- Content preview.
- Save draft.
- Publish.
- Edit.
- Delete.
- Unsaved changes warnings.
- Duplicate submission prevention.
- Validation.
- Clear success and error feedback.

Respect existing business ownership and team permissions. Users must not publish under businesses they do not have permission to manage.

# 13. CONTENT MANAGEMENT

Improve the management of created content.

Provide support for:
- Draft management.
- Published content management.
- Scheduled content management.
- Editing existing posts.
- Deleting posts.
- Duplicating posts.
- Reusing previous content.
- Upload status.
- Publishing status.
- Failed upload recovery.
- Retry failed publishing.
- Scheduled publishing cancellation.

Only expose scheduling functionality when the required scheduling mechanism exists. Do not simulate successful scheduled publishing using local timestamps alone.

# 14. CREATE PAGE INTEGRATION

All creation workflows must be discoverable from the existing Create page.

Ensure that:
- Every creation action opens its correct workflow.
- Every form is functional.
- Every workflow has appropriate validation.
- The correct personal or business identity is retained.
- Users can return without unnecessarily losing their work.
- Existing navigation remains intact.
- Successful publishing updates the appropriate application state.
- Created content appears in its appropriate destination.
- Products and services appear in business catalogues.
- Stories appear in the Stories experience.
- Events appear in event discovery.
- Opportunities appear in opportunity discovery.
- Milestones appear on business timelines.
- Polls appear in the feed with working voting functionality.

Do not create separate disconnected versions of functionality that already exists elsewhere.

# 15. LOCAL DATA AND API ARCHITECTURE

The existing project currently has local/mock functionality and API infrastructure.

Preserve the existing architecture and improve it carefully.

Requirements:
- Keep local demonstration mode working.
- Keep production API mode separate.
- Use the existing API client and service conventions.
- Add missing service methods and API contracts where appropriate.
- Avoid placing business logic directly inside UI components.
- Implement proper loading, error and empty states.
- Use typed request and response models.
- Ensure authentication is respected.
- Handle media uploads separately from ordinary JSON requests.
- Support multipart uploads where the backend provides them.
- Avoid claiming that content is server-published when only local storage is used.

If backend endpoints do not exist, create clearly documented API contracts and service interfaces without inventing successful server operations.

Do not silently replace real API functionality with local mock data.

# 16. SECURITY, MODERATION AND PRIVACY

Implement:
- Content validation.
- File type validation.
- File size limits.
- Safe media handling.
- Audience and privacy controls.
- Appropriate permissions.
- Business ownership checks.
- Reporting support.
- Moderation status handling.
- Prevention of unauthorised publishing.
- Protection against duplicate submissions.
- Safe handling of external links.
- Appropriate disclosures for investment-related content.

Respect existing account privacy and moderation systems.

# 17. QUALITY AND USER EXPERIENCE

Ensure:
- Responsive layouts.
- Consistent design with the existing BizConnect application.
- Accessible controls.
- Clear form labels.
- Keyboard handling.
- Proper loading states.
- Useful validation messages.
- Confirmation before destructive actions.
- Reliable navigation.
- Smooth media previews.
- No broken buttons.
- No dead-end screens.
- No placeholder actions presented as completed features.

Do not unnecessarily change the visual identity of the rest of the application.

# 18. TESTING AND VERIFICATION

Test all creation workflows.

At minimum, verify:

1. Create a personal text post.
2. Create a personal photo post.
3. Create a multiple-photo post.
4. Create a video post.
5. Create and publish a Story.
6. Create a Story highlight.
7. Create and vote in a poll.
8. Create a business announcement.
9. Create a product.
10. Create a service.
11. Create a business offer.
12. Create an event.
13. Create a business opportunity.
14. Create a founder story.
15. Create a business milestone.
16. Generate and edit AI-assisted content when AI is configured.
17. Save, reopen and edit drafts.
18. Edit and delete published content.
19. Verify personal/business identity switching.
20. Verify business role permissions.
21. Verify media upload failures and retry.
22. Verify local mode.
23. Verify API mode and unavailable backend handling.

Add or update automated tests for the new functionality.

Run the existing test suite and ensure previous functionality remains intact.

Test Android and iOS compatibility where the project and environment permit. Clearly document any tests that cannot be executed.

# 19. FINAL DELIVERABLES

When complete:

- Provide the updated existing project.
- List every feature implemented.
- List features that remain incomplete.
- Identify any backend endpoints still required.
- Identify any external services or API keys required.
- Report automated test results.
- Report Android and iOS verification results.
- Document any limitations.
- Provide instructions for running the updated application.

## STRICT IMPLEMENTATION RULES

1. Do not rebuild BizConnect from scratch.
2. Do not remove existing functionality.
3. Do not replace working screens with simplified versions.
4. Do not introduce duplicate business, product, event or opportunity systems.
5. Do not create non-functional buttons.
6. Do not use fake success messages.
7. Do not hardcode production credentials.
8. Do not expose secrets in frontend code.
9. Do not break existing navigation, authentication or business permissions.
10. Do not claim completion without testing.

**The final objective is to make BizConnect's Create page a complete creation hub for social content, business content, entrepreneurial storytelling, products, services, opportunities, events, promotions and interactive community content.**

Implement the functionality fully, integrate it with existing modules and preserve the rest of the application.

## Phase 3.15 — Create frontend completion (12 November 2026)

_Progress: Phase 3.15 Create frontend scope is implemented and verified in local-demo mode: `pnpm check`, `pnpm lint`, `pnpm test -- --reporter=dot` (14 files/89 tests), `pnpm e2e:journeys` (1/1 expanded journey), and Expo SDK 58 Android/iOS JavaScript/Hermes exports all pass. The broader Phase 3 acceptance brief remains open outside this phase. The source specification below is preserved verbatim; no live AI/backend publishing, native release build or new physical-device verification is claimed._

### Source specification preserved verbatim

# BIZCONNECT — CREATE PAGE FINAL FRONTEND COMPLETION

## PROJECT INSTRUCTION

Continue developing the existing BizConnect application using the latest project files provided.

The previous Create Page upgrade has already implemented many features. Your task is to identify and implement ALL remaining frontend functionality, improve incomplete experiences and polish the entire creation system.

**THIS IS A FRONTEND-ONLY TASK.**

We are not integrating AI services or implementing actual AI functionality at this stage. We are building and completing the frontend screens, interactions, components, navigation and user experiences first.

Do not start a new project. Do not rebuild the application. Do not remove existing functionality.

## 1. FIRST: AUDIT THE EXISTING CREATE SYSTEM

Before writing code:

1. Inspect the current Create page.
2. Inspect every creation screen and related component.
3. Identify which features are complete, partially implemented or missing.
4. Identify broken navigation and incomplete interactions.
5. Inspect draft-saving and restoration.
6. Inspect Story creation and management.
7. Inspect video and media editing experiences.
8. Inspect product, service, event, offer and opportunity creation.
9. Inspect the existing design system and reusable components.

Use this inspection to determine exactly what needs to be completed.

Do not duplicate functionality that already works.

## 2. COMPLETE DRAFT MANAGEMENT

Fix the existing draft system.

Every draft must preserve all information entered by the user, including:

- Content type.
- Post text.
- Captions.
- Selected images.
- Selected videos.
- Media ordering.
- Hashtags.
- Tagged users.
- Tagged businesses.
- Location.
- Selected personal or business identity.
- Selected business.
- Poll questions.
- Poll options.
- Poll duration.
- Audience settings.
- Comment permissions.
- Sharing permissions.
- Video subtitles and editing information.
- Product and service information where applicable.
- Other content-specific fields.

Implement:

- Save draft.
- Automatically save drafts where appropriate.
- Reopen drafts.
- Continue editing.
- Update existing drafts.
- Duplicate drafts.
- Delete drafts.
- Discard unsaved changes.
- Warn users before leaving with unsaved changes.
- Restore drafts without losing entered information.

Use persistent local application storage so drafts survive application restarts.

## 3. BUILD THE AI CREATION ASSISTANT INTERFACE

We do not have an AI service yet.

Build the complete frontend experience using mock responses and a clearly separated demonstration service.

Do not attempt to connect to an actual AI provider.

Create an AI assistant experience that users can access from relevant creation screens.

### AI assistant features to represent

**Writing assistance**
- Generate captions.
- Rewrite captions.
- Improve grammar.
- Make content more professional.
- Make content more engaging.
- Make content shorter.
- Make content longer.
- Change writing tone.
- Generate hashtags.
- Suggest post titles.

**Business content assistance**
- Generate business announcements.
- Generate promotional captions.
- Generate product descriptions.
- Generate service descriptions.
- Generate business updates.
- Generate event descriptions.
- Generate offer descriptions.

**Entrepreneurship assistance**
- Turn rough ideas into structured posts.
- Generate founder-story drafts.
- Suggest storytelling questions.
- Suggest business content topics.
- Generate milestone descriptions.
- Generate poll questions.
- Suggest educational post ideas.

### AI assistant interface

Build:
- AI assistant entry point.
- Assistant home screen.
- Content generation screen.
- Prompt input.
- Content type selection.
- Tone selection.
- Length selection.
- Generate button.
- Loading animation.
- Generated content preview.
- Regenerate button.
- Copy button.
- Insert into composer button.
- Edit generated content.
- Generation history.
- Empty states.
- Error states.

Create realistic mock responses for demonstration.

Users must be able to interact with the entire experience without a real AI service.

Clearly identify this as a demonstration experience. Do not falsely represent mock responses as actual AI-generated results.

Keep the AI service isolated so an actual AI provider can be integrated in the future without rebuilding the screens.

## 4. COMPLETE VIDEO CREATION AND EDITING

Build the remaining frontend video editing experience.

Include:

- Record video.
- Select video from gallery.
- Video preview.
- Video trimming interface.
- Start and end time selection.
- Cover image selection.
- Video caption editor.
- Subtitle editor.
- Text overlays.
- Text positioning.
- Basic filters.
- Video duration information.
- Video quality information.
- Media replacement.
- Remove video.
- Upload progress demonstration.
- Upload cancellation interaction.
- Retry interaction.
- Validation messages.

Use actual supported device functionality where available.

Where advanced editing cannot yet be performed, build a clear functional frontend demonstration rather than displaying a non-functional button.

## 5. COMPLETE STORIES AND HIGHLIGHTS

Improve the Story creation and management experience.

### Story editor
- Photo stories.
- Video stories.
- Text-only stories.
- Background selection.
- Text overlays.
- Text positioning.
- Text colours.
- Font styles.
- Stickers.
- Emojis.
- Location stickers.
- Mentions.
- Question stickers.
- Poll stickers.
- Link stickers.
- Audio/music selection interface.
- Captions.
- Story preview.
- Audience selection.
- Publish interaction.

### Story management
- View active stories.
- View expired stories where appropriate.
- Delete stories.
- View story viewers using demonstration data.
- View story engagement using demonstration data.
- Create highlights.
- Edit highlight titles.
- Select highlight covers.
- Add stories to highlights.
- Remove stories from highlights.
- Reorder highlights.
- Delete highlights.

Use local demonstration data for functionality that requires information not yet available.

Maintain the distinction between temporary Stories and permanent feed posts.

## 6. COMPLETE CONTENT CREATION TYPES

Verify and complete the following creation experiences:

### Social content
- Text posts.
- Single-photo posts.
- Multiple-photo posts.
- Video posts.
- Polls.
- Questions.
- Discussions.
- Tutorials.
- Educational posts.
- Recommendations.
- Achievements.
- Customer appreciation posts.

### Business content
- Business announcements.
- Business updates.
- Product launches.
- New arrivals.
- Service announcements.
- Promotions.
- Customer testimonials.
- Behind-the-scenes posts.
- Business achievements.
- Business news.

### Entrepreneurial storytelling
- How I started.
- Why I started.
- My startup capital journey.
- My first customer.
- My first sale.
- Business challenges.
- Lessons learned.
- Mistakes and recovery.
- Business growth.
- Behind my business.
- Advice for entrepreneurs.

Each creation type should have the correct fields, validation, preview and publishing interaction.

## 7. COMPLETE PRODUCT AND SERVICE CREATION

Verify that users can create and manage products and services through a complete frontend experience.

### Products
- Product name.
- Description.
- Category.
- Multiple images.
- Product videos.
- Price.
- Discounted price.
- Sizes.
- Colours.
- Variations.
- Stock availability.
- Product specifications.
- Delivery information.
- Collection information.
- Business selection.
- Preview.
- Save.
- Publish.
- Edit.
- Archive.
- Delete.

### Services
- Service name.
- Description.
- Category.
- Images.
- Videos.
- Pricing.
- Pricing model.
- Service area.
- Working hours.
- Availability.
- Duration.
- Booking instructions.
- Business selection.
- Preview.
- Save.
- Publish.
- Edit.
- Archive.
- Delete.

Ensure these workflows integrate with the existing catalogue screens and do not create duplicate systems.

## 8. COMPLETE OFFERS AND PROMOTIONS

Implement and polish:

- Discount offers.
- Limited-time promotions.
- Seasonal promotions.
- Bundle offers.
- Coupon offers.
- Free delivery announcements.
- Clearance sales.
- Special deals.

Include:
- Title.
- Description.
- Images.
- Original price.
- Discounted price.
- Start date.
- Expiry date.
- Terms and conditions.
- Product or service association.
- Business identity.
- Preview.
- Save and publish.

Use KSh as the currency.

## 9. COMPLETE EVENTS

Implement:

- Networking events.
- Workshops.
- Training sessions.
- Business meetups.
- Product launches.
- Webinars.
- Entrepreneurship events.
- Promotional events.

Include:
- Event title.
- Description.
- Category.
- Cover image.
- Date.
- Start time.
- End time.
- Physical or online location.
- Registration information.
- Contact details.
- Business association.
- Preview.
- Save.
- Publish.
- Edit.
- Delete.

## 10. COMPLETE OPPORTUNITY CREATION

Implement frontend workflows for:

- Business ideas.
- Startup opportunities.
- Partnership requests.
- Collaboration requests.
- Investment-related opportunities.
- Supplier requests.
- Distributor opportunities.
- Franchise opportunities.
- Mentorship requests.
- Mentorship offers.
- Job opportunities.
- Business advice requests.
- Market-gap discoveries.

Each must have appropriate fields, categories, validation, preview, save and publish interactions.

For investment-related content, include risk disclosures and avoid misleading guaranteed-return claims.

## 11. COMPLETE BUSINESS MILESTONES

Implement all remaining milestone creation and management experiences:

- Business launch.
- First customer.
- First sale.
- First employee.
- First location.
- New product.
- New service.
- New branch.
- Anniversary.
- Major partnership.
- Business expansion.
- Custom achievements.

Allow users to add descriptions, dates, images and videos.

Ensure milestones can be viewed and managed from the appropriate business timeline.

## 12. CONTENT MANAGEMENT CENTRE

Build a comprehensive frontend content management experience.

Include:

- All content.
- Posts.
- Stories.
- Drafts.
- Scheduled posts.
- Products.
- Services.
- Offers.
- Events.
- Opportunities.
- Milestones.

Provide:
- Search.
- Filtering.
- Sorting.
- Content previews.
- Edit actions.
- Delete actions.
- Duplicate actions where appropriate.
- Status indicators.
- Empty states.
- Confirmation dialogs.

Use local demonstration data where needed.

## 13. COMPLETE PUBLISHING CONTROLS

Every relevant composer should support:

- Personal identity selection.
- Business identity selection.
- Business switching.
- Branch selection where applicable.
- Audience selection.
- Public and private visibility.
- Comment controls.
- Sharing controls.
- Location.
- Hashtags.
- Mentions.
- Business tagging.
- Preview.
- Draft saving.
- Publishing confirmation.
- Unsaved changes warning.
- Input validation.
- Error handling.

Ensure users cannot select businesses they do not manage.

## 14. IMPROVE THE DESIGN QUALITY

This is particularly important.

The existing application must not look like a generic template or a collection of ordinary forms.

Improve the Create experience to feel like a polished, modern, premium social-business platform.

Design expectations:

- Strong visual hierarchy.
- Attractive content creation entry points.
- Rich visual previews.
- Modern typography.
- Thoughtful spacing.
- Well-designed cards.
- Distinctive icons.
- Smooth transitions.
- Appropriate animations.
- Beautiful empty states.
- Consistent component styling.
- Clear interactive feedback.
- Well-designed bottom sheets and modals.
- Responsive layouts.
- Excellent mobile usability.

Do not make every creation option look like an identical rectangular button.

Use meaningful visual differences between social posts, Stories, products, services, events, opportunities and business content.

Make the creation experience intuitive, visually engaging and enjoyable.

Maintain the established BizConnect brand identity and consistency with the rest of the application.

Do not redesign unrelated application screens.

## 15. FUNCTIONALITY REQUIREMENTS

Every visible action must work.

Do not leave:
- Dead buttons.
- Empty navigation destinations.
- Placeholder forms.
- Broken previews.
- Fake publishing actions without a clear demonstration state.
- Incomplete editing flows.
- Unusable media controls.

For functionality that cannot yet use a real service, create a complete frontend demonstration with local data and clearly identified mock behaviour.

Persist demonstration data locally where appropriate so users can revisit their work.

## 16. TESTING

Verify:

- Every creation entry point.
- Every creation form.
- Every preview.
- Every publishing interaction.
- Every editing workflow.
- Draft saving and restoration.
- Story creation and management.
- Poll creation and voting.
- Product creation.
- Service creation.
- Offer creation.
- Event creation.
- Opportunity creation.
- Milestone creation.
- AI assistant demonstration.
- Identity switching.
- Business permissions.
- Navigation.
- Android compatibility.
- iOS compatibility.

Run existing tests and add tests for newly completed functionality.

Fix regressions introduced by the upgrade.

## 17. FINAL DELIVERABLE

Return the complete updated BizConnect project.

Provide a detailed implementation report showing:

1. Features completed.
2. Previously incomplete features now implemented.
3. Screens created or improved.
4. Existing features preserved.
5. Tests executed and results.
6. Features still incomplete.
7. Any known limitations.

## NON-NEGOTIABLE RULES

- Continue from the existing project.
- Frontend development only.
- Do not integrate an actual AI provider.
- Build AI interfaces using mock demonstration responses.
- Do not rebuild the application.
- Do not remove existing features.
- Do not duplicate existing modules.
- Do not simplify working screens.
- Do not leave non-functional controls.
- Do not claim that a feature works unless it has been tested.
- Prioritise completing the entire Create experience before moving to unrelated development.

**FINAL GOAL: Deliver a complete, polished and highly functional BizConnect frontend creation ecosystem. Users should be able to create, edit, preview, save and manage every supported type of social and business content through a cohesive application experience.**
