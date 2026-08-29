# Changelog

## [0.2.4] - 2026-08-29

### Features
- add /v1 versioning prefix to API base URL

### Bug Fixes
- correct platform-config API path and response mapping
- parse list response correctly in platform-ui
- surface actual error detail from 503 on Services page
- redirect to login when token refresh retry also returns 401
- stores table dark mode — row hover, expired row, link and badge colors
- comprehensive dark mode readability and focus improvements
- customers table empty — API returns array not {users:[]}
- improve table row highlight visibility in dark mode
- correct stores page API path and response shape
- parse plain array response in superadmins page
- use superadmin endpoints in admins page
- correct admin list API endpoints
- show correct error when current password is wrong
- refresh token on 401 for authenticated /auth/* endpoints
- write API URL to static file at build time, fetch it at runtime
- combine direct script tag in head with lazy interceptor evaluation
- read API URL from meta tag instead of script injection
- evaluate API base URL lazily at request time, not module load
- inject API URL via server component to fix client-side requests
- explicitly map NEXT_PUBLIC_API_URL via next.config env
- hardcode dev gateway URL with /api suffix in build arg
- use auth-store-v3 key consistently in token refresh handler
- remove duplicate build-args in deploy-dev.yml
- pass DEV_API_GATEWAY_URL build arg to dev Docker build
- use $PORT env var so Cloud Run port injection works
- resolve Cucumber cn() import and load steps as CommonJS
- exclude features/ from Next.js TypeScript compilation
- bind Next.js to port 8080 for Cloud Run (was hardcoded 3001)
- regenerate package-lock.json to include missing cucumber/ts-node deps

### Documentation
- restore doc/README and add gateway API notes
- add complete project documentation

### CI/Build
- retrigger after repo-level secrets set
- retrigger build with DEV_API_GATEWAY_URL secret now available
- read API gateway URL from org secret instead of hardcoding
- fail PRs and stage deploys when tests fail
- trigger first dev build
- use separate GCP project IDs for dev (digi-carts-dev) and prod (digi-carts)All notable changes to platform-ui are documented here.
Format: `## [x.y.z] — YYYY-MM-DD` with `### Added / Changed / Fixed` subsections.

## [0.2.3] — 2026-08-19

### Added
- REST/client notes at `doc/api.md`
- Service overview restored at `doc/README.md`
- Fix Cucumber `cn()` import path (`../../../lib/utils`) so `test:component` compiles
- Load Cucumber steps as CommonJS via ts-node so Node can resolve `lib/utils`

## [0.2.2] — 2026-08-19

### Added
- Cucumber JS component tests (`npm run test:component`)
- GitHub Actions `pr-tests.yml`: pull requests to `stage`/`main` run component tests and fail the check on failure
- Dev deploy (`deploy-dev.yml`) runs component tests before Cloud Run update

## [0.2.1] — 2026-08-18

### Changed
- WhatsApp Twilio config now uses separate Account SID and Auth Token fields
- Add Send test email / WhatsApp / message buttons on the Notifications page

## [0.2.0] — 2026-08-07

### Added

- Notifications config page (`/super/notifications`) — per-store email (SMTP) and WhatsApp (Meta/Twilio) setup
- Sidebar link for Notifications under super-admin nav

## [0.1.0] — 2026-08-07

### Added (initial)

- Initial super-admin platform UI (Next.js 14)
- Dashboard, Customers, Stores, Templates, Subscription pages
- Store create/edit with email + phone fields
- Blocked field on customers; link customer to store
- Super-admin sidebar navigation restructure
