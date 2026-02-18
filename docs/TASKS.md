# ShotMaker Web — Task List

> Updated 2026-02-17. Based on comprehensive Mac app analysis (see `docs/planning/09-Generation-Implementation-Reference.md`).

---

## Phase 0: Critical Infrastructure Fixes ✅

- [x] **Fix Gemini `imageConfig` in API calls** — Aspect ratio now passed via `generationConfig.imageConfig.aspectRatio` instead of prompt text.
- [x] **Standardize auth header** — All API calls now use `x-goog-api-key` header consistently.
- [x] **Add `responseModalities` switching** — Uses `["IMAGE"]` for single image, `["TEXT", "IMAGE"]` for batch generation.

## Phase 1: Prompt Engineering Upgrade (P0)

### 1.1 Template System
- [ ] Create `src/lib/prompts/templates/` directory structure
- [ ] Port **Style Reference** system+user JSON templates from Mac app
- [ ] Port **Character Asset** system+user JSON templates
- [ ] Port **Object Asset** system+user JSON templates
- [ ] Port **Set Asset** system+user JSON templates (including camera params)
- [ ] Port **Frame Composition** system+user JSON templates
- [ ] Port **Shot Video** system+user JSON templates
- [ ] Port all 4 **Refinement** templates (character, object, set, frame)
- [ ] Port **Shot Extension** templates
- [ ] Port **Style Extraction** templates

### 1.2 Style Compilation Enhancement
- [ ] Add `compileCharacterValues()` — merge description + attributes to natural language
- [ ] Add `compileObjectValues()` — merge description + attributes
- [ ] Add `compileSetValues()` — merge description + attributes + camera params
- [ ] Add `compileFrameValues()` — description + camera + assets + style + negative prompt + frame attributes
- [ ] Add `compileShotValues()` — narrative + audio + camera + style (filtered variant)
- [ ] Add `cleanEmptyPlaceholders()` — remove lines with empty string values from compiled prompts
- [ ] Add attribute-to-natural-language converters (character, object, set)

### 1.3 Prompt Builder
- [ ] Create unified `buildPrompt(system, user, values)` function
- [ ] Integrate into existing style generation route
- [ ] Integrate into existing asset generation route

## Phase 2: Missing Generation Pipelines (P1)

### 2.1 Frame Generation
- [ ] Create `POST /api/generate/frame` route
- [ ] Implement multi-reference image composition (assets → single frame)
- [ ] Support camera parameters (framing, perspective, composition, lens type, motion blur, lighting)
- [ ] Support frame attributes (location, time, weather, scale, architecture, atmosphere)
- [ ] Support negative prompt with stability guardrails
- [ ] Wire up frame generation UI
- [ ] Draft history for frames
- [ ] Frame refinement (conversation-based)

### 2.2 Shot Video Generation
- [ ] Create `POST /api/generate/shot` route (start generation)
- [ ] Create `GET /api/generate/shot/status` route (poll for completion)
- [ ] Build shot prompt compiler with all placeholders
- [ ] Implement shot stability guardrails (auto-prepend to exclusions)
- [ ] Support reference images (interpolation mode: first/last frame)
- [ ] Support reference images (reference mode: up to 3 asset images for Veo 3.1)
- [ ] Support camera movement, framing, perspective, composition, lens, motion blur, lighting
- [ ] Support audio prompt
- [ ] Support negative prompt (merged into prompt text, NOT as API param)
- [ ] Wire up shot generation UI
- [ ] Draft history for shots
- [ ] Video playback and preview

### 2.3 Conversation-Based Refinement
- [ ] Implement multi-turn `contents[]` for Gemini API refinement calls
- [ ] Store `ConversationHistory` in draft data (messages with text + image references)
- [ ] Build structured refinement prompts per type (character/object/set/frame)
- [ ] First refinement includes system prompt; subsequent use user template only
- [ ] Update asset generation route to use conversation-based flow
- [ ] Add refinement UI (chat-style with previous image context)

## Phase 3: Extension & Analysis Features (P2)

### 3.1 Video Extension
- [ ] Create `POST /api/generate/shot/extend` route
- [ ] Store `videoReference` (URI) per shot draft
- [ ] Force `veo-3.1-generate-preview` model for extensions
- [ ] Build extension prompt with continuity-focused templates
- [ ] Support independent extension camera/style parameters
- [ ] Chain extensions (up to 20 / 180s max)
- [ ] Extension UI with parameter controls

### 3.2 Style Extraction from Image
- [ ] Create `POST /api/analyze/style` route
- [ ] Use Gemini vision model (`gemini-2.5-flash`) with `responseMimeType: "application/json"`
- [ ] Port extraction prompt templates (system + user with JSON schema)
- [ ] Parse response into `VisualStyle` — map string values to enums
- [ ] UI for uploading reference image and extracting style
- [ ] Low temperature (0.3) for consistent extraction

### 3.3 Resolution Support
- [ ] Add `imageSize` parameter to Gemini API calls ("1K", "2K", "4K")
- [ ] Show resolution picker for models that support it (Gemini 3 Pro)
- [ ] Pass through to `imageConfig` in request body

### 3.4 Empty Value Cleanup
- [ ] Implement `cleanJSON()` equivalent — remove lines with empty values from compiled prompts
- [ ] Fix trailing comma cleanup after removal
- [ ] Apply to all filtered prompt compilation (shots, frames, extensions)

## Phase 4: Quality & Polish (P3)

### 4.1 Batch Generation
- [ ] Implement numbered prompt technique for generating multiple drafts in one call
- [ ] Fall back to sequential generation if batch returns fewer images than requested
- [ ] Draft count selector UI (1-4)

### 4.2 Negative Prompt Support
- [ ] Add negative prompt field to asset generation
- [ ] Add negative prompt field to frame generation
- [ ] Auto-prepend stability guardrails for shots

### 4.3 Model Capabilities System
- [ ] Port `ImageModelCapabilities` struct (max references, supported ratios, resolutions, candidate count)
- [ ] Port `ModelCapabilities` for video (frame selection mode, max frames, supported durations, etc.)
- [ ] Use capabilities to validate and constrain UI options

### 4.4 Style Presets
- [ ] Port preset definitions (70mm Epic, Anime, Cyberpunk, Documentary, Claymation, Film Noir, Horror, Fantasy, Sci-Fi, Western, Vector Animation)
- [ ] Each preset populates both preset (dropdown) and manual (detailed text) fields

---

## Previously Completed ✅

- [x] Basic Gemini image generation API integration
- [x] Basic Veo video generation API polling
- [x] Style generation (3 images: character, object, environment)
- [x] Asset generation (character turnaround, object grid, set establishing shot)
- [x] Basic refinement (text-based, not conversation-based)
- [x] R2 media storage
- [x] Credit system
- [x] Project data model with styles, assets, drafts
- [x] Auth + multi-user
- [x] Generation logging
