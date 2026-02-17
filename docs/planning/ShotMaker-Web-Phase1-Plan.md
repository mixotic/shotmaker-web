# ShotMaker Web — Phase 1 Implementation Plan

> **Goal:** Ship a working web app where users can sign up, create projects, define visual styles, generate AI assets (characters, objects, sets), browse draft history, and pay for credits. This covers the first two steps of the pipeline: **Style → Assets**.
>
> **Platform:** Replit (Next.js + PostgreSQL + one-click deploy)
>
> **Timeline estimate:** 8–12 weeks for a solo developer using Replit Agent to accelerate

---

## Tech Stack (Replit-Optimized)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | Replit has a native template; API routes handle backend |
| **Language** | TypeScript | Type safety mirrors the Swift models |
| **Database** | Replit PostgreSQL (Neon) | Zero config, `DATABASE_URL` auto-injected |
| **ORM** | Drizzle ORM | Lightweight, type-safe, great Neon/Postgres support |
| **Auth** | NextAuth.js v5 (Auth.js) | Free, self-hosted, supports email + Google OAuth |
| **UI Components** | shadcn/ui + Tailwind CSS | Maps directly to desktop app's component patterns |
| **State Management** | Zustand | Lightweight stores mirror the desktop ViewModels |
| **Object Storage** | Cloudflare R2 | S3-compatible, zero egress, use via `@aws-sdk/client-s3` |
| **Payments** | Stripe | Subscriptions + one-time credit packs |
| **AI API** | Google Gemini (server-side proxy) | Same provider as desktop app |
| **Real-time Updates** | Server-Sent Events (SSE) | Generation progress without WebSocket complexity |
| **Validation** | Zod | Schema validation for API inputs and project data |
| **Icons** | Lucide React | Equivalent to SF Symbols from the desktop app |

---

## Project Structure

```
shotmaker-web/
├── .replit                          # Replit config
├── replit.nix                       # Nix packages
├── .env                             # Secrets (DATABASE_URL auto-set by Replit)
├── drizzle.config.ts                # Drizzle ORM config
├── next.config.ts
├── tailwind.config.ts
├── package.json
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (providers, auth session)
│   │   ├── page.tsx                 # Landing / marketing page
│   │   │
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx           # Centered card layout
│   │   │
│   │   ├── (app)/                   # Authenticated app route group
│   │   │   ├── layout.tsx           # App shell (sidebar, header, auth guard)
│   │   │   ├── dashboard/page.tsx   # Project list (= Welcome View)
│   │   │   ├── settings/page.tsx    # Account, API keys, billing
│   │   │   │
│   │   │   └── project/[id]/        # Per-project routes
│   │   │       ├── layout.tsx       # Project layout (workflow tabs, toolbar)
│   │   │       ├── style/page.tsx   # Style Definition tab
│   │   │       ├── assets/
│   │   │       │   ├── page.tsx     # Asset Library
│   │   │       │   ├── new/[type]/page.tsx  # Asset creation (type = character|object|set)
│   │   │       │   └── [assetId]/page.tsx   # Asset editing
│   │   │       ├── frames/          # Phase 2
│   │   │       └── shots/           # Phase 2
│   │   │
│   │   └── api/                     # API Routes (server-side)
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── projects/
│   │       │   ├── route.ts         # GET (list), POST (create)
│   │       │   └── [id]/route.ts    # GET, PUT, DELETE
│   │       ├── generate/
│   │       │   ├── style/route.ts   # Style example generation
│   │       │   ├── asset/route.ts   # Asset generation
│   │       │   └── status/[jobId]/route.ts  # SSE progress
│   │       ├── media/
│   │       │   ├── upload/route.ts  # Presigned URL generation
│   │       │   └── [key]/route.ts   # Proxy or redirect to R2
│   │       ├── credits/
│   │       │   └── route.ts         # GET balance, POST purchase
│   │       ├── billing/
│   │       │   ├── webhook/route.ts # Stripe webhook
│   │       │   └── portal/route.ts  # Stripe customer portal redirect
│   │       └── api-keys/
│   │           └── route.ts         # BYOK management (Pro+)
│   │
│   ├── db/                          # Database layer
│   │   ├── index.ts                 # Drizzle client init
│   │   ├── schema.ts                # All table definitions
│   │   └── migrations/              # Drizzle migrations
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── stripe.ts                # Stripe client + helpers
│   │   ├── r2.ts                    # Cloudflare R2 client
│   │   ├── gemini.ts                # Google Gemini API client
│   │   ├── credits.ts               # Credit check/deduct logic
│   │   ├── prompts/                 # Prompt templates (from desktop app)
│   │   │   ├── style-generation.ts
│   │   │   ├── asset-generation.ts
│   │   │   └── compile-style.ts     # Style value compilation
│   │   └── validation/
│   │       ├── project.ts           # Zod schemas for project data
│   │       ├── style.ts             # Zod schemas for style params
│   │       └── asset.ts             # Zod schemas for asset params
│   │
│   ├── stores/                      # Zustand stores (= ViewModels)
│   │   ├── project-store.ts         # Project list + active project
│   │   ├── style-store.ts           # Style editing state
│   │   ├── asset-store.ts           # Asset creation/editing state
│   │   └── ui-store.ts              # Global UI state (modals, notifications)
│   │
│   ├── components/                  # React components
│   │   ├── ui/                      # shadcn/ui primitives (auto-generated)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Main app layout wrapper
│   │   │   ├── WorkflowTabs.tsx     # Style | Assets | Frames | Shots tabs
│   │   │   ├── ProjectToolbar.tsx   # Project name, save status, credits
│   │   │   └── ThreeColumnLayout.tsx # Resizable 3-panel layout
│   │   ├── dashboard/
│   │   │   ├── ProjectList.tsx      # Project cards grid
│   │   │   ├── ProjectCard.tsx      # Individual project card
│   │   │   └── NewProjectDialog.tsx # Create project modal
│   │   ├── style/
│   │   │   ├── StyleEditor.tsx      # Main 3-column style editor
│   │   │   ├── StyleParametersPanel.tsx  # Left column: all style controls
│   │   │   ├── StylePreviewArea.tsx      # Center: preview grid + sheet
│   │   │   ├── StyleListPanel.tsx        # Right top: named styles list
│   │   │   ├── DraftHistoryPanel.tsx     # Right bottom: draft history
│   │   │   ├── QuickStylePresets.tsx     # 15 preset buttons grid
│   │   │   ├── ModelSelector.tsx         # AI model picker
│   │   │   └── StyleSelector.tsx         # Style picker dropdown
│   │   ├── asset/
│   │   │   ├── AssetLibrary.tsx          # Asset grid with type filters
│   │   │   ├── AssetCard.tsx             # Library card (thumbnail + name)
│   │   │   ├── AssetEditor.tsx           # 3-column asset editor
│   │   │   ├── AssetParametersPanel.tsx  # Left: type-specific attributes
│   │   │   ├── AssetPreviewArea.tsx      # Center: generated images
│   │   │   ├── AssetDraftHistory.tsx     # Right: draft history
│   │   │   └── AssetAttributesEditor.tsx # Dynamic attribute fields
│   │   ├── shared/
│   │   │   ├── GenerateButton.tsx        # Generate/cancel with progress
│   │   │   ├── DraftNavigation.tsx       # Prev/next/primary controls
│   │   │   ├── RefinementPanel.tsx       # Multi-turn refinement input
│   │   │   ├── PreviewGrid.tsx           # Responsive image grid
│   │   │   ├── ImageCard.tsx             # Clickable image with overlay
│   │   │   ├── MediaLightbox.tsx         # Full-size media viewer
│   │   │   ├── NotificationBanner.tsx    # Toast notifications
│   │   │   ├── CreditsBadge.tsx          # Credits display in header
│   │   │   └── EmptyState.tsx            # Reusable empty state
│   │   └── billing/
│   │       ├── PricingCards.tsx           # Plan selection
│   │       ├── CreditBalance.tsx         # Current balance + buy more
│   │       └── UsageHistory.tsx          # Generation log
│   │
│   └── types/                       # TypeScript types (= Swift models)
│       ├── project.ts               # Project, NamedStyle, VisualStyle
│       ├── asset.ts                 # Asset, AssetDraft, AssetReference
│       ├── style.ts                 # StyleDraft, StyleReference, StyleParameters
│       ├── camera.ts                # CameraParameters, enums
│       ├── generation.ts            # Generation request/response types
│       └── enums.ts                 # All enum types (from A1-Enum-Reference)
```

---

## Database Schema

```sql
-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  avatar_url      TEXT,
  plan            TEXT NOT NULL DEFAULT 'free',          -- free | starter | pro | team
  credits         INTEGER NOT NULL DEFAULT 50,           -- current credit balance
  storage_used    BIGINT NOT NULL DEFAULT 0,             -- bytes
  storage_limit   BIGINT NOT NULL DEFAULT 524288000,     -- 500MB default (free tier)
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NextAuth.js required tables (accounts, sessions, verification_tokens)
-- These are auto-created by the Drizzle adapter

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  project_data    JSONB NOT NULL DEFAULT '{}',           -- Full project model (styles, assets, etc.)
  storage_used    BIGINT NOT NULL DEFAULT 0,             -- bytes used by this project's media
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user ON projects(user_id);

-- ============================================================
-- MEDIA FILES (tracks every file in R2)
-- ============================================================

CREATE TABLE media_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,                         -- style | asset | frame | shot
  entity_id       UUID NOT NULL,                         -- ID of the style/asset/frame/shot
  draft_index     INTEGER NOT NULL DEFAULT 0,
  image_index     INTEGER NOT NULL DEFAULT 0,            -- For multi-image drafts (asset turnarounds)
  r2_key          TEXT NOT NULL,                         -- Full R2 object key
  file_type       TEXT NOT NULL,                         -- png | mp4 | jpg
  size_bytes      BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_project ON media_files(project_id);
CREATE INDEX idx_media_entity ON media_files(entity_type, entity_id);

-- ============================================================
-- GENERATION LOG (for billing, analytics, debugging)
-- ============================================================

CREATE TABLE generation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,                         -- style | asset | frame | shot
  entity_id       UUID,
  generation_type TEXT NOT NULL,                         -- initial | refinement | extend
  model           TEXT NOT NULL,                         -- e.g. "gemini-2.0-flash-exp"
  credits_used    INTEGER NOT NULL,
  prompt_hash     TEXT,                                  -- For debugging, not the full prompt
  status          TEXT NOT NULL DEFAULT 'pending',       -- pending | completed | failed | cancelled
  error_message   TEXT,
  duration_ms     INTEGER,                               -- Time from request to completion
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_genlog_user ON generation_log(user_id);
CREATE INDEX idx_genlog_created ON generation_log(created_at);

-- ============================================================
-- API KEYS (for BYOK — Pro+ only)
-- ============================================================

CREATE TABLE user_api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL DEFAULT 'google',        -- google | stability | runway
  encrypted_key   TEXT NOT NULL,                         -- AES-256 encrypted
  key_hint        TEXT,                                  -- Last 4 chars for display
  is_valid        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_apikeys_user_provider ON user_api_keys(user_id, provider);

-- ============================================================
-- CREDIT TRANSACTIONS (audit trail)
-- ============================================================

CREATE TABLE credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL,                      -- positive = add, negative = deduct
  reason          TEXT NOT NULL,                         -- subscription_renewal | purchase | generation | refund
  reference_id    TEXT,                                  -- Stripe payment ID or generation_log ID
  balance_after   INTEGER NOT NULL,                      -- Running balance for audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credits_user ON credit_transactions(user_id);
```

---

## Implementation Steps (In Order)

### Step 1: Project Scaffolding

**What to build:**
- Create Next.js 15 project on Replit using the template
- Install core dependencies
- Configure Tailwind CSS + shadcn/ui
- Set up TypeScript path aliases
- Create the file/folder structure above

**Key commands for Replit:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npx shadcn@latest init
npm install drizzle-orm postgres zustand zod lucide-react
npm install -D drizzle-kit @types/node
```

**Install shadcn components you'll need immediately:**
```bash
npx shadcn@latest add button card dialog dropdown-menu input label select separator
npx shadcn@latest add tabs textarea toast avatar badge form popover sheet
npx shadcn@latest add scroll-area slider switch toggle-group tooltip alert
npx shadcn@latest add resizable command context-menu
```

**Replit secrets to configure:**
```
DATABASE_URL          → Auto-set by Replit PostgreSQL
NEXTAUTH_SECRET       → Generate: openssl rand -base64 32
NEXTAUTH_URL          → Your Replit app URL
GOOGLE_GEMINI_API_KEY → Your platform Gemini key
R2_ACCOUNT_ID         → Cloudflare account ID
R2_ACCESS_KEY_ID      → R2 API token
R2_SECRET_ACCESS_KEY  → R2 API token secret
R2_BUCKET_NAME        → e.g. "shotmaker-media"
R2_PUBLIC_URL         → Your R2 public bucket URL or custom domain
STRIPE_SECRET_KEY     → Stripe secret key
STRIPE_WEBHOOK_SECRET → Stripe webhook signing secret
STRIPE_PUBLISHABLE_KEY → Stripe publishable key
ENCRYPTION_KEY        → For BYOK key encryption: openssl rand -base64 32
```

---

### Step 2: Database + ORM Setup

**What to build:**
- Drizzle schema matching the SQL above
- Database client initialization
- Migration system
- Seed script for development

**Key file — `src/db/schema.ts`:**

Define all tables using Drizzle's `pgTable()`. The `project_data` column uses `jsonb` type and stores the full project model (styles, assets, frames, shots). This mirrors the desktop app's `project.json` — the entire project is a single JSON document, with relational tables wrapping it for user ownership, billing, and media tracking.

**Key decision: JSONB for project data.** The desktop app serializes the entire project as one JSON file. We replicate this by storing the project model in a JSONB column. This means:
- Style/asset/frame/shot CRUD operates on the JSONB document (read → modify → write back)
- No need for separate relational tables for every nested entity
- Schema matches 1:1 with the desktop app's data models
- Queries that need to filter by project attributes can use JSONB operators
- Trade-off: no foreign keys on nested entities, but the project is the unit of consistency anyway

---

### Step 3: Authentication

**What to build:**
- NextAuth.js v5 with Drizzle adapter
- Email/password registration (credentials provider)
- Google OAuth (optional, reuses same Google Cloud project)
- Session management
- Auth guard middleware for `/app/*` routes
- Login and registration pages

**Key file — `src/lib/auth.ts`:**
- Configure NextAuth with the Drizzle PostgreSQL adapter
- Add `CredentialsProvider` for email/password (hash with bcrypt)
- Add `GoogleProvider` for OAuth login
- Include `user.plan` and `user.credits` in the session JWT for client-side access

**Pages:**
- `/login` — Email + password form, "Sign in with Google" button, link to register
- `/register` — Name, email, password form, "Sign up with Google" button
- Both use a centered card layout with the ShotMaker logo

---

### Step 4: Dashboard (Project List)

**What to build:**
- Dashboard page showing all user projects
- New project creation dialog
- Project deletion with confirmation
- Project card showing name, last modified, asset count

**This is the web equivalent of the desktop app's Welcome View / `WelcomeView`.**

**Route:** `/dashboard`

**Components:**
- `ProjectList` — Grid of `ProjectCard` components
- `ProjectCard` — Name, description preview, last modified date, asset count, thumbnail (first style example or placeholder)
- `NewProjectDialog` — Modal with name + optional description fields
- Empty state when no projects exist ("Create your first project")

**API routes:**
- `GET /api/projects` — List all projects for the authenticated user
- `POST /api/projects` — Create a new project (initializes empty `project_data` JSONB)
- `DELETE /api/projects/[id]` — Delete project + cascade media cleanup from R2

---

### Step 5: Project Layout + Workflow Tabs

**What to build:**
- Project layout with workflow tab navigation
- Project toolbar (name, save status, credits badge)
- Tab routing: Style | Assets | Frames (disabled) | Shots (disabled)
- Auto-save with debounce (mirrors desktop's `SaveDebouncing`)

**Route:** `/project/[id]/layout.tsx`

**This is the web equivalent of `ProjectWindow` + `WorkflowNavigation`.**

The layout loads the project from the database, hydrates the Zustand project store, and renders:
```
┌──────────────────────────────────────────────────────┐
│  ProjectToolbar: [ShotMaker] Project Name ▼  [💎 847]│
├──────────────────────────────────────────────────────┤
│  WorkflowTabs: [Style] [Assets] [Frames🔒] [Shots🔒]│
├──────────────────────────────────────────────────────┤
│  {children}  ← Tab content rendered by nested routes │
└──────────────────────────────────────────────────────┘
```

**Zustand store — `project-store.ts`:**
```typescript
interface ProjectStore {
  // State
  project: Project | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // Actions
  loadProject: (id: string) => Promise<void>;
  updateProject: (updates: Partial<Project>) => void;
  saveProject: () => Promise<void>;
  
  // Style helpers (mirrors ProjectViewModel)
  addStyle: (style: NamedStyle) => void;
  updateStyle: (styleId: string, updates: Partial<NamedStyle>) => void;
  deleteStyle: (styleId: string) => void;
  setDefaultStyle: (styleId: string) => void;

  // Asset helpers
  addAsset: (asset: Asset) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  deleteAsset: (assetId: string) => void;
}
```

**Auto-save:** Use a `useEffect` with a debounced save (1 second delay after last change, same as desktop). The toolbar shows "Saving..." → "Saved ✓" status.

---

### Step 6: TypeScript Types (Port from Swift Models)

**What to build:**
- All data model types from `02-Data-Models.md`
- All enum types from `A1-Enum-Reference.md`
- Zod validation schemas matching each type

**Port these models (Phase 1 scope only):**

| Swift Model | TypeScript File | Notes |
|------------|----------------|-------|
| `Project` | `types/project.ts` | Omit `defaultVideoProvider` for now |
| `NamedStyle` | `types/style.ts` | Direct port |
| `VisualStyle` | `types/style.ts` | All properties including preset/manual modes |
| `StyleDraft` | `types/style.ts` | |
| `StyleReference` | `types/style.ts` | |
| `StyleParameters` | `types/style.ts` | |
| `Asset` | `types/asset.ts` | |
| `AssetDraft` | `types/asset.ts` | |
| `AssetReference` | `types/asset.ts` | |
| `AssetAttributes` | `types/asset.ts` | Per-type attribute sets |
| `CameraParameters` | `types/camera.ts` | Used by assets |
| `ConversationHistory` | `types/project.ts` | For refinement |
| `Medium`, `FilmFormat`, `FilmGrain`, `DepthOfField` | `types/enums.ts` | String enums |
| `AssetType` | `types/enums.ts` | character, object, set |
| `ImageAspectRatio` | `types/enums.ts` | |
| All camera enums | `types/enums.ts` | ShotAngle, Perspective, etc. |
| `StyleParameterOptions` | `types/enums.ts` | Preset dropdown values |

**Example — VisualStyle in TypeScript:**
```typescript
export interface VisualStyle {
  medium: Medium | null;
  filmFormat: FilmFormat | null;
  filmGrain: FilmGrain | null;
  depthOfField: DepthOfField | null;
  lighting: string;
  colorPalette: string;
  aesthetic: string;
  atmosphere: string;
  mood: string;
  motion: string;
  texture: string;
  detailLevel: number;
  customPrompt: string;
  isAdvancedMode: boolean;
  // Preset mode storage
  presetLighting: string | null;
  presetColorPalette: string | null;
  // ... etc (all 7 preset + 7 manual fields)
  // Draft/reference system
  reference: StyleReference | null;
  currentDraft: StyleDraft | null;
  draftHistory: StyleDraft[];
  appliedDraftId: string | null;
  aspectRatio: ImageAspectRatio | null;
}
```

---

### Step 7: Cloudflare R2 Integration

**What to build:**
- R2 client using `@aws-sdk/client-s3`
- Presigned URL generation for uploads
- Media URL resolution (R2 key → public CDN URL)
- Storage tracking (update `media_files` table + user/project byte counts)
- Cleanup helper for orphaned files

**Key file — `src/lib/r2.ts`:**
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Key format: {userId}/{projectId}/{entityType}/{entityId}/draft-{index}-{imageIndex}.png
```

**R2 bucket setup (do this once in Cloudflare dashboard):**
1. Create bucket `shotmaker-media`
2. Enable public access via custom domain or R2.dev subdomain
3. Create API token with read/write permissions
4. Add CORS rules allowing your Replit domain

---

### Step 8: Gemini API Proxy

**What to build:**
- Server-side Gemini client (`src/lib/gemini.ts`)
- Style generation endpoint (`/api/generate/style`)
- Asset generation endpoint (`/api/generate/asset`)
- Credit check middleware (reject if insufficient credits)
- Prompt templates ported from desktop app

**This is the most complex step. The desktop app's prompt engineering (Doc 04) and generation workflows (Doc 08) are the blueprint.**

**Key file — `src/lib/gemini.ts`:**
```typescript
export async function generateImage(params: {
  prompt: string;
  model: string;
  apiKey: string;         // Platform key or user's BYOK key
  referenceImages?: Buffer[];
  aspectRatio?: string;
}): Promise<Buffer[]> {
  // POST to https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
  // Parse response, extract image data
  // Return array of image buffers
}
```

**Style generation flow (`/api/generate/style`):**
1. Authenticate user from session
2. Check credits (15 credits for style generation)
3. Load project from DB
4. Compile style values using `compileStyleValues()` (port from `StyleSheetService`)
5. Build 3 prompts (character, object, environment) using JSON templates
6. Call Gemini 3 times in parallel (Promise.all)
7. Upload 3 result images to R2
8. Create `StyleDraft` object with R2 media URLs
9. Update project_data JSONB (append to draftHistory)
10. Deduct credits, log generation
11. Return draft data + media URLs to client

**Asset generation flow (`/api/generate/asset`):**
1. Same auth + credit check (8 credits for character/object, 5 for set)
2. Load project, resolve the active style
3. Build asset prompt using the style sheet + asset attributes
4. For characters/objects: request multi-angle turnaround grid
5. For sets: request single environment image
6. Call Gemini
7. Upload results to R2
8. Create `AssetDraft`, update project_data
9. Deduct credits, log, return

**Prompt templates:** Port the JSON prompt templates from `A2-Prompt-Templates-Verbatim.md` into `src/lib/prompts/`. These are the exact templates the desktop app uses, parameterized with style values.

---

### Step 9: Style Definition UI

**What to build:**
- Full Style Definition tab (= desktop's `StyleDefinitionView`)
- 3-column resizable layout
- All parameter controls (medium, film format, lighting, etc.)
- Preset vs Manual mode toggle
- Quick Style presets (15 buttons)
- Model selector
- Generate button with progress
- Preview grid (3 images: character, object, set)
- Draft history panel
- Style list panel (multiple named styles)
- Apply / Save as New / Set as Default actions

**Route:** `/project/[id]/style`

**Zustand store — `style-store.ts`:**
```typescript
interface StyleStore {
  // Current editing state
  currentStyleId: string | null;
  currentStyle: VisualStyle;
  selectedModel: string;
  
  // Generation
  isGenerating: boolean;
  generationProgress: string;
  previewImages: { character: string | null; object: string | null; set: string | null };
  
  // Draft navigation
  currentDraftIndex: number;
  
  // Actions
  setParameter: (key: keyof VisualStyle, value: any) => void;
  applyPreset: (presetName: string) => void;
  toggleMode: () => void;
  generateStyleExamples: () => Promise<void>;
  navigateDraft: (direction: 'prev' | 'next') => void;
  applyDraft: () => void;
  saveDraftAsReference: () => void;
}
```

**Component breakdown:**

`StyleParametersPanel` (left column):
- ModelSelector dropdown (Gemini model list)
- "Camera Styles" card: aspect ratio picker, medium dropdown, film grain toggle, DoF toggle
- Mode toggle: "Preset" / "Manual" segmented control
- In Preset mode: QuickStylePresets (3-col grid of 15 style buttons)
- In Manual mode: 7 text fields (lighting, color palette, aesthetic, atmosphere, mood, motion, texture)
- Custom prompt textarea
- GenerateButton at bottom

`StylePreviewArea` (center column):
- PreviewGrid showing 3 images in a row (character | object | set)
- Click image → open in MediaLightbox
- Below: style sheet text (if generated)
- Action buttons: Apply, Save as New, Set as Default

`StyleListPanel + DraftHistoryPanel` (right column):
- Top section: list of named styles with star (default) indicator
- Resizable divider
- Bottom section: scrollable draft history with thumbnail composites

---

### Step 10: Asset Creation UI

**What to build:**
- Asset Library view (grid of all assets with type filters)
- Asset Editor (3-column layout for create + edit)
- Type-specific attribute controls (character, object, set)
- Style selector (pick which named style to use)
- Reference image selection (pick from style examples or previous assets)
- Generate button with progress
- Draft history + navigation
- Save to Library / Set as Primary actions
- Refinement panel (multi-turn conversation)

**Routes:**
- `/project/[id]/assets` — Asset Library
- `/project/[id]/assets/new/[type]` — New asset (type = character | object | set)
- `/project/[id]/assets/[assetId]` — Edit existing asset

**Asset Library page:**
- Filter tabs or buttons: All | Characters | Objects | Sets
- Grid of AssetCards (thumbnail, name, type badge, draft count)
- "New Character" / "New Object" / "New Set" buttons
- Click card → navigate to edit page

**Asset Editor (3-column):**

Left — `AssetParametersPanel`:
- Asset name text field
- Style selector dropdown (which named style to apply)
- Model selector
- Type-specific attributes (from `AssetAttributesEditor`):
  - **Character:** age, gender, build, hair, clothing, distinguishing features, pose
  - **Object:** material, size, condition, distinguishing features
  - **Set:** location type, time of day, weather, architecture style, key elements
- Asset description textarea
- Reference image section (select from library or upload)
- GenerateButton

Center — `AssetPreviewArea`:
- For characters/objects: multi-angle turnaround grid
- For sets: single large environment image
- DraftNavigation (prev/next/primary controls)
- Refinement input below

Right — `AssetDraftHistory`:
- Scrollable list of draft thumbnails
- Primary badge indicator
- Click to load draft into preview

---

### Step 11: Credits + Billing

**What to build:**
- Stripe product/price setup (4 plans + 3 credit packs)
- Checkout flow for subscriptions
- Credit pack purchase (one-time payments)
- Stripe webhook handler (subscription events, payment events)
- Customer portal link (manage subscription)
- Credit balance display in header
- Credit deduction on generation
- Monthly credit renewal on subscription billing

**Stripe setup (do once in Stripe dashboard):**

Products to create:
- ShotMaker Free (no Stripe product needed)
- ShotMaker Starter: $15/month or $144/year, includes 500 credits/month
- ShotMaker Pro: $35/month or $336/year, includes 2,000 credits/month  
- Credit Pack: Small ($10 / 500 credits), Medium ($25 / 1,500 credits), Large ($50 / 3,500 credits)

**Webhook events to handle:**
- `checkout.session.completed` — Activate subscription, set plan + credits
- `invoice.paid` — Monthly renewal: reset credits to plan amount
- `customer.subscription.updated` — Plan change: update plan + credits
- `customer.subscription.deleted` — Downgrade to free, reduce limits

**Credit flow:**
```
User clicks Generate
  → Client calls POST /api/generate/style
    → Server checks: user.credits >= 15?
      → YES: proceed with generation, deduct credits atomically
      → NO: return 402 with { error: "Insufficient credits", required: 15, available: N }
    → Client shows "Not enough credits" dialog with "Buy Credits" button
```

---

### Step 12: Settings Page

**What to build:**
- Account info (name, email, avatar)
- Current plan display + upgrade button
- Credit balance + purchase history
- API key management (BYOK for Pro+)
- Billing portal link (Stripe)

**Route:** `/settings`

Sections:
- **Account** — Edit name, email (read-only if OAuth), avatar
- **Plan & Billing** — Current plan badge, credits remaining, "Manage Subscription" → Stripe portal, "Buy Credits" → credit pack checkout
- **API Keys (Pro+)** — For users who want to bring their own Google API key. Encrypted storage, show only last 4 characters, test connection button
- **Usage** — Recent generation log (last 50 entries with type, credits, timestamp)

---

## What's Explicitly NOT in Phase 1

These are deferred to Phase 2+:
- Frame composition (Frames tab)
- Shot video generation (Shots tab) and Veo integration
- Video extension and ReFrame
- Style extraction from uploaded images
- Google Drive export
- Team workspaces
- Real-time collaboration
- Project import/export
- Template/style sharing
- Mobile responsive layout (desktop-first for Phase 1)

---

## Environment Setup Checklist

Before starting to build, set up these external services:

1. **Cloudflare R2**
   - Create Cloudflare account
   - Create R2 bucket `shotmaker-media`
   - Create API token (Object Read & Write)
   - Enable public access or custom domain
   - Configure CORS for your Replit domain

2. **Stripe**
   - Create Stripe account
   - Create products and prices (4 plans + 3 credit packs)
   - Set up webhook endpoint pointing to `/api/billing/webhook`
   - Note all API keys

3. **Google Cloud (for Gemini)**
   - Create project or use existing ShotMaker project
   - Enable Generative Language API
   - Create API key for platform use
   - Note: this is YOUR platform key, not the user's

4. **Replit**
   - Create new Repl from Next.js template
   - Provision PostgreSQL database
   - Add all secrets listed above
   - Configure custom domain (optional)

---

## Replit Agent Prompting Strategy

When using Replit Agent to build this, feed it in chunks. Here's the suggested order of prompts:

1. **"Set up a Next.js 15 app with TypeScript, Tailwind, shadcn/ui, Drizzle ORM connected to the PostgreSQL database, and NextAuth.js v5 for authentication with email/password and Google OAuth."**

2. **"Create the database schema for a SaaS app with users, projects (with a JSONB project_data column), media_files, generation_log, credit_transactions, and user_api_keys tables. Here's the SQL..."** [paste the schema above]

3. **"Build a dashboard page at /dashboard that shows a grid of project cards with create/delete functionality. The project list should come from the API."**

4. **"Create a project layout at /project/[id] with a 4-tab workflow navigation (Style, Assets, Frames, Shots) where Frames and Shots tabs are disabled with a 'Coming Soon' tooltip."**

5. **"Build the Style Definition tab..."** [provide the component breakdown from Step 9 with the desktop app's parameter lists]

6. Continue with each subsequent step...

Give the agent the TypeScript types and Zod schemas as context when building UI components — it'll generate much better forms and validation that way.
