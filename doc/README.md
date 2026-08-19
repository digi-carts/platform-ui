# platform-ui

Super-admin console for the digi-carts SaaS. Next.js App Router; all API traffic via **api-gateway**.

Platform design: [System design](https://github.com/digi-carts/doc/blob/main/architecture/system-design.md)

## Purpose

Role `superadmin`: stores, merchants (`admins`), customers, subscription plans/features/discounts, platform payment, notifications, templates, Firebase, support, cleanup, setup wizard, service health.

## Tech stack

| Item | Version / lib |
|------|----------------|
| Next.js | 16.3.0 |
| React | 19.2.8 |
| Data | axios, TanStack Query, Zustand `auth-store-v3` |
| UI | Tailwind 4, shadcn, lucide |
| Tests | Playwright script in `package.json` (`test:e2e`) |

## Auth

Same pattern as merchant-ui: Bearer JWT + refresh against `/auth/refresh`. Default `NEXT_PUBLIC_API_URL` = `http://localhost:4000/api`.

## Routes

| Area | Paths |
|------|--------|
| Auth | `/login` |
| Home | `/dashboard` |
| Tenants | `/stores`, `/admins`, `/customers`, `/superadmins` |
| Plans | `/subscriptions`, `/subscriptions/features`, `/subscriptions/discounts` |
| Ops | `/payment`, `/notifications`, `/templates`, `/support`, `/services`, `/firebase`, `/cleanup` |
| Config | `/settings`, `/settings/info-content`, `/setup-wizard` |

Shell: `app/(superadmin)/layout.tsx`, nav in `components/layout/Sidebar.tsx`.

## Env

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Gateway API prefix |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Documented at org level; session today is Zustand + JWT, not NextAuth in this package.json |

## Local run

```bash
export NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm ci
npm run dev
```

Dockerfile: Node 20, listen **8080**.

## CI/CD

`digi-cart-platform-ui-dev` / `digi-cart-platform-ui`.

## Related

- [platform-service](https://github.com/digi-carts/platform-service/blob/stage/doc/README.md)
- [auth-service](https://github.com/digi-carts/auth-service/blob/stage/doc/README.md)
- [notification-service](https://github.com/digi-carts/notification-service/blob/stage/doc/README.md)
- [payment-service](https://github.com/digi-carts/payment-service/blob/stage/doc/README.md)
- AI map: [docs/ai/KNOWLEDGE_GRAPH.md](../docs/ai/KNOWLEDGE_GRAPH.md)
