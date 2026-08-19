<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:digi-carts-ai-nav -->

# digi-carts AI navigation

Read `docs/ai/KNOWLEDGE_GRAPH.md` before editing. It maps tasks to files.

# platform-ui — AI navigation

Next.js superadmin console: stores, plans, services, payment, notifications, templates.

**Stack:** Next 16 App Router, axios, zustand, tanstack-query, shadcn

## How to use this knowledge graph

1. Start here (`AGENTS.md`) for purpose, ports, and where to change X.
2. Open `docs/ai/KNOWLEDGE_GRAPH.md` for file-to-file links and task routing.
3. Prefer jumping to listed files over scanning the whole tree.
4. Browser traffic goes through **api-gateway**. Path `/api/<prefix>/...` is stripped to the service path. Downstream services trust `x-user-id`, `x-user-email`, `x-user-role`, `x-store-id` injected by the gateway — they do not re-validate JWTs.
5. Roles: `user` (shopper), `merchant` (store admin), `superadmin` (platform).


API: `lib/api.ts` (persist key `auth-store-v3`).

## Jump table

| Task | File |
| --- | --- |
| Axios | `lib/api.ts` |
| Session | `lib/auth-store.ts` |
| Nav | `components/layout/Sidebar.tsx` |
| Superadmin shell | `app/(superadmin)/layout.tsx` |
| Login | `app/(auth)/login/page.tsx` |
| Notification forms | `components/notifications/*` |
