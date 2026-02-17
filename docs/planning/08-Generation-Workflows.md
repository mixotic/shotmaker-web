# 08 - Generation Workflows

> Step-by-step recipes for every generation flow in ShotMaker, from user action through prompt assembly, API call, result handling, and state persistence. Each workflow is a complete, traceable pipeline.

---

## Table of Contents

1. [Style Example Generation](#1-style-example-generation)
2. [Character Asset Generation](#2-character-asset-generation)
3. [Object Asset Generation](#3-object-asset-generation)
4. [Set Asset Generation](#4-set-asset-generation)
5. [Frame Composition](#5-frame-composition)
6. [Shot Video Generation](#6-shot-video-generation)
7. [Video Extension](#7-video-extension)
8. [Refinement (Multi-Turn)](#8-refinement-multi-turn)
9. [Style Extraction](#9-style-extraction)
10. [ReFrame](#10-reframe)
11. [Import Flows](#11-import-flows)
12. [Batch Generation](#12-batch-generation)

---

## 1. Style Example Generation

Generates three preview images (character, object, environment) to visualize the current style parameters before committing them.

### Trigger

User clicks "Generate" in the Style Definition view.

### Prerequisites

- Google API key configured in Settings (provider registered in `AIProviderRegistry`)
- A model selected (`selectedModel` is non-empty; defaults to saved preference or first available model)
- Style parameters configured on `currentStyle` (medium, lighting, color palette, aesthetic, etc.)

### Step-by-Step Flow

1. **User clicks Generate** -- Calls `StyleDefinitionViewModel.generateStyleExamples()`.

2. **Task creation** -- A new `Task` is stored in `generationTask` for cancellation support. Calls `performStyleGeneration()`.

3. **Provider resolution** -- Resolves `googleProviderId` (first provider in registry) and obtains the `ImageGenerationProvider` instance via `registry.getImageProvider(id:)`.
   - **Error path:** If no provider or no API key, sets `errorMessage = "Please configure Google API key in Settings"` and returns.

4. **State update** -- Sets `isGenerating = true`, clears `errorMessage` and `statusMessage`.

5. **Template selection** -- Checks `DeveloperSettings.isDeveloperModeEnabled`:
   - If enabled: uses custom `devSettings.styleReferenceSystemPromptJSON` / `devSettings.styleReferenceUserPromptJSON`
   - If disabled: uses `DeveloperSettings.defaultStyleReferenceSystemPromptJSON` / `DeveloperSettings.defaultStyleReferenceUserPromptJSON`

6. **Prompt assembly** (three prompts, one per subject type) -- Calls `StyleSheetService.generateJSONPrompt()` three times:
   - `subjectType: .character` -- generates character subject prompt
   - `subjectType: .object` -- generates object subject prompt
   - `subjectType: .environment` -- generates environment subject prompt

   Each call:
   1. Compiles style values via `compileStyleValues(from: currentStyle)` into a `[String: String]` dictionary
   2. Substitutes placeholders (`{VISUAL_MEDIUM}`, `{LIGHTING}`, etc.) into the user prompt template
   3. Substitutes `{GENERATE_ARRAY}` with the subject-type-specific JSON array
   4. Wraps as `"SYSTEM INSTRUCTIONS:\n...\n---\nUSER REQUEST:\n..."`

   **Cross-reference:** See Doc 4 (Prompt Engineering), Section 5.1 for template details and placeholder list.

7. **Cancellation check** -- `try Task.checkCancellation()` between prompt assembly and API calls.

8. **Parallel API calls** -- Three `async let` calls to `providerInstance.generateImage()`:
   ```
   async let characterData = providerInstance.generateImage(prompt: characterPrompt, model: selectedModel, referenceImage: nil, aspectRatio: nil, ...)
   async let objectData = providerInstance.generateImage(prompt: objectPrompt, ...)
   async let setImageData = providerInstance.generateImage(prompt: setPrompt, ...)
   ```
   All three execute concurrently via Swift structured concurrency. Each call goes to `GoogleGeminiProvider.generateImage()`.

   **Cross-reference:** See Doc 3 (API Integration), Section 2.5.1 for the Gemini `generateContent` request format.

9. **Await results** -- `let (charData, objData, setData) = try await (characterData, objectData, setImageData)`

10. **Cancellation check** -- Another `try Task.checkCancellation()` after results arrive.

11. **Draft creation** -- Creates a `StyleDraft`:
    ```
    StyleDraft(
        examples: [charData, objData, setData],   // 3 images in fixed order
        parameters: StyleParameters(from: currentStyle),
        prompt: characterPrompt,                    // stores full JSON prompt for reference
        aiModel: selectedModel
    )
    ```

12. **Draft history management**:
    - Appends draft to `currentStyle.draftHistory`
    - Calls `pruneDraftHistoryIfNeeded()` (removes oldest drafts if count exceeds `maxDraftCount = 50`)
    - Sets `currentStyle.currentDraft = draft`

13. **Preview update** -- Sets `previewCharacter`, `previewObject`, `previewSet` with the three image `Data` values.

14. **Project persistence** -- Calls `persistStyleToProject()`, which:
    - Finds the style in `projectViewModel.currentProject.styles` by `currentStyleId`
    - Updates the style in the project
    - Triggers async disk save via `projectViewModel.saveCurrentProject()`

15. **Usage tracking** -- `registry.incrementGenerationCount(providerId:)` updates the provider's generation counter.

16. **Completion** -- Sets `isGenerating = false`.

### Error Paths

| Error Type | Handling |
|------------|----------|
| `CancellationError` | Sets `statusMessage = "Generation cancelled"`, auto-clears after 3 seconds |
| `URLError` with `.cancelled` code | Same as `CancellationError` |
| Any other error | Transforms via `ValidationError.fromAPIError()` into user-friendly `errorMessage` with solution text |

### State Updates

| Property | Change |
|----------|--------|
| `isGenerating` | `true` during generation, `false` after |
| `currentStyle.draftHistory` | New `StyleDraft` appended |
| `currentStyle.currentDraft` | Set to new draft |
| `previewCharacter/Object/Set` | Updated with generated image data |
| `errorMessage` / `statusMessage` | Set on failure/cancellation |

### Cross-References

- **Doc 3, Section 2.5.1:** Gemini `generateImage` request/response format
- **Doc 4, Section 5.1:** Style reference prompt templates and placeholders
- **Doc 6, Section 2:** StyleDefinitionViewModel state management

---

## 2. Character Asset Generation

Generates a multi-view reference sheet (front, back, side, 3/4 views) for a character asset with style-consistent appearance.

### Trigger

User clicks "Generate" in the Asset Creation view with `assetType == .character`.

### Prerequisites

- Google API key configured
- Model selected (`selectedModel` non-empty)
- Prompt text entered (`prompt` non-empty)
- Validation passes (`validateConfiguration()` returns no `.error` severity items)

### Step-by-Step Flow

1. **User clicks Generate** -- Calls `AssetCreationViewModel.generateAsset()`, which creates a cancellable `Task` calling `performAssetGeneration()`.

2. **Validation** -- Calls `validateConfiguration()` which checks:
   - Provider exists and is configured
   - Model is selected and available
   - Prompt is non-empty
   - **Error path:** If critical errors exist, sets `errorMessage` with first error's message and solution, returns immediately.

3. **Provider resolution** -- Resolves `googleProviderId` and `providerInstance`.

4. **State update** -- `isGenerating = true`, clears errors.

5. **Prompt assembly** -- Calls `buildFullPrompt()`:
   1. Selects JSON templates from `DeveloperSettings` (custom if dev mode enabled, default otherwise):
      - `characterSystemPromptJSON`
      - `characterUserPromptJSON`
   2. Calls `StyleSheetService.generateCharacterJSONPrompt()`:
      - Compiles character values via `compileCharacterValues(description:attributes:style:)`:
        - `{CHARACTER_DESCRIPTION}`: base description + natural language attribute sentences (age, build, clothing, hair, expression, posture)
        - Style values: `{VISUAL_MEDIUM}`, `{LIGHTING}`, `{COLOR_PALETTE}`, etc.
      - Substitutes all `{PLACEHOLDER}` tokens into the user prompt template
      - Wraps with system instructions

   **Cross-reference:** See Doc 4, Section 5.2 for character prompt template and placeholder details.

6. **Human-readable prompt** -- Captures `renderedPrompt` (the display version with `=== SECTION ===` headers) at generation time for storage on the draft.

7. **Aspect ratio override** -- Forces `effectiveAspectRatio = .standard` (4:3) for character assets, regardless of user selection.

8. **API call** -- Determines call path based on reference images:
   - **No reference images (typical for character creation):** Calls `providerInstance.generateReferenceSheet()` with views `[.front, .back, .side, .threeFourths]`. The provider appends `", reference sheet with front, back, side, threeFourths views, character turnaround sheet"` to the prompt.
   - **Single reference image:** Calls `providerInstance.generateImage()` with `referenceImage`.
   - **Multiple reference images:** Calls `providerInstance.generateImageWithMultipleReferences()`.

   **Cross-reference:** See Doc 3, Section 2.5.6 for `generateReferenceSheet` and Section 2.5.3 for multi-reference composition.

9. **Draft creation**:
   ```
   Draft(
       imageData: [imageData],
       prompt: prompt,                    // user's input prompt
       fullPrompt: fullPrompt,            // compiled JSON prompt
       renderedPrompt: humanReadablePrompt,
       parameters: attributes,
       aiModel: selectedModel,
       usedReference: !referenceImages.isEmpty,
       referenceImageId: currentDraft?.id
   )
   ```

10. **Draft management**:
    - Appends to `drafts` array
    - Sets `currentDraftIndex = drafts.count - 1`
    - Calls `pruneDraftHistoryIfNeeded()` (max 30 drafts)
    - Calls `autosaveDrafts()` if in `.edit` mode (updates existing asset in project)

11. **Preview update** -- `previewImages = [imageData]`

12. **Usage tracking** -- `registry.incrementGenerationCount(providerId:)`

13. **Completion** -- `isGenerating = false`

### Error Paths

| Error Type | Handling |
|------------|----------|
| Validation errors | Displayed as `errorMessage` with solution; generation does not start |
| `CancellationError` / `URLError(.cancelled)` | `statusMessage = "Generation cancelled"`, clears after 3 seconds |
| API errors | Logged to console, transformed via `ValidationError.fromAPIError()` |

### State Updates

| Property | Change |
|----------|--------|
| `isGenerating` | `true` during, `false` after |
| `drafts` | New `Draft` appended |
| `currentDraftIndex` | Set to latest draft |
| `previewImages` | Updated with generated image |
| Project (if edit mode) | Asset's `legacyDrafts` updated via `autosaveDrafts()` |

### Cross-References

- **Doc 3, Sections 2.5.1, 2.5.3, 2.5.6:** Gemini image generation methods
- **Doc 4, Section 5.2:** Character asset prompt templates
- **Doc 6, Section 3:** AssetCreationViewModel business logic

---

## 3. Object Asset Generation

Generates a multi-view reference sheet for an object/prop asset. The pipeline is nearly identical to character asset generation with object-specific prompt templates.

### Trigger

User clicks "Generate" in the Asset Creation view with `assetType == .object`.

### Prerequisites

Same as character asset generation.

### Step-by-Step Flow

Steps 1-4 are identical to character asset generation.

5. **Prompt assembly** -- Calls `buildFullPrompt()`:
   - Selects `objectSystemPromptJSON` / `objectUserPromptJSON` templates
   - Calls `StyleSheetService.generateObjectJSONPrompt()`:
     - Compiles values via `compileObjectValues(description:attributes:style:)`:
       - `{OBJECT_DESCRIPTION}`: base description + natural language attribute sentences (size, material, condition, style, era, function)
       - Style values: same as character

   **Cross-reference:** See Doc 4, Section 5.3 for object prompt templates.

6. **Aspect ratio override** -- Forces `effectiveAspectRatio = .standard` (4:3) for object assets.

7. **API call** -- Same branching logic as character:
   - No references: `generateReferenceSheet()` with `[.front, .back, .side, .threeFourths]` views
   - Single reference: `generateImage()` with reference
   - Multiple references: `generateImageWithMultipleReferences()`

Steps 8-13 are identical to character asset generation.

### Key Differences from Character

| Aspect | Character | Object |
|--------|-----------|--------|
| Prompt template | `characterSystemPromptJSON` / `characterUserPromptJSON` | `objectSystemPromptJSON` / `objectUserPromptJSON` |
| Description placeholder | `{CHARACTER_DESCRIPTION}` | `{OBJECT_DESCRIPTION}` |
| Attribute sentences | Age, build, clothing, hair, expression, posture | Size, material, condition, style, era, function |
| Aspect ratio | 4:3 (forced) | 4:3 (forced) |
| Reference sheet views | front, back, side, 3/4 | front, back, side, 3/4 |

### Cross-References

- **Doc 4, Section 5.3:** Object asset prompt templates
- **Doc 3, Section 2.5.6:** `generateReferenceSheet`

---

## 4. Set Asset Generation

Generates a single establishing shot for a set/environment asset. Unlike character and object assets, sets produce one wide image rather than a multi-view reference sheet.

### Trigger

User clicks "Generate" in the Asset Creation view with `assetType == .set`.

### Prerequisites

Same as character asset generation.

### Step-by-Step Flow

Steps 1-4 are identical to character asset generation.

5. **Prompt assembly** -- Calls `buildFullPrompt()`:
   - Selects `setSystemPromptJSON` / `setUserPromptJSON` templates
   - Calls `StyleSheetService.generateSetJSONPrompt()`:
     - Compiles values via `compileSetValues(description:attributes:style:)`:
       - `{SET_DESCRIPTION}`: base description + natural language attribute sentences (location, time, weather, scale, architecture, atmosphere)
       - Camera placeholders: `{FRAMING}`, `{PERSPECTIVE}`, `{COMPOSITION}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
       - Style values include `{ASPECT_RATIO}` (sets respect the project aspect ratio, unlike character/object)

   **Cross-reference:** See Doc 4, Section 5.4 for set prompt templates.

6. **Aspect ratio** -- Uses `selectedAspectRatio` as-is (no 4:3 override; sets use the project's aspect ratio).

7. **API call** -- Different branching for sets:
   - **No references:** Calls `generateReferenceSheet()` with `views: []` (empty array signals single image generation, not a turnaround sheet)
   - **Single reference:** `generateImage()` with reference
   - **Multiple references:** `generateImageWithMultipleReferences()`

Steps 8-13 are identical to character asset generation.

### Key Differences from Character/Object

| Aspect | Character/Object | Set |
|--------|-----------------|-----|
| Output | Multi-view reference sheet (4 views) | Single establishing shot |
| Aspect ratio | 4:3 (forced) | Project's aspect ratio (user-selected) |
| Reference sheet views | `[.front, .back, .side, .threeFourths]` | `[]` (empty = single image) |
| Extra placeholders | None | Camera params + `{ASPECT_RATIO}` |

### Cross-References

- **Doc 4, Section 5.4:** Set asset prompt templates
- **Doc 3, Section 2.5.6:** `generateReferenceSheet` with empty views array

---

## 5. Frame Composition

Composes a single frame image by combining selected asset references (characters, objects, sets) with camera parameters and style into a coherent scene.

### Trigger

User clicks "Generate" in the Frame Builder view.

### Prerequisites

- Google API key configured
- Model selected
- Frame description entered (`frameDescription` non-empty)
- Validation passes (reference image count within model limits)
- Optional: assets/frames/imported images selected as references

### Step-by-Step Flow

1. **User clicks Generate** -- Calls `FrameBuilderViewModel.generateFrame()`, creates cancellable `Task` calling `performFrameGeneration()`.

2. **Validation** -- `validateConfiguration()` checks:
   - Provider and model availability
   - Prompt non-empty
   - Reference image count within model's `maxReferenceImages` limit
   - **Error path:** First critical error shown as `errorMessage`.

3. **Model-specific validation** -- Additional check for kling-v2-1 (legacy, requires 0 or 2-4 assets).

4. **Provider resolution** and **state update** -- Same pattern as asset generation.

5. **Prompt assembly** -- Calls `buildFramePrompt()`:
   1. Selects `frameSystemPromptJSON` / `frameUserPromptJSON` templates from `DeveloperSettings`
   2. Calls `StyleSheetService.compileFrameValues()` which builds a dictionary with:
      - `{FRAME_DESCRIPTION}`: scene description
      - Camera parameters: `{FRAMING}`, `{PERSPECTIVE}`, `{COMPOSITION}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}` (empty string if not set)
      - Frame attributes: `{FRAME_LOCATION}`, `{FRAME_TIME}`, `{FRAME_WEATHER}`, `{FRAME_SCALE}`, `{FRAME_ARCHITECTURE}`, `{FRAME_ATMOSPHERE}` (empty string if not set)
      - `{ASSETS_JSON}`: JSON array of selected asset names and types
      - Style values: all visual style parameters (empty string if not set, cleaned from JSON)
      - `{NEGATIVE_PROMPT}`: user's exclusions
   3. Calls `StyleSheetService.generateFrameJSONPrompt()`:
      - Substitutes all placeholders
      - Runs `cleanJSON()` to remove lines with empty string values and fix trailing commas
      - Wraps with system instructions

   **Cross-reference:** See Doc 4, Section 5.5 for frame prompt templates and the JSON cleanup process.

6. **Reference image collection** -- Iterates `selectedImageItems`, extracting `previewImageData` from each (supports assets, frames, and imported images).

7. **API call** -- Branches based on reference image count:
   - **Multiple references (>1):** `providerInstance.generateImageWithMultipleReferences()`
   - **Single or no reference:** `providerInstance.generateImage()` with optional single reference
   - Aspect ratio converted from `CameraParameters.aspectRatio` (`AspectRatio`) to `ImageAspectRatio` via `convertAspectRatio()`:
     - `.widescreen` -> `.widescreen`
     - `.standard` -> `.standard`
     - `.letterbox` -> `.ultrawide`
     - `.square` -> `.square`
     - `nil` -> `.widescreen` (default)

   **Cross-reference:** See Doc 3, Sections 2.5.1, 2.5.3 for the Gemini API calls.

8. **Draft creation**:
   ```
   FrameDraft(
       imageData: composedImageData,
       prompt: frameDescription,
       fullPrompt: fullPrompt,
       renderedPrompt: renderedPrompt,
       assetIds: selectedAssetIds,
       cameraParameters: cameraParameters,
       aiModel: selectedModel,
       aiProviderId: providerId,
       frameAttributes: frameAttributes
   )
   ```

9. **Draft management**:
   - Appends to `drafts` array
   - Sets `currentDraftIndex = drafts.count - 1`
   - `pruneDraftHistoryIfNeeded()` (max 30 drafts)
   - `autosaveDrafts()` if in `.edit` mode

10. **Preview update** -- `previewImage = composedImageData`

11. **Usage tracking** and **completion** -- Same pattern.

### Error Paths

Same as asset generation: validation errors, cancellation, API errors.

### State Updates

| Property | Change |
|----------|--------|
| `isGenerating` | `true` during, `false` after |
| `drafts` | New `FrameDraft` appended |
| `currentDraftIndex` | Set to latest draft |
| `previewImage` | Updated with composed image |
| Project (if edit mode) | Frame's `draftHistory` updated via `autosaveDrafts()` |

### Cross-References

- **Doc 3, Sections 2.5.1, 2.5.3:** Gemini image generation
- **Doc 4, Section 5.5:** Frame composition prompt templates
- **Doc 6, Section 4:** FrameBuilderViewModel business logic

---

## 6. Shot Video Generation

Generates a video clip from a text narrative with optional reference images (frames, assets, imported images) using Google Veo.

### Trigger

User clicks "Generate Shot" in the Shot Animation view.

### Prerequisites

- Google API key configured
- Video model selected (`selectedModel` non-empty; defaults to best available Veo model)
- Narrative text entered (`narrative` non-empty)
- Optional: reference images selected (assets, frames, or imported) or first/last frame set for interpolation

### Step-by-Step Flow

1. **User clicks Generate** -- Calls `ShotAnimationViewModel.generateShot()`, immediately sets `isGenerating = true` and creates cancellable `Task` calling `performShotGeneration()`.

2. **Basic validation** -- Checks narrative is non-empty and provider is available.
   - **Error path:** Sets `errorMessage` and `isGenerating = false` on failure.

3. **Provider resolution** -- Gets `GoogleVeoProvider` instance via `AIProviderRegistry.shared.getVideoProvider(id:)`.

4. **Mode determination** -- Determines the actual image mode based on user selections:
   - If `firstFrameItem != nil`: mode = `.interpolation`
   - Else if `selectedImageItems` is non-empty: mode = `.reference`
   - Else: mode = `.reference` (text-to-video, no images)

5. **Image gathering** -- Based on mode:
   - **Reference mode:** Uses `selectedImageItems` directly. Validates all items have preview data.
   - **Interpolation mode:** Collects `firstFrameItem` and optionally `lastFrameItem` into `imageItems`.

6. **Prompt assembly** -- Calls `buildShotPrompt()`:
   1. Gathers reference image descriptions (name + type) for template substitution
   2. Selects `shotSystemPromptJSON` / `shotUserPromptJSON` templates from `DeveloperSettings`
   3. Calls `StyleSheetService.compileShotValuesFiltered()` which builds:
      - `{NARRATIVE}`: scene narrative
      - `{AUDIO_PROMPT}`: audio/sound description
      - `{USER_EXCLUSIONS_SUFFIX}`: appended to built-in exclusions (e.g., `, rain, umbrellas`)
      - `{REFERENCE_IMAGES_JSON}`: JSON array of reference image metadata
      - Camera parameters: `{CAMERA_MOVEMENT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{COMPOSITION}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`
      - Style values: all visual style parameters (empty string if not set)
   4. Calls `StyleSheetService.generateShotJSONPromptFiltered()`:
      - Substitutes placeholders
      - Runs `cleanJSON()` to remove empty values
      - Wraps with system instructions

   **Note:** `negativePrompt` is NOT sent as a separate API parameter. It is merged into the prompt string via `{USER_EXCLUSIONS_SUFFIX}` in the SCENE EXCLUSIONS section.

   **Cross-reference:** See Doc 4, Section 5.6 for shot prompt templates.

7. **Duration calculation** -- Determines `finalDuration`:
   - If images are provided and provider is `GoogleVeoProvider`: forces 8 seconds
   - If model has `requiredDuration`: uses that
   - Otherwise: uses `selectedDuration`

8. **API call** -- Calls `GoogleVeoProvider.generateVideo()`:
   ```
   veoProvider.generateVideo(
       imageItems: imageItems,
       prompt: prompt,
       model: selectedModel,
       duration: finalDuration,
       aspectRatio: aspectRatio,        // "16:9" or "9:16"
       resolution: resolution,          // "720p" or "1080p"
       negativePrompt: nil,             // exclusions are in the prompt
       imageMode: veoImageMode          // .none, .reference, or .interpolation
   )
   ```

   Inside `GoogleVeoProvider.generateVideo()`:
   1. Builds `instance` dict with `prompt` and images based on mode
   2. Builds `parameters` dict with `aspectRatio`, `resolution`, `durationSeconds`, `sampleCount`
   3. Calls `startVideoGeneration()` -- POST to `models/<model>:predictLongRunning`, returns operation name
   4. Calls `pollOperation()` -- polls GET on operation URL every 3 seconds (initial 5s delay), up to 600s timeout
   5. On completion, parses `response.generateVideoResponse.generatedSamples[0].video.uri`
   6. Calls `downloadVideo()` -- GET on video URI with API key as query param
   7. Returns `(videoData, videoReference)` where `videoReference` is the download URI (used for extensions)

   **Cross-reference:** See Doc 3, Section 3.3 for the complete Veo API flow.

9. **Draft creation**:
   ```
   ShotDraft(
       videoData: videoData,
       prompt: narrative,
       fullPrompt: prompt,
       renderedPrompt: humanReadablePrompt,
       audioPrompt: audioPrompt.isEmpty ? nil : audioPrompt,
       frameIds: selectedFrameIds,
       shotDuration: finalDuration,
       aiModel: selectedModel,
       aiProviderId: providerId,
       extensionCount: 0,
       videoReference: videoReference     // URI for extension chaining
   )
   ```

10. **Draft management**:
    - Appends to `drafts`, sets `currentDraftIndex`
    - `pruneDraftHistoryIfNeeded()` (max 30 drafts)
    - `autosaveDrafts()` if in `.edit` mode

11. **Preview update** -- `previewVideo = videoData`

12. **Usage tracking** -- `incrementGenerationCount()`

13. **Extension state** -- Sets `isNewGenerationSession = true` to enable video extension for this draft.

14. **Completion** -- `isGenerating = false`, clears `generationProgress`.

### Error Paths

| Error Type | Handling |
|------------|----------|
| Empty narrative | `errorMessage` set, `isGenerating` reset |
| No provider | `errorMessage` set |
| `CancellationError` / `URLError(.cancelled)` | `statusMessage = "Generation cancelled"` |
| API errors (auth, quota, timeout) | Transformed via `ValidationError.fromAPIError()` |
| Veo operation timeout (>600s) | `unknownError("Video generation timed out...")` |
| Veo operation error | `unknownError("Video generation failed: <message>")` |

### State Updates

| Property | Change |
|----------|--------|
| `isGenerating` | `true` during, `false` after |
| `generationProgress` | Status messages during generation |
| `drafts` | New `ShotDraft` appended |
| `currentDraftIndex` | Set to latest draft |
| `previewVideo` | Updated with video data |
| `isNewGenerationSession` | Set to `true` |

### Cross-References

- **Doc 3, Section 3:** Google Veo API (start operation, polling, download, image modes)
- **Doc 4, Section 5.6:** Shot video prompt templates
- **Doc 6, Section 5:** ShotAnimationViewModel business logic

---

## 7. Video Extension

Extends an existing generated video by appending new content to its end, using the Veo extension API with the original video's reference URI.

### Trigger

User enters an extension description and clicks "Extend" in the Shot Animation view's extension panel.

### Prerequisites

- A generated video draft exists (`currentDraft` is non-nil)
- Draft has a valid `videoReference` (URI from original generation, only available in current session)
- Extension prompt is non-empty
- Extension count < 20
- Video duration < 180 seconds (3 minutes)
- Google API key configured

### Step-by-Step Flow

1. **User clicks Extend** -- Calls `ShotAnimationViewModel.extendVideo()` (async method called from Task).

2. **Validation**:
   - `currentDraft` exists
   - `extensionPrompt` is non-empty
   - `extensionCount < 20`
   - `shotDuration < 180`
   - Provider is available
   - `videoReference` exists and is non-empty
   - **Error path:** Each check sets `errorMessage` and returns.

3. **State update** -- `isExtending = true`, clears errors.

4. **Model constraint** -- The extension MUST use the same model as the original video (`extensionModel = currentDraft.aiModel`).

5. **Prompt assembly** -- Uses extension-specific templates:
   1. Selects `shotExtendSystemPromptJSON` / `shotExtendUserPromptJSON` from `DeveloperSettings`
   2. Compiles extension-specific values via `StyleSheetService.compileShotValuesFiltered()`:
      - Uses `extensionPrompt` as narrative
      - Uses extension-specific camera parameters (`extensionCameraMovement`, `extensionFraming`, etc.)
      - Uses `extensionAudioPrompt`
      - No reference images (extensions do not use them)
      - Optionally includes visual style (controlled by `extensionIncludeStyle`)
   3. Generates filtered JSON prompt

   **Cross-reference:** See Doc 4, Section 5.7 for extension prompt templates.

6. **API call** -- Calls `provider.extendVideo()`:
   ```
   provider.extendVideo(
       videoReference: videoReference,   // URI from original/previous generation
       prompt: extensionUserPrompt,
       model: extensionModel,            // must match original
       extensionDuration: 0,             // duration determined by provider (7s for Veo)
       aspectRatio: aspectRatio,
       resolution: resolution,
       negativePrompt: nil               // exclusions merged into prompt
   )
   ```

   Inside `GoogleVeoProvider.extendVideo()`:
   1. Forces model to `veo-3.1-generate-preview` (only model supporting extensions)
   2. Builds instance with `prompt` and `video: { "uri": videoReference }`
   3. Parameters include `aspectRatio`, `resolution`, `sampleCount` but NOT `durationSeconds`
   4. Follows same start -> poll -> download flow as regular generation

   **Cross-reference:** See Doc 3, Section 3.5 for video extension API details.

7. **Duration calculation** -- `newDuration = currentDraft.shotDuration + 7.0` (Veo extensions add 7 seconds).

8. **Draft creation** -- Creates a new `ShotDraft` with:
   - `videoData`: the extended video
   - `prompt`: original prompt + `"\n\nExtension: <extensionPrompt>"`
   - `fullPrompt`: original fullPrompt + `"\n\n[Extension: <extensionUserPrompt>]"`
   - `renderedPrompt`: original + extension section
   - `shotDuration`: `newDuration`
   - `extensionCount`: `currentDraft.extensionCount + 1`
   - `videoReference`: NEW video reference URI (for chaining further extensions)

9. **Draft management** -- Same pattern: append, prune, autosave.

10. **Preview update** -- `previewVideo = extendedVideoData`

11. **Parameter reset** -- Calls `resetExtensionParameters()` to clear extension-specific fields for next use (preserves `extensionIncludeStyle` preference).

12. **Completion** -- `isExtending = false`, progress message shows extension count.

### URI Chaining

Each extension returns a new `videoReference`, enabling chain extensions:
```
Original video (8s) -> videoReference_1
Extension 1 (+7s = 15s) -> videoReference_2
Extension 2 (+7s = 22s) -> videoReference_3
...up to 20 extensions
```

### Error Paths

| Error Type | Handling |
|------------|----------|
| No current draft | `errorMessage` set |
| Empty extension prompt | `errorMessage` set |
| Extension limit (20) reached | `errorMessage` set |
| Duration limit (180s) reached | `errorMessage` set |
| No video reference | `APIError.unknownError` thrown |
| API errors | Transformed via `ValidationError.fromAPIError()` |

### State Updates

| Property | Change |
|----------|--------|
| `isExtending` | `true` during, `false` after |
| `drafts` | New `ShotDraft` appended (represents extended video) |
| `currentDraftIndex` | Set to latest |
| `previewVideo` | Updated with extended video |
| Extension parameters | Reset to defaults |

### Cross-References

- **Doc 3, Section 3.5:** Video extension API
- **Doc 4, Section 5.7:** Extension prompt templates
- **Doc 6, Section 5:** ShotAnimationViewModel extension state

---

## 8. Refinement (Multi-Turn)

Iteratively refines an existing generated image using conversation-based context, allowing the user to request targeted changes while maintaining the AI's understanding of the full refinement history.

### Trigger

User enters a refinement instruction and clicks "Refine" on an existing asset draft or frame draft.

### Prerequisites

- An existing draft with at least one image (`currentDraft` with non-empty image data)
- Refinement prompt text entered (`refinementPrompt` non-empty)
- Provider configured with a model that supports image-to-image (`capabilities.supportsImageToImage == true`)

### Step-by-Step Flow (Asset Refinement)

1. **User clicks Refine** -- Calls `AssetCreationViewModel.refineCurrentDraft()` (async).

2. **Validation**:
   - `currentDraft` exists
   - Draft has loadable images (`loadImagesFromDraft(draft)` returns non-empty)
   - Provider exists
   - Refinement prompt is non-empty after trimming

3. **State update** -- `isRefining = true`, clears errors.

4. **Image loading** -- Loads the first image from the current draft (handles both file-based and inline storage via `loadImagesFromDraft()`).

5. **Conversation history initialization** -- Gets or creates `ConversationHistory`:
   - If draft already has `conversationHistory`: uses it (subsequent refinement)
   - If not: creates new via `ConversationHistory.fromInitialGeneration(prompt:generatedImage:)`, which:
     - Adds the original prompt as a user message
     - Adds the generated image as an assistant message
     - Results in 2 initial messages

6. **Refinement prompt assembly**:
   1. Selects refinement templates based on asset type:
      - Character: `characterRefineSystemPromptJSON` / `characterRefineUserPromptJSON`
      - Object: `objectRefineSystemPromptJSON` / `objectRefineUserPromptJSON`
      - Set: `setRefineSystemPromptJSON` / `setRefineUserPromptJSON`
   2. Replaces `{REFINEMENT_PROMPT}` in user template with user's trimmed input
   3. Builds the structured prompt:
      - First refinement: system prompt + user template (establishes context)
      - Subsequent refinements: user template only (system already established)

   **Cross-reference:** See Doc 4, Sections 5.8-5.11 for refinement prompt templates.

7. **Conversation update** -- `conversationHistory.addUserMessage(text: trimmedPrompt)`

8. **Aspect ratio** -- Forces 4:3 for character/object assets; uses `selectedAspectRatio` for sets.

9. **API call** -- Calls `providerInstance.refineImageWithConversation()`:
   ```
   providerInstance.refineImageWithConversation(
       conversationHistory: conversationHistory,
       newPrompt: structuredRefinementPrompt,
       currentImage: currentImage,
       model: selectedModel,
       aspectRatio: aspectRatioToUse,
       negativePrompt: negativePrompt.isEmpty ? nil : negativePrompt,
       resolution: selectedResolution
   )
   ```

   Inside `GoogleGeminiProvider.refineImageWithConversation()`:
   1. Builds multi-turn `contents[]` from conversation history via `getAPIContext()` (excludes system messages)
   2. Each historical message becomes a separate `Content` entry with text and/or image parts
   3. Appends the new refinement prompt + current image as the final entry
   4. Sends to Gemini `generateContent` endpoint
   5. Returns refined image data

   **Cross-reference:** See Doc 3, Section 2.5.4 for the conversation-based API format.

10. **Conversation update** -- `conversationHistory.addAssistantMessage(imageData:description:)` with the refined image.

11. **Automatic pruning** -- `ConversationHistory` auto-prunes when messages exceed `maxMessages = 26`:
    - Preserves first 2 messages (initial prompt + first generation)
    - Removes oldest messages after those until back within limit
    - This bounds context to ~12 refinement rounds

12. **Draft creation** -- Creates a new `Draft` with:
    - The refined image
    - Appended prompts: `fullPrompt + "\n\n[Refinement: <userInput>]"`
    - `usedReference: true`
    - `referenceImageId`: points to the draft that was refined
    - `conversationHistory`: the updated history (for further refinements)

13. **Draft management** -- Append, prune, autosave.

14. **Preview update** -- `previewImages = [refinedImageData]` (force refresh via nil-then-set pattern).

15. **Cleanup** -- Clears `refinementPrompt` for next use.

16. **Completion** -- `isRefining = false`.

### Frame Refinement Variant

Frame refinement (`FrameBuilderViewModel.refineCurrentDraft()`) follows the same pattern with these differences:

| Aspect | Asset Refinement | Frame Refinement |
|--------|-----------------|------------------|
| Draft type | `Draft` | `FrameDraft` |
| Template selection | Based on `assetType` (character/object/set) | Always `frameRefineSystemPromptJSON` / `frameRefineUserPromptJSON` |
| Aspect ratio | 4:3 for character/object, selected for set | Converted from `CameraParameters.aspectRatio` |
| Single image loading | `loadImagesFromDraft()` returns array, uses first | `loadImageFromDraft()` returns single `Data?` |
| Draft stores | `assetIds` not applicable | `assetIds`, `cameraParameters`, `frameAttributes` preserved from source |

### Error Paths

| Error Type | Handling |
|------------|----------|
| No draft or no image | `errorMessage` set |
| Empty refinement prompt | `errorMessage` set |
| API errors | Transformed via `ValidationError.fromAPIError()` |

### State Updates

| Property | Change |
|----------|--------|
| `isRefining` | `true` during, `false` after |
| `drafts` | New draft appended (refinement result) |
| `currentDraftIndex` | Set to latest draft |
| `previewImages` / `previewImage` | Updated with refined image |
| `refinementPrompt` | Cleared |
| Draft's `conversationHistory` | Updated with new user + assistant messages |

### Cross-References

- **Doc 3, Section 2.5.4:** `refineImageWithConversation` API format
- **Doc 4, Sections 5.8-5.11:** Refinement prompt templates
- **Doc 6, Section 9:** ConversationHistory management

---

## 9. Style Extraction

Analyzes an uploaded image using Gemini's multimodal vision capabilities to extract visual style parameters as structured JSON, then populates a `VisualStyle` object for immediate use.

### Trigger

User uploads/selects an image for style extraction in the Style Definition view.

### Prerequisites

- Google provider configured with API key
- An image (`Data`) to analyze

### Step-by-Step Flow

1. **User provides image** -- Image data is passed to `StyleAnalysisService.shared.analyzeImageStyle(imageData:)`.

2. **Provider resolution** -- Finds the Google provider in `AIProviderRegistry.shared.providers` by matching `type == .google` and capabilities containing `.imageGeneration`.
   - **Error path:** Throws `APIError.unknownError` if no Google provider found.

3. **API key retrieval** -- Loads API key from Keychain via `KeychainService.shared.load(forKey:)` using the provider's key identifier.
   - **Error path:** Throws `APIError.authenticationFailed` if key not found.

4. **Image encoding** -- Converts image data to base64 string.

5. **Prompt assembly**:
   - Loads prompts from `DeveloperSettings`:
     - `styleExtractionSystemPromptJSON` -- system instructions
     - `styleExtractionUserPromptJSON` -- analysis task
   - Combines into: `"System Instructions:\n<system>\n\nTask:\n<user>"`

   **Cross-reference:** See Doc 4, Section 5.12 for style extraction prompt templates.

6. **Request construction** -- Builds a `GeminiAnalysisRequest`:
   ```
   GeminiAnalysisRequest(
       contents: [
           Content(parts: [
               Part(text: analysisPrompt),
               Part(inlineData: InlineData(mimeType: "image/jpeg", data: base64Image))
           ])
       ],
       generationConfig: GenerationConfig(
           temperature: 0.3,              // low temperature for consistent extraction
           responseMimeType: "application/json"  // forces JSON output
       )
   )
   ```

7. **Model selection** -- Uses `APIConfiguration.Gemini.styleAnalysisModel` (a vision/text model, not an image generation model; e.g., `gemini-2.5-flash`).

8. **API call** -- Direct HTTP POST to `v1beta/models/<model>:generateContent`:
   - URL: `baseURL(for: model)/model:generateContent`
   - Headers: `x-goog-api-key`, `Content-Type: application/json`
   - No custom timeout (uses URLSession default)

9. **Response parsing** (multi-step):
   1. Decode `GeminiAnalysisResponse` from response data
   2. Extract JSON text from `candidates[0].content.parts[0].text`
   3. Decode JSON text into `StyleAnalysisResult` using snake_case key decoding

10. **Style conversion** -- `convertToVisualStyle(result)` maps the analysis result to a `VisualStyle`:
    - **Camera parameters:** Parses `medium`, `filmFormat`, `filmGrain`, `depthOfField` from either nested `cameraParameters` object or top-level fields (nested takes precedence)
    - **Enum parsing:** Each camera parameter is fuzzy-matched via dedicated parse functions:
      - `parseMedium()`: matches keywords like "16mm", "35mm", "photorealistic", "anime", etc.
      - `parseFilmFormat()`: matches "anamorphic", "imax", "standard"
      - `parseFilmGrain()`: matches "none", "subtle", "moderate", "heavy", "vintage"
      - `parseDepthOfField()`: matches "shallow", "moderate", "deep"
    - **Text fields:** `lighting`, `colorPalette`, `aesthetic`, `atmosphere`, `mood`, `motionStyle`, `texture` are set as Manual mode values and generic fields
    - **Numeric fields:** `detailLevel` (defaults to 75 if not provided)
    - **Custom prompt:** `additionalNotes` mapped to `customPrompt`
    - **Mode:** Sets `isAdvancedMode = true` to display the extracted manual-mode text fields

11. **Return** -- Returns the populated `VisualStyle` to the caller for integration into the UI.

### Error Paths

| Error | Handling |
|-------|----------|
| No Google provider | Throws `APIError.unknownError` with setup instruction |
| No API key | Throws `APIError.authenticationFailed` |
| HTTP error | Throws `APIError.unknownError("HTTP <code>: <body>")` |
| Response decode failure | Throws `APIError.unknownError` with decode error details |
| No analysis text in response | Throws `APIError.unknownError("No analysis text in response")` |
| JSON parse failure | Throws `APIError.unknownError` with parse error details |

### State Updates

The `StyleAnalysisService` itself is stateless -- it returns a `VisualStyle`. The caller (typically the Style Definition view) applies the returned style to `currentStyle`, which triggers UI updates for all style parameter controls.

### Cross-References

- **Doc 3, Section 2:** Gemini API format (same base endpoint, different model and config)
- **Doc 4, Section 5.12:** Style extraction prompt templates

---

## 10. ReFrame

Extracts a single frame from a generated video at the current playback position and adds it to the project as a new Frame entity.

### Trigger

User clicks "ReFrame" button while viewing a generated video in the Shot Animation view.

### Prerequisites

- A video is loaded in the preview player (`previewVideo` is non-nil)
- An `AVPlayer` instance is active
- `ProjectViewModel` is available

### Step-by-Step Flow

1. **User clicks ReFrame** -- Calls `ShotAnimationViewModel.reframeAtCurrentPosition(player:projectViewModel:)`.

2. **Capture playback position** -- `let currentTime = player.currentTime()` captures the exact `CMTime` of the playback head.

3. **Frame extraction** -- Calls `extractFrameFromCurrentVideo(at: time)`:
   1. Writes `previewVideo` data to a temporary `.mp4` file
   2. Creates `AVURLAsset` and `AVAssetImageGenerator`
   3. Configures exact time extraction: `requestedTimeToleranceAfter = .zero`, `requestedTimeToleranceBefore = .zero`
   4. Extracts `CGImage` at the specified time via `imageGenerator.image(at: time)`
   5. Converts to PNG:
      - `CGImage` -> `NSImage` -> `tiffRepresentation` -> `NSBitmapImageRep` -> `.png` representation
   6. Cleans up temporary file (via `defer`)
   7. Formats time as `"X.Xs"` for display

4. **FrameDraft creation**:
   ```
   FrameDraft(
       imageData: pngData,
       prompt: "Extracted from shot: <shotName> at <timeString>",
       assetIds: [],
       cameraParameters: CameraParameters(),
       aiModel: "extracted",
       aiProviderId: googleProviderId ?? UUID()
   )
   ```

5. **Frame creation**:
   ```
   Frame(
       name: "<shotName> Frame at <timeString>",
       description: "Extracted from shot: <shotName>",
       assetIds: [],
       cameraParameters: CameraParameters(),
       duration: 3.0,
       previewImageData: pngData,
       aiModel: "extracted",
       draftHistory: [frameDraft],
       primaryDraftIndex: 0
   )
   ```

6. **Add to project** -- `projectViewModel.addFrame(frame)` adds the frame to the project's frames array and triggers a save.

7. **Return** -- Returns the created `Frame` (or `nil` on failure).

### Error Paths

| Error | Handling |
|-------|----------|
| No video data | Throws NSError with "No video available to extract frame from" |
| Frame extraction failure | Throws from `AVAssetImageGenerator` |
| PNG conversion failure | Throws NSError with "Failed to convert frame to PNG" |
| Any error in outer function | Sets `errorMessage = "ReFrame failed: <description>"`, returns `nil` |

### State Updates

| Property | Change |
|----------|--------|
| `projectViewModel.currentProject.frames` | New `Frame` appended |
| No ViewModel state changes | The extracted frame is a project-level addition, not a shot modification |

### Cross-References

- **Doc 6, Section 5:** ShotAnimationViewModel
- **Doc 6, Section 6:** ProjectViewModel `addFrame()`

---

## 11. Import Flows

### 11.1 External Image Import (Asset)

Imports an external image file as an asset draft without any AI generation.

#### Trigger

User drops or selects an image file in the Asset Creation view.

#### Step-by-Step Flow

1. **Image data received** -- `AssetCreationViewModel.importExternalImage(data:)` called with the raw image `Data`.

2. **Draft creation**:
   ```
   Draft(
       imageData: [data],
       prompt: "Imported from external file",
       fullPrompt: "Imported from external file",
       renderedPrompt: "Imported from external file",
       parameters: attributes,
       aiModel: "Imported",
       usedReference: false,
       referenceImageId: nil
   )
   ```

3. **Draft management**:
   - Appends to `drafts`
   - Sets `currentDraftIndex = drafts.count - 1`
   - `pruneDraftHistoryIfNeeded()` (max 30)

4. **Preview update** -- `previewImages = [data]`

#### State Updates

| Property | Change |
|----------|--------|
| `drafts` | New import draft appended |
| `currentDraftIndex` | Set to latest |
| `previewImages` | Updated with imported image |

### 11.2 Reference Image Import

Adds an external image as a reference for image-to-image generation (not as a draft).

#### Trigger

User adds a reference image in the Asset Creation or Frame Builder view.

#### Step-by-Step Flow (Asset)

1. **Image data received** -- `AssetCreationViewModel.addReferenceImage(data:)` called.

2. **Creates `ImportedImage`** -- `ImportedImage(imageData: data, fileName: "Reference Image")`

3. **Wraps as selection item** -- `selectedImageItems.append(.imported(importedImage))`

4. **Flags reference mode** -- `useReference = true`

#### Step-by-Step Flow (Frame)

Frame Builder uses the `ImageSelectionItem` system directly. Users can add references from:
- **Assets:** `.asset(asset)` items
- **Other frames:** `.frame(frame)` items via `useFrameAsReference(frameId:)`
- **Current draft:** `useCurrentDraftAsReference()` creates an `.imported(ImportedImage)` from the draft
- **External files:** Dropped as `.imported(ImportedImage)` items

### 11.3 Use Draft as Reference

Allows using the current generation result as a reference input for the next generation.

#### Asset Version

1. Calls `AssetCreationViewModel.useCurrentDraftAsReference()`
2. Loads first image from current draft via `loadImagesFromDraft()`
3. Creates `ImportedImage` and appends to `selectedImageItems`
4. Sets `useReference = true`

#### Frame Version

1. Calls `FrameBuilderViewModel.useCurrentDraftAsReference()`
2. Loads image from current draft via `loadImageFromDraft()`
3. Creates `ImportedImage` and appends to `selectedImageItems`

### Cross-References

- **Doc 6, Section 3:** AssetCreationViewModel image selection
- **Doc 6, Section 4:** FrameBuilderViewModel image selection
- **Doc 6, Section 14:** ImageSelectableViewModel protocol

---

## 12. Batch Generation

Generates multiple drafts in a single request when `draftCount > 1`.

### Trigger

User sets draft count to 2-4 and clicks Generate in Asset Creation or Frame Builder.

### Step-by-Step Flow (Asset)

1. **Draft count check** -- If `draftCount > 1`, enters batch generation path.

2. **API call branching**:
   - **Multiple references (>1):** Sequential generation -- loops `draftCount` times calling `generateImageWithMultipleReferences()` individually (multi-image composition does not work well with batch generation).
   - **0 or 1 reference:** Batch API -- calls `providerInstance.generateImages()` with `candidateCount: draftCount`.

3. **Batch prompt construction** (inside `GoogleGeminiProvider.generateImages()`):
   ```
   Call the image generation function with the following frequency. After each image
   generation, always check the number. You may finish when the last number is matched.
   Here are the images you must create:

   [Prompt for image 1: <original_prompt>]
   [Prompt for image 2: <original_prompt>]
   [Prompt for image 3: <original_prompt>]
   ```

   Uses `responseModalities: ["TEXT", "IMAGE"]` to allow interleaved text + image responses.

   **Cross-reference:** See Doc 3, Section 2.5.2 for batch generation API details.

4. **Backfill** -- If the API returns fewer images than requested, additional single `generateImage()` calls fill the gap.

5. **Draft creation** -- A separate `Draft` is created for each generated image (not one draft with multiple images):
   ```
   for imageData in imageDatas {
       let draft = Draft(imageData: [imageData], ...)
       drafts.append(draft)
   }
   ```

6. **Index and preview** -- `currentDraftIndex` set to last generated draft; preview shows last image.

### Step-by-Step Flow (Frame)

Same pattern with `FrameDraft` objects. Uses `generateImages()` for batch or sequential `generateImageWithMultipleReferences()` for multi-reference.

### Cross-References

- **Doc 3, Section 2.5.2:** `generateImages` batch generation
- **Doc 4, Section 6:** Batch generation prompt trick

---

## Appendix A: Media Storage Workflow

When a draft is saved to the project (via `saveToLibrary()` / `saveToProject()`), inline image/video data is converted to file-based storage.

### File Save Flow

1. `saveDraftsToFiles()` is called with entity ID and name.
2. For each draft that uses inline storage (`!draft.usesFileStorage`):
   - Calls `MediaStorageService.shared.saveAssetDraftImages()` / `saveFrameDraftImage()` / `saveShotDraftVideo()`.
   - Service creates directory: `Projects/<ProjectName-ID>/<Type>/<EntityName-ShortID>/`
   - Writes file: `draft-<index>.png` (images) or `draft-<index>.mp4` (videos)
   - Returns relative path from project folder
3. Draft is recreated with `imagePaths` / `imagePath` / `videoPath` set and inline data cleared.
4. On subsequent loads, `loadImagesFromDraft()` / `loadImageFromDraft()` / `loadVideoFromDraft()` checks file-based storage first, falls back to inline data.

### Directory Structure

```
Projects/
  MyProject-ABCD1234/
    Assets/
      Hero-EFGH5678/
        draft-0-0.png
        draft-1-0.png
    Frames/
      OpeningShot-IJKL9012/
        draft-0.png
        draft-1.png
    Shots/
      ChaseScene-MNOP3456/
        draft-0.mp4
        draft-1.mp4
        thumbnail-0.png
```

### Cross-References

- **Doc 5 (Storage System):** File system layout and StorageService

---

## Appendix B: Autosave Workflow

When editing an existing entity (`.edit` mode), drafts are automatically saved after each generation to prevent accidental loss.

### Flow

1. After each successful generation or refinement, `autosaveDrafts()` is called.
2. Checks `workingMode == .edit(entityId)`.
3. Finds the existing entity in the project.
4. Creates an updated copy with the latest `drafts` array.
5. Preserves the existing `primaryDraftIndex` (autosave does not change the primary -- only explicit "Set as Primary" does).
6. Keeps the thumbnail from the primary draft, not the current draft.
7. Calls `projectViewModel.updateAsset()` / `updateFrame()` / `updateShot()`.

---

## Appendix C: Generation Cancellation

All generation workflows support cancellation via the same pattern:

1. Generation is wrapped in a `Task` stored in `generationTask`.
2. `cancelGeneration()` calls `generationTask?.cancel()`, nils the reference, sets `isGenerating = false`.
3. Inside the generation method, `try Task.checkCancellation()` is called at key checkpoints (before API call, after API call).
4. Cancellation is caught as `CancellationError` or `URLError(.cancelled)`.
5. `statusMessage = "Generation cancelled"` is shown for 3 seconds, then cleared via `DispatchQueue.main.asyncAfter`.
6. `isGenerating` is set to `false` in the cancellation handler.

---

## Appendix D: Error Transformation Pipeline

All generation workflows share the same error transformation:

```
Raw API Error (URLError, APIError, NSError, etc.)
       |
       v
ValidationError.fromAPIError(error, provider: "Google", model: selectedModel)
       |
       v
ValidationError {
    severity: .error,
    message: "User-friendly description",
    solution: "Actionable fix suggestion",
    code: "ERROR_CODE"  // e.g., AUTH_001, QUOTA_001, RATE_001
}
       |
       v
errorMessage = friendlyError.message + solution
```

**Cross-reference:** See Doc 3, Section 5.5 for the complete error code table.
