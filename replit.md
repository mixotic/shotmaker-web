# ShotMaker Web

## Overview

ShotMaker is an AI-powered storyboard generator web application. Users create projects, define visual styles, generate character/object/set assets using AI image generation (Google Gemini), compose frames and shots, and manage everything through a credits-based billing system powered by Stripe. The app is built with Next.js 15 (App Router), uses PostgreSQL via Drizzle ORM, stores media on Cloudflare R2, and authenticates users with NextAuth.js v5.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: Next.js 15 with App Router and Turbopack for dev
- **Language**: TypeScript with strict mode
- **UI Library**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming; dark mode is the default
- **State Management**: Zustand stores for client-side state (`project-store`, `style-store`, `asset-store`)
- **Forms**: React Hook Form with Zod resolvers for validation
- **Layout**: Two main route groups — `(auth)` for login/register and `(app)` for the authenticated dashboard, project editor, and settings

### Route Structure

- `/` — redirects to `/dashboard`
- `/login`, `/register` — auth pages (redirect to dashboard if already logged in)
- `/dashboard` — project list, create/delete projects
- `/project/[id]/style` — visual style editor with AI generation
- `/project/[id]/assets` — asset library (characters, objects, sets)
- `/project/[id]/assets/[assetId]` — individual asset editor with AI refinement
- `/settings` — billing, plan management, credit history

### Backend / API

- **API Routes** live under `src/app/api/` using Next.js Route Handlers
- Key endpoints:
  - `POST /api/auth/register` — user registration with bcrypt password hashing
  - `GET/POST /api/projects` — list and create projects
  - `GET/PUT/DELETE /api/projects/[id]` — individual project CRUD
  - `POST /api/generate/style` — AI style preview generation
  - `POST /api/generate/asset` — AI asset generation and refinement
  - `POST /api/media/upload` — presigned URL generation for direct R2 uploads
  - `POST /api/billing/checkout` — Stripe Checkout session creation
  - `POST /api/billing/portal` — Stripe Customer Portal
  - `POST /api/billing/webhook` — Stripe webhook handler

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Driver**: `postgres` (postgres.js)
- **Schema** defined in `src/db/schema.ts` with tables for:
  - `users` — with plan, credits, storage limits, Stripe IDs
  - `accounts`, `sessions`, `verification_tokens` — NextAuth adapter tables
  - `projects` — with JSONB `projectData` column storing styles, assets, frames, shots
  - `media_files` — metadata for R2-stored files
  - `credit_transactions` — audit log for credit changes
  - `generation_log` — records of AI generation requests
  - `user_api_keys` — user-provided API keys (e.g., for Gemini)
- **Migrations**: Generated via `drizzle-kit generate`, pushed via `drizzle-kit push`
- **Connection**: Uses `DATABASE_URL` environment variable

### Authentication

- **NextAuth.js v5** (beta) with Drizzle adapter
- **Strategy**: JWT sessions with Credentials provider (email + password)
- **Password hashing**: bcryptjs
- **Middleware** (`src/middleware.ts`) protects `/dashboard`, `/project`, `/settings` routes and redirects authenticated users away from auth pages
- Custom JWT/session callbacks extend the token with `id`, `plan`, and `credits`

### Project Data Model

Projects use a JSONB column (`projectData`) to store the full project structure including:
- **Styles** (`NamedStyle[]`) — visual style definitions with parameters, drafts, and reference images
- **Assets** (`Asset[]`) — characters, objects, and sets with draft history and conversation history
- **Frames** and **Shots** — storyboard composition elements

This denormalized approach keeps the project portable and simplifies reads, with the trade-off of larger writes.

### AI Generation

- **Provider**: Google Gemini API v1beta (`generativelanguage.googleapis.com/v1beta`)
- **Integration**: `src/lib/gemini.ts` handles three API patterns:
  - `generateContent` — Gemini 2.0 Flash Image, Nano Banana 2.5 Flash, Nano Banana 3 Pro
  - `predict` — Imagen 4, Imagen 4 Ultra, Imagen 4 Fast
  - `predictLongRunning` — Veo 2, Veo 3/3 Fast, Veo 3.1/3.1 Fast (async polling for video)
- **Image Models**: Defined in `IMAGE_MODELS` array in `src/lib/gemini.ts`; default is `gemini-2.5-flash-image` (Nano Banana 2.5 Flash)
- **Video Models**: Defined in `VIDEO_MODELS` array in `src/lib/gemini.ts`; async generation with operation polling. Includes capability metadata (supportsFirstFrame, supportsLastFrame, supportsReferenceImages, supportsExtension)
- **Veo API Format**: Uses Vertex AI request format (`bytesBase64Encoded`, NOT `inlineData`) with `instances` + `parameters` structure. Auth via `x-goog-api-key` header. `lastFrame` at instance level (no nested `image` wrapper). Reference images use `{ referenceType: "asset", image: {...} }`. See `https://ideafactory.ltd/guides/veo-api` for complete format reference.
- **Veo Model IDs**: Use `-preview` suffix for Veo 3.1 models (Gemini API), `-001` for Veo 2/3.0
- **Prompt Engineering**: Structured prompt builders in `src/lib/prompts/` for style previews, asset turnaround sheets, and refinements
- **Credit System**: Each generation type has a defined cost (style: 15, character/object: 8, set: 5, refinement: 5)
- **API Key Resolution**: Falls back from user-provided keys to `GOOGLE_GEMINI_API_KEY` env var
- **Model Validation**: `isValidImageModel()` / `isValidVideoModel()` helpers prevent invalid model IDs reaching the API

### Media Storage

- **Cloudflare R2** via AWS S3-compatible SDK
- **Upload flow**: Server generates presigned URLs; client uploads directly to R2
- **URL resolution**: Public URL constructed from `R2_PUBLIC_URL` + key
- **Next.js Image config**: Allows `*.r2.dev` and `*.r2.cloudflarestorage.com` domains

### Credits & Billing

- **Credit system**: Users have a credit balance deducted per generation
- **Plans**: Free (50 credits/mo), Starter ($15/mo, 200 credits), Pro ($35/mo, 600 credits)
- **Credit packs**: One-time purchasable credit bundles
- **Stripe integration**: Checkout sessions for subscriptions and one-time payments, Customer Portal for management, webhook for fulfillment
- **Transaction log**: All credit changes are recorded in `credit_transactions`

## External Dependencies

### Required Services

| Service | Purpose | Environment Variables |
|---|---|---|
| **PostgreSQL** | Primary database | `DATABASE_URL` |
| **Cloudflare R2** | Media/image storage | `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` |
| **Google Gemini** | AI image generation | `GOOGLE_GEMINI_API_KEY` |
| **Stripe** | Payments & subscriptions | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_STARTER`, `NEXT_PUBLIC_STRIPE_PRICE_PRO` |

### Auth Configuration

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | JWT encryption secret |
| `NEXTAUTH_URL` | Canonical app URL |
| `NEXT_PUBLIC_APP_URL` | Client-side app URL |

### Key NPM Packages

- `next` 15.1.3, `react` 19
- `drizzle-orm` + `postgres` (postgres.js driver)
- `next-auth` v5 beta with `@auth/drizzle-adapter`
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- `stripe` + `@stripe/stripe-js`
- `zustand` for state management
- `zod` for runtime validation
- `bcryptjs` for password hashing
- `react-hook-form` + `@hookform/resolvers`
- `react-resizable-panels` for split-pane layouts
- shadcn/ui component ecosystem (Radix UI + CVA + tailwind-merge)