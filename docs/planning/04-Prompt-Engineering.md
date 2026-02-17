# 04 -- Prompt Engineering

> Comprehensive reference for ShotMaker's prompt compilation pipeline, template
> system, placeholder resolution, and AI-facing prompt architecture.

---

## Table of Contents

1. [Prompt Architecture Overview](#1-prompt-architecture-overview)
2. [StyleSheetService -- Template Compilation Engine](#2-stylesheetservice----template-compilation-engine)
3. [Placeholder System](#3-placeholder-system)
4. [Style Compilation Pipeline](#4-style-compilation-pipeline)
5. [Prompt Types](#5-prompt-types)
   - 5.1 [Style Reference Generation](#51-style-reference-generation)
   - 5.2 [Character Asset Generation](#52-character-asset-generation)
   - 5.3 [Object Asset Generation](#53-object-asset-generation)
   - 5.4 [Set Asset Generation](#54-set-asset-generation)
   - 5.5 [Frame Composition](#55-frame-composition)
   - 5.6 [Shot Video Generation](#56-shot-video-generation)
   - 5.7 [Shot Extension](#57-shot-extension)
   - 5.8 [Character Refinement](#58-character-refinement)
   - 5.9 [Object Refinement](#59-object-refinement)
   - 5.10 [Set Refinement](#510-set-refinement)
   - 5.11 [Frame Refinement](#511-frame-refinement)
   - 5.12 [Style Extraction](#512-style-extraction)
6. [Batch Generation Trick](#6-batch-generation-trick)
7. [Conversation-Based Refinement](#7-conversation-based-refinement)
8. [DeveloperSettings Customization](#8-developersettings-customization)

---

## 1. Prompt Architecture Overview

### Two-Tier Prompt Structure

Every generation request in ShotMaker uses a **two-tier prompt architecture**:

| Tier | Purpose | Content |
|------|---------|---------|
| **System prompt** | Meta-instructions that define the AI's role, constraints, and behavioral directives | JSON-structured role definition with `core_directives`, `logic_rules`, and specialized framework sections |
| **User prompt** | The specific generation request with concrete parameters filled in | Markdown-structured request with placeholder-substituted values organized into labeled sections |

These two tiers are assembled into a single text string sent to the Gemini API in the format:

```
SYSTEM INSTRUCTIONS:
{system prompt template -- JSON role definition}

---

USER REQUEST:
{user prompt template -- with all placeholders resolved}
```

### renderedPrompt vs compiledPrompt (fullPrompt)

ShotMaker maintains **two parallel prompt representations** for every draft:

| Property | Stored On | Purpose | Format |
|----------|-----------|---------|--------|
| `renderedPrompt` | `Draft.renderedPrompt` | Human-readable display in the UI prompt inspector | Sectioned plain text with `=== SECTION NAME ===` headers |
| `fullPrompt` | `Draft.fullPrompt` | The actual compiled prompt sent to the AI API | System+User JSON template with all placeholders resolved |

The `renderedPrompt` is computed by the ViewModel (e.g., `AssetCreationViewModel.renderedPrompt`,
`FrameBuilderViewModel.renderedPrompt`, `ShotAnimationViewModel.renderedPrompt`) and shows a
clean, human-scannable summary of all parameters. It is captured at generation time and stored on
the draft so it can be inspected later even if parameters change.

The `fullPrompt` (also called `compiledPrompt` conceptually) is built by the private `buildFullPrompt()` /
`buildFramePrompt()` / `buildShotPrompt()` methods in each ViewModel, which delegate to
`StyleSheetService` for template compilation and placeholder substitution.

### Prompt Assembly Flow

```
User Parameters (UI)
       |
       v
ViewModel.buildFullPrompt()
       |
       +---> DeveloperSettings (select template: default or custom)
       |
       +---> StyleSheetService.compile*Values() -- builds placeholder dictionary
       |
       +---> StyleSheetService.generate*JSONPrompt() -- substitutes placeholders into template
       |            |
       |            +---> String.replacingOccurrences(of: "{PLACEHOLDER}", with: value)
       |            |
       |            +---> cleanJSON() -- removes lines with empty string values
       |
       v
  Final prompt string: "SYSTEM INSTRUCTIONS:\n...\n---\nUSER REQUEST:\n..."
       |
       v
GoogleGeminiProvider.generateImage(prompt: ...)
```

---

## 2. StyleSheetService -- Template Compilation Engine

**File:** `Services/StyleSheetService.swift`

`StyleSheetService` is a singleton (`StyleSheetService.shared`) that serves as the central prompt
compilation engine. It transforms structured data models into natural language prompt strings.

### Core Methods

#### `compileStyleSheet(from: VisualStyle) -> String`

Converts a `VisualStyle` into a natural language "style sheet" -- a multi-line string of
`"Label: Value"` pairs. Only includes parameters that have actual values (non-nil, non-empty).
This is used for the `renderedPrompt` display and for legacy prompt formats.

**Output format:**
```
Visual Medium: 35mm Film
Aspect Ratio: 16:9
Film Grain: Subtle
Depth of Field: Shallow (f/1.4-2.8)
Lighting: High contrast noir lighting with deep shadows
Color Palette: Desaturated blues and warm amber highlights
Detail Level: 80%
```

**Mode awareness:** Uses `style.activeLighting`, `style.activeColorPalette`, etc., which are
computed properties that return either the preset (dropdown) or manual (free text) value based
on `style.isAdvancedMode`.

#### `compileStyleValues(from: VisualStyle) -> [String: String]`

Converts a `VisualStyle` into a **placeholder dictionary** for JSON template substitution.
Returns a `[String: String]` where keys are placeholder names (without braces) and values are
the resolved strings.

**Key behavior:** Unset values default to `"not specified"` or `"none"` rather than empty strings.
This is used for asset generation prompts where the template expects every placeholder to have
a visible value.

#### `compileFrameValues(...)` and `compileShotValuesFiltered(...)`

These compile methods use a different strategy: unset values default to **empty strings** (`""`),
which are later removed by `cleanJSON()`. This produces cleaner prompts for frames and shots
where many parameters are optional.

#### `generate*JSONPrompt(...)` Methods

All `generate*JSONPrompt` methods follow the same pattern:

1. Call the appropriate `compile*Values()` to build the placeholder dictionary
2. Iterate over the dictionary, replacing `{PLACEHOLDER_NAME}` with the resolved value
3. Optionally call `cleanJSON()` to remove empty-value lines
4. Wrap the result in the `SYSTEM INSTRUCTIONS: ... --- USER REQUEST: ...` format

#### `cleanJSON(String) -> String`

Post-processor that removes lines containing empty string values (pattern: `": ""`) from the
compiled prompt, then fixes trailing commas before closing braces/brackets. This prevents the
prompt from containing noise like `"Framing": ""` when the user has not set that parameter.

#### Natural Language Attribute Generators

Three methods convert asset attribute dictionaries into natural language sentences:

| Method | Input Keys | Example Output |
|--------|-----------|----------------|
| `generateCharacterAttributesDescription` | Age, Build, Clothing, Hair, Expression, Posture | "The character's age is young adult. The character has an athletic build." |
| `generateObjectAttributesDescription` | Size, Material, Condition, Style, Era, Function | "The object is large in size. The object is made of metal." |
| `generateSetAttributesDescription` | Location, Time, Weather, Scale, Architecture, Atmosphere | "The location is urban. The time of day is dusk." |

These are called by `compileCharacterValues()`, `compileObjectValues()`, and `compileSetValues()`
respectively. The generated sentences are **appended directly to the description** placeholder
(`CHARACTER_DESCRIPTION`, `OBJECT_DESCRIPTION`, `SET_DESCRIPTION`).

---

## 3. Placeholder System

### Syntax

Placeholders use the `{PLACEHOLDER_NAME}` syntax -- curly braces around an UPPER_SNAKE_CASE name.
Replacement is performed via `String.replacingOccurrences(of:with:)` in a loop over the compiled
values dictionary.

### Master Placeholder Reference

#### Visual Style Placeholders (shared across most prompt types)

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{VISUAL_MEDIUM}` | `VisualStyle.medium?.rawValue` | e.g., "35mm Film", "3D CGI", "Watercolor" |
| `{ASPECT_RATIO}` | `VisualStyle.aspectRatio?.displayName` | e.g., "16:9", "4:3" |
| `{FILM_GRAIN}` | `VisualStyle.filmGrain?.rawValue` | "None", "Subtle", "Moderate", "Heavy", "Vintage" |
| `{DEPTH_OF_FIELD}` | `VisualStyle.depthOfField?.rawValue` | "Shallow (f/1.4-2.8)", "Moderate (f/4-5.6)", "Deep (f/8-16)" |
| `{LIGHTING}` | `VisualStyle.activeLighting` | Free text or preset lighting description |
| `{COLOR_PALETTE}` | `VisualStyle.activeColorPalette` | Free text or preset color palette description |
| `{AESTHETIC}` | `VisualStyle.activeAesthetic` | Free text or preset aesthetic description |
| `{ATMOSPHERE}` | `VisualStyle.activeAtmosphere` | Free text or preset atmosphere description |
| `{MOOD}` | `VisualStyle.activeMood` | Free text or preset mood description |
| `{MOTION}` | `VisualStyle.activeMotion` | Free text or preset motion style description |
| `{TEXTURE}` | `VisualStyle.activeTexture` | Free text or preset texture description |
| `{DETAIL_LEVEL}` | `VisualStyle.detailLevel` | Integer 0-100 formatted as "75%" |
| `{ADDITIONAL_STYLE_NOTES}` | `VisualStyle.customPrompt` | User's custom free-text notes |

#### Camera Placeholders

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{FRAMING}` | `CameraParameters.angle?.rawValue` or `ShotAngle` | "Extreme Wide Shot", "Close-up", "Two Shot", etc. |
| `{PERSPECTIVE}` | `CameraParameters.perspective?.rawValue` or `CameraPerspective` | "Eye Level", "High Angle", "Dutch Angle", etc. |
| `{COMPOSITION}` | `CameraParameters.composition?.rawValue` or `CompositionRule` | "Rule of Thirds", "Golden Ratio", "Centered", etc. |
| `{LENS_TYPE}` | `CameraParameters.lensType?.rawValue` or `LensType` | "35mm", "Fisheye", "Wide Angle", "Anamorphic", etc. |
| `{MOTION_BLUR}` | `CameraParameters.motionBlurEffect?.rawValue` or `MotionBlurEffect` | "Motion Blur", "Bokeh", "Tilt-Shift", etc. |
| `{CAMERA_LIGHTING}` | `CameraParameters.lightingStyle?.rawValue` or `LightingStyle` | "Natural", "Dramatic", "Golden Hour", "Neon", etc. |
| `{CAMERA_MOVEMENT}` | Camera movement string | "Slow Push In", "Pan Left", "Dolly Forward", etc. |

#### Asset-Specific Placeholders

| Placeholder | Used In | Source | Description |
|-------------|---------|--------|-------------|
| `{CHARACTER_DESCRIPTION}` | Character templates | User prompt + character attributes as sentences | Full character description with appended attribute sentences |
| `{OBJECT_DESCRIPTION}` | Object templates | User prompt + object attributes as sentences | Full object description with appended attribute sentences |
| `{SET_DESCRIPTION}` | Set templates | User prompt + set attributes as sentences | Full set description with appended attribute sentences |
| `{GENERATE_ARRAY}` | Style reference | `StyleReferenceSubjectType.generateArrayJSON` | JSON array describing subject type for style demo |

#### Frame-Specific Placeholders

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{FRAME_DESCRIPTION}` | User's frame description text | The narrative/action beat for this frame |
| `{ASSETS_JSON}` | Selected assets array | JSON array of `{ "name": "...", "type": "..." }` objects |
| `{FRAME_LOCATION}` | `AssetAttributeSet.location?.rawValue` | "Interior", "Urban", "Wilderness", etc. |
| `{FRAME_TIME}` | `AssetAttributeSet.time?.rawValue` | "Dawn", "Midday", "Night", etc. |
| `{FRAME_WEATHER}` | `AssetAttributeSet.weather?.rawValue` | "Clear", "Stormy", "Foggy", etc. |
| `{FRAME_SCALE}` | `AssetAttributeSet.scale?.rawValue` | "Intimate", "Large", "Epic", etc. |
| `{FRAME_ARCHITECTURE}` | `AssetAttributeSet.architecture?.rawValue` | "Modern", "Gothic", "Brutalist", etc. |
| `{FRAME_ATMOSPHERE}` | `AssetAttributeSet.atmosphere?.rawValue` | "Peaceful", "Tense", "Mysterious", etc. |
| `{NEGATIVE_PROMPT}` | User's negative prompt text | What to exclude from the generation |

#### Shot-Specific Placeholders

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{NARRATIVE}` | User's narrative text | The action/story beat for the shot |
| `{AUDIO_PROMPT}` | User's audio direction text | Sound design cues for the video |
| `{DURATION}` | `selectedDuration` formatted as "8s" | Target video duration |
| `{REFERENCE_IMAGES_JSON}` | Selected image items | JSON array of reference image descriptors |
| `{RESOLUTION}` | Video resolution setting | "720p", "1080p", etc. |
| `{USER_EXCLUSIONS_SUFFIX}` | `negativePrompt` | Appended to stability guardrails with leading comma, or empty string |

#### Refinement Placeholders

| Placeholder | Used In | Source | Description |
|-------------|---------|--------|-------------|
| `{REFINEMENT_PROMPT}` | All refine templates | User's refinement instruction text | The specific change the user wants applied |

### Per-Prompt-Type Placeholder Map

| Prompt Type | Style | Camera | Asset-Specific | Frame | Shot | Refine |
|-------------|-------|--------|---------------|-------|------|--------|
| Style Reference | All except ASPECT_RATIO, MOTION | -- | GENERATE_ARRAY | -- | -- | -- |
| Character Asset | All except ASPECT_RATIO, MOTION, ADDITIONAL_STYLE_NOTES | -- | CHARACTER_DESCRIPTION | -- | -- | -- |
| Object Asset | All except ASPECT_RATIO, MOTION, ADDITIONAL_STYLE_NOTES | -- | OBJECT_DESCRIPTION | -- | -- | -- |
| Set Asset | All | FRAMING, PERSPECTIVE, LENS_TYPE, MOTION_BLUR, CAMERA_LIGHTING | SET_DESCRIPTION | -- | -- | -- |
| Frame Composition | All except MOTION | All 6 camera params | -- | All 7 frame params + NEGATIVE_PROMPT + ASSETS_JSON | -- | -- |
| Shot Video | All except MOTION | All 6 camera params + CAMERA_MOVEMENT | -- | -- | NARRATIVE, AUDIO_PROMPT, DURATION, REFERENCE_IMAGES_JSON, RESOLUTION, USER_EXCLUSIONS_SUFFIX | -- |
| Shot Extension | All except MOTION | All 6 camera params + CAMERA_MOVEMENT | -- | -- | NARRATIVE, AUDIO_PROMPT, DURATION, REFERENCE_IMAGES_JSON, RESOLUTION, USER_EXCLUSIONS_SUFFIX | -- |
| Char/Obj/Set Refine | Subset (locked from original) | Subset (locked) | -- | -- | -- | REFINEMENT_PROMPT |
| Frame Refine | Subset (locked from original) | Subset (locked) | -- | -- | -- | REFINEMENT_PROMPT |
| Style Extraction | -- | -- | -- | -- | -- | -- |

### Post-Processing: Empty Value Removal

For **frame** and **shot** prompts, the `cleanJSON()` method is applied after placeholder substitution.
This method:

1. Splits the prompt into lines
2. Filters out any line containing `": ""` (a key with an empty string value)
3. Fixes trailing commas before closing braces/brackets using regex

This ensures that optional camera and style parameters that the user has not configured do not
appear as `"not specified"` noise in the final prompt. The AI receives only the parameters the
user has actively set.

For **asset** prompts (character, object, set), unset values are filled with `"not specified"` or
`"none"` instead, keeping the template structure intact.

---

## 4. Style Compilation Pipeline

The style compilation pipeline transforms `VisualStyle` model parameters into prompt-ready text
through several stages:

### Stage 1: Mode Resolution

`VisualStyle` supports two input modes, controlled by `isAdvancedMode`:

- **Standard mode** (`isAdvancedMode = false`): Uses `preset*` properties (dropdown selections)
- **Advanced mode** (`isAdvancedMode = true`): Uses `manual*` properties (free-form text)

Computed properties (`activeLighting`, `activeColorPalette`, etc.) resolve the correct value
based on the current mode. All compilation methods use these computed properties.

### Stage 2: Dictionary Compilation

`compileStyleValues(from:)` reads each computed property and builds a placeholder dictionary:

```swift
values["VISUAL_MEDIUM"] = style.medium?.rawValue ?? "not specified"
values["LIGHTING"]      = style.activeLighting.isEmpty ? "not specified" : style.activeLighting
values["DETAIL_LEVEL"]  = "\(style.detailLevel)%"
// ... etc.
```

For frame/shot compilation (`compileFrameValues`, `compileShotValuesFiltered`), the "not specified"
fallback is replaced with empty string `""`, which `cleanJSON()` will strip from the output.

### Stage 3: Template Substitution

The compiled dictionary is applied to the user prompt template:

```swift
var userPrompt = userPromptTemplate
for (placeholder, value) in styleValues {
    userPrompt = userPrompt.replacingOccurrences(of: "{\(placeholder)}", with: value)
}
```

### Stage 4: JSON Cleanup (Frame/Shot Only)

`cleanJSON()` removes lines with empty values and fixes JSON comma artifacts:

```swift
// Before cleanup:
// "Framing & Composition": "" | ""
// "Perspective & Lens": "" through ""
//
// After cleanup:
// (lines removed entirely)
```

### Stage 5: Final Assembly

The system template and cleaned user prompt are combined:

```swift
return """
SYSTEM INSTRUCTIONS:
\(systemPromptTemplate)

---

USER REQUEST:
\(userPrompt)
"""
```

---

## 5. Prompt Types

### 5.1 Style Reference Generation

**Trigger:** User clicks "Generate Style" in the Style Definition panel.

**Purpose:** Generate 3 example images (character, object, environment) that demonstrate
the project's visual style. These serve as the "Visual North Star" for the entire project.

**Generation flow:** Three separate API calls are made in parallel, one per subject type
(character, object, environment). Each call uses the same system + user template but with
a different `{GENERATE_ARRAY}` value.

#### System Prompt

**Template key:** `defaultStyleReferenceSystemPromptJSON`

**Role:** "Master Visual Stylist & Concept Architect"

**Purpose:** Instruct the AI to generate a single, high-fidelity reference image that
establishes a consistent aesthetic framework. Emphasizes:
- Single subject focus (no collages, grids, or split-screens)
- Style synthesis over content description
- Technical fidelity in surface materials, light interaction, depth-of-field
- Compositional clarity to showcase style characteristics

**Structure:** JSON object with `role`, `instruction`, `core_directives[]`, and
`style_logic_framework{}`.

#### User Prompt

**Template key:** `defaultStyleReferenceUserPromptJSON`

**Sections:**
- **SUBJECT TO RENDER** -- `{GENERATE_ARRAY}` (JSON array describing the subject type)
- **ARTISTIC FOUNDATION** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{ATMOSPHERE}`, `{MOOD}`, `{COLOR_PALETTE}`
- **TECHNICAL SPECIFICATIONS** -- `{LIGHTING}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`, `{MOTION}`
- **ADDITIONAL CONTEXT** -- `{ADDITIONAL_STYLE_NOTES}`
- **OUTPUT REQUIREMENT** -- Fixed text requesting 1:1 aspect ratio

#### Placeholders

| Placeholder | Filled By |
|-------------|-----------|
| `{GENERATE_ARRAY}` | `StyleReferenceSubjectType.generateArrayJSON` -- returns JSON like `[{"type": "character", "description": "A character appropriate to this style and context"}]` |
| `{VISUAL_MEDIUM}` | `VisualStyle.medium?.rawValue` or "not specified" |
| `{AESTHETIC}` | `VisualStyle.activeAesthetic` or "not specified" |
| `{ATMOSPHERE}` | `VisualStyle.activeAtmosphere` or "not specified" |
| `{MOOD}` | `VisualStyle.activeMood` or "not specified" |
| `{COLOR_PALETTE}` | `VisualStyle.activeColorPalette` or "not specified" |
| `{LIGHTING}` | `VisualStyle.activeLighting` or "not specified" |
| `{TEXTURE}` | `VisualStyle.activeTexture` or "not specified" |
| `{DETAIL_LEVEL}` | `VisualStyle.detailLevel` as percentage |
| `{DEPTH_OF_FIELD}` | `VisualStyle.depthOfField?.rawValue` or "not specified" |
| `{FILM_GRAIN}` | `VisualStyle.filmGrain?.rawValue` or "none" |
| `{MOTION}` | `VisualStyle.activeMotion` or "not specified" |
| `{ADDITIONAL_STYLE_NOTES}` | `VisualStyle.customPrompt` or "none" |

#### References/Images

No reference images are attached. This is a text-to-image generation.

#### Post-Processing

No `cleanJSON()` is applied. "not specified" values are left in place.

---

### 5.2 Character Asset Generation

**Trigger:** User clicks "Generate" on the Asset Creation panel with asset type set to Character.

**Purpose:** Generate a 4x1 horizontal turnaround reference sheet showing Front, Side, Back,
and 3/4 views of the character on a pure white background. Aspect ratio forced to 4:3.

#### System Prompt

**Template key:** `defaultCharacterSystemPromptJSON`

**Role:** "Lead Character Concept Artist & Technical Illustrator"

**Key directives:**
- Exactly four full-body views in a single horizontal row on a 4:3 canvas
- Absolute solid white (#FFFFFF) studio background
- Identical proportions, clothing, colors, features across all four perspectives
- No text, labels, guide lines, or UI elements
- Render using the specific medium, lighting, and texture from the style block

**Perspective logic:** View 1 (Left): Full Frontal, View 2: Profile (Side), View 3: Full Back, View 4 (Right): 3/4 Perspective

#### User Prompt

**Template key:** `defaultCharacterUserPromptJSON`

**Sections:**
- **SUBJECT IDENTITY** -- `{CHARACTER_DESCRIPTION}` with full-body framing
- **VISUAL DNA APPLICATION** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{MOOD}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`
- **TECHNICAL LAYOUT REQUIREMENTS** -- Fixed: 4x1 strip, 4:3 ratio, white background, negative constraints
- **FINAL QUALITY GOAL** -- Style consistency across all views

#### Placeholders

| Placeholder | Filled By |
|-------------|-----------|
| `{CHARACTER_DESCRIPTION}` | User's prompt text + natural language attribute sentences (age, build, clothing, hair, expression, posture) |
| All Visual Style placeholders | Via `compileCharacterValues()` |

**Note:** `{ASPECT_RATIO}` and `{MOTION}` are NOT used in character templates. Character sheets
always use 4:3.

#### References/Images

Optional. If reference images are provided by the user, they are sent as inline base64 data
alongside the prompt via the `generateImage` or `generateImageWithMultipleReferences` API call.

#### Post-Processing

No `cleanJSON()` applied. Unset style values default to "not specified".

---

### 5.3 Object Asset Generation

**Trigger:** User clicks "Generate" on Asset Creation panel with asset type set to Object.

**Purpose:** Generate a 2x2 quadrant grid showing the object from four angles (Front, Back,
Side, 3/4) on a pure white background. Aspect ratio forced to 4:3.

#### System Prompt

**Template key:** `defaultObjectSystemPromptJSON`

**Role:** "Master Object Designer & Technical Asset Architect"

**Key directives:**
- 2x2 grid: Top-Left Front, Top-Right Back, Bottom-Left Side, Bottom-Right 3/4
- Material consistency across all four views
- Studio isolation on solid white (#FFFFFF) background
- Apply texture and detail level to define material physics
- Neutral, even lighting; centered and scaled identically per quadrant

#### User Prompt

**Template key:** `defaultObjectUserPromptJSON`

**Sections:**
- **OBJECT IDENTITY** -- `{OBJECT_DESCRIPTION}`
- **VISUAL DNA APPLICATION** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`
- **TECHNICAL LAYOUT** -- Fixed: 2x2 grid, 4:3 ratio, white background
- **FINAL QUALITY GOAL** -- Design preservation across all four perspectives

#### Placeholders

| Placeholder | Filled By |
|-------------|-----------|
| `{OBJECT_DESCRIPTION}` | User's prompt text + natural language attribute sentences (size, material, condition, style, era, function) |
| All Visual Style placeholders | Via `compileObjectValues()` |

#### References/Images

Same as character: optional reference images sent as inline base64 data.

#### Post-Processing

No `cleanJSON()` applied. Unset style values default to "not specified".

---

### 5.4 Set Asset Generation

**Trigger:** User clicks "Generate" on Asset Creation panel with asset type set to Set.

**Purpose:** Generate a single establishing shot of the environment/location. Unlike character
and object assets, sets use the project's aspect ratio (not forced 4:3) and include camera
parameters in the prompt.

#### System Prompt

**Template key:** `defaultSetSystemPromptJSON`

**Role:** "Master Production Designer & Cinematic Environment Architect"

**Key directives:**
- Spatial clarity: architectural relationships, environmental scale, layout
- Cinematic rigidity: strictly adhere to framing, lens type, perspective
- Atmospheric depth: use lighting and atmosphere for 3D space
- Production utility: blueprint for set builders and cinematographers

#### User Prompt

**Template key:** `defaultSetUserPromptJSON`

**Sections:**
- **SET IDENTITY** -- `{SET_DESCRIPTION}`
- **CINEMATIC CONFIGURATION** -- `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
- **VISUAL DNA APPLICATION** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`
- **TECHNICAL SPECIFICATIONS** -- `{ASPECT_RATIO}`
- **FINAL QUALITY GOAL** -- Harmonize cinematic lens settings with artistic medium

#### Placeholders

| Placeholder | Filled By |
|-------------|-----------|
| `{SET_DESCRIPTION}` | User's prompt text + natural language attribute sentences (location, time, weather, scale, architecture, atmosphere) |
| `{FRAMING}` | `AssetAttributeSet.framing?.rawValue` via `attributes["framing"]` or "Wide establishing shot" |
| `{PERSPECTIVE}` | `attributes["perspective"]` or "not specified" |
| `{LENS_TYPE}` | `attributes["lens_type"]` or "not specified" |
| `{MOTION_BLUR}` | `attributes["motion_blur"]` or "None" |
| `{CAMERA_LIGHTING}` | `attributes["camera_lighting"]` or "not specified" |
| `{ASPECT_RATIO}` | `VisualStyle.aspectRatio?.displayName` or "not specified" |
| All other Visual Style placeholders | Via `compileSetValues()` |

#### References/Images

Optional reference images sent as inline base64 data.

#### Post-Processing

No `cleanJSON()` applied. Unset values default to "not specified".

---

### 5.5 Frame Composition

**Trigger:** User clicks "Generate" in the Frame Builder panel.

**Purpose:** Compose multiple assets (characters, objects, sets) into a single cohesive
cinematic keyframe. This is the most parameter-rich prompt type.

#### System Prompt

**Template key:** `defaultFrameSystemPromptJSON`

**Role:** "Cinematic Lead Compositor & Keyframe Director"

**Key directives:**
- Asset synthesis: integrate all referenced assets matching their original descriptions
- Global lighting unity: same light sources across all elements
- Cinematic rigidity: framing, lens type, perspective are absolute requirements
- Spatial coherence: realistic scale and depth-of-field relationships
- Frame integrity: fill entire aspect ratio, no letterboxing, no text/watermarks
- Narrative flow: composition must depict the described action/beat

**Compositional logic:** Optical physics (depth-of-field, motion blur) and material harmony
(surfaces react to environment: rain on jacket, neon reflecting on car).

#### User Prompt

**Template key:** `defaultFrameUserPromptJSON`

**Sections:**
- **NARRATIVE & SCENE CONTEXT** -- `{FRAME_DESCRIPTION}`, `{FRAME_LOCATION}`, `{FRAME_TIME}`, `{FRAME_WEATHER}`, `{FRAME_SCALE}`, `{FRAME_ARCHITECTURE}`, `{FRAME_ATMOSPHERE}`
- **ASSET REFERENCES** -- `{ASSETS_JSON}`
- **CINEMATIC CAMERA SPECIFICATIONS** -- `{FRAMING}`, `{COMPOSITION}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
- **VISUAL DNA (STYLE LOCK)** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`
- **TECHNICAL CONSTRAINTS** -- `{NEGATIVE_PROMPT}` + fixed text (no text, no letterboxing, no grid lines)

#### Placeholders

All Visual Style, Camera, and Frame placeholders are used. See the master reference above.

Special compilation behavior for frames:
- Camera values from `CameraParameters` (not from `AssetAttributeSet`)
- Frame attributes from `AssetAttributeSet` (location, time, weather, scale, architecture, atmosphere)
- `{ASSETS_JSON}` is a formatted JSON array built from selected assets
- Empty camera/style values default to `""` (not "not specified")
- `DETAIL_LEVEL` only included if different from default (50%)
- `FILM_GRAIN` excluded if value is `.none`

#### References/Images

Asset reference images (from the user's library) are attached as inline base64 data via
`generateImageWithMultipleReferences` if multiple assets are selected, or `generateImage`
for a single reference. The prompt text describes the assets by name and type; the images
provide visual identity anchoring.

#### Post-Processing

`cleanJSON()` **is applied** to the user prompt after placeholder substitution. Lines with
empty string values are removed. This is critical for frame prompts because many camera and
style parameters are optional.

---

### 5.6 Shot Video Generation

**Trigger:** User clicks "Generate Shot" in the Shot Animation panel.

**Purpose:** Generate a cinematic video shot that realizes the described narrative with
reference image fidelity, camera movement, and visual style consistency.

#### System Prompt

**Template key:** `defaultShotSystemPromptJSON`

**Role:** "Master Cinematographer & AI Motion Director"

**Key directives:**
- **Identity anchoring:** Reference images are "Fixed Truth" -- character features, clothing
  details must remain 100% invariant
- **Spatial permanence:** Objects and set pieces locked in 3D coordinates
- **Temporal consistency:** Zero-tolerance for flickering, texture swimming, morphing
- **Cinematic logic:** Execute movements with fixed focal lengths, no "focal length drift"
- **Canvas integrity:** 100% frame utilization, no letterboxing

**Motion logic:** Natural kinematics with weight and center of gravity, consistent depth-of-field
and bokeh, occlusion logic (objects reappear unchanged after passing behind others).

#### User Prompt

**Template key:** `defaultShotUserPromptJSON`

**Sections:**
- **NARRATIVE & ACTION** -- `{NARRATIVE}`, `{AUDIO_PROMPT}`, `{DURATION}`
- **VISUAL ANCHORS** -- `{REFERENCE_IMAGES_JSON}` with 1:1 identity persistence constraint
- **CINEMATOGRAPHY & CAMERA** -- `{CAMERA_MOVEMENT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
- **VISUAL DNA (STYLE LOCK)** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{ATMOSPHERE}`, `{MOOD}`, `{COLOR_PALETTE}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`
- **TECHNICAL CONSTRAINTS** -- `{ASPECT_RATIO}`, `{RESOLUTION}`
- **SCENE EXCLUSIONS** -- Stability guardrails + `{USER_EXCLUSIONS_SUFFIX}`

#### Stability Guardrails

The shot prompt has a unique **SCENE EXCLUSIONS** section that always includes a hard-coded
set of negative constraints:

```
new characters, identity swaps, character morphing, shifting architecture,
disappearing furniture, jump cuts, flickering lighting, extra limbs, distorted faces
```

The user's negative prompt is appended via `{USER_EXCLUSIONS_SUFFIX}`, which is either
`", {user_text}"` or `""` (empty string if no user exclusions). This creates a natural
sentence ending:

- With user exclusions: `"...distorted faces, rain, umbrellas."`
- Without: `"...distorted faces."`

**Important:** The negative prompt is NOT passed as a separate API parameter to Veo 3.x.
All exclusions are merged directly into the prompt text via this SCENE EXCLUSIONS section.

#### References/Images

Reference images (asset thumbnails, frame images, or imported images) are sent as inline
base64 data to the Veo video generation API. The prompt describes them via `{REFERENCE_IMAGES_JSON}`
for context, while the actual image data provides visual anchoring.

#### Post-Processing

`cleanJSON()` **is applied** via `generateShotJSONPromptFiltered()`. Empty camera and style
values are stripped from the output.

---

### 5.7 Shot Extension

**Trigger:** User clicks "Extend" on an existing generated video in the Shot Animation panel.

**Purpose:** Generate a seamless temporal continuation of an existing video clip, maintaining
visual and motion continuity from the terminal frame.

#### System Prompt

**Template key:** `defaultShotExtendSystemPromptJSON`

**Role:** "Master Temporal Continuity Specialist & Video Sequence Architect"

**Key directives:**
- **Temporal lock:** Extension begins exactly where source ends; no popping, lighting shifts, or position jumps
- **Identity persistence:** 100% visual fidelity for all characters and objects
- **Motion inertia:** Continue existing kinetic energy naturally
- **Environmental stability:** Architecture, lighting, color temperature, atmospheric effects unchanged
- **Aspect ratio rigidity:** Match original resolution and framing exactly
- **Narrative progression:** Advance story while staying within Visual DNA

#### User Prompt

**Template key:** `defaultShotExtendUserPromptJSON`

**Sections:**
- **EXTENSION NARRATIVE** -- `{NARRATIVE}` (continuation action), `{AUDIO_PROMPT}`, `{DURATION}`
- **SOURCE ANCHORS** -- `{REFERENCE_IMAGES_JSON}` with continuity constraint
- **CINEMATOGRAPHY (LOCKED)** -- `{CAMERA_MOVEMENT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
- **VISUAL DNA (STYLE LOCK)** -- Same as shot video
- **TECHNICAL CONSTRAINTS** -- `{ASPECT_RATIO}`, `{RESOLUTION}`
- **SCENE EXCLUSIONS** -- Same guardrails + `{USER_EXCLUSIONS_SUFFIX}`

#### Key Difference from Shot Generation

- Extensions use **extension-specific camera parameters** (`extensionCameraMovement`, `extensionFraming`, etc.) that are independent from the original shot's parameters
- The video reference (an API-level identifier returned from the original generation) is passed to the `extendVideo()` API call
- Extensions always use the **same model** as the original video
- Duration is determined by the provider (Google Veo adds 7 seconds per extension)
- Maximum 20 extensions per shot, 3 minutes total duration

#### Post-Processing

`cleanJSON()` **is applied** via `generateShotJSONPromptFiltered()`.

---

### 5.8 Character Refinement

**Trigger:** User enters text in the refinement panel and clicks "Refine" on a character asset draft.

**Purpose:** Apply delta-only modifications to an existing character reference sheet while
preserving identity, layout, and style.

#### System Prompt

**Template key:** `defaultCharacterRefineSystemPromptJSON`

**Role:** "Senior Iterative Character Designer"

**Key directives:**
- **Identity persistence:** Facial structure, body proportions, core essence unchanged unless targeted
- **Precision refinement:** Only the specific changes requested; no creative flourishes
- **Structural rigidity:** Maintain 4x1 horizontal strip layout on 4:3 with white background
- **View uniformity:** Every modification reflected identically across all four perspectives

#### User Prompt

**Template key:** `defaultCharacterRefineUserPromptJSON`

**Sections:**
- **REFINEMENT INSTRUCTIONS** -- `{REFINEMENT_PROMPT}` (the user's requested change)
- **ASSET SPECIFICATIONS (LOCKED)** -- Layout, aspect ratio, background, Visual DNA preserved
- **CRITICAL CONSTRAINTS** -- Do not change identity beyond instructions, no labels/text/environment
- **FINAL TASK** -- Generate updated 4x1 reference sheet

#### Placeholder

| Placeholder | Filled By |
|-------------|-----------|
| `{REFINEMENT_PROMPT}` | User's free-text refinement instruction (e.g., "Make the hair red and add a leather jacket") |

#### How Refinement Prompts Are Built

1. The user prompt template has `{REFINEMENT_PROMPT}` replaced with the user's text
2. On **first refinement**: system template + user template are concatenated
3. On **subsequent refinements**: only the user template is sent (system context already established)
4. The structured prompt is passed as `newPrompt` to `refineImageWithConversation()`
5. The current image is also attached as inline base64 data

---

### 5.9 Object Refinement

**Trigger:** User enters text in the refinement panel and clicks "Refine" on an object asset draft.

**Purpose:** Apply delta-only modifications to an existing object turnaround sheet.

#### System Prompt

**Template key:** `defaultObjectRefineSystemPromptJSON`

**Role:** "Senior Iterative Industrial & Prop Designer"

**Key directives:**
- Form persistence: base geometry and proportions unchanged unless targeted
- Material integrity: physical properties maintained unless instructed otherwise
- Structural rigidity: maintain 2x2 quadrant grid on 4:3 with white background
- Quadrant uniformity: modification reflected across all four perspectives

#### User Prompt

**Template key:** `defaultObjectRefineUserPromptJSON`

**Sections:**
- **REFINEMENT INSTRUCTIONS** -- `{REFINEMENT_PROMPT}`
- **ASSET SPECIFICATIONS (LOCKED)** -- 2x2 grid, 4:3, white background, Visual DNA maintained
- **CRITICAL CONSTRAINTS** -- Do not alter core design beyond specified changes
- **FINAL TASK** -- Generate updated 2x2 reference sheet

---

### 5.10 Set Refinement

**Trigger:** User enters text in the refinement panel and clicks "Refine" on a set asset draft.

**Purpose:** Apply delta-only modifications to an existing environment reference image while
maintaining architectural layout and cinematic composition.

#### System Prompt

**Template key:** `defaultSetRefineSystemPromptJSON`

**Role:** "Senior Production Designer & Environmental Strategist"

**Key directives:**
- Spatial continuity: layout, architectural footprint, scale relationships constant
- Cinematic persistence: preserve original framing, lens, perspective
- Atmospheric stability: maintain lighting direction, color temperature, mood
- Precision iteration: only the specific changes requested
- Visual DNA adherence: exact medium, texture, detail level from project style

#### User Prompt

**Template key:** `defaultSetRefineUserPromptJSON`

**Sections:**
- **REFINEMENT INSTRUCTIONS** -- `{REFINEMENT_PROMPT}`
- **LOCKED ENVIRONMENTAL PARAMETERS** -- `{VISUAL_MEDIUM}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}` preserved from previous version
- **CRITICAL CONSTRAINTS** -- Do not alter setting identity beyond specified changes
- **FINAL TASK** -- Generate updated environment reference

**Note:** The set refinement user template is unique in that it includes style placeholders
(`{VISUAL_MEDIUM}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`,
`{DETAIL_LEVEL}`) to explicitly lock these values. However, in the current implementation,
these placeholders are NOT substituted during refinement -- the template is used with the
literal placeholder names as instructional anchors for the AI. Only `{REFINEMENT_PROMPT}` is
actively replaced.

---

### 5.11 Frame Refinement

**Trigger:** User enters text in the refinement panel and clicks "Refine" on a frame draft.

**Purpose:** Apply delta-only modifications to an existing cinematic keyframe while preserving
spatial arrangement, character identities, and environmental logic.

#### System Prompt

**Template key:** `defaultFrameRefineSystemPromptJSON`

**Role:** "Senior Visual Effects (VFX) & Shot Compositor"

**Key directives:**
- Compositional persistence: relative placement of all elements unchanged unless targeted
- Asset integrity: visual identity of characters/objects maintained
- Locked cinematography: preserve original framing, lens, perspective, aspect ratio
- Harmonized iteration: new elements seamlessly integrated into existing lighting and atmosphere
- Precision refinement: only the specific changes requested

#### User Prompt

**Template key:** `defaultFrameRefineUserPromptJSON`

**Sections:**
- **REFINEMENT INSTRUCTIONS** -- `{REFINEMENT_PROMPT}`
- **SCENE STATE (LOCKED)** -- `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}` from original
- **VISUAL DNA (LOCKED)** -- `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{WEATHER}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{FILM_GRAIN}`
- **TECHNICAL CONSTRAINTS** -- No letterboxing, no text overlays
- **FINAL TASK** -- Generate updated keyframe preserving production quality

**Note:** Similar to set refinement, the frame refinement template includes style/camera
placeholders as instructional anchors. Only `{REFINEMENT_PROMPT}` is actively substituted
during the refinement flow.

---

### 5.12 Style Extraction

**Trigger:** User imports an image and selects "Extract Style" in the Style Definition panel.

**Purpose:** Analyze a reference image and extract its visual style parameters as structured
JSON data, which is then parsed into a `VisualStyle` object.

#### System Prompt

**Template key:** `defaultStyleExtractionSystemPromptJSON`

**Role:** "Expert Visual Style Forensic Analyst"

**Critical constraints:**
- **No brand/IP names:** Never mention directors, movies, games, or artists -- use descriptive technical terms
- **Character limit:** Each text parameter maximum 200 characters to prevent model drift
- **Style over content:** Ignore what is in the image; describe how it looks (the aesthetic execution)
- **Technical terminology:** Use cinematography, lighting, and art-theory terminology

#### User Prompt

**Template key:** `defaultStyleExtractionUserPromptJSON`

**Content:** Requests a JSON object with these fields:
- `medium` -- Select from enumerated list (16mm Film, 35mm Film, Photorealistic, 3D CGI, etc.)
- `film_grain` -- Select from: None, Subtle, Moderate, Heavy, Vintage
- `depth_of_field` -- Descriptive (e.g., "Shallow f/1.8 with soft bokeh")
- `lighting` -- Max 200 chars
- `color_palette` -- Max 200 chars
- `aesthetic` -- Max 200 chars
- `atmosphere` -- Max 200 chars
- `mood` -- Max 200 chars
- `motion_style` -- Max 200 chars
- `texture` -- Max 200 chars
- `detail_level` -- Integer 0-100
- `additional_notes` -- Max 200 chars

#### No Placeholders

This prompt type has **no placeholders**. The system and user templates are used as-is,
combined into a single analysis prompt.

#### Image Attachment

The source image is attached as inline base64 JPEG data in the Gemini API request alongside
the text prompt.

#### API Details

- Uses the **vision/analysis model** (not the image generation model)
- `temperature: 0.3` for consistent, deterministic extraction
- `responseMimeType: "application/json"` to force structured JSON output
- Response is parsed via `StyleAnalysisResult` (Codable struct with snake_case key decoding)
- Extracted values are converted to a `VisualStyle` via `convertToVisualStyle()`, which:
  - Parses enum fields (medium, film grain, depth of field) using fuzzy string matching
  - Populates `manual*` fields (lighting, colorPalette, etc.) for Advanced mode
  - Sets `isAdvancedMode = true` to display the extracted free-text values

---

## 6. Batch Generation Trick

**File:** `Services/ImageGeneration/GoogleGeminiProvider.swift`, method `generateImages()`

When generating multiple images in a single API call (used for style reference "Generate 3x"
or asset "Generate 4x" flows), ShotMaker uses a **numbered prompt wrapper** technique.

### How It Works

For `candidateCount > 1`, the original prompt is wrapped in a numbered instruction block:

```
Call the image generation function with the following frequency.
After each image generation, always check the number. You may finish
when the last number is matched. Here are the images you must create:

[Prompt for image 1: {original prompt}]
[Prompt for image 2: {original prompt}]
[Prompt for image 3: {original prompt}]
```

### Why This Works

The Gemini API's `responseModalities` for batch generation is set to `["TEXT", "IMAGE"]`
(note: includes TEXT, unlike single-image which is `["IMAGE"]` only). This allows the model
to process the numbered instructions as text while generating multiple images in the response.

### Fallback Behavior

If the batch response returns fewer images than requested, the provider automatically falls
back to sequential `generateImage()` calls to fill the remaining count. If more images than
requested are returned, the array is truncated to `candidateCount`.

### When Batch Is Used

- Style reference generation: 3 images (character, object, environment) -- but these are
  actually 3 separate parallel API calls, not batch
- Asset creation with `draftCount > 1`: Uses batch generation for characters/objects/sets
- Frame creation with `draftCount > 1`: Uses batch generation

---

## 7. Conversation-Based Refinement

**Files:** `Models/ConversationHistory.swift`, `Services/ImageGeneration/GoogleGeminiProvider.swift`

### Architecture

Refinement uses the Gemini API's **multi-turn conversation** capability. Each draft stores a
`ConversationHistory` that accumulates the full conversation context.

### ConversationHistory Structure

```
ConversationMessage:
  - id: UUID
  - role: .user | .assistant | .system
  - text: String?
  - imageData: Data?
  - timestamp: Date
```

Messages are stored in chronological order. The maximum is 26 messages (initial generation
pair + ~12 refinement rounds).

### Conversation Flow

1. **Initial generation:** When a draft is first refined, a `ConversationHistory` is created
   from the original generation via `ConversationHistory.fromInitialGeneration(prompt:generatedImage:)`:
   - Message 1: `user` role with the original prompt text
   - Message 2: `assistant` role with the generated image data

2. **Refinement request:** The user's refinement text is added as a `user` message.

3. **API call:** `refineImageWithConversation()` serializes the full conversation as multiple
   `GeminiRequest.Content` entries:
   - Each prior message becomes a `Content` with text and/or inline image data
   - The new refinement prompt (structured system+user template) is added as the final `Content`
   - The current image is attached alongside the new prompt

4. **Response:** The refined image is added to the conversation as an `assistant` message.

5. **New draft:** A new `Draft` is created with the updated `ConversationHistory`, allowing
   the user to refine again or navigate back to previous versions.

### Pruning Strategy

When the conversation exceeds 26 messages:
- The first 2 messages (initial prompt + generation) are always preserved
- Oldest messages after position 2 are removed to get back under the limit
- This preserves the original context while discarding old intermediate refinements

### System Prompt Injection

On the **first refinement** of a draft (when `conversationHistory == nil`), the structured
refinement prompt includes both the system template and the user template:

```
{refineSystemTemplate}

{structuredUserPrompt}
```

On **subsequent refinements** (conversation already exists), only the user template is sent,
since the system context is already established in the conversation history.

### API Context Generation

`getAPIContext()` returns all messages except those with `.system` role. The Gemini API
receives `user` and `assistant` messages as the conversation turns.

---

## 8. DeveloperSettings Customization

**File:** `Services/DeveloperSettings.swift`

### Overview

`DeveloperSettings` is a singleton (`DeveloperSettings.shared`) that provides password-protected
access to override every prompt template in ShotMaker. When Developer Mode is enabled, the app
uses the custom templates stored in `UserDefaults` instead of the hardcoded defaults.

### Storage

All custom templates are persisted to `UserDefaults` via `@Published` properties with `didSet`
observers that write to specific keys. On initialization, each property loads from UserDefaults
with a fallback to the static `default*` constant.

### Template Categories

| Category | System Template Property | User Template Property |
|----------|------------------------|----------------------|
| Style Reference | `styleReferenceSystemPromptJSON` | `styleReferenceUserPromptJSON` |
| Character Asset | `characterSystemPromptJSON` | `characterUserPromptJSON` |
| Object Asset | `objectSystemPromptJSON` | `objectUserPromptJSON` |
| Set Asset | `setSystemPromptJSON` | `setUserPromptJSON` |
| Frame Composition | `frameSystemPromptJSON` | `frameUserPromptJSON` |
| Shot Video | `shotSystemPromptJSON` | `shotUserPromptJSON` |
| Shot Extension | `shotExtendSystemPromptJSON` | `shotExtendUserPromptJSON` |
| Character Refine | `characterRefineSystemPromptJSON` | `characterRefineUserPromptJSON` |
| Object Refine | `objectRefineSystemPromptJSON` | `objectRefineUserPromptJSON` |
| Set Refine | `setRefineSystemPromptJSON` | `setRefineUserPromptJSON` |
| Frame Refine | `frameRefineSystemPromptJSON` | `frameRefineUserPromptJSON` |
| Style Extraction | `styleExtractionSystemPromptJSON` | `styleExtractionUserPromptJSON` |

Additionally, legacy (non-JSON) templates are stored for backward compatibility:
- `customStylePromptTemplate`, `styleGenerationSystemPrompt`
- `customCharacterPromptTemplate`, `characterGenerationSystemPrompt`
- `customObjectPromptTemplate`, `objectGenerationSystemPrompt`
- `customSetPromptTemplate`, `setGenerationSystemPrompt`
- `customFramePromptTemplate`, `frameGenerationSystemPrompt`
- `customShotPromptTemplate`, `shotGenerationSystemPrompt`
- `customAssetPromptTemplate`, `assetGenerationSystemPrompt`

### How Templates Are Selected at Runtime

Every ViewModel follows this pattern when building prompts:

```swift
let devSettings = DeveloperSettings.shared

let systemPromptTemplate = devSettings.isDeveloperModeEnabled
    ? devSettings.characterSystemPromptJSON          // Custom override
    : DeveloperSettings.defaultCharacterSystemPromptJSON  // Hardcoded default

let userPromptTemplate = devSettings.isDeveloperModeEnabled
    ? devSettings.characterUserPromptJSON
    : DeveloperSettings.defaultCharacterUserPromptJSON
```

This means:
- When Developer Mode is **off**: hardcoded `static let default*` templates are used directly
- When Developer Mode is **on**: the `@Published` properties (backed by UserDefaults) are used,
  which may contain user-modified versions

### Reset to Defaults

`resetToDefaults()` restores all custom templates to their hardcoded default values by
assigning each `@Published` property from its corresponding `static let default*` constant.
The `didSet` observer automatically persists the reset values to UserDefaults.

### Stability Guardrails Constant

`DeveloperSettings.shotStabilityGuardrails` is a static constant (not customizable via
Developer Mode) that contains the hardcoded negative constraints always prepended to shot
exclusions:

```
"new characters, identity swap, character morphing, shifting walls, disappearing furniture,
jump cuts, flickering lighting, extra limbs, distorted faces"
```

This ensures that even with custom templates, critical stability constraints are maintained.

---

## Appendix: Source File Reference

| File | Purpose |
|------|---------|
| `Services/DeveloperSettings.swift` | All default prompt templates (~1260 lines), UserDefaults persistence, developer mode toggle |
| `Services/StyleSheetService.swift` | Template compilation engine: placeholder substitution, style compilation, JSON cleanup, attribute description generation |
| `Services/StyleAnalysisService.swift` | Style extraction: sends image + extraction prompt to Gemini vision API, parses JSON response into VisualStyle |
| `Models/VisualStyle.swift` | Visual style parameters (medium, lighting, color palette, etc.) with dual-mode (preset/manual) support |
| `Models/CameraParameters.swift` | Camera parameter enums: ShotAngle, CameraPerspective, CompositionRule, LensType, MotionBlurEffect, LightingStyle, CameraMovement |
| `Models/AssetAttributes.swift` | Asset attribute enums (CharacterAge, ObjectMaterial, SetLocation, etc.) and AssetAttributeSet container |
| `Models/ConversationHistory.swift` | Multi-turn conversation tracking for iterative refinement |
| `Models/Draft.swift` | Draft model with `fullPrompt`, `renderedPrompt`, and `conversationHistory` fields |
| `ViewModels/AssetCreationViewModel.swift` | Orchestrates asset prompt building (`buildFullPrompt()`) and refinement flow |
| `ViewModels/FrameBuilderViewModel.swift` | Orchestrates frame prompt building (`buildFramePrompt()`) and refinement flow |
| `ViewModels/ShotAnimationViewModel.swift` | Orchestrates shot prompt building (`buildShotPrompt()`) and extension flow |
| `ViewModels/StyleDefinitionViewModel.swift` | Orchestrates style reference generation and provides `renderedPrompt` |
| `Services/ImageGeneration/GoogleGeminiProvider.swift` | API integration: single/batch/multi-reference image generation, conversation-based refinement, numbered prompt trick |
| `Services/ImageGeneration/ImageGenerationProtocol.swift` | Provider protocol with `refineImageWithConversation()` and other generation methods |
