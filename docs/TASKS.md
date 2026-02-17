# ShotMaker Web — Task Tracker

> **Reference:** See `docs/planning/` for full specs, screenshots, and implementation chunk details.
> **Screenshots:** See `docs/screenshots/` for Mac app UI reference.

---

## Legend

- ✅ Done (code exists and appears functional)
- 🟡 Partial (scaffolded but incomplete or needs review)
- ❌ Not started
- 🔧 Needs fix (broken or known issues)

---

## Chunk 0: Replit Setup
- ✅ Next.js 15 + App Router + TypeScript + Tailwind
- ✅ shadcn/ui components installed
- ✅ Dependencies installed (drizzle, next-auth, zustand, zod, stripe, aws-sdk, etc.)
- ✅ Folder structure created
- ✅ GitHub repo connected
- 🟡 Environment variables — Aaron setting up Replit Secrets now

## Chunk 1: TypeScript Types & Enums
- ✅ `src/types/enums.ts` (935 lines — comprehensive)
- ✅ `src/types/style.ts` (VisualStyle, NamedStyle, StyleDraft, etc.)
- ✅ `src/types/asset.ts` (Asset, AssetDraft, AssetAttributes union types)
- ✅ `src/types/camera.ts` (CameraParameters)
- ✅ `src/types/project.ts` (Project, Frame, Shot stubs)
- ✅ `src/types/generation.ts` (GenerationRequest/Response/Status)
- ✅ `src/lib/validation/schemas.ts` (Zod schemas)

## Chunk 2: Database Schema & Migrations
- ✅ `src/db/schema.ts` (304 lines)
- ✅ `src/db/index.ts` (Drizzle client)
- 🟡 Migrations — need to verify `drizzle-kit push` has run on Replit's Postgres

## Chunk 3: Authentication
- ✅ `src/lib/auth.ts` (NextAuth config)
- ✅ `src/app/api/auth/[...nextauth]/route.ts`
- ✅ `src/app/api/auth/register/route.ts`
- ✅ `src/app/(auth)/login/page.tsx` (email/password form)
- ✅ `src/app/(auth)/register/page.tsx` (registration form)
- ✅ `src/middleware.ts` (auth guard)
- ❌ Google OAuth (optional, can add later)
- 🔧 **Needs testing** — does login/register actually work end-to-end?

## Chunk 4: Dashboard & Project CRUD
- ✅ `src/app/(app)/dashboard/page.tsx` (240 lines — project list)
- ✅ `src/app/api/projects/route.ts` (GET list, POST create)
- ✅ `src/app/api/projects/[id]/route.ts` (GET, PUT, DELETE)
- ✅ `src/stores/project-store.ts`
- 🔧 **Needs testing** — create/edit/delete projects

## Chunk 5: Project Layout & Workflow Tabs
- ✅ `src/app/(app)/project/[id]/layout.tsx` (233 lines)
- ✅ `src/app/(app)/layout.tsx` (app shell)
- 🟡 Workflow tabs (Style | Assets | Frames | Shots) — need to verify navigation works
- ❌ Three-column resizable layout (per spec)

## Chunk 6: Cloudflare R2 Integration
- ✅ `src/lib/r2.ts` (161 lines — S3 client, upload/delete/presigned URLs)
- ✅ `src/app/api/media/upload/route.ts` (presigned URL generation)
- 🟡 `src/app/api/media/[key]/route.ts` (15 lines — may be a stub)
- 🔧 **Needs R2 env vars** to test

## Chunk 7: Gemini API Client & Prompt Templates
- ✅ `src/lib/gemini.ts` (88 lines)
- ✅ `src/lib/prompts/style-generation.ts`
- ✅ `src/lib/prompts/asset-generation.ts`
- ✅ `src/lib/prompts/compile-style.ts`
- 🔧 **Needs GOOGLE_GEMINI_API_KEY** to test
- 🟡 Prompts may need refinement vs. the detailed templates in `docs/planning/04-Prompt-Engineering.md`

## Chunk 8: Style Generation API Route
- ✅ `src/app/api/generate/style/route.ts` (273 lines)
- 🟡 Credit deduction integration
- 🔧 **Needs end-to-end testing** with Gemini

## Chunk 9: Style Definition UI
- ✅ `src/app/(app)/project/[id]/style/page.tsx` (836 lines — big file)
- ✅ `src/stores/style-store.ts` (316 lines)
- 🟡 Compare against `docs/screenshots/Style_Tab.png` for UI fidelity
- 🟡 Preset mode vs Advanced mode toggle
- 🟡 Draft history / navigation
- 🟡 Named styles list (right panel)

## Chunk 10: Asset Generation API Route
- ✅ `src/app/api/generate/asset/route.ts` (391 lines)
- 🟡 Credit deduction integration
- 🔧 **Needs end-to-end testing** with Gemini

## Chunk 11: Asset Library & Editor UI
- ✅ `src/app/(app)/project/[id]/assets/page.tsx` (190 lines — library)
- ✅ `src/app/(app)/project/[id]/assets/_components/asset-editor.tsx` (719 lines)
- ✅ `src/app/(app)/project/[id]/assets/(new)/[type]/page.tsx`
- ✅ `src/app/(app)/project/[id]/assets/[assetId]/page.tsx`
- ✅ `src/stores/asset-store.ts` (326 lines)
- 🟡 Compare against `docs/screenshots/AssetLibrary-CardView.png` and `CharacterAssetWindow.png`
- 🟡 Multi-turn refinement / conversation history

## Chunk 12: Stripe Billing Integration
- ✅ `src/lib/stripe.ts` (83 lines)
- ✅ `src/lib/billing.ts` (82 lines)
- ✅ `src/lib/credits.ts` (90 lines)
- ✅ `src/app/api/billing/checkout/route.ts`
- ✅ `src/app/api/billing/portal/route.ts`
- ✅ `src/app/api/billing/webhook/route.ts` (211 lines)
- ✅ `src/app/(app)/settings/_components/settings-client.tsx` (billing UI)
- 🔧 **Needs Stripe env vars** to test

---

## Not Yet Started (Phase 1 Stretch / Phase 2)

- ❌ Frames tab (composition, camera parameters, scene generation)
- ❌ Shots tab (narrative, shot sequence generation)
- ❌ SSE progress streaming for generation status
- ❌ Full media lightbox viewer
- ❌ BYOK (Bring Your Own Key) for Pro users
- ❌ Google OAuth login
- ❌ Landing / marketing page (currently minimal)
- ❌ Privacy Policy / Terms of Service pages (see `Website-Privacy-Terms-Update.md`)
- ❌ Mobile responsive polish

---

## Current Priority (Top to Bottom)

1. **Get env vars set in Replit** (Aaron doing now)
2. **Verify DB migrations ran** — `drizzle-kit push` on Replit
3. **Test auth flow** — register → login → dashboard
4. **Test project CRUD** — create, open, edit, delete
5. **Test style generation** — end-to-end with Gemini
6. **Test asset generation** — end-to-end with Gemini
7. **UI polish** — compare each view against Mac app screenshots
8. **Fix R2 media proxy** — the `[key]/route.ts` looks like a stub
9. **Stripe integration testing** — checkout, webhook, credit flow
10. **Landing page & legal pages**
