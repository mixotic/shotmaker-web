# 07 -- UI Specification

This document describes every view, window, component, and interactive element in ShotMaker's native macOS SwiftUI interface. It covers the multi-window architecture, the main workflow navigation, all four creator views (Style, Asset, Frame, Shot), their corresponding library views, the unified image picker modal, settings, overlays, and every reusable component. For each view the document records its purpose, layout structure, key interactive elements, data bindings, and navigation flows. It is written to the level of detail required to re-implement an equivalent UI on another platform (web, iOS, etc.).

---

## Table of Contents

1. [Window Architecture](#1-window-architecture)
2. [Main / Welcome Window](#2-main--welcome-window)
3. [Project Window](#3-project-window)
4. [Style Definition Tab](#4-style-definition-tab)
5. [Creator View Layout (3-Column HSplitView)](#5-creator-view-layout-3-column-hsplitview)
6. [Library Views](#6-library-views)
7. [Unified Image Picker Modal](#7-unified-image-picker-modal)
8. [Shot-Specific UI](#8-shot-specific-ui)
9. [Settings](#9-settings)
10. [Reusable Components](#10-reusable-components)
11. [Web Migration Component Mapping](#11-web-migration-component-mapping)

---

## 1. Window Architecture

**File:** `ShotMakerApp.swift`

ShotMaker uses SwiftUI's multi-window model. The `@main` `App` struct declares 11 distinct `WindowGroup` entries, each opened via `openWindow(id:value:)` with a typed context struct. Window deduplication and lifecycle are managed through a combination of `sessionId` UUIDs and `WindowCoordinator` (a singleton with `NotificationCenter` observers).

### 1.1 WindowGroup Registry

| Window ID | Context Type | Default Size | Purpose |
|-----------|-------------|-------------|---------|
| `"main-welcome"` | None | System default | Welcome screen and project list |
| `"asset-creation"` | `AssetCreationContext` | 1200 x 800 | Create new assets |
| `"asset-edit"` | `AssetEditContext` | 1200 x 800 | Edit existing assets |
| `"frame-creation"` | `FrameCreationContext` | 1300 x 850 | Create new frames |
| `"frame-edit"` | `FrameEditContext` | 1300 x 850 | Edit existing frames |
| `"shot-creation"` | `ShotCreationContext` | 1200 x 800 | Create new shots |
| `"shot-edit"` | `ShotEditContext` | 1200 x 800 | Edit existing shots |
| `"media-preview"` | `MediaPreviewContext` | 400 x 300 min | Full-size media inspector |
| `"project"` | `Project` (Transferable) | System default | Per-project workflow window |
| `"settings"` | None | 800 x 600 | Application settings |
| `"new-project"` / `"open-project"` | None | 500 x 400 / 500 x 500 | Project creation / opening |

### 1.2 Context Structs

**File:** `Models/WindowContexts.swift`

Every creation/edit window receives a typed context struct conforming to `Codable` and `Hashable`. Each context contains:

- `projectId: UUID` -- identifies the parent project.
- `projectViewModelId: String` -- key into `ProjectViewModelRegistry.shared` for cross-window ViewModel sharing.
- `sessionId: UUID` -- generated fresh in `init()` to guarantee a unique window instance every time.

Creation contexts use `sessionId` as the SwiftUI window `id`. Edit contexts use the entity's own `id`, which enables SwiftUI to reuse (bring to front) an already-open edit window for the same entity.

| Context | Extra Fields | Window ID Strategy |
|---------|-------------|-------------------|
| `AssetCreationContext` | `assetType: AssetType` | `sessionId` (always new) |
| `AssetEditContext` | `assetId: UUID` | `assetId` (dedup) |
| `FrameCreationContext` | (none) | `sessionId` (always new) |
| `FrameEditContext` | `frameId: UUID` | `frameId` (dedup) |
| `ShotCreationContext` | `initialFrameId: UUID?` (for ReFrame) | `sessionId` (always new) |
| `ShotEditContext` | `shotId: UUID` | `shotId` (dedup) |
| `MediaPreviewContext` | `title: String`, `mediaType` (`.image`/`.video`), `imageData: Data?`, `videoData: Data?` | `sessionId` |

### 1.3 WindowCoordinator

**File:** `ShotMakerApp.swift` (inline class)

A singleton (`WindowCoordinator.shared`) that listens for `NotificationCenter` notifications and translates them into `openWindow` calls. This decouples views from direct window-opening logic.

| Notification Name | Action |
|-------------------|--------|
| `"OpenNewProjectWindow"` | Opens `"new-project"` window |
| `"OpenOpenProjectWindow"` | Opens `"open-project"` window |
| `"OpenSettings"` | Opens `"settings"` window |
| `"OpenProjectWindow"` | Extracts `Project` from `userInfo` and opens `"project"` window |

### 1.4 ProjectViewModelRegistry

Cross-window ViewModel sharing pattern:

1. When a `ProjectWindow` opens, it creates a dedicated `ProjectViewModel` instance with a unique `viewModelId` string: `"\(project.id.uuidString)-\(Date().timeIntervalSince1970)"`.
2. The ViewModel is registered in `ProjectViewModelRegistry.shared` via a `.task` modifier.
3. The `viewModelId` string is injected into the environment as `projectViewModelId`.
4. Child windows (asset-creation, frame-creation, etc.) receive this key in their context, then call `ProjectViewModelRegistry.shared.getViewModel(id:)` to obtain the same ViewModel instance.
5. On window close, `ProjectViewModelRegistry.shared.removeViewModel(id:)` is called for cleanup.

### 1.5 AppDelegate

**File:** `ShotMakerApp.swift` (inline class conforming to `NSApplicationDelegate`)

- `applicationWillTerminate`: triggers auto-save on all open projects.
- `applicationShouldTerminateAfterLastWindowClosed`: returns `false` (app stays alive with no windows).

### 1.6 Overlay System

The main welcome window wraps its content with two view modifiers that gate access behind mandatory setup:

1. `.requiresEULAConsent()` -- shows the `EULAConsentView` overlay with the underlying content disabled and blurred until the user accepts the EULA. Acceptance is persisted to `UserDefaults["eulaAccepted"]`.
2. `.requiresAPIKeySetup()` -- shows the `APIKeySetupView` overlay until a valid API key is stored in `AIProviderRegistry.shared`. The overlay prevents interaction with the app until setup is complete.

Both overlays use a `ZStack` approach: the real content remains mounted (disabled and blurred), and the overlay sits on top.

**Files:**
- `Views/EULAConsentView.swift` — `EULAConsentView` (terms/privacy summary, checkbox toggle, links to shotmaker.app/privacy and shotmaker.app/terms) + `EULACheckModifier` (`.requiresEULAConsent()`)
- `Views/APIKeySetupView.swift` — `APIKeySetupView` (3-step onboarding: get key → enter key → create project, links to Google AI Studio and Cloud Console, SecureField for key entry, saves via `AIProviderRegistry.shared.setAPIKey()`) + `APIKeyCheckModifier` (`.requiresAPIKeySetup()`)

### 1.7 Window Content Wrappers

Each `WindowGroup` in `ShotMakerApp.swift` delegates to a **window content wrapper** view. These wrappers are responsible for:
- Resolving the `ProjectViewModel` from `ProjectViewModelRegistry` using the context's `projectViewModelId`
- Creating or retrieving the entity ViewModel via `WindowViewModelManager.shared`
- Wiring up `WindowCloseInterceptor` for unsaved-changes protection
- Showing a `confirmationDialog` on close (Save / Close Without Saving / Cancel)
- Handling the close lifecycle: cancel generation → cleanup VM → close NSWindow
- Displaying an error state if the project or entity is no longer found

All wrappers follow the same pattern and share identical close/cleanup logic.

| Wrapper File | Context | ViewModel Created | Delegates To |
|-------------|---------|-------------------|--------------|
| `Views/AssetCreation/AssetCreationWindowContent.swift` | `AssetCreationContext` | `AssetCreationViewModel` (create mode) | `AssetCreationSheet` |
| `Views/AssetCreation/AssetEditWindowContent.swift` | `AssetEditContext` | `AssetCreationViewModel` (edit mode) | `AssetEditSheet` |
| `Views/FrameBuilder/FrameCreationWindowContent.swift` | `FrameCreationContext` | `FrameBuilderViewModel` (create mode) | `FrameCreationSheet` |
| `Views/FrameBuilder/FrameEditWindowContent.swift` | `FrameEditContext` | `FrameBuilderViewModel` (edit mode) | `FrameEditSheet` |
| `Views/ShotAnimation/ShotCreationWindowContent.swift` | `ShotCreationContext` | `ShotAnimationViewModel` (create mode) | `ShotCreationContent` |
| `Views/ShotAnimation/ShotEditWindowContent.swift` | `ShotEditContext` | `ShotAnimationViewModel` (edit mode) | `ShotCreationContent` (with `existingShot`) |

**Save-on-close flow (all wrappers):**
1. User attempts window close → `WindowCloseInterceptor.shouldClose` checks `viewModel.hasUnsavedChanges`
2. If unsaved changes: shows `confirmationDialog` with Save / Close Without Saving / Cancel
3. Save path: calls `viewModel.saveToLibrary()` or `viewModel.saveToProject()` → commits to `ProjectViewModel` → `saveCurrentProject()` → closes window
4. Close Without Saving: calls `closeWindow()` directly (cancels generation, cleans up VM, closes NSWindow)

---

## 2. Main / Welcome Window

**File:** `Views/MainWindow.swift`

The main window serves two purposes: it is both the welcome/landing screen for new users and the project workspace for an active project.

### 2.1 Top-Level Structure

```
MainWindow
  VStack(spacing: 0)
    WorkflowNavigation (tab bar -- hidden when no project)
    Divider
    Content area (tab-dependent)
    Toolbar (top of window)
```

### 2.2 Welcome View (No Project Loaded)

**Subview:** `WelcomeView` (defined in the same file)

| Element | Description |
|---------|-------------|
| App icon | `Image("AppIcon")`, 80 x 80, corner radius 16 |
| Title | "ShotMaker" in `.largeTitle` weight |
| Subtitle | "AI-Powered Video Creation" in `.title3`, secondary color |
| New Project button | Blue bordered prominent button, sparkles icon, posts `"OpenNewProjectWindow"` notification |
| Recent Projects | `GroupBox("Recent Projects")` containing a `List` of `ProjectRow` items |

**ProjectRow** displays:
- Project name (`.headline` font)
- Last modified date (`DateFormatter.short`)
- Asset count ("X assets")
- "Open" button (bordered prominent, blue tint) -- loads project and opens project window
- Trash button (plain, red) -- deletes project with confirmation

**File:** `Views/ProjectPickerSheet.swift` — `ProjectPickerSheet` is a standalone sheet modal for the File > Open Project flow. Displays a scrollable list of `ProjectRow` items with delete confirmation, header with close button, and Cancel footer. Used as an alternative to the `OpenProjectWindowContent` window when invoked from within an existing window context.

### 2.3 Toolbar

The toolbar (`.toolbar` modifier) contains:

| Position | Element | Behavior |
|----------|---------|----------|
| Leading | Project name pill | Blue tint, `.bordered` button style, shows project name or "No Project" |
| Center | Save indicator | Shows "Saving..." with pulse animation or "Saved" with green checkmark; `ProgressView` during save |
| Trailing | Settings gear | Opens settings via `"OpenSettings"` notification |

### 2.4 Workflow Tabs

When a project is loaded, `WorkflowNavigation` replaces the welcome view. It displays 4 tabs (see Section 10.9 for the component spec):

| Tab | View Shown |
|-----|-----------|
| Style | `StyleDefinitionView` |
| Assets | `AssetLibraryView` |
| Frames | `FramesLibraryView` |
| Shots | `ShotsLibraryView` |

Each tab receives a `WorkflowTabInfo` from the ViewModel containing:
- `badge`: count string (not currently used for badges, only for `statusText`)
- `hasContent`: boolean, shows green checkmark on the tab button
- `statusText`: e.g. "Cinematic Style", "12 assets", "5 frames", "2 shots"

---

## 3. Project Window

**File:** `Views/ProjectWindow.swift`

Each project opened from the welcome screen gets its own dedicated window via `WindowGroup(id: "project", for: Project.Type)`.

### 3.1 Architecture

```
ProjectWindow(project: Project)
  .task {
    Create dedicated ProjectViewModel
    Register in ProjectViewModelRegistry.shared
  }
  .onDisappear {
    Unregister ViewModel
  }
  WindowCloseInterceptor
    MainWindow content
      (injected environment: projectViewModelId)
```

Key differences from the shared `MainWindow`:

1. **Dedicated ViewModel**: Each project window creates its own `ProjectViewModel` rather than using the global `ProjectViewModel.shared`. The unique `viewModelId` is `"\(project.id.uuidString)-\(Date().timeIntervalSince1970)"`.
2. **Registry lifecycle**: The ViewModel is registered on `.task` and unregistered in the `WindowCloseInterceptor.onWillClose` callback.
3. **Environment injection**: `projectViewModelId` is set in the environment so child windows (creator/editor) can look up the correct ViewModel.

### 3.2 Close Behavior

`WindowCloseInterceptor` intercepts `windowShouldClose` to perform cleanup (unregister ViewModel, mark windows closed). No unsaved-changes dialog is shown for the project window itself (auto-save handles persistence).

---

## 4. Style Definition Tab

**File:** `Views/StyleDefinition/StyleDefinitionView.swift`

The Style tab is the first step in the workflow. It allows users to create and manage named visual styles that are applied across all asset, frame, and shot generation.

### 4.1 Layout

```
StyleDefinitionView
  if no styles exist:
    Empty state (icon + "Create Your First Style" button)
  else:
    StyleEditorView (HSplitView, 3 columns)
      Column 1: StyleParametersPanel (300-500pt)
      Column 2: StylePreviewArea (min 340pt, flexible)
      Column 3: VStack (280-450pt)
        StyleListPanel (height controlled by draggable divider)
        Draggable divider handle (9pt, capsule grip)
        DraftHistoryPanel (fills remaining space)
```

`StyleDefinitionView` owns the `@State` for `styleListHeight` and passes it as a `@Binding` to `StyleEditorView`. This ensures the divider position persists when switching between styles (since `StyleEditorView` is recreated via `.id(styleId)` on each switch, but the parent is not).

### 4.2 Style Editor View

**Subview:** `StyleEditorView` -- uses `HSplitView` with 3 columns:

#### Column 1: Style Parameters Panel (300-500pt)

A scrollable form containing these sections from top to bottom:

| Section | Component | Details |
|---------|-----------|---------|
| Model | `ModelSelectorView` | Picker for Google Gemini model, resolution picker if supported |
| Camera Styles | `StyledCard` | Aspect ratio picker, medium picker, film grain toggle, depth of field toggle |
| Quick Styles | `StyledCard` | 15 preset buttons in a 3-column `LazyVGrid`: Cinematic, Anime, Noir, etc. Clicking a preset fills all style parameters |
| Mode Toggle | Segmented control | "Preset" vs "Manual" mode. Preset mode shows Quick Styles; Manual mode shows individual parameter fields |
| Visual Styles | `StyledCard` (Manual mode) | 7 parameter pickers/text fields: lighting, color palette, aesthetic, atmosphere, mood, motion, texture |
| Custom Prompt | `StyledCard` | Multi-line `TextEditor` for freeform style instructions |
| Extract from Image | Button | Opens file picker, sends image to AI for style parameter extraction |
| Generate | `GenerateButton` | Footer, full-width, triggers style generation |

#### Column 2: Style Preview Area (flexible, min 340pt)

| Element | Description |
|---------|-------------|
| `PreviewGrid` | 3 cells in a row labeled "Character", "Object", "Set". Shows generated style example images |
| Style Sheet | Below preview grid, displays the extracted style description text |
| Action buttons | "Apply" (saves current draft as the applied style), "Save as New" (creates new named style from current), "Set as Default" (marks for auto-selection) |

Double-clicking a preview image opens a `MediaPreviewWindow` for full-size inspection.

#### Column 3: Style List + Draft History (280-450pt)

The right column is a `VStack` containing two panels separated by a draggable divider:

**Style List Panel (top):**

| Element | Description |
|---------|-------------|
| Header | "Visual Styles" title + "New" button (bordered prominent) |
| Style list | `ScrollView` of `StyleListItem` entries, each showing: star icon (gold if default), name, status indicator (Saved/Draft) |
| Delete | Trash icon on hover per row |

**Data bindings:**
- `@Binding var selectedStyleId: UUID?`
- `styles: [NamedStyle]` from `ProjectViewModel`

The panel height is controlled by `styleListHeight` (default 200pt, clamped 100-400pt), adjustable via the draggable divider handle below it.

**Draggable Divider:**

A 9pt-tall interactive region with a separator line and centered capsule grip (36 x 4pt). Shows `resizeUpDown` cursor on hover. Drag gesture adjusts `styleListHeight` within the 100-400pt range.

**Draft History Panel (bottom, fills remaining space):**

**File:** `Views/StyleDefinition/DraftHistoryView.swift`

This file contains all draft history card components used across entity types:

| Component | Purpose |
|-----------|---------|
| `DraftHistoryView` | Collapsible list of `DraftHistoryCard` entries for style drafts, with select/delete actions |
| `DraftHistoryCard` | Individual style draft card using `UnifiedDraftListItem` with composite 3-image thumbnails |
| `StyleReferenceCard` | Applied style reference display with green border, parameter summary, and "Load" action |
| `AssetReferenceCard` | Applied asset reference display with green border, model info, and description |
| `FrameDraftHistoryCard` | Frame draft card using `UnifiedDraftListItem` with single image thumbnail and primary badge |
| `ShotDraftHistoryCard` | Shot draft card with video placeholder, duration/extension info, and narrative excerpt |
| `ParameterRow` | Reusable label-value pair display (e.g., "Model: gemini-3-pro") |
| `EmptyHistoryView` | Empty state shown when no drafts exist yet |

| Element | Description |
|---------|-------------|
| Draft list | Scrollable list of `UnifiedDraftListItem` entries with composite 3-image thumbnails, ordered chronologically |
| Full Prompt section | Collapsible `DisclosureGroup` showing the complete prompt sent to the AI |
| Current Draft Details | Shows parameter values of the currently selected draft |

**Navigation flow:** Clicking a draft in the history list loads it into the preview area and updates the parameter panel to reflect its values.

---

## 5. Creator View Layout (3-Column HSplitView)

All three creator views (Asset, Frame, Shot) follow the same structural pattern: a 3-column `HSplitView` with a configuration sidebar on the left, a preview/generation area in the center, and a draft history panel on the right. Each is opened in its own window.

### 5.1 Window Lifecycle Pattern

**Files:** `*CreationWindowContent.swift`, `*EditWindowContent.swift`

Every creator/editor window follows this pattern:

```
*WindowContent(context: Context)
  .task {
    Resolve ProjectViewModel from ProjectViewModelRegistry
    Create or retrieve per-window ViewModel from WindowViewModelManager
  }
  WindowCloseInterceptor(
    shouldClose: { return !hasUnsavedChanges },
    onCloseAttempt: { showConfirmationDialog = true },
    onWillClose: { cleanup ViewModel, mark window closed }
  )
  ZStack {
    if isClosing: Color.clear   // prevents "Project Not Found" flash
    else: actual creation view
  }
  .alert("Unsaved Changes") {
    "Save" / "Close Without Saving" / "Cancel"
  }
```

The `isClosing` flag is set to `true` when the user confirms close, which immediately replaces the content with `Color.clear` before the window actually closes. This prevents a brief flash of error state when the ViewModel is cleaned up before the view hierarchy updates.

### 5.2 Asset Creation View

**File:** `Views/AssetCreation/AssetCreationView.swift`

#### Column 1: Asset Settings Sidebar (350-500pt)

| Section | Component | Details |
|---------|-----------|---------|
| Style | `StyleSelectorView` | Picker from project's saved styles, 80 x 80 example thumbnails |
| Model | `ModelSelectorView` | Gemini model picker with resolution selector and capability badges |
| Reference Images | `ImageSelectionPreview` | "Add Reference Images" button when empty; horizontal scroll of 80 x 80 thumbnails with remove buttons when populated. Opens `UnifiedImagePickerSheet` |
| Description | `TextEditor` | Multi-line text input for asset description, min height ~100pt |
| Attributes | Collapsible `AssetAttributesEditor` | Type-specific attribute pickers (see Section 10.5) |
| Camera Settings | Collapsible section | Only shown for "Set" type assets. Aspect ratio, framing presets |
| Negative Prompt | Collapsible `TextEditor` | What to avoid in generation |
| Validation | Error messages | Red text for validation failures (e.g., missing description) |
| Draft Count | `Picker` | 1-4 drafts per generation batch |
| Generate | `GenerateButton` | Footer button with cancel support |

#### Column 2: Asset Preview Area (flexible, min 400pt)

| Element | Description |
|---------|-------------|
| Reference Sheet | Displays the style's reference image grid above the main preview |
| Preview Image | Large generated image display, aspect-fit |
| `RefinementPanel` | Chat-based iterative refinement (see Section 10.8) |
| Name Field | `TextField` for the asset name |
| `DraftController` | Save / Save as New / Delete buttons (see Section 10.7) |
| Import Button | File importer for adding external images as asset drafts |
| `NotificationStack` | Error/success/warning banners |

#### Column 3: Draft History Sidebar (300-450pt)

| Element | Description |
|---------|-------------|
| Draft list | `UnifiedDraftListItem` entries with single-image thumbnails |
| Asset Reference Card | Green-bordered card showing the reference asset if one was used |
| Full Prompt | Collapsible section showing the complete generation prompt |
| Current Draft Details | Parameter values of the active draft |

### 5.3 Frame Creation View

**File:** `Views/FrameBuilder/FrameCreationContent.swift`

#### Column 1: Frame Configuration Panel (320-400pt)

| Section | Component | Details |
|---------|-----------|---------|
| Style | `StyleSelectorView` | Project style picker |
| Model | `FrameModelSelector` | Model picker (filters to image generation capable models) |
| Reference Images | `ImageSelectionPreview` | Optional reference images from project assets/frames or disk imports |
| Description | `TextEditor` | Frame scene description |
| Negative Prompt | Collapsible `TextEditor` | |
| Frame Attributes | Collapsible `FrameAttributesEditor` | Location, time, weather, scale, architecture, atmosphere pickers |
| Camera Settings | Collapsible section | Framing (shot type), perspective, composition rule, lens type, motion blur, lighting style, aspect ratio |
| Validation + Generate | `GenerateButton` | Footer |

#### Column 2: Frame Preview / Generation Panel (min 500pt)

| Element | Description |
|---------|-------------|
| Image Preview | Large preview with double-click to open `MediaPreviewWindow` |
| `RefinementPanel` | Chat-based refinement |
| Frame Name | `TextField` |
| `DraftController` | Save / Save as New / Delete |

#### Column 3: Frame Draft History Panel (300-400pt)

Same pattern as Asset draft history: `UnifiedDraftListItem` list, Full Prompt disclosure, Current Draft Details.

### 5.4 Shot Creation View

**File:** `Views/ShotAnimation/ShotCreationContent.swift`

#### Column 1: Shot Configuration Panel (320-400pt)

| Section | Component | Details |
|---------|-----------|---------|
| Frame Selector | Button / preview | Select a frame as the visual basis for the shot. Shows frame thumbnail when selected |
| Model | Model picker | Video generation model (Veo), with capability description badge |
| Images | `ImageSelectionPreview` | Mode-dependent: interpolation (first/last frame slots) or reference images, depending on model capabilities. Hidden if reference images selected and model does not support both |
| Narrative | `TextEditor` | Shot action/story description |
| Audio Prompt | `TextField` | Optional audio/music/SFX description |
| Camera Movement | `Picker` | 18 camera movement presets (Static, Push In, Pull Out, Pan Left, Pan Right, Tilt Up, Tilt Down, Orbit, Crane Up, Crane Down, Dolly In, Dolly Out, Zoom In, Zoom Out, Tracking, Handheld, Aerial, Drone) |
| Duration | `Picker` | Duration in seconds |
| Aspect Ratio | `Picker` | 16:9, 9:16, 1:1, 4:3 |
| Resolution | `Picker` | 720p, 1080p (availability depends on model) |
| Negative Prompt | Collapsible `TextEditor` | |
| Generate | `GenerateButton` | Footer |

#### Column 2: Shot Preview Panel (flexible)

| Element | Description |
|---------|-------------|
| Video Player | `AVPlayerViewRepresentable` with inline controls and fullscreen toggle |
| `RefinementPanel` | Chat-based refinement |
| Shot Name | `TextField` |
| `DraftController` | Save / Save as New / Delete / ReFrame / Extend |

The "ReFrame" button opens a new `FrameCreationContent` window pre-seeded from the shot's current frame. The "Extend" button opens the `ExtensionPanel` (see Section 8.1).

#### Column 3: Shot Draft History Panel (300-400pt)

Same pattern as other creators, but uses `VideoThumbnailCompact` for draft thumbnails (auto-generated from video data at 0.5s mark).

---

## 6. Library Views

All four library views (Style list embedded in StyleDefinitionView, AssetLibraryView, FramesLibraryView, ShotsLibraryView) share a common visual pattern. The three entity libraries (Asset, Frame, Shot) are nearly identical in structure.

### 6.1 Common Library Layout

```
LibraryView
  VStack(spacing: 0)
    Header Bar
      HStack:
        Filter tabs (type-specific)
        Search field
        Selection count
        Grid/List toggle
        Export menu
        Import button (if applicable)
        "New" button
    Divider
    Content (Grid or List mode)
```

### 6.2 Asset Library View

**File:** `Views/AssetCreation/AssetLibraryView.swift`

#### Header Elements

| Element | Details |
|---------|---------|
| Filter Tabs | "All", "Character", "Object", "Set" -- each is a `.bordered` button with tint based on active state |
| Search | `TextField` with magnifying glass icon and clear button |
| Selection Count | Shows "X selected" when multi-select is active |
| View Toggle | Grid/List toggle button using `ViewPreferences` |
| Export Menu | `Menu` with "Export Selected" and "Export All" options, formats: PNG, JSON metadata |
| Import Button | Opens type selection sheet, then file picker |
| New Button | Plus icon, opens `AssetCreationSheet` |

#### Grid Mode

```swift
LazyVGrid(columns: [GridItem(.adaptive(minimum: 200, maximum: 250))], spacing: 16)
```

**AssetCard** (200 x 250pt approx):
- 200 x 200 thumbnail (aspect fill, clipped, corner radius 8)
- Asset name below thumbnail (`.caption` font, 2-line limit)
- Draft count badge
- Hover overlay with Edit / Export / Delete buttons
- Context menu: Edit, Duplicate, Export, Delete

#### List Mode

```swift
LazyVStack(spacing: 8)
```

**AssetListRow**: horizontal row with 60 x 60 thumbnail, name, type badge, draft count, action buttons.

#### Asset Creation Sheet

A 2-step modal flow:
1. **Type Selection**: 3 large cards (Character, Object, Set) with icons and descriptions.
2. **Creation View**: Opens `AssetCreationView` in a new window with the selected type.

#### Import Flow

1. Type selection sheet (same 3 cards)
2. `NSOpenPanel` file picker (PNG, JPEG, HEIC)
3. Creates an `Asset` with the imported image as a draft

### 6.3 Frames Library View

**File:** `Views/FrameBuilder/FramesLibraryView.swift`

Same layout as Asset Library. Differences:
- No type filter tabs (frames do not have subtypes)
- **FrameCard**: shows frame preview image, name, draft count
- **FrameListRow**: horizontal row with thumbnail, name, description excerpt
- "New" button opens `FrameCreationContent` in a new window

### 6.4 Shots Library View

**File:** `Views/ShotAnimation/ShotsLibraryView.swift`

Same layout as Asset Library. Differences:
- No type filter tabs
- **ShotCard**: shows video thumbnail (generated via `AVAssetImageGenerator` at 0.5s), name, duration badge, draft count
- Import button opens `VideoImportSheet` (see Section 8.2)
- "New" button opens `ShotCreationContent` in a new window

---

## 7. Unified Image Picker Modal

**File:** `Components/UnifiedImagePickerSheet.swift`

A full-screen modal sheet used by Asset, Frame, and Shot creators for selecting reference images, interpolation frames, or style reference images. It adapts its behavior based on the model's capabilities.

### 7.1 Layout

```
UnifiedImagePickerSheet
  VStack(spacing: 0)
    Header (title, selection count, close button)
    Divider
    Mode Selector (if model supports reference + interpolation)
    Divider
    Filter Bar (type tabs + search)
    Divider
    Content Area (grid of cards or import section)
    Divider
    Footer (Clear All, Done buttons)
```

**Size:** 75% of screen height, 4:3 aspect ratio (calculated from `NSScreen.main?.visibleFrame`)

### 7.2 Modes

The picker operates in two mutually exclusive modes:

| Mode | Selection Behavior | Max Selections |
|------|-------------------|----------------|
| **Reference** | Multi-select with blue checkmarks. Items are added to `selectedImageItems` array | Configurable via `maxImages` parameter (typically 3-14) |
| **Interpolation** | Exactly two slots: "First Frame" (green) and "Last Frame" (purple). Sequential assignment | 2 |

When a model supports both modes (e.g., Veo 3.1 Standard), a toggle switch labeled "Enable Reference Mode" appears. Switching modes clears the opposite mode's selections.

### 7.3 Filter Tabs

| Tab | Sources Shown |
|-----|--------------|
| All | Assets + Frames + Imported |
| Assets | Only project assets |
| Frames | Only project frames |
| Import | File import UI + imported images |

The "Import" tab shows a large "Import Images from Disk" button that opens `NSOpenPanel` for PNG/JPEG/HEIC. Imported images are auto-selected in reference mode.

### 7.4 Item Grid

```swift
LazyVGrid(columns: [GridItem(.adaptive(minimum: 176, maximum: 200), spacing: 20)], spacing: 20)
```

Each item is rendered as a `UnifiedImageCard` (see Section 10.12).

### 7.5 Data Flow

The picker is generic over `ViewModel: ImageSelectableViewModel`. The `ImageSelectableViewModel` protocol requires:
- `selectedImageItems: [ImageSelectionItem]`
- `firstFrameItem: ImageSelectionItem?` / `lastFrameItem: ImageSelectionItem?`
- `hasFirstFrame: Bool` / `hasLastFrame: Bool`
- `availableFrames: [Frame]`
- `toggleImageSelection(_:mode:maxImages:)`
- `canSelectImage(_:mode:maxImages:) -> Bool`
- `clearFirstFrame()` / `clearLastFrame()` / `clearAllSelections(mode:)`
- `setFirstFrame(_:)` / `setLastFrame(_:)`
- `removeImageItem(_:mode:)`

`ImageSelectionItem` is an enum with cases `.asset(Asset)`, `.frame(Frame)`, `.imported(ImportedImage)`, providing uniform access to `name`, `previewImageData`, and `sourceType`.

---

## 8. Shot-Specific UI

### 8.1 Extension Panel

**File:** `Views/ShotAnimation/ExtensionPanel.swift`

Allows extending an existing shot video by generating additional footage appended to the end.

**Layout:** `HSplitView` with 2 columns:

#### Left Column: Extension Configuration

| Element | Description |
|---------|-------------|
| Original Video Info | Shows source video thumbnail, name, and current duration |
| Extension Prompt | `TextEditor` for describing what should happen in the extended portion |
| Duration Picker | Segmented control: 2s, 4s, 6s, 8s |
| Cost Estimate | Shows estimated API cost based on duration |
| Extend Button | `GenerateButton` triggering `videoProvider.extendVideo` |

#### Right Column: Extended Preview

| Element | Description |
|---------|-------------|
| Video Player | `AVPlayerViewRepresentable` showing the extended result |
| Save Button | Saves the extended video as a new draft on the shot |

### 8.2 Video Import Sheet

**File:** `Views/ShotAnimation/VideoImportSheet.swift`

A simple dialog for importing external video files as shot drafts.

| Element | Description |
|---------|-------------|
| File Picker | Triggers `NSOpenPanel` for video files |
| Name Field | `TextField` for the shot name |
| Validation | Checks video duration is 0-120 seconds |
| Import Button | Creates a `Shot` entity with the imported video as a single draft |

---

## 9. Settings

### 9.1 Settings Window

**File:** `Views/Settings/SettingsView.swift`

**Size:** 800 x 600

`TabView` with up to 3 tabs:

| Tab | Visible | Content |
|-----|---------|---------|
| Google API | Always | API key configuration |
| About | Always | App info and links |
| Developer | Only when developer mode enabled | System prompt editors |

#### Developer Mode Activation

Developer mode is hidden and requires a specific unlock sequence:
1. Click the "Settings" title text 11 times within 2 seconds.
2. A password prompt sheet appears (`DeveloperPasswordPrompt`).
3. Enter the password "luxojr".
4. On success, the Developer tab becomes visible for the session.

### 9.2 Google API Settings

**Subview:** `GoogleAPISettingsView`

| Element | Description |
|---------|-------------|
| API Key | `SecureField` bound to `AIProviderRegistry.shared` |
| Default Image Model | `Picker` for the default Gemini image model |
| Default Video Model | `Picker` for the default Veo video model |
| Links | "Get API Key" links to Google AI Studio and Google Cloud Console |

### 9.3 About Settings

**Subview:** `AboutSettingsView`

| Element | Description |
|---------|-------------|
| App Icon | Large display |
| Version | From `Bundle.main` |
| Links | Privacy Policy, Terms of Service, Website (as `Link` views) |

### 9.4 Developer Settings

**File:** `Views/Settings/DeveloperSettingsView.swift`

**Layout:** `HSplitView` with sidebar + content area.

**Sidebar:** List of 12 prompt section entries:

| Section | Purpose |
|---------|---------|
| Style Generate | System prompt for style generation |
| Style Extract | System prompt for style extraction from images |
| Character Generate | System prompt for character asset generation |
| Character Refine | System prompt for character refinement |
| Object Generate | System prompt for object asset generation |
| Object Refine | System prompt for object refinement |
| Set Generate | System prompt for set/environment generation |
| Set Refine | System prompt for set refinement |
| Frame Generate | System prompt for frame generation |
| Frame Refine | System prompt for frame refinement |
| Shot Generate | System prompt for shot generation |
| Shot Extend | System prompt for shot extension |

**Content Area:** For each section, displays two `TextEditor` fields:
- System Prompt (JSON format)
- User Prompt (JSON format)

Both are editable and changes are persisted to UserDefaults.

### 9.5 Developer Password Prompt

**File:** `Views/Settings/DeveloperPasswordPrompt.swift`

A modal dialog (400 x 280pt):
- Lock shield icon (48pt, accent color)
- "Developer Mode" title
- `SecureField` for password input (300pt wide)
- Error text (red, shown on wrong password)
- Cancel / Unlock buttons (Cancel uses `.cancelAction` shortcut, Unlock uses `.defaultAction`)

---

## 10. Reusable Components

### 10.1 StyledCard

**File:** `Views/Components/StyledCard.swift`

A generic container card used throughout configuration panels.

| Property | Value |
|----------|-------|
| Layout | `VStack(alignment: .leading, spacing: 12)` |
| Title | `.headline` font, primary color |
| Padding | 16pt all sides |
| Background | `Color(nsColor: .controlBackgroundColor)` |
| Corner radius | 8pt |
| Border | 1pt stroke, `Color.gray.opacity(0.3)` |

Usage: Wrap any content in `StyledCard(title: "Section Name") { ... }`.

### 10.2 StyleSelectorView

**File:** `Components/StyleSelectorView.swift`

A reusable dropdown for selecting a project style, used in Asset, Frame, and Shot creators.

| Element | Description |
|---------|-------------|
| Label | "Visual Style:" in `.headline` font |
| Picker | SwiftUI `Picker` with `UUID?` selection binding. Shows "No Saved Style" if list is empty, otherwise "No Style" as nil option plus all `NamedStyle` entries |
| Thumbnails | When a style is selected, shows up to 3 example images (80 x 80) from the style's applied/current/last draft |
| Empty State | Info banner: "No styles created yet. Create styles in the Style Creator." |

**Data bindings:**
- `@Binding var selectedStyleId: UUID?`
- `let availableStyles: [NamedStyle]`
- `let onStyleSelected: (UUID?) -> Void`

### 10.3 ModelSelectorView

**File:** `Components/ModelSelectorView.swift`

A reusable model picker that reads available models from `AIProviderRegistry.shared`.

| Element | Description |
|---------|-------------|
| Model Picker | Label shows "Google Veo Model" or "Google Gemini Model" depending on capability. `Picker` bound to `selectedModel: String` |
| Resolution Picker | Conditional: only shown when the selected model has `supportedResolutions`. Bound to `selectedResolution: String?` |
| Warning | Orange banner with exclamation icon shown when Google provider is not configured |

**Parameters:**
- `@Binding var selectedModel: String`
- `@Binding var selectedResolution: String?`
- `let capability: ProviderCapability` (`.imageGeneration`, `.imageToImage`, `.multiView`, `.videoGeneration`)
- `var requiresTextToImage: Bool` -- when true, filters out image-to-image only models

### 10.4 StatusBadge

**File:** `Components/StatusBadge.swift`

A small colored badge indicating entity status.

| Status | Color | Icon | Text |
|--------|-------|------|------|
| `.draft` | Orange | `doc.text` | "Draft" |
| `.reference` | Green | `checkmark.circle.fill` | "Reference" |
| `.modified` | Yellow | `pencil.circle.fill` | "Modified" |
| `.none` | Gray | `circle` | "No Content" |

Supports `compact: Bool` mode (icon only, smaller padding). Provides extensions on `StyleStatus` and `AssetStatus` to convert to `BadgeStatus`.

### 10.5 AssetAttributesEditor

**File:** `Components/AssetAttributesEditor.swift`

A polymorphic attribute editor that switches layout based on `AssetType`. Each sub-editor presents a vertical stack of `AttributeRow` views, each containing a label, optional `ParameterInfoView` tooltip, and a `Picker`.

#### Character Attributes
| Attribute | Type | Options |
|-----------|------|---------|
| Age | `CharacterAge?` | Child, Teen, Young Adult, Adult, Middle-Aged, Elderly |
| Build | `CharacterBuild?` | Slim, Athletic, Muscular, Stocky, Average |
| Clothing | `CharacterClothing?` | Casual, Formal, Fantasy, Sci-Fi, Military, etc. |
| Hair | `CharacterHair?` | Short, Long, Curly, Braided, Bald, etc. |
| Expression | `CharacterExpression?` | Neutral, Happy, Confident, Sad, Angry, etc. |
| Posture | `CharacterPosture?` | Standing, Sitting, Walking, Relaxed, etc. |

#### Object Attributes
| Attribute | Type |
|-----------|------|
| Size | `ObjectSize?` |
| Material | `ObjectMaterial?` |
| Condition | `ObjectCondition?` |
| Style | `ObjectStyle?` |
| Era | `ObjectEra?` |
| Function | `ObjectFunction?` |

#### Set Attributes
| Attribute | Type |
|-----------|------|
| Location | `SetLocation?` |
| Time | `SetTime?` |
| Weather | `SetWeather?` |
| Scale | `SetScale?` |
| Architecture | `SetArchitecture?` |
| Atmosphere | `SetAtmosphere?` |

All attributes are nullable (each picker has a "None" option). The `AttributeRow` helper view aligns labels at 90-110pt width with the picker filling the remaining space.

### 10.6 FrameAttributesEditor

**File:** `Components/FrameAttributesEditor.swift`

Subset of set/environment attributes for frame context. Contains the same 6 pickers as Set Attributes (Location, Time, Weather, Scale, Architecture, Atmosphere) but with direct `@Binding var attributes: AssetAttributeSet` without the `onAttributeChanged` callback wrapper.

### 10.7 DraftController

**File:** `Views/Components/DraftController.swift`

Action button bar displayed below the preview area in all creators.

**Layout:** `HStack` with black background, rounded corners.

| Button | Style | Tint | Condition |
|--------|-------|------|-----------|
| Save | `.borderedProminent` | Configurable | Always shown |
| Save as New | `.borderedProminent` | Configurable | When editing existing entity |
| Delete | `.bordered` | Red | When more than 1 draft exists |

Additional action buttons (ReFrame, Extend) are added by the Shot creator via the same pattern.

### 10.8 RefinementPanel

**File:** `Views/Components/RefinementPanel.swift`

Chat-based iterative refinement UI displayed in the center column of all creators.

**Layout:**
```
VStack
  Header: "Refinement" title + history toggle button
  if showHistory:
    ScrollView (conversation history)
      ForEach messages:
        User message (right-aligned, blue bubble)
        AI message (left-aligned, gray bubble)
  HStack:
    TextField (refinement instruction input)
    Send button (arrow.up.circle.fill icon)
  Help text ("Describe changes you'd like to make")
```

**Styling:** Blue-tinted card background (`Color.blue.opacity(0.05)`) with rounded corners and subtle border.

**Data bindings:**
- Conversation history array from the creator's ViewModel
- Text input binding for current refinement instruction
- Send action callback

### 10.9 WorkflowNavigation

**File:** `Components/WorkflowNavigation.swift`

The tab bar displayed at the top of the main/project window.

**Layout:** `HStack(spacing: 12)` filling the full width, 8pt vertical + 20pt horizontal padding, `windowBackgroundColor` background.

**4 tabs defined by `WorkflowTab` enum:**

| Tab | Icon | Description |
|-----|------|-------------|
| Style | `paintpalette` | "Define visual style" |
| Assets | `cube.box` | "Create assets" |
| Frames | `camera.viewfinder` | "Build frames" |
| Shots | `film` | "Animate shots" |

**WorkflowTabButton** structure:
- Icon (18pt, medium weight) + optional green checkmark (`checkmark.circle.fill`, 14pt)
- Tab title (12pt, semibold)
- Optional status text (10pt, secondary)
- Active tab: blue tint + `Color.blue.opacity(0.1)` background
- Minimum width: 110pt per tab

### 10.10 GenerateButton

**File:** `Views/Components/GenerateButton.swift`

Reusable generation trigger button used in all creator sidebars.

| State | Appearance |
|-------|-----------|
| Ready | `sparkles` icon + "Generate" text, `.borderedProminent`, full width |
| Generating | `ProgressView` + "Generating...", disabled. A separate "Cancel" button appears alongside |
| Disabled | Grayed out when validation fails |

### 10.11 NotificationBanner / NotificationStack

**File:** `Components/NotificationBanner.swift`

#### NotificationBanner

A single notification row displaying:
- Type icon (error: red `xmark.circle`, success: green `checkmark.circle`, warning: orange `exclamationmark.triangle`, info: blue `info.circle`)
- Message text (`.caption`, `.medium` weight)
- Optional error code in brackets (`[AUTH_001]`)
- Optional detail text (`.caption2`, secondary)
- Dismiss button (X icon)

**Background:** Type-specific color at 0.1 opacity.

#### NotificationStack

A `VStack(spacing: 8)` of `NotificationBanner` items with:
- Animated insertion (`.move(edge: .top)` + `.opacity`)
- Animated removal (`.opacity`)
- Auto-dismiss support: configurable `dismissDuration` (in seconds) per notification

### 10.12 UnifiedImageCard

**File:** `Components/UnifiedImageCard.swift`

Mode-aware image card used in the `UnifiedImagePickerSheet` grid.

**Structure:**
```
Button(onTap)
  VStack(spacing: 8)
    ZStack (160 x 160)
      Thumbnail image (cached via ImageCacheManager)
      Selection indicator (mode-dependent)
      Disabled overlay (if !canSelect: black 50% + lock icon)
    Name (caption, 2 lines max)
    Source type badge (colored pill: blue=character, green=object, orange=set, purple=frame, gray=imported)
  Background: controlBackgroundColor
  Border: blue (selected reference), green (first frame), purple (last frame), or clear
```

**Selection indicators by mode:**
- **Reference mode:** Blue `checkmark.circle.fill` on selected items
- **Interpolation mode:** Numbered circle badge (1 = green "First", 2 = purple "Last")

**Image caching:** Uses a singleton `ImageCacheManager` with `NSCache` (100 item limit) to avoid decoding the same `Data` to `NSImage` on every render.

### 10.13 ImageSelectionPreview

**File:** `Components/ImageSelectionPreview.swift`

Inline preview of selected images shown in creator sidebars. Generic over `ViewModel: ImageSelectableViewModel`.

**Two display modes based on selection type:**

#### Reference Mode Preview
- Horizontal `ScrollView` of 80 x 80 `ReferenceThumbnail` items with remove (X) buttons
- "Add"/"Edit" button at the end (plus icon if below max, pencil if at max)
- Count text: "X of Y images selected"

#### Interpolation Mode Preview
- Two `InterpolationFrameCard` slots stacked vertically with an arrow between them
- Each card shows: colored circle number badge (green 1 / purple 2), frame label, 120pt height image or dashed-border empty placeholder, item name

**Empty state:** "Select Images" button with `photo.badge.plus` icon, blue tint background.

### 10.14 AssetSelectionPreview

**File:** `Components/AssetSelectionPreview.swift`

Simpler variant of `ImageSelectionPreview` specifically for selecting project assets (not generic over ViewModel). Uses `@Binding var selectedAssetIds: [UUID]` and resolves assets from `allAssets: [Asset]`.

Shows `AssetThumbnail` items (80 x 80) in a horizontal scroll with remove buttons.

### 10.15 PreviewGrid

**File:** `Components/PreviewGrid.swift`

Grid of preview cells used in the Style Definition preview area and potentially other multi-image preview contexts.

**Parameters:**
- `items: [PreviewItem]` -- each item has a `label`, optional `imageData`, and `isLoading` flag
- `columns: Int` -- default 3
- `onDoubleClick: ((Data, String) -> Void)?` -- callback for double-click to open full preview

**PreviewCell** layout:
- Square aspect ratio image (aspect fill, clipped, rounded corners 8)
- Empty state: dashed border rectangle with quaternary label fill
- Loading overlay: black 50% opacity + `ProgressView` + "Generating..." text
- Label below image (`.caption`, `.medium` weight, secondary color)

### 10.16 NavigationGuard

**File:** `Components/NavigationGuard.swift`

An `ObservableObject` class that intercepts navigation attempts when there are unsaved changes.

**API:**
- `hasUnsavedChanges: Bool` -- set by the creator ViewModel
- `showUnsavedChangesDialog: Bool` -- triggers the dialog
- `requestNavigation(to:) -> Bool` -- returns true if safe to navigate, false if dialog should show. Stores the pending navigation closure.
- `saveAndContinue()` / `cancelNavigation()` / `discardAndContinue()` -- dialog response handlers

**View modifier:** `.navigationGuard(guard, onSaveAsReference: { ... })` -- attaches the `UnsavedChangesDialog` sheet.

**Environment key:** `NavigationGuardKey` allows passing the guard through the environment.

### 10.17 UnsavedChangesDialog

**File:** `Components/UnsavedChangesDialog.swift`

A modal sheet (400pt wide) shown when the user tries to leave with unsaved changes.

**Layout:**
```
VStack(spacing: 20)
  Warning icon (exclamationmark.triangle.fill, 48pt, orange)
  "Unsaved Changes" title
  Description text
  Divider
  3 action buttons (VStack, full width):
    "Save as Reference" (borderedProminent, large, pin icon) -- primary action
    "Continue Editing" (bordered, large, pencil icon)
    "Discard Changes" (bordered, large, destructive role, trash icon)
```

Applied as a view modifier via `.unsavedChangesDialog(isPresented:onSaveAsReference:onContinueEditing:onDiscardChanges:)`.

### 10.18 WindowCloseInterceptor

**File:** `Views/Components/WindowCloseInterceptor.swift`

An `NSViewRepresentable` that installs a custom `NSWindowDelegate` on the parent window to intercept close events.

**Callbacks:**
- `shouldClose: () -> Bool` -- return `false` to prevent close
- `onCloseAttempt: () -> Void` -- called when close is blocked (typically shows confirmation dialog)
- `onWillClose: () -> Void` -- called when window is actually closing (cleanup)

**Implementation:** Finds the parent `NSWindow` by walking up the view hierarchy from the hosted `NSView`, then sets `window.delegate` to a coordinator object.

### 10.19 DraftNavigationController

**File:** `Views/Components/DraftNavigationController.swift`

Generic draft navigation bar: "Draft X of Y" label, left/right chevron buttons, trash button.

**Parameters:**
- `drafts: [DraftType]` (generic, requires `Identifiable`)
- `@Binding var currentIndex: Int`
- `onDelete: (Int) -> Void`

**Layout:** `HStack(spacing: 8)` with `controlBackgroundColor` background, 6pt corner radius. Left/right buttons disabled at bounds. Trash disabled when only 1 draft remains.

### 10.20 AVPlayerViewRepresentable

**File:** `Views/Components/AVPlayerViewRepresentable.swift`

`NSViewRepresentable` wrapping AppKit's `AVPlayerView` to avoid a SwiftUI `VideoPlayer` crash on macOS 26.

**Configuration:**
- `controlsStyle: .inline`
- `showsFullScreenToggleButton: true`
- Updates player reference when the binding changes (identity check via `!==`)

### 10.21 MediaPreviewWindow

**File:** `Views/Components/MediaPreviewWindow.swift`

View-only window for inspecting images and videos at full size.

**Routing:** Switches on `context.mediaType`:
- `.image`: displays `Image(nsImage:)` with aspect-fit
- `.video`: displays `VideoPreviewContent` which writes video data to a temporary file and creates an `AVPlayer`

**Minimum size:** 400 x 300. Title set from `context.title`.

### 10.22 ParameterInfoView

**File:** `Components/ParameterInfoView.swift`

Tooltip info button (blue `info.circle` icon) that shows a popover on click.

**Popover content:**
- Title (`.headline`)
- Description (`.caption`, secondary, multi-line)
- Divider
- Examples list (bulleted, `.caption2`)

**Width:** 250-400pt

The `ParameterInfo` struct contains static definitions for all parameter tooltips used throughout the app (approximately 40 entries covering style, camera, asset, frame, and shot parameters).

### 10.23 Unified Draft Navigation Components

**Files:** `Components/UnifiedDraftNavigation/DraftBadge.swift`, `DraftThumbnail.swift`, `UnifiedDraftListItem.swift`

#### DraftBadge

Small colored pill badge indicating draft status.

| Type | Background | Icon | Text |
|------|-----------|------|------|
| `.primary` | Blue | `star.fill` | "PRIMARY" |
| `.viewing` | Blue | `eye.fill` | (empty) |
| `.extended(count)` | Green | `arrow.forward.circle.fill` | "xN" |
| `.referenceUsed` | Gray | (none) | "REF" |
| `.applied` | Green | `checkmark.circle.fill` | "APPLIED" |

#### Draft Thumbnails

Cached thumbnail components for different media types:

| Component | Use Case | Size | Caching |
|-----------|----------|------|---------|
| `ImageThumbnail` | Asset/Frame drafts | 50 x 50 | `NSCache` (200 items, 50MB) |
| `SeparateImagesThumbnail` | Style drafts (3 images in a row) | 3 x 50 x 50 | Shared image cache |
| `VideoThumbnailCompact` | Shot drafts | 50 x 50 | Separate `NSCache` (50 items, 20MB), generates from `AVAssetImageGenerator` at 0.5s |
| `PlaceholderThumbnail` | Missing image | 50 x 50 | N/A |
| `VideoPlaceholderThumbnail` | Missing video | 50 x 50 | N/A |

All image-based thumbnails load on a background thread via `Task.detached(priority: .userInitiated)` to avoid blocking the UI.

#### UnifiedDraftListItem

The standard draft row component used in all draft history panels.

**Layout:**
```
Button(onSelect)
  HStack(spacing: 8)
    thumbnailView (type-erased via AnyView, 50pt height)
    VStack(alignment: .leading, spacing: 4)
      HStack: title + DraftBadge array
      Optional subtitle (caption2, secondary)
    Spacer
    Delete button (trash icon, red)
  Background: blue 15% if current, controlBackgroundColor otherwise
  Border: blue 2pt if current, separator 1pt otherwise
```

**Convenience initializers:**
- `init(imageData:...)` -- single image thumbnail
- `init(imageData: Data?, ...)` -- optional image with placeholder fallback
- `init(compositeImages:...)` -- 3-image row (for Style drafts)
- `init(videoData:...)` -- video thumbnail
- `init(videoData: Data?, ...)` -- optional video with placeholder fallback

---

## 11. Web Migration Component Mapping

This section maps every ShotMaker macOS component to its recommended web equivalent for a potential web-based implementation.

### 11.1 Window Architecture

| macOS Concept | Web Equivalent |
|---------------|---------------|
| Multiple `WindowGroup`s | Single-page app with route-based views or modal overlays |
| `openWindow(id:value:)` | React Router navigation or modal state management |
| `WindowCoordinator` + `NotificationCenter` | Global event bus (EventEmitter) or React Context + dispatch |
| `ProjectViewModelRegistry` | React Context providers or global state store (Zustand/Redux) |
| `WindowCloseInterceptor` | `window.onbeforeunload` for browser close; in-app navigation guards |
| `NSWindowDelegate` close interception | `react-router` `useBlocker` or custom `beforeunload` handler |

### 11.2 Layout Components

| macOS Component | Web Equivalent |
|----------------|---------------|
| `HSplitView` (3-column) | CSS Grid (`grid-template-columns: 350px 1fr 350px`) or flexbox with resize handles |
| `LazyVGrid(.adaptive(minimum:maximum:))` | CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(200px, 250px))` |
| `ScrollView` | `overflow: auto` container, or virtualized list (react-virtuoso) for large lists |
| `LazyVStack` | Virtualized list component |
| `TabView` | Tab component (headless UI Tabs, Radix Tabs) |
| `GroupBox` | `<fieldset>` or styled card with title |
| `DisclosureGroup` | `<details>/<summary>` or Accordion component |
| `Divider` | `<hr>` or CSS border |

### 11.3 Input Components

| macOS Component | Web Equivalent |
|----------------|---------------|
| SwiftUI `Picker` | `<select>` dropdown or custom Combobox (Radix Select) |
| `TextField` | `<input type="text">` |
| `SecureField` | `<input type="password">` |
| `TextEditor` | `<textarea>` with auto-resize |
| `Toggle` | `<input type="checkbox">` or Switch component |
| Segmented `Picker` | Radio group styled as segmented buttons |
| `.borderedProminent` Button | `<button>` with primary styling |
| `.bordered` Button | `<button>` with secondary/outlined styling |

### 11.4 Media Components

| macOS Component | Web Equivalent |
|----------------|---------------|
| `Image(nsImage:)` | `<img>` with `object-fit: cover/contain` |
| `AVPlayerViewRepresentable` | HTML5 `<video>` element with controls |
| `NSOpenPanel` (file picker) | `<input type="file">` with accept attributes |
| `AVAssetImageGenerator` | Server-side thumbnail generation or `<canvas>` frame extraction from `<video>` |
| `NSImage(data:)` | `URL.createObjectURL(blob)` or base64 data URI |
| `ImageCacheManager` / `NSCache` | Browser LRU cache, `Map` with size limit, or service worker cache |

### 11.5 Overlay / Modal Components

| macOS Component | Web Equivalent |
|----------------|---------------|
| `.sheet(isPresented:)` | Modal dialog (Radix Dialog, headless UI Dialog) |
| `.alert()` | Native `confirm()`/`alert()` or custom alert dialog |
| `.popover()` | Popover component (Radix Popover, Floating UI) |
| `.help()` (tooltip) | CSS `title` attribute or Tooltip component |
| `.contextMenu` | Custom right-click menu (Radix ContextMenu) |
| `.fileImporter` | `<input type="file">` triggered programmatically |
| EULA/API overlay (ZStack + blur) | Full-screen modal with `backdrop-filter: blur()` |

### 11.6 State Management

| macOS Pattern | Web Equivalent |
|---------------|---------------|
| `@ObservedObject` / `@StateObject` | React `useState` + `useEffect`, or store subscription hooks |
| `@Binding` | Props with callback (`value` + `onChange`) |
| `@Environment` | React Context (`useContext`) |
| `@Published` properties | Observable/signal libraries (MobX, Zustand, Jotai) |
| `ProjectViewModel.shared` | Global store singleton |
| `ProjectViewModelRegistry` | Context provider per project route |
| `UserDefaults` | `localStorage` / `sessionStorage` |
| `NotificationCenter` | EventEmitter, CustomEvent, or global state dispatch |

### 11.7 Navigation

| macOS Pattern | Web Equivalent |
|---------------|---------------|
| `WorkflowNavigation` (4 tabs) | Tab bar component with route segments (`/project/:id/style`, `/assets`, etc.) |
| `openWindow(id:value:)` | `window.open()` for separate windows, or navigate to route + modal for in-app |
| Window deduplication (edit context with entity ID) | Route-based dedup (navigating to same route focuses existing tab/panel) |
| `NavigationGuard` | `react-router` `useBlocker` / `Prompt` component |

### 11.8 Animation / Transitions

| macOS Pattern | Web Equivalent |
|---------------|---------------|
| `.animation(.easeInOut)` | CSS `transition` property |
| `.transition(.move(edge:).combined(with: .opacity))` | CSS `@keyframes` + `animation` |
| Pulse animation (save indicator) | CSS `@keyframes pulse { ... }` |
| `.scaleEffect` | CSS `transform: scale()` |

### 11.9 Complete View-to-Route Mapping

| macOS View | Suggested Web Route / Component |
|------------|-------------------------------|
| `WelcomeView` | `/` (landing page) |
| `MainWindow` with tabs | `/project/:id` with nested tab routes |
| `StyleDefinitionView` | `/project/:id/style` |
| `AssetLibraryView` | `/project/:id/assets` |
| `AssetCreationView` | `/project/:id/assets/new/:type` (or modal) |
| `FramesLibraryView` | `/project/:id/frames` |
| `FrameCreationContent` | `/project/:id/frames/new` (or modal) |
| `ShotsLibraryView` | `/project/:id/shots` |
| `ShotCreationContent` | `/project/:id/shots/new` (or modal) |
| `SettingsView` | `/settings` (or modal overlay) |
| `UnifiedImagePickerSheet` | Full-screen modal component |
| `MediaPreviewWindow` | Lightbox / modal overlay |
| `ExtensionPanel` | Sub-route or expandable panel within shot editor |
