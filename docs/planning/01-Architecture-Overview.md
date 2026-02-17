# 01 — Architecture Overview

> The "read first" document. This provides a high-level map of ShotMaker's entire system: what the app does, how it is structured, and where to find detail in the remaining documents.

---

## Table of Contents

1. [Application Purpose](#1-application-purpose)
2. [Core Terminology](#2-core-terminology)
3. [Architecture Pattern — MVVM with Singleton Services](#3-architecture-pattern--mvvm-with-singleton-services)
4. [State Management Hierarchy](#4-state-management-hierarchy)
5. [Data Flow](#5-data-flow)
6. [Service Layer](#6-service-layer)
7. [Multi-Window Architecture](#7-multi-window-architecture)
8. [Complete User Workflow](#8-complete-user-workflow)
9. [Source File Map](#9-source-file-map)
10. [Cross-Reference Guide](#10-cross-reference-guide)
11. [Web Migration Strategy](#11-web-migration-strategy)

---

## 1. Application Purpose

ShotMaker is a native macOS SwiftUI application for AI-powered video creation. It provides a **four-step creative pipeline**:

```
Style → Assets → Frames → Shots
```

1. **Style** — Define the visual aesthetic (medium, lighting, color palette, film grain, depth of field, etc.) that governs all generated content.
2. **Assets** — Create AI-generated characters, objects, and sets as reference sheets, all rendered in the chosen style.
3. **Frames** — Compose cinematic keyframes by selecting assets, choosing camera angles, and adding environment details.
4. **Shots** — Generate videos from frames using Google Veo, with extension, refinement, and ReFrame capabilities.

Every step produces **drafts** — versioned outputs the user can browse, compare, and iterate on. The entire project (data, media, history) is saved as a self-contained folder on disk.

**External APIs used:**

| API | Purpose | Provider |
|-----|---------|----------|
| Google Gemini | Image generation (assets, frames, style examples) | `GoogleGeminiProvider` |
| Google Veo | Video generation (shots, extensions) | `GoogleVeoProvider` |
| Google Files API | Image upload for video generation references | `GoogleFilesService` |

→ Full API details: [03-API-Integration.md](03-API-Integration.md)

---

## 2. Core Terminology

| Term | Definition | Documented In |
|------|-----------|---------------|
| **Project** | Root container. Holds styles, assets, frames, shots, provider refs, timestamps. Serialized as a single JSON file. | [02-Data-Models §1](02-Data-Models.md) |
| **NamedStyle** | A user-named wrapper around a `VisualStyle`. Projects can have multiple named styles. One is designated `defaultStyleId`. | [02-Data-Models §2](02-Data-Models.md) |
| **VisualStyle** | The full parameter set defining visual aesthetic: medium, film format, grain, depth of field, lighting, color palette, aesthetic, and more. | [02-Data-Models §3](02-Data-Models.md) |
| **Asset** | A character, object, or set — generated as a reference sheet image. Has a type (`AssetType`), prompt, attributes, and draft history. | [02-Data-Models §8](02-Data-Models.md) |
| **Frame** | A composed cinematic keyframe combining multiple assets with camera parameters and scene direction. | [02-Data-Models §12](02-Data-Models.md) |
| **Shot** | A generated video clip with narrative, audio prompt, camera movement, and extension support. | [02-Data-Models §14](02-Data-Models.md) |
| **Draft** | A versioned generation output. Each entity type has its own draft model (`StyleDraft`, `AssetDraft`, `FrameDraft`, `ShotDraft`). Users can browse, compare, and select a "primary" draft. | [02-Data-Models §5, §9, §13, §15](02-Data-Models.md) |
| **Reference** | An applied/saved version of a draft. Styles have `StyleReference`; assets have `AssetReference`. References are the committed output used downstream. | [02-Data-Models §6, §10](02-Data-Models.md) |
| **CameraParameters** | A struct of optional enums (shot angle, perspective, composition rule, lens type, etc.) describing camera setup for frames and shots. | [02-Data-Models §17](02-Data-Models.md) |
| **ConversationHistory** | A capped array (max 26 messages) of user/model/system turns that enables multi-turn refinement via the API. | [02-Data-Models §19](02-Data-Models.md) |
| **WindowContext** | A `Codable` struct passed to SwiftUI `WindowGroup` to open entity creation/edit windows. Carries project ID, entity ID, and a unique `sessionId`. | [02-Data-Models](02-Data-Models.md) |
| **WorkflowTab** | The four tabs in the project window: Style, Assets, Frames, Shots. | [07-UI-Specification.md](07-UI-Specification.md) |

→ Full enum listings with all cases and raw values: [A1-Enum-Reference.md](A1-Enum-Reference.md)

---

## 3. Architecture Pattern — MVVM with Singleton Services

ShotMaker uses a strict **Model-View-ViewModel** pattern with a layer of singleton services:

```
┌─────────────────────────────────────────────────────────┐
│                       VIEWS                              │
│  SwiftUI Views (declarative UI, no business logic)       │
│  @StateObject / @ObservedObject → ViewModel bindings     │
└──────────────────────┬──────────────────────────────────┘
                       │ @Published properties, methods
┌──────────────────────▼──────────────────────────────────┐
│                    VIEWMODELS                             │
│  StyleDefinitionViewModel                                │
│  AssetCreationViewModel                                  │
│  FrameBuilderViewModel                                   │
│  ShotAnimationViewModel                                  │
│  ProjectViewModel                                        │
│  AIProviderViewModel                                     │
└──────────────────────┬──────────────────────────────────┘
                       │ direct calls
┌──────────────────────▼──────────────────────────────────┐
│                    SERVICES (singletons)                  │
│  StorageService, MediaStorageService,                    │
│  StorageLocationManager, KeychainService,                │
│  AIProviderRegistry, StyleSheetService,                  │
│  StyleAnalysisService, GoogleFilesService,               │
│  ExportService, DeveloperSettings,                       │
│  WindowViewModelManager, ProjectViewModelRegistry,       │
│  ViewPreferences, AppState, AspectRatioConverter         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    MODELS                                │
│  Project, NamedStyle, VisualStyle, Asset, Frame, Shot,   │
│  Draft models, CameraParameters, ConversationHistory,    │
│  AIProvider, WindowContexts, ImageSelectionItem, etc.    │
└─────────────────────────────────────────────────────────┘
```

**Key rules:**

- Views never call services directly — they go through ViewModels.
- ViewModels own mutable state via `@Published` properties. Views bind to these.
- Services are singletons accessed via `.shared`. They handle persistence, API calls, and cross-cutting concerns.
- Models are plain `Codable` structs (value types). No business logic beyond computed properties and `Codable` conformance.

---

## 4. State Management Hierarchy

### 4.1 ProjectViewModel — The Central Hub

`ProjectViewModel` is the primary state manager. Two usage patterns:

| Pattern | Instance | Purpose |
|---------|----------|---------|
| **Singleton** | `ProjectViewModel.shared` | Welcome window — manages the full project list, used before a project is opened. |
| **Per-project** | `ProjectViewModel(project:)` | Project window — manages a single project's data (styles, assets, frames, shots). Created fresh each time a project window opens; reloads from disk for consistency. |

The per-project instance is propagated to all child ViewModels and windows via `ProjectViewModelRegistry` (keyed by a unique viewModelId string).

### 4.2 Entity ViewModels

Each entity type has a dedicated ViewModel:

| ViewModel | Entity | Modes |
|-----------|--------|-------|
| `StyleDefinitionViewModel` | NamedStyle / VisualStyle | Inline in project window (no separate window) |
| `AssetCreationViewModel` | Asset | `.create` / `.edit(assetId)` |
| `FrameBuilderViewModel` | Frame | `.create` / `.edit(frameId)` |
| `ShotAnimationViewModel` | Shot | `.create` / `.edit(shotId)` |

Entity ViewModels are **lifecycle-managed** by `WindowViewModelManager.shared`, which:
- Creates or retrieves VMs by window context ID (prevents duplicate creation)
- Populates edit-mode VMs from existing entity data
- Cleans up VMs when windows close

### 4.3 Global Services

| Service | State Managed |
|---------|--------------|
| `AIProviderRegistry` | Registered providers, API key availability, provider instances |
| `AppState` | Sheet visibility flags (new/open project) |
| `DeveloperSettings` | Custom prompt template overrides |
| `ViewPreferences` | Library grid/list view mode |
| `WindowViewModelManager` | Open window tracking, ViewModel instances |
| `ProjectViewModelRegistry` | Project ID → ProjectViewModel instance mapping |

---

## 5. Data Flow

### 5.1 Standard Generation Flow

```
User Action (tap Generate)
    │
    ▼
ViewModel.generate()
    │
    ├─ Validate (provider, model, prompt, refs)
    │
    ├─ Build prompt (StyleSheetService compiles style → natural language)
    │
    ├─ API call (GoogleGeminiProvider or GoogleVeoProvider)
    │
    ├─ Create Draft (images/video + parameters + conversation)
    │
    ├─ Save media files (MediaStorageService → project folder)
    │
    ├─ Append draft to entity's draftHistory
    │
    ▼
ViewModel mutates entity → ProjectViewModel.update{Entity}()
    │
    ▼
ProjectViewModel.saveCurrentProjectDebounced()
    │  (1.5s debounce, cancels pending saves)
    ▼
StorageService.saveProject()
    │  (atomic write: encode JSON → .tmp file → replace)
    ▼
[ProjectName]-[ShortUUID]/project.json on disk
```

→ Detailed workflows for every generation type: [08-Generation-Workflows.md](08-Generation-Workflows.md)

### 5.2 Save Pipeline

| Trigger | Save Type | Method |
|---------|-----------|--------|
| Entity add/update | Debounced (1.5s) | `saveCurrentProjectDebounced()` |
| Cmd+S / explicit save | Immediate | `saveCurrentProjectImmediately()` |
| Window close | Immediate | `saveCurrentProjectImmediately()` |
| App termination | Immediate | `AppDelegate.applicationWillTerminate()` |

→ Full save pipeline details: [05-Storage-System.md §8](05-Storage-System.md)

### 5.3 Project Load Pipeline

```
App launch
    │
    ▼
WindowCoordinator.shared init
    ├─ KeychainService.shared
    ├─ StyleSheetService.shared
    ├─ StorageLocationManager: resolve bookmark or prompt for folder
    ├─ StorageService.shared
    └─ AIProviderRegistry.loadProviders()

    ▼
WelcomeWindow → ProjectViewModel.shared.loadProjectsAsync()
    │  (background thread scan of projects directory)
    ▼
User opens project → openWindow(id: "project", value: project)
    │
    ▼
ProjectWindow → ProjectViewModel(project:)
    ├─ Reload from disk (ensures latest state)
    ├─ cleanProject() — deduplicate, remove orphans
    └─ validateAndFixProject() — fix invalid primaryDraftIndex values
```

---

## 6. Service Layer

All 16 services with their responsibilities:

### 6.1 Persistence Services

| Service | Singleton | Responsibility |
|---------|-----------|----------------|
| `StorageService` | Yes | JSON project serialization, atomic file writes, project folder management, folder URL cache |
| `MediaStorageService` | Yes | Image/video file storage in project subfolders (Assets/, Frames/, Shots/), file naming conventions |
| `StorageLocationManager` | Yes | User-selected storage directory via NSOpenPanel, security-scoped bookmarks, access lifecycle |
| `KeychainService` | Yes | Secure API key storage/retrieval via macOS Keychain |

→ Full details: [05-Storage-System.md](05-Storage-System.md)

### 6.2 AI Provider Services

| Service | Singleton | Responsibility |
|---------|-----------|----------------|
| `AIProviderRegistry` | Yes | Provider registration, lookup, API key management, creates GoogleGeminiProvider/GoogleVeoProvider instances |
| `GoogleGeminiProvider` | No (per-provider) | Image generation via Gemini API (generateContent endpoint). Models: gemini-2.5-flash-image, gemini-3-pro-image-preview |
| `GoogleVeoProvider` | No (per-provider) | Video generation via Veo API (predictLongRunning + polling). Models: veo-3.0/3.1 standard and fast |
| `GoogleFilesService` | Yes | Resumable image upload to Google Files API for video generation references |

→ Full details: [03-API-Integration.md](03-API-Integration.md)

### 6.3 Prompt Services

| Service | Singleton | Responsibility |
|---------|-----------|----------------|
| `StyleSheetService` | Yes | Compiles VisualStyle parameters into natural-language prompt text. Template engine with placeholder substitution. |
| `StyleAnalysisService` | Yes | Extracts style parameters from uploaded images via Gemini multimodal analysis |
| `DeveloperSettings` | Yes | Stores all prompt templates (~1260 lines). Password-protected override UI. Persists to UserDefaults. |

→ Full details: [04-Prompt-Engineering.md](04-Prompt-Engineering.md)
→ Verbatim templates: [A2-Prompt-Templates-Verbatim.md](A2-Prompt-Templates-Verbatim.md)

### 6.4 UI Coordination Services

| Service | Singleton | Responsibility |
|---------|-----------|----------------|
| `WindowViewModelManager` | Yes | ViewModel lifecycle for entity windows — create, cache, populate (edit mode), cleanup |
| `ProjectViewModelRegistry` | Yes | Maps project IDs to ProjectViewModel instances for child window access |
| `WindowCoordinator` | Yes | App-level initialization, NotificationCenter-based window opening |
| `AppState` | Yes | Sheet visibility tracking, duplicate prevention |
| `ViewPreferences` | Yes | Library view mode (grid/list) persistence |
| `ExportService` | Yes | Share sheet, folder export, Finder reveal for media content |

### 6.5 Utility Services

| Service | Type | Responsibility |
|---------|------|----------------|
| `AspectRatioConverter` | Static utility | Converts `ImageAspectRatio` to provider-specific formats (ratio strings, dimensions, prompt text) |

---

## 7. Multi-Window Architecture

ShotMaker uses SwiftUI's `WindowGroup` API to support multiple simultaneous windows.

### 7.1 Window Groups (11 total)

| Window ID | Context Type | Purpose | Default Size |
|-----------|-------------|---------|-------------|
| (default) | — | Welcome / project picker | 800 × 600 |
| `project` | `Project` | Main project window with 4 workflow tabs | 1200 × 800 |
| `asset-creation` | `AssetCreationContext` | New asset creation (3-column editor) | 1200 × 800 |
| `asset-edit` | `AssetEditContext` | Edit existing asset | 1200 × 800 |
| `frame-creation` | `FrameCreationContext` | New frame composition | 1300 × 850 |
| `frame-edit` | `FrameEditContext` | Edit existing frame | 1300 × 850 |
| `shot-creation` | `ShotCreationContext` | New shot generation | 1200 × 800 |
| `shot-edit` | `ShotEditContext` | Edit existing shot | 1200 × 800 |
| `media-preview` | `MediaPreviewContext` | Full-size image/video preview | 800 × 600 |
| `settings` | — | API key and developer settings | 800 × 600 |
| `new-project` | — | New project name entry | 500 × 380 |
| `open-project` | — | Project list picker | 600 × 500 |

### 7.2 Window Context System

Each entity window receives a typed context struct (e.g., `AssetCreationContext`) that carries:
- `projectId` — which project this window belongs to
- Entity-specific fields (e.g., `assetType`, `assetId` for edits)
- `projectViewModelId` — links to the correct ProjectViewModel instance via `ProjectViewModelRegistry`
- `sessionId` — a fresh UUID per window open, preventing SwiftUI from reusing stale window state

### 7.3 ViewModel Lifecycle

```
User clicks "New Asset" in library
    │
    ▼
openWindow(id: "asset-creation", value: AssetCreationContext(...))
    │
    ▼
AssetCreationWindowContent.onAppear
    │
    ├─ ProjectViewModelRegistry.get(projectViewModelId) → ProjectViewModel
    │
    ├─ WindowViewModelManager.getOrCreateAssetCreationVM(context, projectVM)
    │     └─ Creates new AssetCreationViewModel (or returns cached)
    │
    └─ WindowViewModelManager.markWindowOpen(contextId)

    ... user works ...

AssetCreationWindowContent.onDisappear
    │
    ├─ WindowViewModelManager.cleanupAssetVM(contextId)
    │     └─ Removes ViewModel from cache
    │
    └─ WindowViewModelManager.markWindowClosed(contextId)
```

---

## 8. Complete User Workflow

A typical end-to-end session:

### Step 1: Project Setup
1. Launch app → Welcome window with project grid
2. First launch: EULA consent overlay → API key setup overlay
3. Create new project (name + optional description) → project window opens

### Step 2: Define Style
1. Style tab → Create a new named style
2. Choose preset (13 built-in presets: Cinematic, Anime, Noir, etc.) or configure manually
3. Set parameters: medium, film format, grain, depth of field, lighting, color palette, aesthetic
4. Generate style examples → 3 preview images (character, object, environment)
5. Browse drafts, apply preferred one as the style reference
6. Optionally create multiple named styles for the project

### Step 3: Create Assets
1. Assets tab → library grid → "New Asset" button
2. Select asset type (Character, Object, or Set) → creation window opens
3. Write prompt describing the asset
4. Configure attributes (type-specific: age/build/clothing for characters, size/material for objects, location/weather for sets)
5. Select a style and model → Generate
6. Browse drafts, refine with multi-turn conversation if needed
7. Save → asset appears in library with primary draft as thumbnail

### Step 4: Compose Frames
1. Frames tab → library grid → "New Frame" button → creation window opens
2. Select assets to include (from asset library or imported images)
3. Configure camera parameters (angle, perspective, composition, lens)
4. Write scene description
5. Generate → cinematic keyframe compositing all selected assets
6. Refine, browse drafts, save

### Step 5: Generate Shots
1. Shots tab → library grid → "New Shot" button → creation window opens
2. Select frames/assets as reference or interpolation images
3. Write narrative and optional audio prompt
4. Choose camera movement, duration, model
5. Generate → video via Veo API (with polling)
6. Extend video (up to 20 extensions / 180s max)
7. ReFrame: extract a frame from the video at any point → creates a new Frame

### Step 6: Export
- Share individual assets/frames/shots via share sheet
- Export to folder
- Reveal in Finder

→ Full UI specifications: [07-UI-Specification.md](07-UI-Specification.md)
→ Step-by-step generation recipes: [08-Generation-Workflows.md](08-Generation-Workflows.md)

---

## 9. Source File Map

### Models/ (Data structures)

| File | Key Types |
|------|-----------|
| `Project.swift` | `Project` |
| `NamedStyle.swift` | `NamedStyle` |
| `VisualStyle.swift` | `VisualStyle`, `Medium`, `FilmFormat`, `FilmGrain`, `DepthOfField` |
| `Asset.swift` | `Asset`, `AssetType`, `ViewAngle` |
| `AssetDraft.swift` | `AssetDraft`, `AssetParameters` |
| `AssetReference.swift` | `AssetReference` |
| `AssetAttributes.swift` | `AssetAttributeSet`, character/object/set attribute enums |
| `Frame.swift` | `Frame` |
| `FrameDraft.swift` | `FrameDraft` |
| `Shot.swift` | `Shot` |
| `ShotDraft.swift` | `ShotDraft` |
| `Draft.swift` | `Draft` (legacy) |
| `CameraParameters.swift` | `CameraParameters`, `ShotAngle`, `CameraPerspective`, `CompositionRule`, `LensType`, etc. |
| `ConversationHistory.swift` | `ConversationHistory`, `ConversationMessage` |
| `AIProvider.swift` | `AIProvider`, `ProviderType`, `ProviderCapability` |
| `WindowContexts.swift` | All 7 window context structs |
| `ImageSelectionItem.swift` | `ImageSelectionItem` (.asset/.frame/.imported) |
| `AspectRatio.swift` | `ImageAspectRatio`, `QualityLevel` |
| `ImageModelCapabilities.swift` | `ImageModelCapabilities` |
| `AppState.swift` | `AppState` |
| `AppNotification.swift` | `AppNotification` |

### ViewModels/

| File | Key Types |
|------|-----------|
| `ProjectViewModel.swift` | `ProjectViewModel` — project CRUD, entity CRUD, debounced save |
| `StyleDefinitionViewModel.swift` | Style generation, presets, multi-style management |
| `AssetCreationViewModel.swift` | Asset generation pipeline, refinement, import |
| `FrameBuilderViewModel.swift` | Frame composition, asset selection, batch generation |
| `ShotAnimationViewModel.swift` | Video generation, extension, ReFrame |
| `AIProviderViewModel.swift` | Provider UI bindings |

### Services/

| File | Key Types |
|------|-----------|
| `StorageService.swift` | `StorageService` — JSON persistence, atomic writes |
| `MediaStorageService.swift` | `MediaStorageService` — media file management |
| `StorageLocationManager.swift` | `StorageLocationManager` — security-scoped bookmarks |
| `KeychainService.swift` | `KeychainService` — secure credential storage |
| `AIProviderRegistry.swift` | `AIProviderRegistry` — provider lifecycle |
| `StyleSheetService.swift` | `StyleSheetService` — prompt template compilation |
| `StyleAnalysisService.swift` | `StyleAnalysisService` — image-to-style extraction |
| `DeveloperSettings.swift` | `DeveloperSettings` — all prompt templates |
| `ExportService.swift` | `ExportService` — share/export/reveal |
| `GoogleFilesService.swift` | `GoogleFilesService` — Files API upload |
| `WindowViewModelManager.swift` | `WindowViewModelManager` — VM lifecycle |
| `ProjectViewModelRegistry.swift` | `ProjectViewModelRegistry` — VM instance sharing |
| `ViewPreferences.swift` | `ViewPreferences` — UI preferences |
| `AspectRatioConverter.swift` | `AspectRatioConverter` — ratio format conversion |
| `ImageGeneration/GoogleGeminiProvider.swift` | `GoogleGeminiProvider` |
| `ImageGeneration/ImageGenerationProtocol.swift` | `ImageGenerationProvider` protocol, `APIError` |
| `VideoGeneration/GoogleVeoProvider.swift` | `GoogleVeoProvider` |
| `VideoGeneration/VideoGenerationProtocol.swift` | `VideoGenerationProvider` protocol, `ModelCapabilities` |

### Views/ (by feature area)

| Directory | Contents |
|-----------|----------|
| `Views/StyleDefinition/` | `StyleDefinitionView`, `DraftHistoryView` (draft history cards: `DraftHistoryCard`, `StyleReferenceCard`, `AssetReferenceCard`, `FrameDraftHistoryCard`, `ShotDraftHistoryCard`, `ParameterRow`, `EmptyHistoryView`) |
| `Views/AssetCreation/` | `AssetCreationView`, `AssetLibraryView`, `AssetCreationWindowContent` (create window wrapper), `AssetEditWindowContent` (edit window wrapper) |
| `Views/FrameBuilder/` | `FrameCreationContent`, `FramesLibraryView`, `FrameCreationWindowContent` (create window wrapper), `FrameEditWindowContent` (edit window wrapper) |
| `Views/ShotAnimation/` | `ShotCreationContent`, `ShotsLibraryView`, `ExtensionPanel`, `VideoImportSheet`, `ShotCreationWindowContent` (create window wrapper), `ShotEditWindowContent` (edit window wrapper) |
| `Views/Settings/` | `SettingsView`, `DeveloperSettingsView`, `DeveloperPasswordPrompt` |
| `Views/Components/` | `AVPlayerViewRepresentable`, `MediaPreviewWindow`, `StyledCard`, `WindowCloseInterceptor`, `DraftNavigationController` |
| `Views/` (root) | `EULAConsentView` + `EULACheckModifier`, `APIKeySetupView` + `APIKeyCheckModifier`, `ProjectPickerSheet`, `ProjectWindow`, `MainWindow` |

### Components/ (shared UI components)

| File | Purpose |
|------|---------|
| `GenerateButton.swift` | Unified generate/cancel button with progress |
| `DraftController.swift` | Draft navigation (prev/next/primary) |
| `RefinementPanel.swift` | Multi-turn refinement text input |
| `StyleSelectorView.swift` | Style picker dropdown |
| `ModelSelectorView.swift` | AI model picker dropdown |
| `NavigationGuard.swift` | Unsaved changes interception |
| `UnsavedChangesDialog.swift` | Save/discard/cancel dialog |
| `NotificationBanner.swift` | Error/success notification display |
| `StatusBadge.swift` | Status indicator badges |
| `WorkflowNavigation.swift` | 4-tab workflow bar |
| `PreviewGrid.swift` | Image grid layout |
| `UnifiedImageCard.swift` | Consistent image card |
| `UnifiedImagePickerSheet.swift` | Image selection modal |
| `AssetAttributesEditor.swift` | Type-specific attribute controls |
| `FrameAttributesEditor.swift` | Frame attribute controls |
| `AssetSelectionPreview.swift` | Selected assets display |
| `ImageSelectionPreview.swift` | Selected images display |
| `ParameterInfoView.swift` | Parameter information display |
| `ProjectNameToolbarItem.swift` | Editable project name in toolbar |
| `UnifiedDraftNavigation/` | `DraftBadge`, `DraftThumbnail`, `UnifiedDraftListItem` |

### Protocols/

| File | Protocol |
|------|----------|
| `ImageSelectableViewModel.swift` | `ImageSelectableViewModel` — unified selection for reference/interpolation modes |

### Other Top-Level Files

| File | Purpose |
|------|---------|
| `ShotMakerApp.swift` | `@main` app entry, all 11 WindowGroup definitions, `WindowCoordinator`, `AppDelegate` |
| `ShotMakerDocument.swift` | Document-based app stub (unused in current architecture) |
| `ContentView.swift` | Default template (unused) |
| `Configuration/APIConfiguration.swift` | API endpoint constants |

---

## 10. Cross-Reference Guide

How the documentation set connects:

| If you need to understand... | Start with... | Then see... |
|------------------------------|---------------|-------------|
| What data gets stored | [02-Data-Models](02-Data-Models.md) | [05-Storage-System](05-Storage-System.md) |
| How prompts are built | [04-Prompt-Engineering](04-Prompt-Engineering.md) | [A2-Prompt-Templates-Verbatim](A2-Prompt-Templates-Verbatim.md) |
| What the API calls look like | [03-API-Integration](03-API-Integration.md) | [04-Prompt-Engineering](04-Prompt-Engineering.md) |
| How generation works end-to-end | [08-Generation-Workflows](08-Generation-Workflows.md) | [06-Business-Logic](06-Business-Logic.md), [03](03-API-Integration.md), [04](04-Prompt-Engineering.md) |
| What the user sees | [07-UI-Specification](07-UI-Specification.md) | [06-Business-Logic](06-Business-Logic.md) |
| All enum values | [A1-Enum-Reference](A1-Enum-Reference.md) | [02-Data-Models](02-Data-Models.md) |
| ViewModel behavior and validation | [06-Business-Logic](06-Business-Logic.md) | [02-Data-Models](02-Data-Models.md), [08-Generation-Workflows](08-Generation-Workflows.md) |
| File layout on disk | [05-Storage-System](05-Storage-System.md) | [02-Data-Models](02-Data-Models.md) |

### Document Dependency Graph

```
                    01-Architecture-Overview (this document)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     02-Data-Models    03-API-Integration   07-UI-Specification
         │    │              │                     │
         │    ▼              ▼                     │
         │  05-Storage   04-Prompt-Engineering     │
         │                   │                     │
         ▼                   ▼                     ▼
    A1-Enum-Ref     A2-Prompt-Templates    06-Business-Logic
                                                   │
                                                   ▼
                                          08-Generation-Workflows
```

---

## 11. Web Migration Strategy

This section summarizes key platform differences and recommended substitutions for recreating ShotMaker as a web application.

### 11.1 Data Layer

| macOS (Current) | Web (Recommended) |
|-----------------|-------------------|
| JSON file on disk (`project.json`) | IndexedDB or OPFS for local; PostgreSQL/MongoDB for server |
| `FileManager` folder structure | OPFS (File System API) or S3/R2 for media |
| Security-scoped bookmarks | Not applicable (browser sandbox handles storage) |
| `Codable` structs | TypeScript interfaces with Zod or similar validation |
| Keychain for API keys | Server-side encrypted storage (never expose keys client-side) |

### 11.2 API Layer

| macOS (Current) | Web (Recommended) |
|-----------------|-------------------|
| Direct `URLSession` to Google APIs | Server-side proxy (Next.js API routes, Express, etc.) to protect API keys |
| In-process polling (Veo) | Server-Sent Events or WebSocket for progress; server-side polling |
| Base64 inline image data in requests | Multipart uploads or pre-signed URLs |

### 11.3 UI Layer

| SwiftUI | Web Equivalent |
|---------|---------------|
| `WindowGroup` multi-window | Tabs, modals, or multi-pane SPA layout |
| `HSplitView` (3-column editor) | CSS Grid or Flexbox with resizable panels |
| `@StateObject` / `@ObservedObject` | React `useState`/`useReducer` + Context, or Zustand/Jotai |
| `NSSavePanel` / `NSOpenPanel` | File System Access API or `<input type="file">` |
| `AVPlayer` | HTML5 `<video>` element |
| SF Symbols | Lucide, Heroicons, or similar icon library |
| `NavigationSplitView` | React Router + sidebar layout |
| `LazyVGrid` | CSS Grid with `auto-fill` / `auto-fit` |
| `Form` with pickers | HTML `<select>`, headless UI components |
| `@AppStorage` / `UserDefaults` | `localStorage` or `sessionStorage` |

### 11.4 Architecture Mapping

| macOS Pattern | Web Pattern |
|---------------|-------------|
| Singleton services (`.shared`) | Dependency injection container or module-scoped instances |
| `ProjectViewModel` (ObservableObject) | React Context + reducer, or Zustand store |
| `WindowViewModelManager` | Route-scoped state providers |
| `NotificationCenter` | Custom event bus, or React context callbacks |
| `Combine` publishers | RxJS, or React Query for async state |
| `@MainActor` | Not needed (JS is single-threaded); use Web Workers for heavy computation |

→ Component-level mapping details: [07-UI-Specification.md](07-UI-Specification.md)
