# 09 — Generation Implementation Reference

> **Purpose:** Comprehensive reference mapping every prompt template, API call structure, and generation flow from the Mac app (Swift) to guide the web implementation (TypeScript/Next.js).

---

## Table of Contents

1. [API Configuration](#1-api-configuration)
2. [Gemini Image Generation API](#2-gemini-image-generation-api)
3. [Veo Video Generation API](#3-veo-video-generation-api)
4. [Prompt Templates — Style Reference](#4-prompt-templates--style-reference)
5. [Prompt Templates — Character Asset](#5-prompt-templates--character-asset)
6. [Prompt Templates — Object Asset](#6-prompt-templates--object-asset)
7. [Prompt Templates — Set Asset](#7-prompt-templates--set-asset)
8. [Prompt Templates — Frame Composition](#8-prompt-templates--frame-composition)
9. [Prompt Templates — Shot Video](#9-prompt-templates--shot-video)
10. [Prompt Templates — Refinement (per type)](#10-prompt-templates--refinement)
11. [Prompt Templates — Shot Extension](#11-prompt-templates--shot-extension)
12. [Prompt Templates — Style Extraction](#12-prompt-templates--style-extraction)
13. [Style Compilation & Placeholder System](#13-style-compilation--placeholder-system)
14. [Conversation-Based Refinement Flow](#14-conversation-based-refinement-flow)
15. [Batch Generation Flow](#15-batch-generation-flow)
16. [Multi-Reference Image Flow](#16-multi-reference-image-flow)
17. [Video Extension Flow](#17-video-extension-flow)
18. [Gap Analysis: Mac App vs Web](#18-gap-analysis-mac-app-vs-web)
19. [Migration Notes](#19-migration-notes)

---

## 1. API Configuration

### Mac App (`APIConfiguration.swift`)

```swift
enum Gemini {
    static let baseURLStable = "https://generativelanguage.googleapis.com/v1/models"
    static let baseURLBeta   = "https://generativelanguage.googleapis.com/v1beta/models"
    // All models currently use v1beta for image generation
    static let flashModel = "gemini-2.5-flash-image"
    static let proModel   = "gemini-3-pro-image-preview"
    static let styleAnalysisModel = "gemini-2.5-flash"  // Vision model (text output)
}
enum Veo {
    static let baseURL = "https://generativelanguage.googleapis.com/v1beta"
    static let standardModel = "veo-3.1-generate-preview"
    static let fastModel     = "veo-3.1-fast-generate-preview"
}
```

### Web App (`gemini.ts`)

```typescript
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
// Image models include gemini-2.5-flash-image, nano-banana-pro-preview, imagen-4 variants
// Video models: veo-2.0 through veo-3.1
```

### Gaps

| Feature | Mac | Web | Status |
|---------|-----|-----|--------|
| Gemini 3 Pro Preview model | ✅ `gemini-3-pro-image-preview` | ✅ `nano-banana-pro-preview` | ✅ Equivalent |
| Gemini 2.5 Flash Image | ✅ | ✅ | ✅ |
| Imagen 4 models | ❌ | ✅ | Web has extra models |
| Veo 3.1 Standard/Fast | ✅ | ✅ | ✅ |
| Veo 3.0 Standard/Fast | ✅ | ✅ | ✅ |
| Style analysis model | ✅ `gemini-2.5-flash` | ❌ | 🔴 **Missing** |
| Resolution support (1K/2K/4K) | ✅ `imageSize` in config | ❌ | 🔴 **Missing** |
| `x-goog-api-key` header auth | ✅ | ⚠️ Partial (uses query param for images, header for video) | 🟡 Inconsistent |

---

## 2. Gemini Image Generation API

### Request Structure (Mac App — `GoogleGeminiProvider.swift`)

```json
POST /v1beta/models/{model}:generateContent

Headers:
  x-goog-api-key: {apiKey}
  Content-Type: application/json

Body:
{
  "contents": [
    {
      "parts": [
        { "text": "{prompt}" },
        { "inline_data": { "mime_type": "image/png", "data": "{base64}" } }  // optional reference
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],       // or ["TEXT", "IMAGE"] for batch
    "imageConfig": {
      "aspectRatio": "1:1",               // or "4:3", "16:9", "9:16", "21:9"
      "imageSize": "2K"                   // optional: "1K", "2K", "4K" (pro model)
    }
  }
}
```

**Key differences from web:**
- Mac uses `responseModalities: ["IMAGE"]` for single image, `["TEXT", "IMAGE"]` for batch
- Mac includes `imageConfig.imageSize` for resolution control
- Mac uses `x-goog-api-key` header; web uses query param `?key=`
- Mac has 180s timeout

### Web equivalent (`gemini.ts`)

```typescript
// Current web implementation is simpler:
body = {
  contents: [{ role: "user", parts }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  // Missing: imageConfig with aspectRatio and imageSize
};
```

**🔴 Web is missing:**
- `imageConfig` block (aspectRatio passed in prompt text instead)
- `imageSize` / resolution support
- Proper `responseModalities` switching (always uses `["TEXT", "IMAGE"]`)

---

## 3. Veo Video Generation API

### Start Generation (Mac — `GoogleVeoProvider.swift`)

```
POST /v1beta/models/{model}:predictLongRunning

Headers:
  x-goog-api-key: {apiKey}

Body:
{
  "instances": [{
    "prompt": "{compiled prompt}",
    "image": {                                    // optional: first frame
      "mimeType": "image/jpeg",
      "bytesBase64Encoded": "{base64}"
    },
    "lastFrame": {                                // optional: last frame
      "mimeType": "image/jpeg",
      "bytesBase64Encoded": "{base64}"
    },
    "referenceImages": [{                         // optional: style references (Veo 3.1 only)
      "referenceType": "asset",
      "image": { "bytesBase64Encoded": "...", "mimeType": "image/jpeg" }
    }],
    "video": { "uri": "{videoUri}" }              // for extensions only
  }],
  "parameters": {
    "aspectRatio": "16:9",
    "resolution": "720p",
    "durationSeconds": 8,
    "sampleCount": 1
  }
}
```

### Poll Operation

```
GET /v1beta/{operationName}
Headers: x-goog-api-key: {apiKey}

Response when done:
{
  "done": true,
  "response": {
    "generateVideoResponse": {
      "generatedSamples": [{
        "video": { "uri": "{downloadUri}" }
      }]
    }
  }
}
```

### Download Video

```
GET {videoUri}?key={apiKey}
```

**Mac-specific details:**
- Initial poll delay: 5 seconds
- Polling interval: 3 seconds
- Operation timeout: 600 seconds (10 min)
- Video reference (URI) is stored per draft for extension support
- `negativePrompt` is NOT sent as API param — it's merged into the prompt text

### Web Implementation Status

The web `gemini.ts` has a working implementation of `startVideoGeneration` and `pollVideoStatus` that closely matches the Mac app. ✅

**🔴 Missing in web polling:** The web polls via `response.predictions[0].video` instead of `response.generateVideoResponse.generatedSamples[0].video`. The response format may differ — needs verification.

---

## 4. Prompt Templates — Style Reference

### System Prompt

```json
{
  "role": "Master Visual Stylist & Concept Architect",
  "instruction": "You are a specialized AI designed to define and anchor the 'Visual DNA' for high-end video production...",
  "core_directives": [
    "SINGLE SUBJECT FOCUS: Strictly generate exactly one image of the requested subject...",
    "STYLE SYNTHESIS: Integrate medium, lighting, color, and texture variables...",
    "TECHNICAL FIDELITY: Prioritize the rendering of surface materials...",
    "COMPOSITIONAL CLARITY: Use a clean, intentional composition..."
  ],
  "style_logic_framework": {
    "texture_rendering": "How the medium interacts with the subject's surface...",
    "lighting_physics": "The source, intensity, and temperature of light...",
    "chromatic_language": "The specific color palette...",
    "optical_properties": "The lens behavior, focus depth..."
  }
}
```

### User Prompt

```
Generate a definitive style reference image for a video production project based on the following 'Visual DNA' specifications.

### SUBJECT TO RENDER
- **Target Subject**: {GENERATE_ARRAY}
- **Composition**: Centered, style-focused, clean framing.

### ARTISTIC FOUNDATION
- **Medium & Aesthetic**: {VISUAL_MEDIUM} | {AESTHETIC}
- **Atmosphere & Mood**: {ATMOSPHERE} | {MOOD}
- **Color Palette**: {COLOR_PALETTE}

### TECHNICAL SPECIFICATIONS
- **Lighting Configuration**: {LIGHTING}
- **Texture & Detail**: {TEXTURE} at {DETAIL_LEVEL} detail level.
- **Optical Qualities**: {DEPTH_OF_FIELD} depth of field with {FILM_GRAIN} grain.
- **Motion Character**: {MOTION}

### ADDITIONAL CONTEXT
{ADDITIONAL_STYLE_NOTES}

### OUTPUT REQUIREMENT
Produce ONE high-fidelity image that serves as the 'Visual North Star' for this specific subject, ensuring all style variables are harmonized. Aspect Ratio: 1:1.
```

**`{GENERATE_ARRAY}` values:**
- Character: `[{"type": "character", "description": "A character appropriate to this style and context"}]`
- Object: `[{"type": "object", "description": "An object or prop appropriate to this style and context"}]`
- Environment: `[{"type": "environment", "description": "An environment or location appropriate to this style and context"}]`

### Web Implementation

The web uses a **simpler prompt** in `style-generation.ts`:
```
Generate an image of {subject}.
{requirements}
Apply this visual style throughout: {styleDescription}
```

**🔴 GAP:** Web prompts are dramatically simpler — no JSON system prompt, no structured sections, no "Visual DNA" framing. This likely produces lower quality and less consistent results.

---

## 5. Prompt Templates — Character Asset

### System Prompt

```json
{
  "role": "Lead Character Concept Artist & Technical Illustrator",
  "instruction": "You are a specialist in creating production-ready character turnaround sheets...",
  "core_directives": [
    "LAYOUT: Exactly four full-body views arranged in a single horizontal row on a 4:3 canvas.",
    "BACKGROUND: Absolute solid white (#FFFFFF) studio background...",
    "CONSISTENCY: Proportions, clothing, colors, and features must be identical...",
    "ISOLATION: No text, labels, guide lines, or UI elements...",
    "STYLE INTEGRATION: Render the character using the specific medium..."
  ],
  "perspective_logic": [
    "View 1 (Left): Full Frontal",
    "View 2: Profile (Side)",
    "View 3: Full Back",
    "View 4 (Right): 3/4 Perspective"
  ]
}
```

### User Prompt

```
Generate a professional character reference turnaround sheet.

### SUBJECT IDENTITY
- **Character Description**: {CHARACTER_DESCRIPTION}
- **Framing**: Full-body, head-to-toe visibility.

### VISUAL DNA APPLICATION
- **Medium**: {VISUAL_MEDIUM}
- **Aesthetic & Mood**: {AESTHETIC} | {MOOD}
- **Lighting & Color**: {LIGHTING} | {COLOR_PALETTE}
- **Texture & Detail**: {TEXTURE} at {DETAIL_LEVEL} detail level.
- **Optical Attributes**: {DEPTH_OF_FIELD} and {FILM_GRAIN} grain.

### TECHNICAL LAYOUT REQUIREMENTS
- **Format**: 4x1 horizontal strip (4 views in a single row).
- **Angles**: Front, Side, Back, 3/4 View.
- **Aspect Ratio**: 4:3
- **Background**: Solid, pure white (#FFFFFF).
- **Negative Constraints**: NO text, NO labels, NO lines, NO grids, NO environment, NO props unless specified.

### FINAL QUALITY GOAL
Ensure the character looks identical in all views, treated with the specific {VISUAL_MEDIUM} style provided.
```

**Placeholder `{CHARACTER_DESCRIPTION}`:** Combines user description + natural language attributes:
> "A tall warrior in leather armor The character's age is young adult. The character has a muscular build. The character is wearing leather armor clothing."

### Web Implementation

Web uses `asset-generation.ts`:
```
Create a 4x1 horizontal turnaround sheet of a CHARACTER on a pure white background.
Panels (left to right): Front view, Side view, Back view, 3/4 view.
...
Character name: {name}
Description: {description}
{styleBlock}
```

**🔴 GAP:** Web prompt is much simpler — no structured JSON system prompt, no "Visual DNA" sections, no explicit negative constraints. Character attributes are not compiled into natural language descriptions.

---

## 6. Prompt Templates — Object Asset

### System Prompt

```json
{
  "role": "Master Object Designer & Technical Asset Architect",
  "instruction": "...production-ready object turnaround sheets. 2x2 grid...",
  "core_directives": [
    "GRID ARCHITECTURE: Arrange views in a 2x2 grid. Top-Left: Front; Top-Right: Back; Bottom-Left: Side; Bottom-Right: 3/4.",
    "MATERIAL CONSISTENCY: Surfaces, textures, wear-and-tear...",
    "STUDIO ISOLATION: solid, pure white (#FFFFFF) background...",
    "STYLE INTEGRATION: ...",
    "CLEAN ASSET POLICY: No text, labels, pointers, dimension lines..."
  ]
}
```

### User Prompt

```
Generate a technical 2x2 object reference turnaround sheet...

### OBJECT IDENTITY
- **Description**: {OBJECT_DESCRIPTION}

### VISUAL DNA APPLICATION
(same placeholder pattern as character)

### TECHNICAL LAYOUT
- **Format**: 2x2 Quadrant Grid (Front, Back, Side, 3/4 View).
- **Aspect Ratio**: 4:3
- **Background**: Solid White (#FFFFFF).
```

### Web Implementation

Web has equivalent `asset-generation.ts` for objects with `2x2 quadrant grid` — structurally similar but simpler prompts. Same gap as character.

---

## 7. Prompt Templates — Set Asset

### System Prompt

```json
{
  "role": "Master Production Designer & Cinematic Environment Architect",
  "instruction": "...high-fidelity environmental concept art...",
  "core_directives": [
    "SPATIAL CLARITY: ...",
    "CINEMATIC RIGIDITY: Strictly adhere to specified framing, lens type, perspective...",
    "ATMOSPHERIC DEPTH: ...",
    "STYLE SYNERGY: ...",
    "PRODUCTION UTILITY: ..."
  ]
}
```

### User Prompt

Includes camera parameters unique to sets:
```
### CINEMATIC CONFIGURATION
- **Framing & Shot Type**: {FRAMING}
- **Perspective & Lens**: {PERSPECTIVE} view with {LENS_TYPE} characteristics.
- **Optical Effects**: {MOTION_BLUR} and {CAMERA_LIGHTING}.

### VISUAL DNA APPLICATION
(standard style placeholders)

### TECHNICAL SPECIFICATIONS
- **Aspect Ratio**: {ASPECT_RATIO}
```

**Key:** Sets use the project's aspect ratio (e.g., 16:9), not the fixed 4:3 used by characters/objects.

### Web Implementation

Web has a simpler set prompt. **🔴 Missing:** Camera parameter placeholders (framing, perspective, lens type, etc.) for sets.

---

## 8. Prompt Templates — Frame Composition

### System Prompt

```json
{
  "role": "Cinematic Lead Compositor & Keyframe Director",
  "instruction": "...synthesize individual assets into a singular, high-fidelity cinematic keyframe...",
  "core_directives": [
    "ASSET SYNTHESIS: Integrate all referenced characters and objects from {ASSETS_JSON}...",
    "GLOBAL LIGHTING UNITY: Ensure all elements illuminated by same light sources...",
    "CINEMATIC RIGIDITY: Framing, lens type, and perspective are absolute requirements...",
    "SPATIAL COHERENCE: Maintain realistic scale and depth-of-field...",
    "FRAME INTEGRITY: Fill entire aspect ratio. No letterboxing...",
    "NARRATIVE FLOW: Composition must clearly depict the action or 'beat'..."
  ]
}
```

### User Prompt

```
Compose a production-ready cinematic keyframe...

### NARRATIVE & SCENE CONTEXT
- **Action/Beat**: {FRAME_DESCRIPTION}
- **Environment Details**: {FRAME_LOCATION} | {FRAME_TIME} | {FRAME_WEATHER}
- **Spatial Character**: {FRAME_SCALE} scale with {FRAME_ARCHITECTURE} and {FRAME_ATMOSPHERE}.

### ASSET REFERENCES
- **Assets to Include**: {ASSETS_JSON}

### CINEMATIC CAMERA SPECIFICATIONS
- **Framing & Composition**: {FRAMING} | {COMPOSITION}
- **Perspective & Lens**: {PERSPECTIVE} through {LENS_TYPE}
- **Optical Attributes**: {MOTION_BLUR} and {CAMERA_LIGHTING}.

### VISUAL DNA (STYLE LOCK)
(standard style placeholders)

### TECHNICAL CONSTRAINTS
- **Negative Constraints**: {NEGATIVE_PROMPT}. No text, no letterboxing, no grid lines.
```

**Frame-specific placeholders:**
- `{ASSETS_JSON}` — JSON array of `{ "name": "...", "type": "character|object|set" }`
- `{FRAME_LOCATION}`, `{FRAME_TIME}`, `{FRAME_WEATHER}`, `{FRAME_SCALE}`, `{FRAME_ARCHITECTURE}`, `{FRAME_ATMOSPHERE}` — from `AssetAttributeSet`

### Web Implementation

**🔴 MISSING ENTIRELY.** The web has no frame generation API route or prompts. This is a major gap.

---

## 9. Prompt Templates — Shot Video

### System Prompt

```json
{
  "role": "Master Cinematographer & AI Motion Director",
  "instruction": "...specialized in 'Temporal Style Persistence' and 'Persistent 3D Geometry'...",
  "core_directives": [
    "IDENTITY ANCHORING: Treat reference images as 'Fixed Truth'...",
    "SPATIAL PERMANENCE: Objects must remain locked in 3D coordinates...",
    "TEMPORAL CONSISTENCY: Zero-tolerance for flickering, texture swimming, or morphing...",
    "CINEMATIC LOGIC: Execute movements with fixed focal lengths...",
    "CANVAS INTEGRITY: 100% frame utilization. No letterboxing."
  ]
}
```

### User Prompt

```
Generate a high-fidelity cinematic video shot...

### NARRATIVE & ACTION
- **Narrative Beat**: {NARRATIVE}
- **Pacing & Audio Cues**: {AUDIO_PROMPT}
- **Duration**: {DURATION}

### VISUAL ANCHORS (REFERENCE DATA)
- **Source Assets**: {REFERENCE_IMAGES_JSON}

### CINEMATOGRAPHY & CAMERA
- **Movement**: {CAMERA_MOVEMENT}
- **Framing & Perspective**: {FRAMING} | {PERSPECTIVE}
- **Lens & Optics**: {LENS_TYPE} with {MOTION_BLUR} and {CAMERA_LIGHTING}.

### VISUAL DNA (STYLE LOCK)
(standard style placeholders)

### TECHNICAL CONSTRAINTS
- **Aspect Ratio**: {ASPECT_RATIO}
- **Resolution**: {RESOLUTION}

### SCENE EXCLUSIONS
Strictly exclude: new characters, identity swaps, character morphing, shifting architecture, disappearing furniture, jump cuts, flickering lighting, extra limbs, distorted faces{USER_EXCLUSIONS_SUFFIX}.
```

**Key details:**
- `{USER_EXCLUSIONS_SUFFIX}` — appends user's negative prompt as `, {negativePrompt}` or empty string
- Shot stability guardrails are always prepended to exclusions
- `negativePrompt` is NOT sent as an API parameter — it's in the prompt text
- Empty values are cleaned from the prompt (no "not specified" noise)

### Web Implementation

**🔴 MISSING.** Web has no shot generation API route or prompt templates. The `gemini.ts` has the Veo API calls but no prompt construction for shots.

---

## 10. Prompt Templates — Refinement

The Mac app has **separate refine templates for each asset type** plus frames. All follow the same pattern:

### Pattern

**System:** `"Senior Iterative {Type} Designer"` with `"Delta-Only"` update philosophy — change only what's requested, lock everything else.

**User:**
```
Execute a precision refinement on the current {type} reference sheet.

### REFINEMENT INSTRUCTIONS
- **Requested Changes**: {REFINEMENT_PROMPT}

### ASSET SPECIFICATIONS (LOCKED)
- Layout, Aspect Ratio, Background, Visual DNA from previous version

### CRITICAL CONSTRAINTS
- Do NOT change identity beyond specified instructions
- Ensure changes applied consistently to all views

### FINAL TASK
Generate the updated reference sheet incorporating changes while preserving quality.
```

### Types with refine templates:
| Type | Layout Lock | Unique Aspects |
|------|------------|----------------|
| Character | 4x1 strip, 4:3, white bg | Identity persistence, all 4 views |
| Object | 2x2 grid, 4:3, white bg | Material integrity, form persistence |
| Set | Original framing/lens/perspective | Spatial continuity, architectural persistence |
| Frame | Camera position locked, all assets locked | Compositional persistence, narrative delta |

### Web Implementation

Web has `buildRefinementPrompt()` in `asset-generation.ts` but it's **extremely basic:**
```
Refine the following prompt for a {type}...
ORIGINAL PROMPT: ...
REFINEMENT INSTRUCTIONS: ...
{styleBlock}
```

**🔴 GAP:** Web refinement doesn't use conversation-based API calls, doesn't have per-type templates, doesn't lock layout/identity. See [Section 14](#14-conversation-based-refinement-flow).

---

## 11. Prompt Templates — Shot Extension

### System Prompt

```json
{
  "role": "Master Temporal Continuity Specialist & Video Sequence Architect",
  "instruction": "...seamless temporal extension...Zero-Seam Transition...",
  "core_directives": [
    "TEMPORAL LOCK: Extension begins exactly where source ends...",
    "IDENTITY PERSISTENCE: 100% visual fidelity...",
    "MOTION INERTIA: Continue existing kinetic energy...",
    "ENVIRONMENTAL STABILITY: Architecture, lighting unchanged...",
    "ASPECT RATIO RIGIDITY: Fill 100% of frame...",
    "NARRATIVE PROGRESSION: Advance story as described..."
  ]
}
```

### User Prompt

Same structure as shot prompt but with continuity emphasis:
```
### EXTENSION NARRATIVE
- **Continuation Action**: {NARRATIVE}
- **Pacing & Audio Cues**: {AUDIO_PROMPT}

### SOURCE ANCHORS (CONTINUITY DATA)
- **Terminal State References**: {REFERENCE_IMAGES_JSON}

### CINEMATOGRAPHY (LOCKED)
- Maintain previous camera movement, framing, perspective

### SCENE EXCLUSIONS
(same stability guardrails + user exclusions)
```

### How Extension Works in Mac App

1. Original shot generates → stores `videoReference` (the download URI)
2. Extension sends `instance.video.uri = videoReference` + new prompt
3. Forces `veo-3.1-generate-preview` model (only model supporting extensions)
4. Extension adds ~7 seconds
5. New `videoReference` stored for chaining further extensions
6. Max 20 extensions or 180 seconds total

### Web Implementation

**🔴 MISSING.** Web `gemini.ts` has the `extensionVideoUri` parameter wired up but no UI, route, or prompt construction for extensions.

---

## 12. Prompt Templates — Style Extraction

### System Prompt

```json
{
  "role": "Expert Visual Style Forensic Analyst",
  "instruction": "...'Style DNA' extraction. Deconstruct a reference image into core visual parameters...",
  "critical_constraints": [
    "NO BRAND/IP NAMES: Never mention specific directors, movies, games, or artists.",
    "CHARACTER LIMIT: Each parameter MAXIMUM 200 characters.",
    "STYLE OVER CONTENT: Ignore 'what', focus on 'how'.",
    "TECHNICAL TERMINOLOGY: Use cinematography and art-theory terms."
  ]
}
```

### User Prompt

```
Extract the Visual DNA from the provided image and return a JSON object.

### EXTRACTION SCHEMA
- medium: Select ONE: 16mm Film, 35mm Film, 70mm Film, VHS, DV, Photorealistic, 3D CGI, ...
- film_grain: None, Subtle, Moderate, Heavy, Vintage
- depth_of_field: Describe focal depth...
- lighting: Describe light quality... (Max 200 chars)
- color_palette: ...
- aesthetic: ...
- atmosphere: ...
- mood: ...
- motion_style: ...
- texture: ...
- detail_level: Integer 0-100
- additional_notes: ...

### OUTPUT FORMAT
Return ONLY a valid JSON object.
```

### API Call (`StyleAnalysisService.swift`)

Uses **text-only Gemini model** (`gemini-2.5-flash`) with:
- `temperature: 0.3` (low for consistency)
- `responseMimeType: "application/json"` (structured output)
- Image sent as `inline_data` with the analysis prompt

### Web Implementation

**🔴 MISSING ENTIRELY.** No style extraction/analysis feature in the web app.

---

## 13. Style Compilation & Placeholder System

### Mac App (`StyleSheetService.swift`)

The Mac app has a sophisticated placeholder replacement system:

#### `compileStyleValues(from: VisualStyle) -> [String: String]`

Produces a dictionary of all style placeholders:

| Placeholder | Source |
|------------|--------|
| `{VISUAL_MEDIUM}` | `style.medium?.rawValue` |
| `{ASPECT_RATIO}` | `style.aspectRatio?.displayName` |
| `{FILM_GRAIN}` | `style.filmGrain?.rawValue` |
| `{DEPTH_OF_FIELD}` | `style.depthOfField?.rawValue` |
| `{LIGHTING}` | `style.activeLighting` (preset or manual) |
| `{COLOR_PALETTE}` | `style.activeColorPalette` |
| `{AESTHETIC}` | `style.activeAesthetic` |
| `{ATMOSPHERE}` | `style.activeAtmosphere` |
| `{MOOD}` | `style.activeMood` |
| `{MOTION}` | `style.activeMotion` |
| `{TEXTURE}` | `style.activeTexture` |
| `{DETAIL_LEVEL}` | `"\(style.detailLevel)%"` |
| `{ADDITIONAL_STYLE_NOTES}` | `style.customPrompt` |

#### Attribute Description Generation

Mac app converts structured attributes to natural language:

```swift
// Character: "The character's age is young adult. The character has a muscular build."
// Object: "The object is medium in size. The object is made of wood."
// Set: "The location is urban. The time of day is night."
```

These are **appended to the description** in the `{CHARACTER_DESCRIPTION}` / `{OBJECT_DESCRIPTION}` / `{SET_DESCRIPTION}` placeholders.

#### JSON Cleanup

The `cleanJSON()` method removes lines with empty string values and fixes trailing commas — this prevents "not specified" noise in filtered prompts.

### Web App (`compile-style.ts`)

Web has `compileStyleValues()` that produces the same placeholder keys but:

**🔴 Gaps:**
- No attribute-to-natural-language conversion
- No JSON cleanup for empty values
- No separate compilation for frames, shots, or extensions
- No camera parameter compilation

---

## 14. Conversation-Based Refinement Flow

### How it works in Mac App

1. **Initial generation** creates a `ConversationHistory` from the original prompt + generated image
2. **Refinement** sends the FULL conversation as multi-turn `contents[]`:
   ```json
   {
     "contents": [
       { "parts": [{ "text": "original prompt" }] },           // Turn 1: user
       { "parts": [{ "inline_data": { ... } }] },              // Turn 2: model response (image)
       { "parts": [{ "text": "refine prompt" }, { "inline_data": { ... } }] }  // Turn 3: user + current image
     ]
   }
   ```
3. Each refinement adds to the conversation, maintaining context
4. The structured refine template (system + user with `{REFINEMENT_PROMPT}`) is used as the text prompt
5. First refinement includes system prompt; subsequent ones use user template only

### Key API detail

`responseModalities: ["IMAGE"]` — refinement expects image-only response.

### Web Implementation

**🔴 Web has NO conversation-based refinement.** The `asset/route.ts` appends conversation history as text but doesn't send it as multi-turn `contents[]`. The Gemini API call is a single-turn call.

### TypeScript Migration

```typescript
async function refineWithConversation(
  history: ConversationMessage[],
  newPrompt: string,
  currentImage: Buffer,
  model: string,
  apiKey: string,
  aspectRatio: string,
): Promise<Buffer> {
  const contents: any[] = [];

  // Replay conversation history
  for (const msg of history) {
    const parts: any[] = [];
    if (msg.text) parts.push({ text: msg.text });
    if (msg.imageData) {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: Buffer.from(msg.imageData).toString("base64"),
        },
      });
    }
    if (parts.length) contents.push({ parts });
  }

  // Add new refinement turn
  contents.push({
    parts: [
      { text: newPrompt },
      {
        inline_data: {
          mime_type: "image/png",
          data: currentImage.toString("base64"),
        },
      },
    ],
  });

  const body = {
    contents,
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  // POST to generateContent...
}
```

---

## 15. Batch Generation Flow

### Mac App

For batch (multiple drafts at once), the Mac app uses a clever numbered prompt approach:

```
Call the image generation function with the following frequency. After each image generation, always check the number. You may finish when the last number is matched.

[Prompt for image 1: {prompt}]
[Prompt for image 2: {prompt}]
[Prompt for image 3: {prompt}]
```

With `responseModalities: ["TEXT", "IMAGE"]` to get multiple images back.

If fewer images returned than requested, it falls back to sequential single-image calls.

### Web Implementation

Web doesn't have batch generation support. Each call generates 1 image.

**🟡 Lower priority** — can be added later for UX improvement.

---

## 16. Multi-Reference Image Flow

### Mac App

`generateImageWithMultipleReferences()` sends multiple images as separate `inline_data` parts in a single content:

```json
{
  "contents": [{
    "parts": [
      { "text": "{prompt}" },
      { "inline_data": { "mime_type": "image/png", "data": "{base64_1}" } },
      { "inline_data": { "mime_type": "image/png", "data": "{base64_2}" } },
      { "inline_data": { "mime_type": "image/png", "data": "{base64_3}" } }
    ]
  }]
}
```

Used for:
- Frame composition (reference images from selected assets)
- Asset refinement with style references

### Web Implementation

Web `gemini.ts` already supports `referenceImages` parameter — **✅ implemented** in the API layer but not yet used for frame generation (which doesn't exist yet).

---

## 17. Video Extension Flow

### Mac App Flow

1. Generate shot → get `videoReference` (download URI)
2. User provides extension narrative + optional new camera/style params
3. Build extension prompt using `shotExtendSystemPromptJSON` + `shotExtendUserPromptJSON`
4. Call `extendVideo()`:
   - `instance.video.uri = videoReference`
   - `instance.prompt = extensionPrompt`
   - Forces `veo-3.1-generate-preview` model
   - No `durationSeconds` param (API determines: ~7s)
5. Poll for completion
6. Download extended video → store new `videoReference`
7. Can chain up to 20 extensions (max 180s total)

### Extension-specific parameters

The Mac app has **independent camera/style controls for extensions:**
- `extensionCameraMovement`
- `extensionFraming`, `extensionPerspective`, `extensionComposition`
- `extensionLensType`, `extensionMotionBlur`, `extensionLighting`
- `extensionAudioPrompt`
- `extensionIncludeStyle` (toggle to inherit Visual Style)

### Web Implementation

**🔴 MISSING.** The `gemini.ts` has `extensionVideoUri` parameter support in `startVideoGeneration()` but there's no UI, route, or prompt construction.

---

## 18. Gap Analysis: Mac App vs Web

### Critical Missing Features (🔴)

| Feature | Mac App | Web App | Priority |
|---------|---------|---------|----------|
| JSON-structured prompt templates | Full system+user for all types | Simple concatenated strings | **P0** |
| `imageConfig` in Gemini API calls | ✅ aspectRatio + imageSize | ❌ (aspect ratio in prompt text) | **P0** |
| Frame generation (compose assets) | Full pipeline | Missing entirely | **P1** |
| Shot generation (video from frames) | Full pipeline with Veo | Missing (API layer exists) | **P1** |
| Conversation-based refinement | Multi-turn with image context | Single-turn text append | **P1** |
| Shot video extension | Chain extensions with Veo | Missing | **P2** |
| Style extraction from image | Gemini vision + JSON schema | Missing | **P2** |
| Batch generation (multi-draft) | Numbered prompt technique | Missing | **P3** |
| Resolution control (1K/2K/4K) | imageSize param per model | Missing | **P2** |
| Negative prompt in image gen | Supported (not heavily used) | Not implemented | **P3** |
| Empty value cleanup in prompts | cleanJSON removes empty lines | Not implemented | **P2** |
| Natural language attribute descriptions | Character/object/set converters | Missing | **P1** |
| Camera parameters for sets | Framing, perspective, lens type | Missing | **P1** |
| Frame attributes (location, time, weather) | Full attribute set | Missing | **P1** |
| Shot stability guardrails | Auto-prepended to exclusions | Missing | **P1** |
| Developer mode (custom templates) | Full UserDefaults system | Not applicable (admin panel?) | **P3** |

### Partially Implemented (🟡)

| Feature | Status |
|---------|--------|
| Veo API integration | API layer complete, no UI/routes for shots |
| Reference image support | API layer supports it, asset route uses it |
| Style presets | Different implementation approach (web has its own) |
| Draft history / versioning | Basic implementation exists |

### Web-Only Features (not in Mac)

| Feature |
|---------|
| Imagen 4 model support |
| Credit system / billing |
| R2 cloud storage |
| Multi-user / auth |
| Generation logging / audit trail |

---

## 19. Migration Notes

### Prompt Template Migration Strategy

1. **Create `src/lib/prompts/templates/` directory** with one file per generation type:
   - `style-reference.ts` — system + user templates
   - `character-asset.ts`
   - `object-asset.ts`
   - `set-asset.ts`
   - `frame-composition.ts`
   - `shot-video.ts`
   - `refine-character.ts`, `refine-object.ts`, `refine-set.ts`, `refine-frame.ts`
   - `shot-extension.ts`
   - `style-extraction.ts`

2. **Each file exports:**
   ```typescript
   export const SYSTEM_PROMPT = `{...JSON...}`;
   export const USER_PROMPT = `...template with {PLACEHOLDERS}...`;
   ```

3. **Create `src/lib/prompts/compile.ts`** with:
   - `compileStyleValues(style)` — already exists, enhance
   - `compileCharacterValues(description, attributes, style)`
   - `compileObjectValues(description, attributes, style)`
   - `compileSetValues(description, attributes, style, cameraParams)`
   - `compileFrameValues(description, cameraParams, assets, style, negativePrompt, frameAttrs)`
   - `compileShotValues(narrative, audioPrompt, negativePrompt, refs, camera, style)`
   - `cleanEmptyPlaceholders(prompt)` — remove lines with empty values

4. **Create prompt builder:**
   ```typescript
   function buildPrompt(systemTemplate: string, userTemplate: string, values: Record<string, string>): string {
     let user = userTemplate;
     for (const [key, value] of Object.entries(values)) {
       user = user.replaceAll(`{${key}}`, value);
     }
     user = cleanEmptyPlaceholders(user);
     return `SYSTEM INSTRUCTIONS:\n${systemTemplate}\n\n---\n\nUSER REQUEST:\n${user}`;
   }
   ```

### Gemini API Fix

Update `gemini.ts` to use proper `imageConfig`:

```typescript
const body = {
  contents: [{ parts }],
  generationConfig: {
    responseModalities: ["IMAGE"],  // or ["TEXT", "IMAGE"] for batch
    imageConfig: {
      aspectRatio: params.aspectRatio ?? "1:1",
      imageSize: params.resolution,  // "1K", "2K", "4K" for pro model
    },
  },
};
```

### New API Routes Needed

1. `POST /api/generate/frame` — Frame composition
2. `POST /api/generate/shot` — Shot video generation (start + poll)
3. `GET /api/generate/shot/status` — Poll shot generation
4. `POST /api/generate/shot/extend` — Video extension
5. `POST /api/analyze/style` — Style extraction from image
6. `POST /api/generate/asset/refine` — Proper conversation-based refinement

### Attribute Description Helpers

```typescript
function describeCharacterAttributes(attrs: Record<string, string>): string {
  const parts: string[] = [];
  if (attrs.Age) parts.push(`The character's age is ${attrs.Age.toLowerCase()}.`);
  if (attrs.Build) parts.push(`The character has a ${attrs.Build.toLowerCase()} build.`);
  if (attrs.Clothing) parts.push(`The character is wearing ${attrs.Clothing.toLowerCase()} clothing.`);
  if (attrs.Hair) parts.push(`The character's hair is ${attrs.Hair.toLowerCase()}.`);
  if (attrs.Expression) parts.push(`The character has a ${attrs.Expression.toLowerCase()} expression.`);
  if (attrs.Posture) parts.push(`The character is in a ${attrs.Posture.toLowerCase()} posture.`);
  return parts.join(" ") || "";
}

// Similar for object (Size, Material, Condition, Style, Era, Function)
// and set (Location, Time, Weather, Scale, Architecture, Atmosphere)
```
