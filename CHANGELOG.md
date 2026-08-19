# Changelog

All notable changes to platform-ui are documented here.
Format: `## [x.y.z] — YYYY-MM-DD` with `### Added / Changed / Fixed` subsections.

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
