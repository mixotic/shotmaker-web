# 05 -- Storage System

This document describes every layer of ShotMaker's persistence architecture: the on-disk folder layout, the services that read and write to it, the dual inline/file-based storage model for media, the security-scoped bookmark system for user-chosen directories, the debounced save pipeline, data cleanup logic, and the export subsystem. It is written to the level of detail required to re-implement equivalent storage on another platform (IndexedDB, OPFS, S3-backed, etc.).

---

## Table of Contents

1. [Project Folder Structure](#1-project-folder-structure)
2. [StorageService](#2-storageservice)
3. [MediaStorageService](#3-mediastorageservice)
4. [Dual Storage Pattern](#4-dual-storage-pattern)
5. [Project Serialization](#5-project-serialization)
6. [StorageLocationManager](#6-storagelocationmanager)
7. [Application Support Storage](#7-application-support-storage)
8. [Save Debouncing](#8-save-debouncing)
9. [Data Cleanup](#9-data-cleanup)
10. [Export System](#10-export-system)

---

## 1. Project Folder Structure

Every project lives in its own folder under a user-selected base directory. The full path pattern is:

```
[UserSelectedBase]/ShotMaker/Projects/[SanitizedName]-[ShortUUID]/
```

### Path Components

| Segment | Source | Example |
|---------|--------|---------|
| `[UserSelectedBase]` | Chosen via NSOpenPanel, persisted as a security-scoped bookmark | `~/Documents` |
| `ShotMaker/` | Created automatically if the user selects a parent directory | -- |
| `Projects/` | Fixed subdirectory, created on first access | -- |
| `[SanitizedName]` | Project name run through `sanitizeProjectName()` (see Section 5) | `My-Cool-Film` |
| `[ShortUUID]` | First 8 characters of the project `UUID().uuidString` | `A3F7B2C1` |

### Directory Tree for a Single Project

```
My-Cool-Film-A3F7B2C1/
    project.json                          # Entire Project model serialized
    Assets/
        Hero-Character-D4E5F6A7/
            draft-0-0.png                 # AssetDraft images: draft-{draftIndex}-{imageIndex}.png
            draft-0-1.png
            draft-1-0.png
        Magic-Sword-B8C9D0E1/
            draft-0-0.png
    Frames/
        Opening-Shot-F2A3B4C5/
            draft-0.png                   # FrameDraft images: draft-{draftIndex}.png
            draft-1.png
    Shots/
        Chase-Scene-1A2B3C4D/
            draft-0.mp4                   # ShotDraft videos: draft-{draftIndex}.mp4
            thumbnail-0.png              # ShotDraft thumbnails: thumbnail-{draftIndex}.png
            draft-1.mp4
            thumbnail-1.png
```

### Subdirectory Rules

- `Assets/` is always created when the project folder is created (done by `StorageService.saveProject()`).
- `Frames/` and `Shots/` are created on demand by `MediaStorageService` when the first frame or shot media is saved.
- Each asset, frame, and shot gets its own named subfolder using the same `SanitizedName-ShortUUID` pattern (the item's own UUID, not the project's).

---

## 2. StorageService

**File:** `Services/StorageService.swift`

Singleton (`StorageService.shared`) responsible for all project JSON persistence and the atomic-write strategy. It holds the JSON encoder/decoder pair and the project folder cache.

### Initialization

```swift
private init() {
    encoder.outputFormatting = .prettyPrinted
    encoder.dateEncodingStrategy = .iso8601
    decoder.dateDecodingStrategy = .iso8601
}
```

The encoder produces human-readable pretty-printed JSON. All `Date` fields use ISO 8601 format (`"2025-06-15T10:30:00Z"`).

### Error Types

```swift
enum StorageError: Error {
    case directoryCreationFailed
    case fileNotFound
    case encodingFailed
    case decodingFailed
    case saveFailed
    case deleteFailed
    case noStorageAccess
}
```

### Project Folder Cache

A dictionary mapping `shortId` (first 8 chars of UUID string) to the folder `URL`:

```swift
private var projectFolderCache: [String: URL] = [:]
```

**Purpose:** Avoids repeated directory scans on the Projects directory. Every `findProjectFolder(id:)` call checks the cache first, verifying the cached path still exists on disk. Stale entries (where the folder was moved or deleted externally) are evicted automatically.

**Invalidation:** Call `invalidateProjectCache()` when the storage location changes (e.g., user picks a new base folder). This clears the entire cache.

The cache is populated by:
- `saveProject()` -- caches after creating or finding the folder.
- `loadAllProjects()` and `loadAllProjectsAsync()` -- populate cache entries for every project decoded.
- `findProjectFolder(id:)` -- caches on a successful directory scan.

The cache is pruned by:
- `deleteProject(id:)` -- removes the entry.
- `findProjectFolder(id:)` -- removes stale entries when the cached path no longer exists.

### Public Methods

#### `saveProject(_ project: Project) throws`

1. Calls `findProjectFolder(id:)` to locate an existing folder, or `getProjectFolderURL(for:)` to build the target path for a new project.
2. Creates the project folder and `Assets/` subdirectory (with `withIntermediateDirectories: true`).
3. Encodes the `Project` to JSON via the shared encoder.
4. Writes `project.json` atomically (see Atomic Writes below).
5. Caches the folder URL.

**Parameters:** `project: Project` -- the full project model. Must have a stable `id`.

**Throws:** `StorageError` subtypes or underlying file-system errors.

#### `loadProject(id: UUID) throws -> Project`

1. Calls `findProjectFolder(id:)` to locate the folder.
2. Reads `project.json` from that folder.
3. Decodes and returns the `Project`.

**Throws:** `StorageError.fileNotFound` if the folder or JSON file does not exist.

#### `loadAllProjects() throws -> [Project]`

Synchronous full scan of the `Projects/` directory. For each subdirectory containing a `project.json` file:
1. Reads and decodes the file.
2. On success, appends to the result array and populates the folder cache.
3. On failure, logs the error and skips that project (does not throw).

**Returns:** `[Project]` sorted by `modifiedAt` descending (most recent first).

#### `loadAllProjectsAsync() async throws -> [Project]`

Two-phase async loading for UI responsiveness:
1. **Phase 1 (background thread):** Runs a `Task.detached(priority: .userInitiated)` that scans the Projects directory and reads all `project.json` files into raw `Data` objects. Uses its own `FileManager` instance since `FileManager.default` is not sendable.
2. **Phase 2 (main actor):** Decodes each `Data` blob into a `Project`. This must happen on the main actor because `Project`'s `Decodable` conformance is `@MainActor`-isolated.

**Returns:** `[Project]` sorted by `modifiedAt` descending.

**Thread safety note:** File I/O runs on a detached task; decoding runs on the calling actor (expected to be `@MainActor`). The folder cache is updated during phase 2 only.

#### `loadProjectAsync(id: UUID) async throws -> Project`

Single-project async variant. File read on background thread, decode on main actor.

#### `deleteProject(id: UUID) throws`

Removes the entire project folder (recursively) and evicts the cache entry.

**Throws:** `StorageError.fileNotFound` if no matching folder exists.

#### `invalidateProjectCache()`

Clears `projectFolderCache`. Call this when the storage base URL changes.

#### `saveProviders(_ providers: [AIProvider]) throws`

Encodes the array of AI providers to `providers.json` in Application Support (not in the project folder). Uses atomic write.

#### `loadProviders() throws -> [AIProvider]`

Returns `[]` if the file does not exist (no throw). Otherwise decodes the file.

#### `saveImageData(_ data: Data, filename: String) throws -> URL`

Writes image data to `~/Library/Application Support/ShotMaker/Media/Images/{filename}`. Returns the full URL. Used for legacy media storage (not the project-relative system).

#### `loadImageData(from filename: String) throws -> Data`

Reads from the same legacy Images directory.

### Atomic Writes

All JSON persistence goes through `atomicWrite(data:to:)`:

```
1. Write data to targetURL.tmp
2. If targetURL exists:  replaceItemAt(targetURL, withItemAt: tempURL)
   Else:                 moveItem(tempURL -> targetURL)
```

This guarantees that a crash during write never leaves a corrupted `project.json`. The `.tmp` file acts as a staging area. `replaceItemAt` is an atomic filesystem operation on APFS/HFS+.

### Directory Resolution

```
getProjectsDirectory()
    -> StorageLocationManager.shared.getProjectsBaseURL()   // user-chosen base
        -> .appendingPathComponent("Projects")              // fixed suffix
```

```
getApplicationSupportDirectory()
    -> ~/Library/Application Support/ShotMaker/             // always available, no bookmark needed
```

---

## 3. MediaStorageService

**File:** `Services/MediaStorageService.swift`

Singleton (`MediaStorageService.shared`) responsible for saving and loading binary media files (images, videos, thumbnails) into project subfolders. All paths returned are **relative to the project folder**, enabling project portability.

### Media Type Enum

```swift
enum MediaType {
    case asset
    case frame
    case shot
}
```

Maps to subdirectory names: `"Assets"`, `"Frames"`, `"Shots"`.

### File Naming Conventions

| Content Type | Directory Pattern | Filename Pattern | Example Relative Path |
|-------------|-------------------|-----------------|----------------------|
| Asset draft image | `Assets/{SafeName}-{ShortId}/` | `draft-{draftIndex}-{imageIndex}.png` | `Assets/Hero-D4E5F6A7/draft-0-0.png` |
| Frame draft image | `Frames/{SafeName}-{ShortId}/` | `draft-{draftIndex}.png` | `Frames/Opening-F2A3B4C5/draft-2.png` |
| Shot draft video | `Shots/{SafeName}-{ShortId}/` | `draft-{draftIndex}.mp4` | `Shots/Chase-1A2B3C4D/draft-0.mp4` |
| Shot thumbnail | `Shots/{SafeName}-{ShortId}/` | `thumbnail-{draftIndex}.png` | `Shots/Chase-1A2B3C4D/thumbnail-0.png` |

- `{SafeName}` = item name sanitized by `sanitizeName()` (same rules as project name sanitization).
- `{ShortId}` = first 8 characters of the item's UUID string.
- `{draftIndex}` = zero-based index in the draft array at time of generation.
- `{imageIndex}` = zero-based index within a multi-image asset draft (e.g., front/back/side views). Only assets use this second index.

### Public Methods

#### `saveAssetDraftImage(_:projectId:assetId:assetName:draftIndex:imageIndex:) throws -> String`

Saves a single PNG image for an asset draft.

**Parameters:**
- `data: Data` -- raw PNG bytes
- `projectId: UUID` -- used to locate the project folder
- `assetId: UUID` -- used for the asset subfolder name
- `assetName: String` -- human-readable name, sanitized for the folder
- `draftIndex: Int` -- which draft iteration
- `imageIndex: Int` -- which view within the draft (default `0`)

**Returns:** Relative path from project root, e.g. `"Assets/Hero-D4E5F6A7/draft-0-0.png"`.

**Side effects:** Creates the `Assets/{SafeName}-{ShortId}/` directory if it does not exist.

#### `saveAssetDraftImages(_:projectId:assetId:assetName:draftIndex:) throws -> [String]`

Batch variant. Iterates the `[Data]` array, calling `saveAssetDraftImage` for each with incrementing `imageIndex`.

**Returns:** Array of relative paths, one per image.

#### `saveFrameDraftImage(_:projectId:frameId:frameName:draftIndex:) throws -> String`

Saves a single PNG for a frame draft. Filename: `draft-{draftIndex}.png`.

**Returns:** Relative path, e.g. `"Frames/Opening-F2A3B4C5/draft-1.png"`.

#### `saveShotDraftVideo(_:projectId:shotId:shotName:draftIndex:) throws -> String`

Saves an MP4 video for a shot draft. Filename: `draft-{draftIndex}.mp4`.

**Returns:** Relative path, e.g. `"Shots/Chase-1A2B3C4D/draft-0.mp4"`.

#### `saveShotThumbnail(_:projectId:shotId:shotName:draftIndex:) throws -> String`

Saves a PNG thumbnail for a shot draft. Filename: `thumbnail-{draftIndex}.png`.

**Returns:** Relative path, e.g. `"Shots/Chase-1A2B3C4D/thumbnail-0.png"`.

#### `loadMedia(relativePath:projectId:) throws -> Data`

Resolves the relative path against the project folder and reads the file.

**Throws:** `StorageError.fileNotFound` if the file does not exist.

#### `loadMediaOptional(relativePath:projectId:) -> Data?`

Nil-safe variant. Returns `nil` if `relativePath` is nil or the file cannot be read. Does not throw.

#### `deleteMediaFolder(for:itemName:projectId:type:) throws`

Removes the entire subfolder for an asset, frame, or shot (e.g. `Assets/Hero-D4E5F6A7/`). Called during item deletion from `ProjectViewModel`.

**Parameters:**
- `itemId: UUID` -- the item's ID (for folder name suffix)
- `itemName: String` -- the item's name (for folder name prefix)
- `projectId: UUID` -- to locate the project folder
- `type: MediaType` -- determines the parent directory (`Assets`, `Frames`, or `Shots`)

No-op if the folder does not exist. Silently succeeds.

### Project Folder Resolution

`MediaStorageService` resolves the project folder independently of `StorageService`'s cache. It performs its own directory scan:

```swift
private func getProjectFolder(projectId: UUID) throws -> URL {
    let baseURL = try StorageLocationManager.shared.getProjectsBaseURL()
    let projectsDir = baseURL.appendingPathComponent("Projects")
    let shortId = String(projectId.uuidString.prefix(8))
    // Scan for folder ending with "-{shortId}"
    ...
}
```

This means `MediaStorageService` does not share `StorageService`'s folder cache. Each service independently scans the directory when needed.

### Name Sanitization

Both `StorageService` and `MediaStorageService` use identical sanitization logic (implemented independently in each class):

```swift
private func sanitizeName(_ name: String) -> String {
    let invalidChars = CharacterSet(charactersIn: "/\\:*?\"<>|")
    var sanitized = name.components(separatedBy: invalidChars).joined(separator: "-")
    sanitized = sanitized.trimmingCharacters(in: .whitespacesAndNewlines)
    sanitized = sanitized.trimmingCharacters(in: CharacterSet(charactersIn: "."))
    if sanitized.count > 50 { sanitized = String(sanitized.prefix(50)) }
    if sanitized.isEmpty { sanitized = "Untitled" }
    return sanitized
}
```

**Rules:**
1. Replace characters in the set `/\:*?"<>|` with `-`.
2. Trim leading and trailing whitespace/newlines.
3. Trim leading and trailing periods (prevents hidden files on Unix or reserved names on Windows).
4. Truncate to 50 characters maximum.
5. Fall back to `"Untitled"` if the result is empty.

---

## 4. Dual Storage Pattern

ShotMaker uses a migration-aware dual storage scheme where media can be stored either as inline Base64 `Data` inside the JSON (legacy) or as separate files on disk referenced by relative paths (current).

### How It Works by Entity Type

#### Draft (Asset Legacy Drafts)

```swift
struct Draft {
    var imageData: [Data]      // Legacy: inline PNG bytes
    var imagePaths: [String]   // Current: relative file paths

    var usesFileStorage: Bool {
        !imagePaths.isEmpty
    }
}
```

- **Write path:** New drafts populate `imagePaths` via `MediaStorageService`. `imageData` is left empty.
- **Read path:** Check `usesFileStorage` first. If true, load from `imagePaths` via `MediaStorageService.loadMedia()`. Otherwise fall back to inline `imageData`.

#### FrameDraft

```swift
struct FrameDraft {
    var imageData: Data?       // Legacy: inline PNG bytes
    var imagePath: String?     // Current: relative file path

    var usesFileStorage: Bool {
        imagePath != nil
    }
}
```

Same dual pattern: single image, single path.

#### ShotDraft

```swift
struct ShotDraft {
    var videoData: Data?       // Legacy: inline MP4 bytes
    var videoPath: String?     // Current: relative file path
    var thumbnailPath: String? // Current: relative file path for thumbnail

    var usesFileStorage: Bool {
        videoPath != nil
    }
}
```

Videos and thumbnails stored as separate files. No legacy inline thumbnail on ShotDraft (that exists on `Shot` itself as `thumbnailData`).

#### Frame (Top-Level)

```swift
struct Frame {
    var previewImageData: Data?    // Legacy inline
    var previewImagePath: String?  // Current file path
}
```

#### Shot (Top-Level)

```swift
struct Shot {
    var videoData: Data?        // Legacy inline
    var videoPath: String?      // Current file path
    var thumbnailData: Data?    // Legacy inline thumbnail
    var thumbnailPath: String?  // Current file path thumbnail
}
```

### Loading Priority

When resolving media for display, the pattern throughout the codebase is:

1. **File path first** -- if a path field is non-nil, load from disk via `MediaStorageService`.
2. **Inline data second** -- fall back to the inline `Data` field.
3. **Legacy/parent fallback** -- for thumbnails, fall back through `primaryDraft -> draftHistory.first -> legacy field`.

### Backward Compatibility

Custom `init(from decoder:)` on all draft types uses `decodeIfPresent` for the newer path fields, defaulting to `nil`. This means projects saved before file-based storage was added decode without error -- they simply have `nil` paths and rely entirely on inline data.

### JSON Size Implications

The primary motivation for file-based storage is JSON size. A project with 20 asset drafts, each containing 4 views at ~500KB per image, would produce a 40MB `project.json` with inline storage. With file-based storage, the JSON contains only the relative path strings, keeping it under 1MB for typical projects.

---

## 5. Project Serialization

### Codable Conformance

`Project` implements custom `encode(to:)` and `init(from:)` to handle:
- `decodeIfPresent` for optional fields like `defaultImageProvider`, `defaultVideoProvider`, `defaultStyleId`.
- Forward compatibility: unknown keys are ignored by the decoder.
- Backward compatibility: missing keys use sensible defaults.

### Coding Keys

```swift
enum CodingKeys: String, CodingKey {
    case id, name, description
    case styles, defaultStyleId
    case assets, frames, shots
    case defaultImageProvider, defaultVideoProvider
    case createdAt, modifiedAt
}
```

All keys use camelCase and match the property names directly.

### Date Encoding

Configured at the `StorageService` level:

```swift
encoder.dateEncodingStrategy = .iso8601
decoder.dateDecodingStrategy = .iso8601
```

This applies to all `Date` fields across all nested models: `Project.createdAt`, `Project.modifiedAt`, `Asset.createdAt`, `Draft.createdAt`, `FrameDraft.createdAt`, `ShotDraft.createdAt`, `AssetDraft.createdAt`, `StyleDraft.createdAt`.

Example output: `"2025-06-15T14:30:00Z"`

### Sanitized Filenames

The project folder name is built by `createProjectFolderName(for:)`:

```swift
let safeName = sanitizeProjectName(project.name)   // See sanitization rules in Section 3
let shortId = String(project.id.uuidString.prefix(8))
return "\(safeName)-\(shortId)"
```

The short UUID uses the **first 8 characters** of `UUID().uuidString` (uppercase hex with hyphens removed by the UUID format, though the standard format includes hyphens -- so the prefix may include a hyphen, e.g. `A3F7B2C1` from `A3F7B2C1-...`).

### Project Folder Lookup

Finding a project by ID scans the `Projects/` directory for any folder whose `lastPathComponent` ends with `-{shortId}`. This allows the project to be renamed (changing the folder prefix) while remaining findable by ID. However, folder renames are not currently implemented -- the name prefix is set at creation time.

### Nested Model Serialization

The entire object graph is serialized into a single `project.json`:

```
Project
  -> [NamedStyle] (with VisualStyle, StyleParameters)
  -> [Asset]
       -> AssetReference?
       -> AssetDraft? (currentDraft)
       -> [AssetDraft] (draftHistory)
       -> [Draft] (legacyDrafts) -- with inline imageData OR imagePaths
  -> [Frame]
       -> [FrameDraft] (draftHistory) -- with inline imageData OR imagePath
       -> CameraParameters
  -> [Shot]
       -> [ShotDraft] (draftHistory) -- with inline videoData OR videoPath
```

All models conform to `Codable`. Legacy migration is handled via `decodeIfPresent` with default values throughout.

---

## 6. StorageLocationManager

**File:** `Services/StorageLocationManager.swift`

Singleton (`StorageLocationManager.shared`) that manages the user-selected storage directory using macOS security-scoped bookmarks. This is necessary because macOS sandboxed apps lose access to user-selected directories after restart unless a bookmark is persisted.

### Error Types

```swift
enum StorageLocationError: Error {
    case noStorageAccess
    case bookmarkCreationFailed
    case bookmarkResolutionFailed
    case folderCreationFailed
}
```

### Security-Scoped Bookmark Lifecycle

```
   [App Launch]
        |
        v
   resolveBookmark()
        |
        +-- Read bookmark Data from UserDefaults (key: "ShotMakerStorageBookmark")
        |
        +-- URL(resolvingBookmarkData:options:.withSecurityScope)
        |
        +-- url.startAccessingSecurityScopedResource()
        |       |
        |       +-- Success: store as activeSecurityScopedURL
        |       |            stop previous scope if any
        |       |            refresh bookmark if stale
        |       |            return URL
        |       |
        |       +-- Failure: return nil
        |
   [App runs, reads/writes files under the scoped URL]
        |
   [App Termination]
        |
        v
   stopAccessingStorage()
        +-- activeSecurityScopedURL?.stopAccessingSecurityScopedResource()
        +-- activeSecurityScopedURL = nil
```

### Public Methods

#### `getProjectsBaseURL() throws -> URL`

Returns the base URL for all ShotMaker storage. Attempts to resolve the saved bookmark. If no valid bookmark exists, throws `StorageLocationError.noStorageAccess`, signaling the UI to prompt the user.

#### `hasValidStorageAccess() -> Bool`

Non-throwing check. Reads the bookmark from UserDefaults, resolves it, and verifies it is not stale. If stale, attempts to refresh by starting security scope, re-saving the bookmark, and stopping scope. Returns `false` if any step fails.

Does **not** keep the security scope active (the start/stop is symmetric within the method for stale refresh only).

#### `promptForStorageLocation() -> URL?` (`@MainActor`)

Presents an `NSOpenPanel` configured for directory selection:
- `canChooseFiles = false`
- `canChooseDirectories = true`
- `canCreateDirectories = true`
- Defaults to the user's Documents folder.

After selection:
1. If the selected folder is not already named `"ShotMaker"`, appends `/ShotMaker`.
2. Creates the `ShotMaker/Projects/` directory tree.
3. Saves a security-scoped bookmark for the `ShotMaker` folder.
4. Returns the ShotMaker folder URL, or `nil` if cancelled.

#### `resolveBookmark() -> URL?`

Resolves the saved bookmark data and starts the security-scoped resource. Manages the `activeSecurityScopedURL` lifecycle:
- Stops the previously active scope before starting a new one.
- Refreshes stale bookmarks silently (errors are swallowed with `try?`).

#### `stopAccessingStorage()`

Must be called on app termination. Stops the security-scoped resource access. Failure to call this leaks a kernel resource handle.

### Bookmark Storage

The bookmark is stored as `Data` in `UserDefaults` under the key `"ShotMakerStorageBookmark"`. The bookmark data is created with:

```swift
url.bookmarkData(options: .withSecurityScope, includingResourceValuesForKeys: nil, relativeTo: nil)
```

### Stale Bookmark Handling

Bookmarks become stale when the target volume is remounted, the folder is moved, or the system updates. The code detects staleness via the `bookmarkDataIsStale` out-parameter and attempts automatic refresh:
1. Start accessing the security-scoped resource (the old bookmark may still work for one access).
2. Create a fresh bookmark from the resolved URL.
3. Save the fresh bookmark to UserDefaults.

If refresh fails, access is denied and the user must re-select the folder.

---

## 7. Application Support Storage

Separate from the user-selected project directory, ShotMaker uses `~/Library/Application Support/ShotMaker/` for application-wide configuration that should persist independently of project location.

### Directory Structure

```
~/Library/Application Support/ShotMaker/
    providers.json          # AI provider configurations
    Media/                  # Legacy media storage (pre-project-folder era)
        Images/
        Videos/
        Audio/
```

### providers.json

Stores an array of `AIProvider` objects. Managed by:
- `StorageService.saveProviders(_ providers: [AIProvider]) throws`
- `StorageService.loadProviders() throws -> [AIProvider]`

This file is stored here rather than in project folders because providers are shared across all projects. Returns an empty array (not an error) if the file does not exist yet.

### Legacy Media Directory

The `Media/` directory with `Images/`, `Videos/`, and `Audio/` subdirectories is created by `StorageService.getMediaDirectory()`. This was the original storage location before per-project media folders were introduced. The `saveImageData(_:filename:)` and `loadImageData(from:)` methods still write to/read from this location.

---

## 8. Save Debouncing

**File:** `ViewModels/ProjectViewModel.swift`

The `ProjectViewModel` implements a debounced save system to reduce disk I/O when the user is actively editing (adding assets, updating frames, tweaking styles, etc.).

### Constants

```swift
private let saveDebounceInterval: TimeInterval = 1.5  // seconds
```

### Mechanism

```swift
private var saveTask: Task<Void, Never>?

private func saveCurrentProjectDebounced() {
    saveTask?.cancel()                              // Cancel pending save
    saveTask = Task {
        try await Task.sleep(for: .seconds(1.5))    // Wait for quiet period
        guard !Task.isCancelled else { return }     // Bail if superseded
        try saveCurrentProject()                    // Perform actual save
    }
}
```

**Behavior:**
1. Every mutating operation (add/update asset, frame, shot, style) calls `saveCurrentProjectDebounced()`.
2. The previous pending save task is cancelled.
3. A new task sleeps for 1.5 seconds.
4. If no new mutation arrives during that window, the save executes.
5. If a new mutation arrives, step 1 repeats -- the 1.5-second window resets.

### Immediate Save

```swift
func saveCurrentProjectImmediately() {
    saveTask?.cancel()           // Cancel any pending debounced save
    try saveCurrentProject()     // Save now
}
```

Used for:
- Explicit user save actions (Cmd+S).
- Window close / app termination.
- Delete operations (which call `saveCurrentProject()` directly, not the debounced variant).

### Which Operations Use Which Save

| Operation | Save Method |
|-----------|------------|
| `addAsset()`, `updateAsset()` | `saveCurrentProjectDebounced()` |
| `addFrame()`, `updateFrame()` | `saveCurrentProjectDebounced()` |
| `addShot()`, `updateShot()` | `saveCurrentProjectDebounced()` |
| `updateVisualStyle()` | `saveCurrentProjectDebounced()` |
| `deleteAsset()`, `deleteFrame()`, `deleteShot()` | `saveCurrentProject()` (immediate, no debounce) |
| `createProject()` | `saveCurrentProject()` (immediate) |
| `validateAndFixProject()` | `saveCurrentProject()` (immediate, only if fixes needed) |
| User-triggered save | `saveCurrentProjectImmediately()` |

### Thread Safety

`ProjectViewModel` is `@MainActor`-isolated. All save operations, including the debounced task, run on the main actor. The `Task` created by `saveCurrentProjectDebounced()` inherits the `@MainActor` context (it is **not** detached). This means:
- No concurrent access to `currentProject`.
- No data races on `saveTask` cancellation/replacement.
- The `Task.sleep` does **not** block the main thread (it suspends the structured task).

### The saveCurrentProject() Pipeline

```swift
func saveCurrentProject() throws {
    guard var project = currentProject else { return }
    project.modifiedAt = Date()              // Stamp modification time
    currentProject = project                  // Update published property
    try storageService.saveProject(project)   // Write to disk
    // Update in-memory projects list
    if let index = projects.firstIndex(where: { $0.id == project.id }) {
        projects[index] = project
    }
}
```

Key detail: `modifiedAt` is stamped at save time, not at mutation time. This means the timestamp reflects when data was persisted, not when the user made the change.

---

## 9. Data Cleanup

**File:** `ViewModels/ProjectViewModel.swift`

The `cleanProject()` static method runs on every project load to repair data integrity issues that may have arisen from race conditions, crashes during save, or migration artifacts.

### When It Runs

- `init(project:)` -- when opening a project window, reloads from disk and cleans.
- `loadProject(_ project:)` -- direct load by Project object.
- `loadProject(id:)` -- load by UUID.

### Cleanup Steps

#### Step 1: Remove Duplicate IDs

For shots, assets, and frames independently: track seen UUIDs in a `Set`, keep only the first occurrence of each ID.

```swift
var seenShotIds = Set<UUID>()
cleaned.shots = project.shots.filter { shot in
    guard !seenShotIds.contains(shot.id) else { return false }
    seenShotIds.insert(shot.id)
    return true
}
```

This handles a scenario where a save race condition could append the same item twice.

#### Step 2: Remove Blank/Invalid Entries

Items without meaningful content are filtered out. The criteria differ by type:

**Shots:** Must have a non-empty `name` AND at least one draft with video content (either inline `videoData` or a `videoPath`).

```swift
cleaned.shots = cleaned.shots.filter { shot in
    !shot.name.isEmpty && shot.draftHistory.contains { $0.videoData != nil || $0.videoPath != nil }
}
```

**Assets:** Must have a non-empty `name` AND image content in either `finalImageData` or any legacy draft's `imageData`.

```swift
cleaned.assets = cleaned.assets.filter { asset in
    !asset.name.isEmpty && (!asset.finalImageData.isEmpty || asset.legacyDrafts.contains { !$0.imageData.isEmpty })
}
```

**Frames:** Must have a non-empty `name` AND at least one draft with image content (either inline `imageData` or an `imagePath`).

```swift
cleaned.frames = cleaned.frames.filter { frame in
    !frame.name.isEmpty && frame.draftHistory.contains { $0.imageData != nil || $0.imagePath != nil }
}
```

### Validation of primaryDraftIndex

After cleaning, `validateAndFixProject()` runs on the loaded project:

```swift
private func validateAndFixProject() {
    // For each asset, frame, shot:
    item.validatePrimaryDraftIndex()
    // If the index was corrected, flag needsSave = true
}
```

Each entity type's `validatePrimaryDraftIndex()` checks that the stored index is within bounds of its draft array:

```swift
mutating func validatePrimaryDraftIndex() {
    guard let index = primaryDraftIndex else { return }
    if index < 0 || index >= draftHistory.count {
        primaryDraftIndex = nil   // Reset to nil (will use fallback logic)
    }
}
```

If any index was corrected, the project is saved immediately.

### Migration: Auto-Set primaryDraftIndex

When decoding legacy projects that lack a `primaryDraftIndex`, all three entity types (Asset, Frame, Shot) auto-set it to the last draft:

```swift
if primaryDraftIndex == nil && !draftHistory.isEmpty {
    primaryDraftIndex = draftHistory.count - 1
}
```

This preserves the old behavior where the most recent draft was always shown.

---

## 10. Export System

**File:** `Services/ExportService.swift`

Singleton (`ExportService.shared`), `@MainActor`-isolated. Handles exporting assets, frames, and shots to the user's filesystem or share sheet.

### Exportable Content Types

```swift
enum ExportableContent {
    case asset(Asset)
    case frame(Frame)
    case shot(Shot)
    case multipleAssets([Asset])
    case multipleFrames([Frame])
    case multipleShots([Shot])
}
```

### Error Types

```swift
enum ExportError: LocalizedError {
    case cancelled                    // User dismissed panel
    case noData                       // No media data available
    case noWindow                     // No window for share sheet
    case fileWriteFailed(String)      // Filesystem error with reason
}
```

### Public Methods

#### `exportWithShareSheet(content:sourceView:) throws`

1. Prepares export items (writes temp files, collects URLs).
2. Presents `NSSharingServicePicker` relative to the source view.

**Throws:** `ExportError.noData` if no media data is available.

#### `exportToFolder(content:) async throws -> URL`

For single items, presents an `NSSavePanel` with suggested filename and content type filter. For multiple items, presents an `NSOpenPanel` for directory selection.

Panel configuration:
- **Single asset:** `{SanitizedName}_{type}.png`, allowed type `.png`
- **Single frame:** `{SanitizedName}_frame.png`, allowed type `.png`
- **Single shot:** `{SanitizedName}_shot.mp4`, allowed type `.mpeg4Movie`
- **Multiple items:** Directory picker with message indicating count.

**Returns:** The URL where data was written.
**Throws:** `ExportError.cancelled` if the user dismisses the panel.

#### `showInFinder(data:filename:)`

Writes data to a temporary file and reveals it in Finder via `NSWorkspace.shared.activateFileViewerSelecting()`.

#### `showInFinder(url:)`

Reveals an existing file URL in Finder.

### Data Resolution Order

When exporting an asset, the `getAssetImageData()` helper follows a strict priority:

```swift
private func getAssetImageData(_ asset: Asset) -> Data? {
    // 1. Try reference first (saved/finalized asset)
    if let imageData = asset.reference?.images.first {
        return imageData
    }
    // 2. Fall back to current draft (unsaved working changes)
    if let imageData = asset.currentDraft?.images.first {
        return imageData
    }
    // 3. Fall back to legacy finalImageData
    if let imageData = asset.finalImageData.first {
        return imageData
    }
    return nil
}
```

**Priority:**
1. `asset.reference?.images.first` -- the saved/committed reference image.
2. `asset.currentDraft?.images.first` -- the current working draft.
3. `asset.finalImageData.first` -- the legacy inline image data.

For frames: `frame.previewImageData` (the inline data field).

For shots: `shot.videoData` (the inline data field).

Note: The export system currently reads from inline `Data` fields. It does not load from file paths. This means exports from file-storage-based projects require the inline data to be populated (or the export will return `noData`).

### Temp File Management

Share sheet exports write to the system temp directory:

```swift
private func saveTempFile(data: Data, name: String) -> URL {
    let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(name)
    try? FileManager.default.removeItem(at: tempURL)   // Clean old
    try? data.write(to: tempURL)
    return tempURL
}
```

Temp files are not explicitly cleaned up after the share sheet closes. They rely on the OS temp directory cleanup.

### Export Filename Sanitization

The export service uses its own sanitization function, slightly different from the storage services:

```swift
private func sanitizeFilename(_ name: String) -> String {
    let invalid = CharacterSet(charactersIn: ":/\\?%*|\"<>")
    return name.components(separatedBy: invalid).joined(separator: "_")
}
```

Differences from `StorageService`/`MediaStorageService` sanitization:
- Uses `_` as replacement character (not `-`).
- Does not trim periods.
- Does not enforce a max length.
- Does not fall back to `"Untitled"`.

---

## Summary of All Storage Locations

| What | Where | Managed By |
|------|-------|-----------|
| Project JSON + media files | `{UserSelected}/ShotMaker/Projects/{Name}-{ShortId}/` | StorageService, MediaStorageService |
| AI provider configs | `~/Library/Application Support/ShotMaker/providers.json` | StorageService |
| Legacy media | `~/Library/Application Support/ShotMaker/Media/` | StorageService |
| Storage location bookmark | `UserDefaults["ShotMakerStorageBookmark"]` | StorageLocationManager |
| Temp export files | `NSTemporaryDirectory()` | ExportService |

---

## Implementation Notes for Cross-Platform Ports

### Web (IndexedDB / OPFS)

- **Project JSON:** Store each project as a single JSON blob in an IndexedDB object store keyed by UUID. Use a "projects" store with the short UUID as the key.
- **Media files:** Store in the Origin Private File System (OPFS) using the same relative path hierarchy (`Assets/`, `Frames/`, `Shots/`). Alternatively, store as blobs in a separate IndexedDB object store keyed by relative path.
- **Dual storage:** Not needed -- use file references exclusively since there is no legacy inline format to support.
- **Atomic writes:** IndexedDB transactions are already atomic. For OPFS, write to a temp name and rename.
- **Security-scoped bookmarks:** Not applicable. OPFS does not require user permission. For File System Access API (showDirectoryPicker), persist handles via IndexedDB.
- **Debounced saves:** Implement with `setTimeout`/`clearTimeout` or a debounce utility. Use `beforeunload` for the immediate-save-on-close equivalent.
- **Folder structure:** OPFS supports nested directories. Mirror the exact structure.

### Electron / Desktop Web

- **Project JSON:** Write to the local filesystem using Node.js `fs` module. Use the same folder structure.
- **Atomic writes:** Write to `.tmp`, then `fs.rename()` (atomic on the same filesystem).
- **Bookmark equivalent:** Store the user's selected directory path in electron-store or equivalent. No security-scoped bookmark needed outside macOS sandbox.

### Key Invariants to Preserve

1. **Project portability:** Media paths stored in JSON are always relative to the project folder root. Never store absolute paths.
2. **Crash safety:** Always write JSON atomically. Never write directly to the canonical file.
3. **ID-based lookup:** Projects are found by their short UUID suffix, not by name. This allows renaming without breaking references.
4. **Backward compatibility:** Always use `decodeIfPresent` with defaults for new fields. Never break deserialization of older project files.
5. **Debounce saves:** Frequent mutations must not produce frequent I/O. Batch writes with a quiet-period debounce.
6. **Clean on load:** Always validate data integrity when loading from disk. Remove duplicates and invalid entries.
