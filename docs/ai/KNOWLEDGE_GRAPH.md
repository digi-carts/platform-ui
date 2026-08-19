# Knowledge graph — platform-ui

```mermaid
flowchart LR
  subgraph UIs
    PUI[platform-ui]
    MUI[merchant-ui]
    SF[storefront]
  end
  GW[api-gateway :4000]
  PUI --> GW
  MUI --> GW
  SF --> GW
  GW --> AUTH[auth-service :3001]
  GW --> PLAT[platform-service :3002]
  GW --> STORE[store-service :3003]
  GW --> CAT[catalog-service :3004]
  GW --> ORD[order-service :3005]
  GW --> SFS[storefront-service :3006]
  GW --> NOTIF[notification-service :3007]
  GW --> PAY[payment-service :3008]
  GW --> SHIP[shipping-service :3009]
  GW --> OFF[offer-service :3010]
  GW --> BILL[billing-service :3011]
```


## This repo

```mermaid
flowchart TD
  APP[app/(superadmin) pages]
  APP --> API[lib/api.ts]
  API --> GW[api-gateway]
  AUTH[lib/auth-store.ts] --> API
```

## Superadmin pages (`app/(superadmin)/`)

`dashboard`, `stores`, `admins`, `superadmins`, `customers`, `subscriptions` (plus `features`, `discounts`), `services`, `templates`, `setup-wizard`, `payment`, `notifications`, `firebase`, `support`, `cleanup`, `settings` (plus `info-content`).

## Task → file

- New console page: `app/(superadmin)/<name>/page.tsx` + `components/layout/Sidebar.tsx`.
- Platform API: typically `/platform/...` via `lib/api.ts`.
