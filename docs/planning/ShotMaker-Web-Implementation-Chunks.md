# ShotMaker Web — Chunked Implementation Prompts

> **Workflow:** Replit creates the repo + database → Push to GitHub → Claude Code handles development → Push back → Replit auto-deploys
>
> Each chunk below is a self-contained task with clear inputs, outputs, and a way to verify it works before moving on.

---

## Chunk 0: Replit Setup (Do This in Replit)

**Prompt for Replit Agent:**

```
Create a Next.js 15 project with the App Router, TypeScript, and Tailwind CSS. 
Set up the following:

1. Initialize shadcn/ui with the "new-york" style and slate base color
2. Install these dependencies:
   - drizzle-orm, postgres, drizzle-kit (database)
   - next-auth@beta @auth/drizzle-adapter (authentication)
   - zustand (state management)
   - zod (validation)
   - lucide-react (icons)
   - @aws-sdk/client-s3, @aws-sdk/s3-request-presigner (R2 storage)
   - stripe, @stripe/stripe-js (payments)
   - bcryptjs, @types/bcryptjs (password hashing)
   - uuid, @types/uuid

3. Add these shadcn/ui components:
   button, card, dialog, dropdown-menu, input, label, select, separator,
   tabs, textarea, toast, avatar, badge, form, popover, sheet,
   scroll-area, slider, switch, toggle-group, tooltip, alert, resizable

4. Set up a PostgreSQL database and connect Drizzle ORM to it using DATABASE_URL
5. Create a drizzle.config.ts pointing to src/db/schema.ts
6. Create an empty src/db/schema.ts and src/db/index.ts

7. Create this folder structure (empty files are fine):
   src/app/(auth)/login/page.tsx
   src/app/(auth)/register/page.tsx
   src/app/(app)/dashboard/page.tsx
   src/app/(app)/settings/page.tsx
   src/app/(app)/project/[id]/layout.tsx
   src/app/(app)/project/[id]/style/page.tsx
   src/app/(app)/project/[id]/assets/page.tsx
   src/lib/auth.ts
   src/lib/stripe.ts
   src/lib/r2.ts
   src/lib/gemini.ts
   src/lib/credits.ts
   src/types/project.ts
   src/types/style.ts
   src/types/asset.ts
   src/types/enums.ts
   src/types/camera.ts
   src/types/generation.ts
   src/stores/project-store.ts
   src/stores/style-store.ts
   src/stores/asset-store.ts
   src/stores/ui-store.ts
   src/lib/prompts/style-generation.ts
   src/lib/prompts/asset-generation.ts
   src/lib/prompts/compile-style.ts

8. Push this to a new GitHub repository called "shotmaker-web"

Don't build any features yet — just the scaffolding, dependencies, and folder structure.
The app should start without errors and show the default Next.js page.
```

**After Replit finishes:** Verify the app runs, the database is provisioned, and the GitHub repo exists. Then switch to Claude Code for everything below.

---

## Chunk 1: TypeScript Types & Enums

> **Give to Claude Code.** This is pure typing work with no dependencies on other features.

```
I'm building a web version of a macOS app called ShotMaker. I need you to create 
all the TypeScript types and enums that mirror the desktop app's Swift data models.

Create these files:

## src/types/enums.ts
All string enums. Here are the exact values needed:

- Medium: "16mm Film", "35mm Film", "70mm Film", "VHS Camera", "DV Camera", 
  "Photorealistic", "3D CGI", "2D Hand-drawn", "Stop Motion", "Claymation", 
  "Pixel Art", "Watercolor", "Oil Painting", "Comic Book"

- FilmFormat: "Standard", "Anamorphic", "IMAX"

- FilmGrain: "None", "Subtle", "Moderate", "Heavy"

- DepthOfField: "Deep", "Moderate", "Shallow", "Ultra Shallow"

- AssetType: "character", "object", "set"

- ImageAspectRatio: "1:1", "3:4", "4:3", "9:16", "16:9"

- ShotAngle: "Eye Level", "Low Angle", "High Angle", "Bird's Eye", 
  "Worm's Eye", "Dutch Angle", "Over the Shoulder"

- Perspective: "Front", "Three-Quarter Front", "Profile", "Three-Quarter Back",
  "Back", "Top Down", "Bottom Up"

- CompositionRule: "Rule of Thirds", "Golden Ratio", "Center Frame", 
  "Leading Lines", "Symmetry", "Frame Within Frame"

- LensType: "Wide Angle", "Standard", "Telephoto", "Macro", "Fish Eye", 
  "Anamorphic", "Tilt-Shift"

- CameraMovement: "Static", "Pan Left", "Pan Right", "Tilt Up", "Tilt Down",
  "Dolly In", "Dolly Out", "Truck Left", "Truck Right", "Crane Up", 
  "Crane Down", "Handheld", "Steadicam", "Zoom In", "Zoom Out", 
  "Arc Left", "Arc Right", "Whip Pan", "Tracking Shot"

- StyleParameterOptions: Create objects (not enums) with arrays of preset values for:
  lighting, colorPalette, aesthetic, atmosphere, mood, motion, texture
  (These are the dropdown options in the preset style mode. Include 10-15 
  options each — common cinematic/artistic terms like "Golden Hour", 
  "High Key", "Warm Tones", "Muted Pastels", "Noir", "Ethereal", etc.)

## src/types/style.ts
- VisualStyle interface: All style parameters (medium, filmFormat, filmGrain, 
  depthOfField, lighting, colorPalette, aesthetic, atmosphere, mood, motion, 
  texture, detailLevel, customPrompt, isAdvancedMode), plus preset/manual 
  storage fields (presetLighting, manualLighting, etc. for all 7 parameters),
  plus draft system (reference, currentDraft, draftHistory, appliedDraftId, 
  aspectRatio)
- NamedStyle interface: id, name, style (VisualStyle), createdAt, lastUsedAt
- StyleDraft interface: id, examples (string[] — media URLs), parameters 
  (StyleParameters), prompt, aiModel, createdAt
- StyleReference interface: id, examples (string[]), parameters, prompt, 
  aiModel, savedAt, styleSheetText
- StyleParameters interface: extracted style values at time of generation
- Helper function: createDefaultVisualStyle() returning a new empty VisualStyle
- Helper function: createNamedStyle(name: string) returning a new NamedStyle
- Helper function: getActiveValue(style: VisualStyle, param: string) that 
  returns the manual value in advanced mode, preset value in standard mode

## src/types/asset.ts
- Asset interface: id, name, type (AssetType), description, prompt, 
  attributes (AssetAttributes), selectedStyleId, drafts (AssetDraft[]),
  primaryDraftIndex, reference (AssetReference | null), 
  conversationHistory (ConversationMessage[]), createdAt, updatedAt
- AssetDraft interface: id, images (string[] — media URLs), parameters, 
  prompt, aiModel, createdAt
- AssetReference interface: id, images (string[]), description, prompt, 
  aiModel, savedAt
- AssetAttributes interface: a union/discriminated type based on AssetType:
  - CharacterAttributes: age, gender, build, hairStyle, hairColor, clothing,
    skinTone, distinguishingFeatures, pose, expression
  - ObjectAttributes: material, size, condition, color, distinguishingFeatures
  - SetAttributes: locationType, timeOfDay, weather, architectureStyle, 
    keyElements, atmosphere

## src/types/camera.ts
- CameraParameters interface: shotAngle, perspective, compositionRule, 
  lensType, cameraMovement — all optional enum values

## src/types/project.ts
- Project interface: id, name, description, styles (NamedStyle[]), 
  defaultStyleId, assets (Asset[]), frames (Frame[]), shots (Shot[]),
  defaultImageProvider, createdAt, updatedAt
- Frame interface (stub for now): id, name, description, selectedAssetIds, 
  selectedStyleId, cameraParameters, sceneDirection, drafts, primaryDraftIndex,
  createdAt, updatedAt
- Shot interface (stub for now): id, name, description, frameId, narrative,
  drafts, primaryDraftIndex, createdAt, updatedAt
- ConversationMessage interface: role ("user" | "model" | "system"), 
  content (string), timestamp
- Helper: createEmptyProject(name: string) returning a new Project

## src/types/generation.ts
- GenerationRequest interface: type, projectId, entityId, model, params
- GenerationResponse interface: mediaUrls, draftData, creditsUsed
- GenerationStatus: "pending" | "generating" | "uploading" | "complete" | "failed"

Also create Zod schemas for VisualStyle, Asset, and Project in a new file:
## src/lib/validation/schemas.ts

Use z.object() matching each interface. These will validate API inputs 
and JSONB data from the database.

Every type should have JSDoc comments explaining what it maps to in the 
desktop app. Use string for IDs (UUID format), string for dates (ISO 8601),
and string for media URLs.
```

**Verify:** TypeScript compiles with no errors. Import a few types in a test file to confirm.

---

## Chunk 2: Database Schema & Migrations

```
Create the Drizzle ORM database schema and run the initial migration.

## src/db/schema.ts

Define these tables using Drizzle's pgTable():

1. users — id (uuid, pk, default gen_random_uuid()), email (text, unique, not null), 
   name (text), password_hash (text), avatar_url (text), 
   plan (text, default 'free'), credits (integer, default 50), 
   storage_used (bigint, default 0), storage_limit (bigint, default 524288000),
   stripe_customer_id (text), stripe_subscription_id (text),
   created_at (timestamp with timezone, default now()), 
   updated_at (timestamp with timezone, default now())

2. accounts — NextAuth adapter table (provider, providerAccountId, userId, etc.)

3. sessions — NextAuth adapter table (sessionToken, userId, expires)

4. verification_tokens — NextAuth adapter table (identifier, token, expires)

5. projects — id (uuid pk), user_id (uuid, references users, cascade delete), 
   name (text), description (text, default ''), 
   project_data (jsonb, default '{}'), storage_used (bigint, default 0),
   created_at, updated_at.
   Index on user_id.

6. media_files — id (uuid pk), project_id (uuid, ref projects, cascade), 
   user_id (uuid, ref users, cascade), entity_type (text), entity_id (uuid),
   draft_index (integer, default 0), image_index (integer, default 0),
   r2_key (text), file_type (text), size_bytes (bigint, default 0), created_at.
   Indexes on project_id and (entity_type, entity_id).

7. generation_log — id (uuid pk), user_id (uuid, ref users, cascade),
   project_id (uuid, ref projects, cascade), entity_type (text), 
   entity_id (uuid), generation_type (text), model (text), 
   credits_used (integer), status (text, default 'pending'), 
   error_message (text), duration_ms (integer), created_at.
   Indexes on user_id and created_at.

8. user_api_keys — id (uuid pk), user_id (uuid, ref users, cascade),
   provider (text, default 'google'), encrypted_key (text), 
   key_hint (text), is_valid (boolean, default true), created_at.
   Unique index on (user_id, provider).

9. credit_transactions — id (uuid pk), user_id (uuid, ref users, cascade),
   amount (integer), reason (text), reference_id (text), 
   balance_after (integer), created_at.
   Index on user_id.

## src/db/index.ts

Initialize the Drizzle client using the DATABASE_URL environment variable:
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
Export the db instance and all schema tables.

After creating the schema, generate and run the migration:
npx drizzle-kit generate
npx drizzle-kit push

Verify by checking that all tables exist in the database.
```

**Verify:** Run `npx drizzle-kit push` successfully. Check tables exist with a quick SQL query.

---

## Chunk 3: Authentication

```
Set up NextAuth.js v5 (Auth.js) with email/password registration and login.

## src/lib/auth.ts
Configure NextAuth with:
- DrizzleAdapter connected to our PostgreSQL database
- CredentialsProvider for email + password login
  - Verify password with bcryptjs.compare()
  - Look up user by email in our users table
- Session strategy: "jwt"
- Include user id, plan, and credits in the JWT token and session
- Callbacks: jwt callback adds id/plan/credits to token, session callback 
  exposes them on session.user

## src/app/api/auth/[...nextauth]/route.ts
Export GET and POST handlers from the auth config.

## src/app/api/auth/register/route.ts  
POST endpoint for user registration:
- Accept { name, email, password }
- Validate with Zod (email format, password min 8 chars)
- Check if email already exists → 409 error
- Hash password with bcryptjs (salt rounds: 12)
- Insert into users table
- Return { success: true, user: { id, email, name } }

## src/app/(auth)/layout.tsx
Centered layout for auth pages — logo at top, card in center, 
dark background with subtle gradient.

## src/app/(auth)/login/page.tsx
Login form with:
- Email input
- Password input
- "Sign In" button (calls signIn("credentials", { email, password }))
- Link to /register
- Error handling for invalid credentials

## src/app/(auth)/register/page.tsx
Registration form with:
- Name input
- Email input
- Password input (with confirmation)
- "Create Account" button (calls /api/auth/register, then auto-signs in)
- Link to /login

## src/middleware.ts
Protect all /dashboard, /project/*, and /settings routes.
Redirect unauthenticated users to /login.
Redirect authenticated users from /login and /register to /dashboard.

Test by:
1. Register a new account
2. Log out
3. Log back in
4. Verify protected routes redirect properly
```

**Verify:** Can register, log in, log out, and access protected routes.

---

## Chunk 4: Dashboard & Project CRUD

```
Build the dashboard page and project management API.

## src/app/api/projects/route.ts
- GET: Return all projects for the authenticated user (from session).
  Select id, name, description, created_at, updated_at, storage_used.
  Also return a count of assets from the project_data JSONB 
  (project_data->'assets' array length, default 0).
  Order by updated_at descending.

- POST: Create a new project. Accept { name, description }.
  Initialize project_data as a valid empty project JSON:
  { styles: [], defaultStyleId: null, assets: [], frames: [], shots: [],
    defaultImageProvider: null, createdAt: <now>, updatedAt: <now> }
  Check user's plan for project count limits (free: 1, starter: 5, 
  pro/team: unlimited). Return 403 if limit reached.
  Return the created project.

## src/app/api/projects/[id]/route.ts
- GET: Return full project (including project_data) for authenticated user.
  Verify ownership (user_id matches session user).
- PUT: Update project. Accept partial updates to name, description, 
  and/or project_data. Set updated_at to now().
- DELETE: Delete project. Also delete all associated media_files records.
  (R2 cleanup can be async/deferred — just delete DB records for now.)
  Reduce user's storage_used by the project's storage_used.

## src/app/(app)/layout.tsx
App shell layout:
- Sidebar or top nav with: ShotMaker logo, Dashboard link, Settings link
- Main content area for {children}
- User avatar/menu in corner with sign out option
- Display current credits balance (from session)

## src/app/(app)/dashboard/page.tsx
- Fetch projects from GET /api/projects
- Show grid of ProjectCards (2-3 columns)
- Each card shows: project name, description (truncated), last modified 
  (relative date), asset count, and a colored accent bar
- Click card → navigate to /project/[id]/style
- "New Project" button opens NewProjectDialog
- NewProjectDialog: name field (required), description field (optional),
  "Create" button calls POST /api/projects then navigates to the new project
- Delete button on each card (with confirmation dialog)
- Empty state: illustration + "Create your first project" CTA

## src/stores/project-store.ts
Zustand store with:
- projects: Project[] (for dashboard list)
- currentProject: Project | null (for active project)
- isDirty: boolean
- isSaving: boolean
- fetchProjects: () => Promise<void>
- createProject: (name, description) => Promise<Project>
- deleteProject: (id) => Promise<void>
- loadProject: (id) => Promise<void>
- updateProjectData: (updates) => void  // marks dirty, triggers debounced save
- saveProject: () => Promise<void>

Include a debounced auto-save: when isDirty becomes true, save after 
1 second of no further changes. Show "Saving..." / "Saved ✓" in the UI.

Test by creating 2-3 projects, verifying they appear on the dashboard, 
and deleting one.
```

**Verify:** Can create, view, and delete projects. Navigation works.

---

## Chunk 5: Project Layout & Workflow Tabs

```
Build the project layout with workflow tab navigation.

## src/app/(app)/project/[id]/layout.tsx
This layout wraps all project sub-pages. On mount:
1. Load the project from GET /api/projects/[id]
2. Hydrate the project Zustand store
3. Render the layout:

┌──────────────────────────────────────────────────────────────┐
│ ← Dashboard   |  Project: {name} (editable)  |  💎 {credits}│
├──────────────────────────────────────────────────────────────┤
│  [Style ✓] [Assets (3)] [Frames 🔒] [Shots 🔒]             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  {children}  — rendered by the active tab's page.tsx         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

## Components needed:

### ProjectToolbar
- Back arrow → /dashboard
- Editable project name (click to edit inline, blur/enter to save)
- Save status indicator: "Saving..." with spinner | "Saved ✓" | "Unsaved"
- Credits badge showing current balance with gem icon

### WorkflowTabs
- 4 tabs: Style, Assets, Frames, Shots
- Style and Assets are active links to /project/[id]/style and /assets
- Frames and Shots show a lock icon and "Coming Soon" tooltip
- Active tab is highlighted
- Each tab shows a status indicator:
  - Style: checkmark if a style reference exists
  - Assets: count of assets (e.g., "(3)")
  - Frames: "--"
  - Shots: "--"
- The status is derived from the project_data in the Zustand store

## src/app/(app)/project/[id]/style/page.tsx
For now, just render a placeholder: "Style Definition — Coming in next chunk"

## src/app/(app)/project/[id]/assets/page.tsx
For now, just render a placeholder: "Asset Library — Coming in next chunk"

Test by navigating to a project, seeing the tabs, clicking between Style 
and Assets, and editing the project name.
```

**Verify:** Project loads, tabs render, navigation between Style/Assets works, project name is editable.

---

## Chunk 6: Cloudflare R2 Integration

```
Set up the Cloudflare R2 client and media upload/download helpers.

## src/lib/r2.ts

Create an R2 client using @aws-sdk/client-s3:

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

Export these functions:

1. uploadMedia(params: { userId, projectId, entityType, entityId, 
   draftIndex, imageIndex, data: Buffer, fileType: 'png' | 'mp4' | 'jpg' })
   - Generates R2 key: `${userId}/${projectId}/${entityType}/${entityId}/draft-${draftIndex}-${imageIndex}.${fileType}`
   - Uploads via PutObjectCommand with correct ContentType
   - Records in media_files table
   - Updates storage_used on user and project
   - Returns the public URL

2. getMediaUrl(r2Key: string): string
   - Returns the public CDN URL for the given key
   - Format: `${R2_PUBLIC_URL}/${r2Key}`

3. deleteMedia(r2Key: string)
   - Deletes from R2 via DeleteObjectCommand
   - Removes from media_files table
   - Adjusts storage_used counts

4. deleteProjectMedia(projectId: string)
   - Looks up all media_files for the project
   - Deletes them all from R2
   - Removes all records
   - Used when deleting a project

5. generatePresignedUploadUrl(params: { key, contentType, expiresIn: 3600 })
   - For future use with client-side uploads
   - Returns a presigned PUT URL

## src/app/api/media/[key]/route.ts
GET handler that redirects to the R2 public URL for the given media key.
This is a fallback if direct R2 access isn't configured.

No UI needed for this chunk — just the server-side utilities. 
Write a simple test script or API route (/api/test-r2) that uploads 
a small test image and returns the URL to verify the connection works.
Delete the test route after verification.
```

**Verify:** Test route uploads a file to R2 and returns a working URL.

---

## Chunk 7: Gemini API Client & Prompt Templates

```
Build the server-side Gemini API client and port the prompt templates 
from the desktop app.

## src/lib/gemini.ts

Create a Gemini client that calls the Google Generative Language API:

export async function generateImages(params: {
  prompt: string;
  model: string;
  apiKey: string;
  referenceImages?: Buffer[];
  aspectRatio?: string;
  numberOfImages?: number;
}): Promise<Buffer[]>

Implementation:
- POST to https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent
- Headers: Content-Type application/json
- Query param: key=${apiKey}
- Body format for image generation with Gemini:
  {
    contents: [{ 
      role: "user", 
      parts: [{ text: prompt }] 
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0
    }
  }
- If referenceImages are provided, add them as inline_data parts 
  (base64 encoded with mimeType "image/png")
- Parse response: look for parts with inlineData.mimeType starting 
  with "image/" and decode the base64 data
- Return array of Buffer objects

Also export:
- getAvailableModels(): returns the list of supported Gemini models
  For now hardcode: ["gemini-2.0-flash-exp", "gemini-2.0-flash-preview-image-generation"]
- testApiKey(apiKey: string): boolean — makes a minimal API call to verify the key works

## src/lib/prompts/compile-style.ts

Port the StyleSheetService.compileStyleValues() function from the desktop app.

export function compileStyleValues(style: VisualStyle): Record<string, string>

This takes a VisualStyle and returns a flat dictionary of style values:
{
  VISUAL_MEDIUM: style.medium ?? "",
  FILM_FORMAT: style.filmFormat ?? "",
  FILM_GRAIN: style.filmGrain ?? "",
  DEPTH_OF_FIELD: style.depthOfField ?? "",
  LIGHTING: getActiveValue(style, "lighting"),
  COLOR_PALETTE: getActiveValue(style, "colorPalette"),
  AESTHETIC: getActiveValue(style, "aesthetic"),
  ATMOSPHERE: getActiveValue(style, "atmosphere"),
  MOOD: getActiveValue(style, "mood"),
  MOTION: getActiveValue(style, "motion"),
  TEXTURE: getActiveValue(style, "texture"),
  DETAIL_LEVEL: style.detailLevel.toString(),
  CUSTOM_PROMPT: style.customPrompt
}

The getActiveValue function returns manualX in advanced mode, presetX 
in standard mode, falling back to the base field, falling back to "".

## src/lib/prompts/style-generation.ts

Port the style reference generation prompt template. This builds the 
JSON-formatted prompt that generates 3 preview images (character, object, 
environment) to visualize a style.

export function buildStyleGenerationPrompt(
  styleValues: Record<string, string>,
  subjectType: 'character' | 'object' | 'environment'
): string

The prompt should be a JSON-structured string that includes:
- System instructions explaining the AI is a visual style reference generator
- The compiled style parameters
- A specific subject to generate based on subjectType:
  - character: "a weathered detective in a long coat"
  - object: "an ornate vintage pocket watch"  
  - environment: "a moody alleyway at night"
- Instructions to render the subject in the specified visual style
- Quality requirements (high detail, consistent style application)

## src/lib/prompts/asset-generation.ts

Port the asset generation prompt templates.

export function buildAssetGenerationPrompt(params: {
  asset: Asset;
  styleValues: Record<string, string>;
  styleSheetText?: string;
  referenceImages?: string[];  // URLs of style reference images
}): string

Build type-specific prompts:
- Character: multi-angle turnaround reference sheet (front, 3/4, side, back views)
- Object: multi-angle reference (front, side, detail views)
- Set/Environment: wide establishing shot

Include the style parameters, asset attributes, and description in the prompt.
Format as JSON structure matching the desktop app's template pattern.

## src/lib/credits.ts

Credit management utilities:

export async function checkCredits(userId: string, required: number): 
  Promise<{ hasEnough: boolean; available: number }>

export async function deductCredits(userId: string, amount: number, 
  reason: string, referenceId?: string): Promise<{ newBalance: number }>
  - Atomically deduct from users.credits
  - Insert credit_transactions record
  - Return new balance

export async function addCredits(userId: string, amount: number, 
  reason: string, referenceId?: string): Promise<{ newBalance: number }>

export const CREDIT_COSTS = {
  styleGeneration: 15,      // 3 images
  characterAsset: 8,        // multi-angle sheet
  objectAsset: 8,           // multi-angle sheet  
  setAsset: 5,              // single image
  assetRefinement: 5,       // refinement iteration
} as const;

No UI in this chunk. Test by calling the Gemini API directly with a 
simple test prompt to verify the client works and images come back.
```

**Verify:** Call `generateImages()` with a test prompt. Get back image data. Verify credit check/deduct logic with test queries.

---

## Chunk 8: Style Generation API Route

```
Build the server-side API endpoint for style example generation.

## src/app/api/generate/style/route.ts

POST endpoint that orchestrates the full style generation flow:

Request body: {
  projectId: string,
  styleId: string,      // Which named style to generate for
  model: string,        // Gemini model name
}

Flow:
1. Authenticate user from session
2. Load project from DB, verify ownership
3. Check credits (15 required) — return 402 if insufficient
4. Find the named style in project_data.styles by styleId
5. Compile style values using compileStyleValues()
6. Build 3 prompts: character, object, environment
7. Determine API key: check if user has a BYOK key for Google, 
   otherwise use platform key (GOOGLE_GEMINI_API_KEY)
8. Call generateImages() 3 times in parallel (Promise.all)
9. Upload all 3 images to R2 via uploadMedia()
10. Create a StyleDraft object:
    {
      id: uuid(),
      examples: [characterUrl, objectUrl, environmentUrl],
      parameters: { ...extracted from current style values },
      prompt: characterPrompt,  // store for debugging
      aiModel: model,
      createdAt: new Date().toISOString()
    }
11. Update project_data JSONB:
    - Find the style, push draft to draftHistory
    - Set currentDraft to the new draft
    - Trim draftHistory to max 50 entries
12. Deduct 15 credits, log generation
13. Save updated project_data to DB
14. Return: { 
      draft: StyleDraft, 
      creditsUsed: 15, 
      creditsRemaining: newBalance 
    }

Error handling:
- 401 if not authenticated
- 403 if project not owned by user
- 402 if insufficient credits (return { required, available })
- 500 if Gemini API fails (include error message, don't deduct credits)
- 400 if style not found in project

Also create a helper function that handles the JSONB update pattern:
async function updateProjectData(projectId: string, 
  updater: (data: ProjectData) => ProjectData): Promise<void>

This reads the current project_data, applies the updater function, 
and writes it back. Include optimistic locking via updated_at check 
to prevent race conditions.

Test with a curl command or simple test page that triggers the endpoint 
and verifies images appear in R2.
```

**Verify:** POST to the endpoint returns 3 image URLs and a valid StyleDraft object. Credits are deducted. Images are viewable at the returned URLs.

---

## Chunk 9: Style Definition UI

```
Build the complete Style Definition tab UI.

This is the first major UI surface — it mirrors the desktop app's 
StyleDefinitionView with a 3-column resizable layout.

## Route: src/app/(app)/project/[id]/style/page.tsx

Uses the shadcn Resizable component for a 3-panel layout.

## src/stores/style-store.ts
Zustand store for style editing state:
- currentStyleId: string | null
- isGenerating: boolean
- generationProgress: string
- selectedModel: string (default: first available)
- previewImages: { character: string | null, object: string | null, set: string | null }
- currentDraftIndex: number

Actions:
- selectStyle(styleId) — loads style into editing state
- setParameter(key, value) — updates a style parameter
- applyPreset(presetName) — fills all params from a preset
- toggleMode() — switch preset/advanced
- generateStyleExamples() — calls POST /api/generate/style, updates store with results
- navigateDraft(prev/next) — browse draft history
- applyDraft() — mark current draft as applied reference
- saveDraftAsReference() — create a StyleReference from current draft

## Components to build:

### StyleEditor (main container)
Three-panel resizable layout using shadcn ResizablePanelGroup:
- Left panel (default 30%): StyleParametersPanel
- Center panel (default 45%): StylePreviewArea  
- Right panel (default 25%): StyleListPanel + DraftHistoryPanel

### StyleParametersPanel (left column)
Scrollable form containing (top to bottom):

1. Model Selector — dropdown of available Gemini models
2. Camera Styles card:
   - Aspect ratio picker (segmented buttons or select)
   - Medium dropdown (from Medium enum)
   - Film format dropdown (Standard/Anamorphic/IMAX)
   - Film grain dropdown
   - Depth of field dropdown
3. Mode toggle — "Preset" / "Manual" segmented control
4. In Preset mode: QuickStylePresets component
   - 3-column grid of 15 preset buttons:
     Cinematic, Anime, Noir, Documentary, Fantasy, Sci-Fi, Horror, 
     Western, Vintage, Minimalist, Surreal, Gothic, Tropical, 
     Industrial, Ethereal
   - Clicking a preset fills all 7 style parameters with curated values
5. In Manual mode: 7 text inputs/textareas
   - Lighting, Color Palette, Aesthetic, Atmosphere, Mood, Motion, Texture
   Each with a label and placeholder text
6. In Preset mode: 7 dropdown selects using StyleParameterOptions values
7. Custom prompt textarea (available in both modes)
8. GenerateButton at the bottom
   - Shows "Generate Style Examples" when idle
   - Shows spinner + "Generating..." when active
   - Disabled when already generating

### StylePreviewArea (center column)
- PreviewGrid: 3 images in a row labeled "Character", "Object", "Set"
  - Each cell shows the image or an empty placeholder
  - Click image → open MediaLightbox (full-size overlay)
- Below the grid: action buttons
  - "Apply Style" — saves draft as the active reference
  - "Save as New Style" — creates a new NamedStyle from current params
  - "Set as Default" — marks this style as the project default

### StyleListPanel (right column, top half)
- Header: "Styles" + "New Style" button
- Scrollable list of named styles
- Each row: star icon (gold if default), style name, status badge
- Click to select and load into the editor
- Delete button (with confirmation) on hover

### DraftHistoryPanel (right column, bottom half)
- Header: "Draft History"
- Scrollable list of draft thumbnails
- Each item shows: 3 small composite thumbnails, model name, timestamp
- Click to load that draft into the preview area
- "Primary" badge on the applied draft
- DraftNavigation component: ← → arrows + "Draft 3 of 7" label

### GenerateButton (shared component)
- Idle: blue primary button with sparkle icon
- Generating: shows progress text, cancel button
- Disabled: grayed out when no model selected or already generating
- On click: calls style-store's generateStyleExamples()

### MediaLightbox (shared component)  
- Full-screen overlay with dark backdrop
- Shows image at full resolution
- Close button (X) and click-outside-to-close
- Keyboard: Escape to close

Wire everything up so that:
1. User arrives at Style tab, sees empty state or existing styles
2. User selects/creates a style and adjusts parameters
3. User clicks Generate → loading state → 3 preview images appear
4. User can browse draft history
5. User can apply a draft as the active reference
6. All changes persist to the project via the Zustand store + auto-save
```

**Verify:** Full style editing workflow works end-to-end — create style, adjust params, generate, see results, browse drafts, apply.

---

## Chunk 10: Asset Generation API Route

```
Build the server-side API endpoint for asset generation.

## src/app/api/generate/asset/route.ts

POST endpoint for generating asset reference sheets.

Request body: {
  projectId: string,
  assetId: string,        // Existing asset to add draft to, or null for preview
  assetType: "character" | "object" | "set",
  attributes: AssetAttributes,
  description: string,
  selectedStyleId: string,
  model: string,
  referenceImageUrls?: string[],  // Style reference images for context
  conversationHistory?: ConversationMessage[],  // For refinement
  isRefinement?: boolean,
  refinementPrompt?: string,
}

Flow:
1. Authenticate, verify project ownership
2. Check credits: character/object = 8, set = 5, refinement = 5
3. Load project, find the selected style
4. Compile style values
5. Build asset generation prompt using buildAssetGenerationPrompt()
6. If refinement: append conversation history + refinement prompt
7. Determine API key (BYOK or platform)
8. If reference images provided, download them as buffers for the API call
9. Call generateImages()
10. Upload result images to R2
11. Create AssetDraft object
12. Update project_data: if assetId exists, find asset and push draft;
    if new generation, caller will handle adding the asset later
13. Deduct credits, log generation
14. Return { draft, creditsUsed, creditsRemaining }

Handle the same error cases as the style endpoint.
```

**Verify:** POST with character attributes returns multi-angle reference sheet URL.

---

## Chunk 11: Asset Library & Editor UI

```
Build the Asset Library view and the Asset Editor with full 
create/edit functionality.

## Asset Library — src/app/(app)/project/[id]/assets/page.tsx

- Filter bar: All | Characters | Objects | Sets (toggle buttons)
- Grid of AssetCards (responsive, 2-4 columns)
- AssetCard shows: primary draft thumbnail, asset name, type badge, 
  draft count
- Click card → navigate to /project/[id]/assets/[assetId]
- Create buttons: "New Character", "New Object", "New Set" 
  → navigate to /project/[id]/assets/new/character (etc.)
- Empty state per type: "No characters yet — create your first one"

## Asset Creation — src/app/(app)/project/[id]/assets/new/[type]/page.tsx

Three-panel resizable layout (same pattern as Style editor):

### Left: AssetParametersPanel
- Asset name field
- StyleSelector dropdown (pick from project's named styles)
- Model selector
- Type-specific attribute fields (AssetAttributesEditor):
  
  For Character:
  - Age (text), Gender (select), Build (select)
  - Hair style (text), Hair color (text)
  - Skin tone (text), Clothing (textarea)
  - Distinguishing features (textarea)
  - Pose (text), Expression (text)
  
  For Object:
  - Material (text), Size (text), Condition (select)
  - Color (text), Distinguishing features (textarea)
  
  For Set:
  - Location type (text), Time of day (select)
  - Weather (select), Architecture style (text)
  - Key elements (textarea), Atmosphere (text)

- Description textarea
- Reference images section (expandable):
  - Shows thumbnails of selected style reference images
  - Toggle to include/exclude each as generation context
- GenerateButton

### Center: AssetPreviewArea
- Shows the generated reference sheet image(s)
- For character/object: the turnaround grid
- For set: the environment image
- DraftNavigation below the preview (← Draft 2 of 5 →)
- RefinementPanel below: text input + "Refine" button for 
  multi-turn conversation

### Right: AssetDraftHistory
- Scrollable list of drafts with thumbnails
- Primary badge on the active draft
- Click to load into preview
- Delete draft button

### Bottom bar:
- "Save to Library" button (creates/updates the asset in project_data)
- "Set as Primary" button (when viewing non-primary draft)
- "Save as New Asset" button (when editing existing, creates a copy)
- Cancel / Back to Library link

## Asset Edit — src/app/(app)/project/[id]/assets/[assetId]/page.tsx
Same component as creation, but pre-populated from the existing asset.
Load asset data from project_data JSONB via the Zustand store.

## src/stores/asset-store.ts
Zustand store for asset editing:
- mode: 'create' | 'edit'
- assetType: AssetType
- name, description, attributes, selectedStyleId, selectedModel
- drafts: AssetDraft[]
- currentDraftIndex, primaryDraftIndex
- isGenerating, generationProgress
- conversationHistory: ConversationMessage[]
- hasUnsavedChanges: boolean

Actions:
- initCreate(type) — reset to empty state for new asset
- initEdit(asset) — populate from existing asset
- setAttribute(key, value)
- generate() — calls POST /api/generate/asset
- refine(prompt) — calls generate with conversation history
- navigateDraft(prev/next)
- setPrimaryDraft(index)
- saveToLibrary() — adds/updates asset in project store
- saveAsNew() — creates a copy with new ID

Wire everything together so that:
1. User can create a new character from the Asset Library
2. Fill in attributes, pick a style
3. Generate → see turnaround sheet
4. Refine with "make the coat darker" → get a new draft
5. Save to library
6. See it appear in the Asset Library grid
7. Click to edit, make changes, generate again
```

**Verify:** Full asset creation workflow — create, generate, refine, save, edit, re-generate.

---

## Chunk 12: Stripe Billing Integration

```
Set up Stripe billing with subscriptions and credit packs.

## Stripe Dashboard Setup (manual):
Create these products and prices:
- "ShotMaker Starter" subscription: $15/month, $144/year
- "ShotMaker Pro" subscription: $35/month, $336/year
- "500 Credits" one-time: $10
- "1,500 Credits" one-time: $25
- "3,500 Credits" one-time: $50

Store all price IDs as environment variables:
STRIPE_STARTER_MONTHLY_PRICE_ID
STRIPE_STARTER_YEARLY_PRICE_ID
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
STRIPE_CREDITS_500_PRICE_ID
STRIPE_CREDITS_1500_PRICE_ID
STRIPE_CREDITS_3500_PRICE_ID

## src/lib/stripe.ts
Initialize Stripe client. Export helper functions:
- createCheckoutSession(userId, priceId, mode: 'subscription' | 'payment')
- createCustomerPortalSession(customerId)
- getOrCreateCustomer(userId, email)

## src/app/api/billing/checkout/route.ts
POST: Create Stripe Checkout session.
Accept { priceId, billingInterval?: 'month' | 'year' }
Create or look up Stripe customer for the user.
Return { url: checkoutSession.url }
Client redirects to this URL.
Success URL: /settings?billing=success
Cancel URL: /settings?billing=cancelled

## src/app/api/billing/portal/route.ts
POST: Create Stripe Customer Portal session.
Return { url: portalSession.url }

## src/app/api/billing/webhook/route.ts
POST: Handle Stripe webhooks. Verify signature.
Handle these events:

- checkout.session.completed:
  If mode is subscription: update user's plan and set credits 
  (starter=500, pro=2000). Set stripe_subscription_id.
  If mode is payment (credit pack): add credits to user 
  (500/1500/3500 based on price ID).

- invoice.paid (for recurring):
  Reset user's credits to their plan amount.
  Log the credit addition.

- customer.subscription.updated:
  Update user's plan field. Adjust credits and storage_limit.

- customer.subscription.deleted:
  Set plan to 'free', storage_limit to 500MB.
  Don't remove credits (let them use what's left).

## src/app/(app)/settings/page.tsx
Add a Billing section:
- Current plan badge (Free / Starter / Pro)
- Credits remaining: {N} credits with progress bar
- "Upgrade Plan" section with plan comparison cards
  Each card: plan name, price, features list, "Subscribe" button
- "Buy Credits" section: 3 credit pack cards with "Buy" buttons
- "Manage Subscription" button → Stripe Customer Portal
- Recent credit transactions list (last 20)

## Update CreditsBadge in the header
Show current credit count from the session/store.
Clicking it navigates to /settings#billing.

Test the full flow:
1. Subscribe to Starter plan via Stripe Checkout
2. Verify credits are set to 500
3. Generate something, verify credits decrease
4. Purchase a credit pack, verify credits increase
5. Open customer portal, verify subscription management works
```

**Verify:** Full billing cycle works — subscribe, credits appear, generate deducts, purchase adds, portal accessible.

---

## Summary: Build Order

| Chunk | What | Depends On | Approx. Effort |
|-------|------|-----------|----------------|
| 0 | Replit scaffolding | Nothing | 30 min (Replit Agent) |
| 1 | TypeScript types & enums | Chunk 0 | 2–3 hours |
| 2 | Database schema | Chunk 0 | 1–2 hours |
| 3 | Authentication | Chunk 2 | 2–3 hours |
| 4 | Dashboard + Project CRUD | Chunks 2, 3 | 3–4 hours |
| 5 | Project layout + tabs | Chunk 4 | 2–3 hours |
| 6 | R2 integration | Chunk 2 | 1–2 hours |
| 7 | Gemini client + prompts | Chunk 1 | 3–4 hours |
| 8 | Style generation API | Chunks 6, 7 | 2–3 hours |
| 9 | Style Definition UI | Chunks 5, 8 | 6–8 hours |
| 10 | Asset generation API | Chunks 7, 8 | 2–3 hours |
| 11 | Asset Library + Editor UI | Chunks 5, 10 | 6–8 hours |
| 12 | Stripe billing | Chunks 2, 3 | 4–5 hours |

**Total: ~35–48 hours of development time**

Chunks 1–2 can run in parallel. Chunks 6–7 can run in parallel. 
Chunk 12 (billing) can be done anytime after Chunk 3.
