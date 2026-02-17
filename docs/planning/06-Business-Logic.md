# 06 - Business Logic & ViewModels

> Complete reference for ShotMaker's ViewModel layer, draft management, validation, error handling, and window lifecycle. Sufficient detail for recreating all business logic in a web or cross-platform implementation.

---

## Table of Contents

1. [ViewModel Lifecycle & Working Modes](#1-viewmodel-lifecycle--working-modes)
2. [StyleDefinitionViewModel](#2-styledefinitionviewmodel)
3. [AssetCreationViewModel](#3-assetcreationviewmodel)
4. [FrameBuilderViewModel](#4-framebuilderviewmodel)
5. [ShotAnimationViewModel](#5-shotanimationviewmodel)
6. [ProjectViewModel](#6-projectviewmodel)
7. [AIProviderViewModel](#7-aiproviderview-model)
8. [Draft Management Patterns](#8-draft-management-patterns)
9. [ConversationHistory Management](#9-conversationhistory-management)
10. [Validation System](#10-validation-system)
11. [Error Handling Flows](#11-error-handling-flows)
12. [WindowViewModelManager](#12-windowviewmodelmanager)
13. [ProjectViewModelRegistry](#13-projectviewmodelregistry)
14. [ImageSelectableViewModel Protocol](#14-imageselectableviewmodel-protocol)

---

## 1. ViewModel Lifecycle & Working Modes

### WorkingMode Enum

Three of the four primary ViewModels (`AssetCreationViewModel`, `FrameBuilderViewModel`, `ShotAnimationViewModel`) use a `WorkingMode` enum to distinguish between creating new entities and editing existing ones:

```
enum WorkingMode {
    case create        // New entity, not yet persisted to project
    case edit(UUID)    // Editing existing entity, associated value is the entity ID
}
```

**Lifecycle stages:**

1. **Create Mode** -- The ViewModel starts with empty state. No entity is added to the project until the user explicitly saves. The `WindowViewModelManager` creates ViewModels in `.create` mode with no entity ID.

2. **Edit Mode** -- The ViewModel is populated from an existing entity loaded from the project. The `WindowViewModelManager` creates ViewModels in `.edit(entityId)` mode and populates all fields from the saved entity.

3. **Mode Transition** -- After the first save in create mode, the ViewModel transitions to edit mode: `workingMode = .edit(newEntity.id)`. Subsequent saves update in place.

### Original State Tracking

Each ViewModel tracks original state to enable change detection and "Save As New":

| Property | Type | Purpose |
|---|---|---|
| `originalDraftCount` | `Int` | Draft count when entity was opened |
| `originalAssetName` / `originalFrameName` / `originalShotName` | `String` | Name at time of opening |
| `savedPrimaryDraftIndex` | `Int?` | The primary draft index from the last save |

These are set via `setOriginalState(name:draftCount:)` when an existing entity is opened for editing, and updated after each save.

### hasUnsavedChanges Detection

All ViewModels implement `hasUnsavedChanges: Bool`:

- **Create mode**: Returns `true` if any work has been done (non-empty drafts, name, or prompt).
- **Edit mode**: Compares current state against saved state (name, prompt, draft count, selected items, primary draft index). If the saved entity cannot be found, assumes changed.

### isSavedEntity Check

`isSavedAsset` / `isSavedFrame` / `isSavedShot` returns `true` when `originalAssetName` (or equivalent) is non-empty, meaning the entity has been saved at least once. This gates the "Save As New" feature.

### Save vs Update Button Logic

The save button dynamically changes based on context:

| Condition | Button Title | Icon |
|---|---|---|
| `workingMode == .create` | "Save to Library" / "Save to Project" | `folder.badge.plus` |
| `.edit` + viewing different draft than primary | "Set as Primary" | `arrow.triangle.2.circlepath` |
| `.edit` + viewing primary draft | "Save" | `square.and.arrow.down` |

The button is enabled when `canSaveOrUpdate` is true (valid name + at least one draft).

---

## 2. StyleDefinitionViewModel

**File:** `ViewModels/StyleDefinitionViewModel.swift`

Manages the visual style definition workflow (Step 1 of the pipeline). Styles define the overall aesthetic applied to all generated content.

### Constants

| Constant | Value | Description |
|---|---|---|
| `maxDraftCount` | `50` | Maximum style drafts retained |

### Published Properties

| Property | Type | Description |
|---|---|---|
| `currentStyle` | `VisualStyle` | The working style being configured |
| `isGenerating` | `Bool` | True during API generation |
| `errorMessage` | `String?` | Error display string |
| `statusMessage` | `String?` | Neutral status messages (e.g., "Generation cancelled") |
| `notifications` | `[AppNotification]` | Toast notification queue |
| `selectedModel` | `String` | Selected AI model name |
| `selectedResolution` | `String?` | Optional resolution override |
| `previewCharacter` | `Data?` | Preview image for character example |
| `previewObject` | `Data?` | Preview image for object example |
| `previewSet` | `Data?` | Preview image for environment example |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `draftHistory` | `[StyleDraft]` | All drafts from `currentStyle.draftHistory` |
| `currentDraft` | `StyleDraft?` | The currently selected draft |
| `reference` | `StyleReference?` | The saved reference (committed style) |
| `hasUnsavedChanges` | `Bool` | Whether style has uncommitted changes |
| `status` | `StyleStatus` | Current style status for UI |
| `compiledStyleSheet` | `String` | Compiled prompt from style parameters |
| `renderedPrompt` | `String` | Human-readable display of current style settings |

### Initialization

```
init(style: VisualStyle, projectViewModel: ProjectViewModel?, styleId: UUID?)
```

**State restoration priority order:**
1. Applied draft (via `appliedDraftId`) -- what the user explicitly applied
2. `currentDraft` if set and different from applied
3. Last draft in history
4. Reference (legacy fallback)

If a draft is found with at least 3 examples (character, object, set), its parameters are loaded into `currentStyle` and its images loaded into preview properties. The model selection defaults to the saved default image model from UserDefaults, or the first available model from the Google provider.

### Style Generation

**Method:** `generateStyleExamples()` / `performStyleGeneration()`

**Pipeline:**
1. Verify Google provider is configured
2. Get JSON prompt templates (developer mode allows customization via `DeveloperSettings`)
3. Generate 3 JSON prompts via `StyleSheetService.generateJSONPrompt()`:
   - Character prompt (`.character` subject type)
   - Object prompt (`.object` subject type)
   - Environment prompt (`.environment` subject type)
4. **Generate all 3 images in parallel** using `async let`
5. Create a `StyleDraft` with the 3 images + snapshot of current parameters
6. Append to `draftHistory`, prune if over 50
7. Set as `currentDraft`, update preview images
8. Persist to project immediately
9. Increment provider generation count

**Cancellation:** `cancelGeneration()` cancels the stored `generationTask` and clears `isGenerating`.

### Apply & Save as Reference

**`applyStyle()`:**
- Sets `currentStyle.appliedDraftId` to the current draft's ID
- Also calls `saveAsReference()` for backward compatibility

**`saveAsReference(notes:)`:**
- Creates a `StyleReference` from the current draft
- Sets it on `currentStyle.reference`
- Posts `"VisualStyleUpdated"` notification

### Multi-Style Management

Styles are stored as `NamedStyle` objects in the project's `styles` array.

**`saveStyleWithName(_ name: String)`:**
- Creates a copy of `currentStyle` as a new `NamedStyle`
- Appends to project's styles array
- Sets as default if it is the first style
- Saves project

**`deleteStyle(id: UUID)`:**
- Prevents deletion of the last remaining style
- Removes from project's styles array
- If deleted style was default, reassigns default to first remaining style

**`loadStyle(id: UUID)`:**
- Loads the named style's `VisualStyle` into `currentStyle`
- Marks the named style as used (updates `lastUsedAt`)

### Draft Management

**`loadDraft(_ draft: StyleDraft)`:**
- Loads all parameters from the draft into `currentStyle`
- Sets as current draft
- Updates preview images
- Persists the change to project

**`deleteDraft(_ draft: StyleDraft)`:**
- Removes from history
- Clears current draft and previews if the deleted draft was current

### 13 Built-in Presets

The `applyPreset(_ presetName: String)` method applies one of 13 predefined style configurations:

| Preset | Medium | Key Characteristics |
|---|---|---|
| 70mm Epic | `.film70mm` | IMAX format, dramatic lighting, 95% detail |
| Anime | `.animation2D` | Cel shading, vibrant colors, 80% detail |
| Cyberpunk | `.photorealistic` | Neon lighting, dystopian, 90% detail |
| Documentary | `.film16mm` | Natural light, handheld, 70% detail |
| Claymation | `.stopMotion` | Plasticine texture, soft lighting, 75% detail |
| Film Noir | `.film35mm` | Chiaroscuro, B&W, shallow DOF, 85% detail |
| Horror | `.film35mm` | Underexposed, desaturated, 85% detail |
| Fantasy | `.photorealistic` | Magical glow, jewel tones, 95% detail |
| Sci-Fi | `.photorealistic` | Cold artificial light, cyan palette, 95% detail |
| Western | `.film35mm` | Anamorphic, golden hour, earth tones, 85% detail |
| Vector Animation | `.animation2D` | Flat lighting, geometric, 50% detail |
| Stop Motion | `.stopMotion` | Studio lighting, puppet aesthetic, 80% detail |
| Watercolor Dream | `.watercolor` | Soft luminous, pastels, 60% detail |
| Pixel Art | `.pixelArt` | 8-bit palette, flat lighting, 30% detail |
| Comic Book | `.animation2D` | Ink lines, halftone, primary colors, 75% detail |

Each preset sets both `preset*` values (for dropdown mode) and `manual*` values (detailed text for text field mode). Presets preserve existing draft/reference data -- only style parameters are changed.

### Preset vs Advanced Mode

The `currentStyle.isAdvancedMode` boolean controls which set of values is active:
- **Preset mode**: Uses `presetLighting`, `presetColorPalette`, etc. (dropdown selections)
- **Advanced mode**: Uses `manualLighting`, `manualColorPalette`, etc. (free-text fields)

The `activeLighting`, `activeColorPalette`, etc. computed properties on `VisualStyle` return the appropriate value based on the current mode.

### Persistence

**`persistStyleToProject()`** (called on save, generation, and `onDisappear`):
1. Finds the style's index in the project's `styles` array by `currentStyleId`
2. Replaces the style at that index with `currentStyle`
3. Reassigns the entire project to trigger `@Published` notification
4. Defers disk save to a background Task

---

## 3. AssetCreationViewModel

**File:** `ViewModels/AssetCreationViewModel.swift`

Manages asset creation/editing (Step 2). Assets are characters, objects, or sets (environments).

### Constants

| Constant | Value | Description |
|---|---|---|
| `maxDraftCount` | `30` | Maximum drafts retained |

### Published Properties

| Property | Type | Description |
|---|---|---|
| `currentAsset` | `Asset?` | The finalized asset after save |
| `assetType` | `AssetType` | `.character`, `.object`, or `.set` |
| `assetName` | `String` | User-given name |
| `prompt` | `String` | Text description for generation |
| `attributes` | `[String: String]` | Legacy key-value attribute dictionary |
| `structuredAttributes` | `AssetAttributeSet` | Typed attribute set |
| `selectedStyleId` | `UUID?` | Which named style is applied |
| `selectedAspectRatio` | `ImageAspectRatio` | Default `.square` |
| `drafts` | `[Draft]` | Array of generated drafts |
| `currentDraftIndex` | `Int` | Index into `drafts` array |
| `useReference` | `Bool` | Whether reference images are being used |
| `selectedImageItems` | `[ImageSelectionItem]` | Selected reference images |
| `isGenerating` | `Bool` | Generation in progress |
| `isRefining` | `Bool` | Refinement in progress |
| `refinementPrompt` | `String` | User's refinement text input |
| `errorMessage` | `String?` | Error display |
| `statusMessage` | `String?` | Neutral status |
| `notifications` | `[AppNotification]` | Toast queue |
| `selectedModel` | `String` | AI model name |
| `selectedResolution` | `String?` | Optional resolution |
| `draftCount` | `Int` | Batch count (1-4), default 1 |
| `negativePrompt` | `String` | Exclusion prompt |
| `showNegativePrompt` | `Bool` | UI toggle |
| `previewImages` | `[Data]` | Current preview image data |
| `visualStyle` | `VisualStyle?` | Applied visual style |

### Initialization

```
init(
    assetType: AssetType,
    visualStyle: VisualStyle?,
    selectedStyleId: UUID?,
    projectViewModel: ProjectViewModel?,
    assetId: UUID?,
    workingMode: WorkingMode
)
```

Sets aspect ratio from visual style if available. Selects default Google model from UserDefaults or first available.

### Generation Pipeline

**Method:** `generateAsset()` -> `performAssetGeneration()`

**Full pipeline:**

1. **Validate** -- Calls `validateConfiguration()` checking provider, model, prompt
2. **Validate v2-1** -- If model is `kling-v2-1`, requires 0 or 2-4 reference images (not 1)
3. **Build prompt** -- `buildFullPrompt()` generates a JSON prompt via `StyleSheetService`:
   - Character: `generateCharacterJSONPrompt()` with system + user templates
   - Object: `generateObjectJSONPrompt()` with system + user templates
   - Set: `generateSetJSONPrompt()` with system + user templates
4. **Force 4:3 aspect ratio** for characters and objects (sets use selected ratio)
5. **API call** -- Branching logic:
   - **Batch (draftCount > 1):**
     - Multi-reference (>1 image): Sequential generation loop
     - Single/no reference: `generateImages()` batch API
   - **Single (draftCount == 1):**
     - Multiple references: `generateImageWithMultipleReferences()`
     - Single reference: `generateImage()` with reference
     - No reference, set: `generateReferenceSheet()` with empty views (single image)
     - No reference, character/object: `generateReferenceSheet()` with `[.front, .back, .side, .threeFourths]`
6. **Create Draft** -- `Draft(imageData:, prompt:, fullPrompt:, renderedPrompt:, parameters:, aiModel:, usedReference:, referenceImageId:)`
7. **Append** -- Add to `drafts`, set `currentDraftIndex` to last
8. **Prune** -- `pruneDraftHistoryIfNeeded()` if over 30
9. **Auto-save** -- `autosaveDrafts()` if in edit mode
10. **Update preview** -- Set `previewImages`
11. **Increment count** -- `registry.incrementGenerationCount()`

### Refinement with ConversationHistory

**Method:** `refineCurrentDraft()` (async)

1. Load images from current draft (file-based or inline via `loadImagesFromDraft()`)
2. Get or initialize `ConversationHistory`:
   - If draft has no history: `ConversationHistory.fromInitialGeneration(prompt:, generatedImage:)`
3. Select refinement templates based on asset type (character/object/set)
4. Replace `{REFINEMENT_PROMPT}` placeholder in user template
5. First refinement includes system prompt; subsequent refinements use user template only
6. Add user message to conversation history
7. Call `providerInstance.refineImageWithConversation()` with full history
8. Add assistant message (refined image) to conversation history
9. Create new draft with conversation history attached
10. Append as new draft, update index, prune, auto-save
11. Clear refinement prompt

### File-Based Storage

**`saveDraftsToFiles(assetId:, assetName:)`:**
- For each draft not already using file storage, saves image data via `MediaStorageService.saveAssetDraftImages()`
- Returns updated drafts with `imagePaths` set and `imageData` cleared
- Falls back to inline data if file save fails

**`loadImagesFromDraft(_ draft: Draft)`:**
- Checks `draft.usesFileStorage` first -- loads from `MediaStorageService`
- Falls back to `draft.imageData`

### Import External Images

**`importExternalImage(data: Data)`:**
- Creates a Draft with `aiModel: "Imported"` and `prompt: "Imported from external file"`
- Appends to drafts, prunes if needed

### Image Selection (ImageSelectableViewModel)

Implements the `ImageSelectableViewModel` protocol:
- `toggleImageSelection()` -- Add or remove from `selectedImageItems`, respecting `maxImages`
- `canSelectImage()` -- True if already selected (can deselect) or under max capacity
- `removeImageItem()` / `clearAllSelections()` -- Cleanup methods
- `addReferenceImage(data:)` -- Wraps data as `ImportedImage` selection item
- `useCurrentDraftAsReference()` -- Adds current draft image as reference

### Save to Library

**`saveToLibrary() -> Asset?`:**

- **Create mode:**
  1. Generate new asset ID
  2. Convert drafts to file-based storage via `saveDraftsToFiles()`
  3. Build `Asset` with all metadata
  4. Switch to edit mode: `workingMode = .edit(asset.id)`
  5. Set `savedPrimaryDraftIndex = currentDraftIndex`
  6. Call `setOriginalState()`

- **Edit mode:**
  1. Convert drafts to file-based storage
  2. Build updated `Asset` with existing ID
  3. Update primary draft index and original state

**`saveAsNew(newName: String) -> Asset?`:**
- Only available for already-saved assets (`isSavedAsset`)
- Creates a new `Asset` with new ID containing only the current draft
- Loads images from file storage to create fresh inline data for the new draft
- Returns new asset without modifying the original

### Auto-Save

**`autosaveDrafts()`:**
- Only triggers in edit mode
- Updates the existing asset's `legacyDrafts` with current drafts
- Preserves existing `primaryDraftIndex` (not changed by auto-save)
- Keeps thumbnail from primary draft, not current draft
- Calls `projectViewModel.updateAsset()`

---

## 4. FrameBuilderViewModel

**File:** `ViewModels/FrameBuilderViewModel.swift`

Manages frame composition (Step 3). Frames combine assets with camera parameters to create composed images.

### Constants

| Constant | Value | Description |
|---|---|---|
| `maxDraftCount` | `30` | Maximum drafts retained |

### Published Properties

| Property | Type | Description |
|---|---|---|
| `currentFrame` | `Frame?` | Finalized frame after save |
| `frameName` | `String` | User-given name |
| `frameDescription` | `String` | Scene description for AI |
| `selectedImageItems` | `[ImageSelectionItem]` | Selected reference images (assets, frames, imported) |
| `cameraParameters` | `CameraParameters` | Camera settings (angle, perspective, composition, lens, motion blur, lighting, aspect ratio) |
| `frameAttributes` | `AssetAttributeSet` | Scene attributes (location, time, weather, scale, architecture, atmosphere) |
| `drafts` | `[FrameDraft]` | Generated frame drafts |
| `currentDraftIndex` | `Int` | Current draft index |
| `isGenerating` | `Bool` | Generation in progress |
| `isRefining` | `Bool` | Refinement in progress |
| `refinementPrompt` | `String` | Refinement text |
| `errorMessage` | `String?` | Error display |
| `statusMessage` | `String?` | Neutral status |
| `notifications` | `[AppNotification]` | Toast queue |
| `selectedModel` | `String` | AI model (triggers `handleModelChange()` on set) |
| `selectedResolution` | `String?` | Resolution override |
| `previewImage` | `Data?` | Current preview |
| `selectedStyleId` | `UUID?` | Applied named style |
| `negativePrompt` | `String` | Exclusion prompt |
| `showNegativePrompt` | `Bool` | UI toggle |
| `draftCount` | `Int` | Batch count (1-4), default 1 |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `selectedAssetIds` | `[UUID]` | UUIDs of selected assets (from `selectedImageItems`) |
| `availableFrames` | `[Frame]` | Project frames excluding current frame |
| `currentDraft` | `FrameDraft?` | Draft at current index |
| `showRefinementUI` | `Bool` | True when drafts exist |
| `currentModelCapabilities` | `ImageModelCapabilities?` | Capabilities of selected model |
| `renderedPrompt` | `String` | Human-readable prompt display |
| `canRefineCurrentDraft` | `Bool` | Validates: draft exists, has image, provider configured, prompt non-empty, model supports image-to-image |
| `canGenerate` | `Bool` | No critical validation errors |
| `canGenerateWithCurrentAssets` | `Bool` | v2-1 specific: 0 or 2-4 assets |

### Initialization

```
init(
    visualStyle: VisualStyle?,
    availableAssets: [Asset],
    projectViewModel: ProjectViewModel?,
    frameId: UUID?,
    workingMode: WorkingMode
)
```

Sets aspect ratio from visual style. Selects default Google model.

### Model Change Handling

`handleModelChange()` (triggered by `selectedModel.didSet`):
- Updates `selectedResolution` to new model's default
- Clears resolution if model does not support it

### Frame Generation

**Method:** `generateFrame()` -> `performFrameGeneration()`

1. **Validate** -- Provider, model, prompt, reference image count vs model limits
2. **Validate v2-1** -- Same as asset: 0 or 2-4 assets
3. **Build prompt** -- `buildFramePrompt()` uses `StyleSheetService.compileFrameValues()` + `generateFrameJSONPrompt()` with system/user templates
4. **Collect reference images** from all `selectedImageItems` via `previewImageData`
5. **API call** branching:
   - **Batch (draftCount > 1):**
     - Multi-reference: Sequential generation
     - Single/no reference: `generateImages()` batch API
   - **Single:** `generateImage()` or `generateImageWithMultipleReferences()`
6. **Create FrameDraft** with `imageData`, `prompt`, `fullPrompt`, `renderedPrompt`, `assetIds`, `cameraParameters`, `aiModel`, `aiProviderId`, `frameAttributes`
7. **Append**, prune, auto-save, update preview

### Aspect Ratio Conversion

`convertAspectRatio(_ ratio: AspectRatio?) -> ImageAspectRatio`:

| Input | Output |
|---|---|
| `.widescreen` | `.widescreen` |
| `.standard` | `.standard` |
| `.letterbox` | `.ultrawide` |
| `.square` | `.square` |
| `nil` | `.widescreen` (default) |

### Refinement

Same pattern as `AssetCreationViewModel` but uses frame-specific templates (`frameRefineSystemPromptJSON`, `frameRefineUserPromptJSON`). Creates `FrameDraft` instead of `Draft`.

### Draft Navigation

`navigateToDraft(index:)` -- Unlike asset creation, frame navigation **restores** the draft's state:
- `frameDescription` = draft's prompt
- `selectedImageItems` reconstructed from `draft.assetIds`
- `cameraParameters` = draft's camera parameters
- `frameAttributes` = draft's frame attributes

### Save to Project

**`saveToProject() -> Frame?`:**

Nearly identical pattern to `AssetCreationViewModel.saveToLibrary()`:
- Create mode: Generate frame ID, save drafts to files, build `Frame`, switch to edit mode
- Edit mode: Save drafts to files, build updated `Frame`
- Both: Set `primaryDraftIndex`, `savedPrimaryDraftIndex`, original state

**`saveAsNew(newName: String) -> Frame?`:**
- Creates new `Frame` with new ID containing only the current draft
- Saves image to new frame's file location

### Auto-Save

Same pattern: edit mode only, preserves primary draft index, updates draft list.

---

## 5. ShotAnimationViewModel

**File:** `ViewModels/ShotAnimationViewModel.swift`

Manages video shot generation (Step 4). Shots are animated videos generated from frames and narrative descriptions.

### Constants

| Constant | Value | Description |
|---|---|---|
| `maxDraftCount` | `30` | Maximum drafts retained |

### Published Properties

| Property | Type | Description |
|---|---|---|
| `shotName` | `String` | User-given name |
| `narrative` | `String` | Scene description for AI |
| `selectedFrameIds` | `[UUID]` | Legacy ordered frame IDs |
| `transitions` | `String` | Transition type, default `"smooth"` |
| `selectedImageItems` | `[ImageSelectionItem]` | Reference mode image selections |
| `firstFrameItem` | `ImageSelectionItem?` | Starting frame for interpolation |
| `lastFrameItem` | `ImageSelectionItem?` | Ending frame for interpolation |
| `drafts` | `[ShotDraft]` | Generated video drafts |
| `currentDraftIndex` | `Int` | Current draft index |
| `previewVideo` | `Data?` | Current video preview data |
| `isGenerating` | `Bool` | Generation in progress |
| `generationProgress` | `String` | Progress message string |
| `isExtending` | `Bool` | Video extension in progress |
| `extensionPrompt` | `String` | Extension description |
| `selectedModel` | `String` | AI model (triggers `handleModelChange()`) |
| `aspectRatio` | `String` | Default `"16:9"` |
| `resolution` | `String` | Default `"720p"` |
| `selectedDuration` | `Int` | Video duration in seconds, default `8` |
| `negativePrompt` | `String` | Exclusion prompt |
| `audioPrompt` | `String` | Audio/sound description |
| `cameraMovement` | `String?` | Camera movement type, `nil` = static |
| `framing` | `ShotAngle?` | Shot angle/framing |
| `cameraPerspective` | `CameraPerspective?` | Camera perspective |
| `composition` | `CompositionRule?` | Composition rule |
| `lensType` | `LensType?` | Lens type |
| `motionBlur` | `MotionBlurEffect?` | Motion blur effect |
| `lighting` | `LightingStyle?` | Lighting style |
| `isNewGenerationSession` | `Bool` | True if video was just generated (enables extensions) |
| `savedPrimaryDraftIndex` | `Int?` | Primary draft from last save |
| `selectedStyleId` | `UUID?` | Applied named style |

**Extension-specific parameters** (independent from original shot):

| Property | Type | Description |
|---|---|---|
| `extensionCameraMovement` | `String?` | Camera movement for extension |
| `extensionFraming` | `ShotAngle?` | Framing for extension |
| `extensionPerspective` | `CameraPerspective?` | Perspective for extension |
| `extensionComposition` | `CompositionRule?` | Composition for extension |
| `extensionLensType` | `LensType?` | Lens for extension |
| `extensionMotionBlur` | `MotionBlurEffect?` | Motion blur for extension |
| `extensionLighting` | `LightingStyle?` | Lighting for extension |
| `extensionAudioPrompt` | `String` | Audio prompt for extension |
| `extensionIncludeStyle` | `Bool` | Inherit visual style, default `true` |
| `showExtensionParameters` | `Bool` | Controls inline expansion |

### Image Mode Selection

The ViewModel supports two mutually exclusive image modes, determined by `ModelCapabilities.FrameSelectionMode`:

**Reference Mode:**
- User selects 0-N images from assets, frames, or imported files via `selectedImageItems`
- All selected images are passed as reference inputs
- Text-to-video when no images selected

**Interpolation Mode:**
- User sets a `firstFrameItem` (starting frame) and optionally a `lastFrameItem` (ending frame)
- The AI generates video that transitions between the two frames
- `firstFrameItem` must be set before `lastFrameItem`
- `firstFrameItem` cannot be cleared while `lastFrameItem` exists

### Duration Rules

| Condition | Duration |
|---|---|
| Images selected + Google Veo | Forced to 8 seconds |
| Model has `requiredDuration` | Uses that fixed duration |
| No images, no fixed requirement | Uses `selectedDuration` (user choice) |

`isDurationLocked: Bool` -- Returns true when images are selected (reference or interpolation mode), indicating the duration picker should be disabled.

### Camera Movement Injection

Camera movement is injected directly into the prompt text via `buildShotPrompt()` using `StyleSheetService.compileShotValuesFiltered()`. The camera movement value is included in the JSON template as a field rather than being passed as a separate API parameter.

### Video Generation

**Method:** `generateShot()` -> `performShotGeneration()`

1. Validate narrative is non-empty
2. Verify Google provider
3. Determine actual mode (interpolation if `firstFrameItem` set, reference if `selectedImageItems` non-empty, default reference)
4. Gather image items based on mode
5. Build prompt via `buildShotPrompt()` using JSON templates
6. Adjust duration based on images and model constraints
7. Generate video:
   - **Google Veo**: Determines `ImageMode` (.none, .reference, .interpolation), calls `veoProvider.generateVideo()`
   - **Legacy providers**: Converts items to frames, calls `provider.generateVideo()`
8. Create `ShotDraft` with `videoData`, `videoReference`, `extensionCount: 0`
9. Append, prune, update preview, auto-save
10. Set `isNewGenerationSession = true`

### Video Extension

**Method:** `extendVideo()` (async)

**Constraints:**
- Maximum **20 extensions** per draft (`extensionCount < 20`)
- Maximum **180 seconds** total duration (`shotDuration < 180`)
- Requires `videoReference` from original generation
- Extension **must use the same model** as the original video

**Pipeline:**
1. Validate extension prompt, extension count, duration limit, video reference
2. Build extension prompt using extension-specific JSON templates (`shotExtendSystemPromptJSON`, `shotExtendUserPromptJSON`)
3. Use extension-specific parameters (not the original shot parameters)
4. Call `provider.extendVideo()` with video reference
5. Calculate new duration: Google Veo adds 7s, others add ~4.5s
6. Create new `ShotDraft` with `extensionCount + 1` and new `videoReference`
7. Append as new draft, prune, auto-save
8. Reset extension parameters via `resetExtensionParameters()`

**`resetExtensionParameters()`** -- Clears all extension-specific fields but preserves `extensionIncludeStyle` as a user preference.

### ReFrame Feature

Extracts a still frame from a generated video at a specific timestamp and adds it to the project as a `Frame`.

**`extractFrameFromCurrentVideo(at: CMTime) -> Frame`:**
1. Write video data to temp file
2. Use `AVAssetImageGenerator` to extract `CGImage` at specified time
3. Convert to PNG data
4. Create `FrameDraft` and `Frame` with the extracted image
5. Clean up temp file

**`reframeAtCurrentPosition(player:, projectViewModel:) -> Frame?`:**
- Gets `player.currentTime()`
- Calls `extractFrameFromCurrentVideo(at:)`
- Adds frame to project via `projectViewModel.addFrame()`

### Draft Navigation

`navigateToDraft(index:)` calls `updatePreviewFromCurrentDraft()` which:
- Sets `previewVideo` from file or inline data
- Restores `narrative` and `selectedFrameIds` from the draft

### Video Extension Lifecycle

`cleanupVideoExtensionState()` -- Resets `isNewGenerationSession` to false. Called after save and when all drafts are deleted.

---

## 6. ProjectViewModel

**File:** `ViewModels/ProjectViewModel.swift`

Central data management ViewModel. Exists as both a **singleton** (`ProjectViewModel.shared`) for the app-wide project list, and as **per-project instances** for individual project windows.

### Published Properties

| Property | Type | Description |
|---|---|---|
| `currentProject` | `Project?` | The currently loaded project |
| `projects` | `[Project]` | All available projects |
| `isLoading` | `Bool` | Data loading in progress |
| `errorMessage` | `String?` | Error display |
| `notifications` | `[AppNotification]` | Toast queue |

### Initialization

**Singleton (no args):**
```
init()
```
- Sets `isLoading = true` synchronously
- Starts `loadProjectsAsync()` in background Task

**Per-project:**
```
init(project: Project)
```
- Reloads from disk via `storageService.loadProject(id:)` to get latest saved state
- Applies `cleanProject()` to remove duplicates
- Falls back to passed-in project if disk load fails
- Also loads project list asynchronously

### Project Cleanup

**`cleanProject(_ project: Project) -> Project`** (static):

Deduplication:
1. For shots, assets, and frames: Keep first occurrence of each UUID, remove subsequent duplicates

Orphan removal:
- **Shots**: Must have non-empty name AND at least one draft with video data (inline or file path)
- **Assets**: Must have non-empty name AND image content (finalImageData or draft imageData)
- **Frames**: Must have non-empty name AND at least one draft with image content (inline or file path)

### Debounced Saving

| Method | Behavior |
|---|---|
| `saveCurrentProject()` | Immediate synchronous save via `StorageService` |
| `saveCurrentProjectDebounced()` | Cancels pending save, schedules new save after **1.5 seconds** |
| `saveCurrentProjectImmediately()` | Cancels pending debounced save, then saves immediately |

The debounce mechanism:
- `saveTask: Task<Void, Never>?` stores the pending save
- Each call to `saveCurrentProjectDebounced()` cancels the previous task and creates a new one
- The task sleeps for `saveDebounceInterval` (1.5s), then saves if not cancelled
- Used by add/update operations to reduce disk I/O during rapid changes

### CRUD Operations

All add/update operations use debounced saves. Delete operations use immediate saves.

**Assets:**

| Method | Behavior |
|---|---|
| `addAsset(_ asset: Asset)` | Appends to `currentProject.assets`. If duplicate ID exists, calls `updateAsset()` instead. Debounced save. |
| `updateAsset(_ asset: Asset)` | Finds by ID and replaces. Debounced save. |
| `deleteAsset(id: UUID)` | Cleans up media files via `MediaStorageService.deleteMediaFolder()`, removes from array. Immediate save. |
| `getAsset(id: UUID) -> Asset?` | Lookup by ID. |

**Frames:**

| Method | Behavior |
|---|---|
| `addFrame(_ frame: Frame)` | Same duplicate prevention as assets. Debounced save. |
| `updateFrame(_ frame: Frame)` | Find and replace. Debounced save. |
| `deleteFrame(id: UUID)` | Media cleanup + removal. Immediate save. |
| `getFrame(id: UUID) -> Frame?` | Lookup by ID. |

**Shots:**

| Method | Behavior |
|---|---|
| `addShot(_ shot: Shot)` | Same duplicate prevention. Debounced save. |
| `updateShot(_ shot: Shot)` | Find and replace. Debounced save. |
| `deleteShot(id: UUID)` | Media cleanup + removal. Immediate save. |
| `getShot(id: UUID) -> Shot?` | Lookup by ID. |

**Visual Styles:**

| Method | Behavior |
|---|---|
| `updateVisualStyle(_ style: VisualStyle)` | Updates the default style. Debounced save. |

**Helper:**

| Property | Type | Description |
|---|---|---|
| `defaultVisualStyle` | `VisualStyle?` | Retrieves the default named style's `VisualStyle` |

### Project Loading with Cleanup

`loadProject(id: UUID)`:
1. Load from `StorageService`
2. Apply `cleanProject()` to remove duplicates and orphans
3. Call `validateAndFixProject()` to fix invalid primary draft indices
4. Update in `projects` list

`validateAndFixProject()`:
- Iterates all assets, frames, and shots
- Calls `validatePrimaryDraftIndex()` on each
- If any indices were fixed, saves the project

### Duplicate Prevention

All `add*()` methods check if an entity with the same ID already exists:
```
if currentProject?.assets.contains(where: { $0.id == asset.id }) == true {
    updateAsset(asset)
    return
}
```
This prevents duplicate entries from race conditions (e.g., double-clicking save).

---

## 7. AIProviderViewModel

**File:** `ViewModels/AIProviderViewModel.swift`

Lightweight singleton facade over `AIProviderRegistry` for UI-layer access.

### Design

- **Singleton**: `AIProviderViewModel.shared`
- **Private init**: Prevents external instantiation
- **No state**: Acts as a pass-through to `AIProviderRegistry.shared`

### Methods

| Method | Return Type | Description |
|---|---|---|
| `getImageProviders()` | `[AIProvider]` | Providers with `.imageGeneration` capability |
| `getVideoProviders()` | `[AIProvider]` | Providers with `.videoGeneration` capability |
| `getDefaultProvider(for:)` | `AIProvider?` | Returns first provider (always Google) |
| `getDefaultProvider()` | `AIProvider?` | Returns first provider |
| `getProvider(id:)` | `AIProvider?` | Lookup by UUID |
| `setAPIKey(_:for:)` | `Void` | Delegates to registry |
| `getAPIKey(for:)` | `String?` | Delegates to registry |

### Google-Only Architecture

The current implementation assumes a single Google provider. All "provider selection" in ViewModels resolves to `registry.providers.first`. The `googleProviderId` computed property in each ViewModel returns `registry.providers.first?.id`.

---

## 8. Draft Management Patterns

All creation ViewModels share consistent draft management patterns.

### Sequential Numbering

Drafts are appended to arrays in chronological order:
```
drafts.append(newDraft)
currentDraftIndex = drafts.count - 1
```

Each draft has a `createdAt: Date` timestamp. The UI can display sequential numbers (Draft 1, Draft 2, etc.) based on array position.

### Newest-First Display

While drafts are stored oldest-first in the array, the sidebar UI typically displays them newest-first (reversed). The `currentDraftIndex` always refers to the storage-order position.

### Primary Draft Selection

The "primary draft" is the one displayed as the entity's thumbnail in the project library:

- Tracked by `primaryDraftIndex: Int?` on the entity (Asset, Frame, Shot)
- Tracked by `savedPrimaryDraftIndex: Int?` on the ViewModel
- Only changed by explicit "Set as Primary" action (save/update)
- Auto-save preserves the existing primary, it does not update it

### Auto-Save vs Explicit Save

| Trigger | What Changes | Primary Draft |
|---|---|---|
| Auto-save (after generation) | Draft list updated, thumbnail preserved | **NOT changed** |
| Explicit save ("Save to Library") | Full entity update, new primary | **Changed to current** |
| "Set as Primary" | Primary index updated | **Changed to current** |

### Draft Pruning

When draft count exceeds `maxDraftCount`, oldest drafts are removed from the front:

```swift
let removeCount = drafts.count - Self.maxDraftCount
drafts.removeFirst(removeCount)
```

**Index adjustment after pruning:**

1. `currentDraftIndex`: If it points beyond the new array length, clamped to `max(0, drafts.count - 1)`
2. `savedPrimaryDraftIndex`: If the primary was removed (index < removeCount), set to `nil`. Otherwise, shifted down by `removeCount`.

### Draft Deletion with Index Adjustment

When a specific draft is deleted:

```swift
drafts.remove(at: index)

// Adjust saved primary index
if index == primaryIndex {
    savedPrimaryDraftIndex = nil           // Deleted primary
} else if index < primaryIndex {
    savedPrimaryDraftIndex = primaryIndex - 1  // Shift down
}

// Adjust current index
if currentDraftIndex >= drafts.count {
    currentDraftIndex = max(0, drafts.count - 1)
}
```

### Draft Types by ViewModel

| ViewModel | Draft Type | Key Fields |
|---|---|---|
| `StyleDefinitionViewModel` | `StyleDraft` | `examples: [Data]` (3 images), `parameters: StyleParameters`, `prompt`, `aiModel` |
| `AssetCreationViewModel` | `Draft` | `imageData: [Data]`, `imagePaths: [String]`, `prompt`, `fullPrompt`, `renderedPrompt`, `parameters`, `aiModel`, `usedReference`, `referenceImageId`, `conversationHistory` |
| `FrameBuilderViewModel` | `FrameDraft` | `imageData: Data?`, `imagePath: String?`, `prompt`, `fullPrompt`, `renderedPrompt`, `assetIds`, `cameraParameters`, `aiModel`, `aiProviderId`, `conversationHistory`, `frameAttributes` |
| `ShotAnimationViewModel` | `ShotDraft` | `videoData: Data?`, `videoPath: String?`, `thumbnailPath`, `prompt`, `fullPrompt`, `renderedPrompt`, `audioPrompt`, `frameIds`, `shotDuration`, `aiModel`, `aiProviderId`, `extensionCount`, `videoReference` |

### File-Based Storage

All draft types support a dual storage mechanism:
- **Inline**: Image/video data stored directly in the `Data?` property
- **File-based**: Data stored on disk, referenced via relative path string

The `usesFileStorage: Bool` computed property checks if file paths are populated. Loading methods check file storage first, falling back to inline data.

---

## 9. ConversationHistory Management

**File:** `Models/ConversationHistory.swift`

Manages multi-turn chat conversations for iterative image refinement with AI providers.

### Data Structures

**MessageRole:**
```
enum MessageRole: String, Codable {
    case user
    case assistant
    case system
}
```

**ConversationMessage:**
| Property | Type | Description |
|---|---|---|
| `id` | `UUID` | Unique message ID |
| `role` | `MessageRole` | Who sent the message |
| `text` | `String?` | Text content |
| `imageData` | `Data?` | Image content |
| `timestamp` | `Date` | When the message was created |

### Constants

| Constant | Value | Description |
|---|---|---|
| `maxMessages` | `26` | Maximum messages retained |

The limit of 26 allows for the initial generation (2 messages: user prompt + assistant image) plus approximately 12 refinement rounds (24 messages: 12 user + 12 assistant).

### Creation

**`fromInitialGeneration(prompt:, generatedImage:) -> ConversationHistory`:**
1. Creates empty history
2. Adds user message with initial prompt
3. Adds assistant message with generated image

This is called lazily on first refinement if the draft has no existing conversation history.

### Adding Messages

| Method | Parameters | Description |
|---|---|---|
| `addUserMessage(text:, imageData:)` | Text required, image optional | Adds user turn, triggers pruning |
| `addAssistantMessage(imageData:, description:)` | Image required, description optional | Adds assistant turn, triggers pruning |
| `addSystemMessage(text:)` | Text only | Adds system message, triggers pruning |

### Pruning at 26 Messages

`pruneOldMessagesIfNeeded()`:

When message count exceeds 26:
1. **Preserve first 2 messages** (initial user prompt + initial generated image)
2. Remove oldest messages starting from position 2 until count is at the limit
3. This keeps the original context while removing intermediate refinement turns

```
[initial_user, initial_assistant, (removed middle), ..., recent_turns]
```

### API Context Extraction

**`getAPIContext() -> [ConversationMessage]`:**
- Returns all messages **excluding** system messages
- Used to build the actual API request to the AI provider

**`getRefinementHistory() -> [ConversationMessage]`:**
- Returns user messages only, **excluding the first** (initial prompt)
- Used for UI display of refinement turn history

### Conversation Management

| Method | Description |
|---|---|
| `clear()` | Removes all messages |
| `removeLastTurn()` | Removes last assistant message, then last user message |
| `getLatestUserMessage()` | Last user message |
| `getLatestAssistantMessage()` | Last assistant message |
| `getCurrentImage()` | Most recent assistant message's image data |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `refinementCount` | `Int` | Number of user messages minus 1 (initial prompt) |
| `messageCount` | `Int` | Total messages |
| `isEmpty` | `Bool` | No messages |
| `isLongConversation` | `Bool` | True when > 20 messages (10 turns) |
| `summary` | `String` | Debug summary with message counts |

---

## 10. Validation System

**File:** `Models/ValidationError.swift`

Pre-generation validation ensures all required configuration is in place before making API calls.

### ValidationError Structure

```swift
struct ValidationError: Identifiable, Equatable {
    let id: UUID
    let severity: Severity
    let message: String
    let solution: String?
    let errorCode: String?

    enum Severity {
        case error      // Prevents generation
        case warning    // May fail or produce unexpected results
        case info       // Informational
    }
}
```

### Pre-Generation Checks

Each ViewModel's `validateConfiguration()` method runs these checks in order:

**1. Provider check:**
```
Guard googleProviderId exists
-> "Google provider not available"
-> Solution: "Configure Google API key in Settings"
```

**2. Model check:**
```
Guard selectedModel is not empty
-> noModelSelected()
-> Return early (can't validate further)
```

**3. Provider instance check:**
```
Guard provider instance exists for ID
-> "Google provider not configured"
```

**4. Model capabilities check:**
```
Guard model capabilities exist
-> "Model not available"
```

**5. Prompt check:**
```
Guard trimmed prompt is not empty
-> emptyPrompt()
```

**6. Reference image count (Frame Builder only):**
```
If referenceCount > capabilities.maxReferenceImages
-> tooManyReferenceImages() or noReferenceImagesSupported()
```

**7. v2-1 specific validation (Asset and Frame):**
```
If model is "kling-v2-1" and 1 reference image selected
-> Error: requires 0 or 2-4 images
```

### canGenerate Computed Property

```swift
var canGenerate: Bool {
    let errors = validateConfiguration()
    return errors.filter { $0.severity == .error }.isEmpty
}
```

Only `.error` severity blocks generation. Warnings and info are displayed but do not prevent the action.

### Factory Methods for Common Errors

| Factory | Error Code | Message |
|---|---|---|
| `noProviderSelected()` | -- | "No AI provider selected" |
| `noModelSelected()` | -- | "No model selected" |
| `tooManyReferenceImages(selected:max:modelName:)` | -- | Model-specific message with counts |
| `noReferenceImagesSupported(modelName:)` | -- | Model does not support references |
| `emptyPrompt()` | -- | "Prompt cannot be empty" |
| `promptTooLong(current:max:)` | -- | Warning about prompt length |
| `invalidDuration(selected:model:)` | -- | Duration not supported |
| `invalidResolution(selected:model:)` | -- | Resolution not supported |
| `unsupportedAspectRatio(selected:model:)` | -- | Aspect ratio may not work (warning) |

---

## 11. Error Handling Flows

### APIError to ValidationError Transformation

**`ValidationError.fromAPIError(_ error: Error, provider: String, model: String) -> ValidationError`**

All API errors are caught in ViewModel generation methods and transformed into user-friendly `ValidationError` instances. The transformation matches error string patterns:

| Pattern Matched | Error Code | User Message | Solution |
|---|---|---|---|
| `"model is not supported"` | -- | Model cannot be used with configuration | Select different model |
| `"Camera control is not supported"` | -- | Camera control not available | Select None or different model |
| `"authenticationFailed"`, `"403"`, `"401"` | `AUTH_001` | Authentication failed | Check API key in Settings |
| `"quotaExceeded"`, `"Quota Exceeded"` | `QUOTA_001` | API quota exceeded | Wait for reset or upgrade plan |
| `"rateLimitExceeded"`, `"429"` | `RATE_001` | Rate limit exceeded | Wait a few minutes |
| `"serviceUnavailable"`, `"503"`, `"500"` | `SVC_001` | Service temporarily unavailable | Try again later |
| `"networkError"`, `"offline"` | `NET_001` | Network connection error | Check internet connection |
| `"timeout"`, `"timed out"` | `NET_002` | Request timed out | Try again |
| `"invalidResponse"`, `"decodingFailed"` | `RESP_001` | Unexpected response | Try again |
| (any other error) | `HTTP_NNN` (if status code found) | Generation failed: (raw error) | (none) |

### Error Code System

Error codes follow a category-number convention:

| Prefix | Category |
|---|---|
| `AUTH_` | Authentication errors |
| `QUOTA_` | Usage quota errors |
| `RATE_` | Rate limiting errors |
| `SVC_` | Service availability errors |
| `NET_` | Network errors |
| `RESP_` | Response parsing errors |
| `HTTP_` | HTTP status code fallback |

### Error Display in ViewModels

All ViewModels display errors the same way:
```swift
let friendlyError = ValidationError.fromAPIError(error, provider: providerName, model: selectedModel)
errorMessage = friendlyError.message + (friendlyError.solution.map { "\n\n\($0)" } ?? "")
```

The `errorMessage: String?` published property is shown in the UI as an alert or inline error.

### Cancellation Handling

All generation methods handle two cancellation types:
1. `CancellationError` (Swift concurrency)
2. `URLError` with `.cancelled` code (network layer)

Both set `statusMessage = "Generation cancelled"` with a 3-second auto-dismiss.

### Notification System

All ViewModels include a parallel notification system:

```swift
@Published var notifications: [AppNotification] = []

func showError(_ message: String, solution: String?, code: String?)
func showSuccess(_ message: String)
func dismissNotification(_ id: UUID)
```

`AppNotification` supports `.error` and `.success` types displayed as toast-style overlays.

---

## 12. WindowViewModelManager

**File:** `Services/WindowViewModelManager.swift`

Centralized singleton managing ViewModel lifecycle for windowed editors.

### Design

- **Singleton**: `WindowViewModelManager.shared`
- **MainActor**: All operations on main thread
- **Context-keyed storage**: ViewModels stored in dictionaries keyed by string context IDs

### Internal Storage

```swift
private var assetCreationVMs: [String: AssetCreationViewModel] = [:]
private var frameBuilderVMs: [String: FrameBuilderViewModel] = [:]
private var shotAnimationVMs: [String: ShotAnimationViewModel] = [:]
@Published private(set) var openWindows: Set<String> = []
```

### Window Tracking

| Method | Description |
|---|---|
| `markWindowOpen(_ contextId: String)` | Adds to `openWindows` set |
| `markWindowClosed(_ contextId: String)` | Removes from `openWindows` set |
| `isWindowOpen(_ contextId: String) -> Bool` | Membership check |

### ViewModel Creation/Retrieval

All `getOrCreate*` methods follow the same pattern:
1. Check if a ViewModel already exists for the context ID
2. If yes, return existing (prevents duplicate creation on re-navigation)
3. If no, create new ViewModel, populate it, cache it, return it

**Asset Creation:**

`getOrCreateAssetCreationVM(context: AssetCreationContext, projectViewModel:) -> AssetCreationViewModel`
- Resolves visual style from project's default style
- Creates in `.create` mode with no asset ID

`getOrCreateAssetEditVM(context: AssetEditContext, asset:, projectViewModel:) -> AssetCreationViewModel`
- Restores style from asset's original style ID, falls back to project default
- Creates in `.edit(asset.id)` mode
- Populates: `assetName`, `prompt`, `attributes`, `selectedAspectRatio`, `drafts`, `currentDraftIndex`, `savedPrimaryDraftIndex`, `selectedModel`, `previewImages`
- Loads primary draft as current viewing position
- Sets original state for change tracking

**Frame Creation/Edit:**

`getOrCreateFrameCreationVM(context:, projectViewModel:) -> FrameBuilderViewModel`
- Resolves default style and available assets
- Creates in `.create` mode
- Sets `selectedStyleId` for UI picker

`getOrCreateFrameEditVM(context:, frame:, projectViewModel:) -> FrameBuilderViewModel`
- Populates: `frameName`, `frameDescription`, `selectedImageItems` (reconstructed from asset IDs), `cameraParameters`, `frameAttributes`, `drafts`, primary index, model, style, preview
- Sets original state

**Shot Creation/Edit:**

`getOrCreateShotCreationVM(context:, projectViewModel:) -> ShotAnimationViewModel`
- Sets project reference for file storage
- If `context.initialFrameId` provided (from ReFrame), pre-sets first frame and shot name

`getOrCreateShotEditVM(context:, shot:, projectViewModel:) -> ShotAnimationViewModel`
- Populates all fields including camera parameters
- Handles model fallback: imported or empty models default to `"veo-3.1-generate-preview"`
- Sets original state

### Cleanup

| Method | Description |
|---|---|
| `cleanupAssetVM(contextId:)` | Removes asset ViewModel from cache |
| `cleanupFrameVM(contextId:)` | Removes frame ViewModel from cache |
| `cleanupShotVM(contextId:)` | Removes shot ViewModel from cache |
| `cleanupAll()` | Removes all ViewModels and clears open windows |

Cleanup is called when a window closes. No project-side cleanup is needed because nothing is added to the project prematurely (create mode does not persist until explicit save).

---

## 13. ProjectViewModelRegistry

**File:** `Services/ProjectViewModelRegistry.swift`

Enables child windows (asset editor, frame builder, shot creator) to access the same `ProjectViewModel` instance as their parent project window.

### Design

- **Singleton**: `ProjectViewModelRegistry.shared`
- **MainActor**: Thread-safe UI access
- **String-keyed**: Maps `projectViewModelId` strings to `ProjectViewModel` instances

### Methods

| Method | Description |
|---|---|
| `register(id: String, viewModel: ProjectViewModel)` | Store a ViewModel reference |
| `get(id: String) -> ProjectViewModel?` | Retrieve by ID |
| `unregister(id: String)` | Remove when window closes |
| `getRegisteredIds() -> [String]` | Debug: list all registered IDs |

### Usage Pattern

1. Project window creates a `ProjectViewModel` and registers it: `registry.register(id: uniqueId, viewModel: vm)`
2. Child windows look up the parent's ViewModel: `registry.get(id: parentProjectViewModelId)`
3. On project window close: `registry.unregister(id: uniqueId)`

This ensures all editors within a project window share the same project data without passing references through deep view hierarchies.

---

## 14. ImageSelectableViewModel Protocol

**File:** `Protocols/ImageSelectableViewModel.swift`

Shared protocol for ViewModels that support unified image/reference selection from multiple sources.

### Protocol Requirements

```swift
protocol ImageSelectableViewModel: ObservableObject {
    var selectedImageItems: [ImageSelectionItem] { get set }
    var availableFrames: [Frame] { get }

    // Reference mode (required)
    func toggleImageSelection(_ item: ImageSelectionItem,
                              mode: ModelCapabilities.FrameSelectionMode,
                              maxImages: Int)
    func canSelectImage(_ item: ImageSelectionItem,
                        mode: ModelCapabilities.FrameSelectionMode,
                        maxImages: Int) -> Bool
    func removeImageItem(_ item: ImageSelectionItem,
                         mode: ModelCapabilities.FrameSelectionMode)
    func clearAllSelections(mode: ModelCapabilities.FrameSelectionMode)

    // Interpolation mode (optional, with defaults)
    var firstFrameItem: ImageSelectionItem? { get }
    var lastFrameItem: ImageSelectionItem? { get }
    var hasFirstFrame: Bool { get }
    var hasLastFrame: Bool { get }
    func setFirstFrame(_ item: ImageSelectionItem)
    func setLastFrame(_ item: ImageSelectionItem)
    func clearFirstFrame()
    func clearLastFrame()
}
```

### Default Implementations

Interpolation mode properties and methods have default no-op implementations:
- `firstFrameItem` / `lastFrameItem` return `nil`
- `hasFirstFrame` / `hasLastFrame` return `false`
- `setFirstFrame()` / `setLastFrame()` / `clearFirstFrame()` / `clearLastFrame()` do nothing

Only `ShotAnimationViewModel` overrides these with actual implementations.

### ImageSelectionItem

The `ImageSelectionItem` enum provides a unified type for selecting images from different sources:
- `.asset(Asset)` -- Select from project assets
- `.frame(Frame)` -- Select from project frames
- `.imported(ImportedImage)` -- Select from imported files

Each case provides `previewImageData: Data?` for display and API use.

### Adopting ViewModels

| ViewModel | Reference Mode | Interpolation Mode |
|---|---|---|
| `AssetCreationViewModel` | Yes (reference images for generation) | No (default no-ops) |
| `FrameBuilderViewModel` | Yes (assets, frames, imported as references) | No (default no-ops) |
| `ShotAnimationViewModel` | Yes (reference images) | Yes (first/last frame) |

### Selection Logic

**Reference mode (`toggleImageSelection`):**
- If item is already selected: remove it
- If under `maxImages` capacity: add it
- Otherwise: no-op (at capacity)

**Interpolation mode (ShotAnimationViewModel only):**
- `setFirstFrame()`: Always allowed
- `setLastFrame()`: Only if `hasFirstFrame` is true
- `clearFirstFrame()`: Only if `hasLastFrame` is false
- `clearLastFrame()`: Always allowed
- This enforces the ordering constraint: first frame must exist before last frame can be set

---

## Appendix: Key Constants Summary

| ViewModel | Constant | Value |
|---|---|---|
| `StyleDefinitionViewModel` | `maxDraftCount` | 50 |
| `AssetCreationViewModel` | `maxDraftCount` | 30 |
| `FrameBuilderViewModel` | `maxDraftCount` | 30 |
| `ShotAnimationViewModel` | `maxDraftCount` | 30 |
| `ShotAnimationViewModel` | Max extensions | 20 |
| `ShotAnimationViewModel` | Max video duration | 180 seconds |
| `ConversationHistory` | `maxMessages` | 26 |
| `ProjectViewModel` | `saveDebounceInterval` | 1.5 seconds |

## Appendix: Service Dependencies

| ViewModel | Services Used |
|---|---|
| `StyleDefinitionViewModel` | `AIProviderRegistry`, `StyleSheetService`, `DeveloperSettings` |
| `AssetCreationViewModel` | `AIProviderRegistry`, `StyleSheetService`, `DeveloperSettings`, `MediaStorageService` |
| `FrameBuilderViewModel` | `AIProviderRegistry`, `StyleSheetService`, `DeveloperSettings`, `MediaStorageService` |
| `ShotAnimationViewModel` | `AIProviderRegistry`, `StyleSheetService`, `DeveloperSettings`, `MediaStorageService` |
| `ProjectViewModel` | `StorageService`, `MediaStorageService` |
| `AIProviderViewModel` | `AIProviderRegistry` |
| `WindowViewModelManager` | All creation ViewModels, `ProjectViewModel` |
| `ProjectViewModelRegistry` | `ProjectViewModel` |
