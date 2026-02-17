# 02 - Data Models

Complete specification of every data structure in ShotMaker. This document covers stored properties, computed properties, encoding/decoding behavior, backward compatibility patterns, relationships between models, and migration logic. A developer should be able to recreate all data structures from this specification.

All models live in `ShotMaker/Models/`.

---

## Table of Contents

1. [Project](#1-project)
2. [NamedStyle](#2-namedstyle)
3. [VisualStyle](#3-visualstyle)
4. [Style Support Enums (Medium, FilmFormat, FilmGrain, DepthOfField)](#4-style-support-enums)
5. [StyleDraft / StyleParameters](#5-styledraft--styleparameters)
6. [StyleReference](#6-stylereference)
7. [StyleParameterOptions](#7-styleparameteroptions)
8. [Asset](#8-asset)
9. [AssetDraft / AssetParameters](#9-assetdraft--assetparameters)
10. [AssetReference](#10-assetreference)
11. [AssetAttributes / AssetAttributeSet](#11-assetattributes--assetattributeset)
12. [Frame](#12-frame)
13. [FrameDraft](#13-framedraft)
14. [Shot](#14-shot)
15. [ShotDraft](#15-shotdraft)
16. [Draft (Legacy)](#16-draft-legacy)
17. [CameraParameters](#17-cameraparameters)
18. [Camera and Composition Enums](#18-camera-and-composition-enums)
19. [ConversationHistory / ConversationMessage](#19-conversationhistory--conversationmessage)
20. [AIProvider](#20-aiprovider)
21. [WindowContexts](#21-windowcontexts)
22. [ImageSelectionItem / ImportedImage](#22-imageselectionitem--importedimage)
23. [ImageAspectRatio](#23-imageaspectratio)
24. [ValidationError](#24-validationerror)
25. [ImageModelCapabilities](#25-imagemodelcapabilities)
26. [AppState](#26-appstate)
27. [AppNotification](#27-appnotification)
28. [Backward Compatibility Summary](#28-backward-compatibility-summary)
29. [Entity Relationship Diagram](#29-entity-relationship-diagram)

---

## 1. Project

**File:** `Project.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

The root container for all project data. Every ShotMaker document is a single serialized `Project`.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `name` | `String` | -- (required) | User-visible project name |
| `description` | `String` | `""` | Optional project description |
| `styles` | `[NamedStyle]` | `[]` | Multi-style system -- array of named visual style configurations |
| `defaultStyleId` | `UUID?` | `nil` | Points to the active default style in `styles[]` |
| `assets` | `[Asset]` | `[]` | All project assets (characters, objects, sets) |
| `frames` | `[Frame]` | `[]` | All composed frames |
| `shots` | `[Shot]` | `[]` | All video shots |
| `defaultImageProvider` | `UUID?` | `nil` | UUID of the default AI provider for image generation |
| `defaultVideoProvider` | `UUID?` | `nil` | UUID of the default AI provider for video generation |
| `createdAt` | `Date` | `Date()` | Project creation timestamp |
| `modifiedAt` | `Date` | `Date()` | Last modification timestamp |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `visualStyle` | `VisualStyle` (get/set) | Accessor for the default style. **Getter:** looks up `defaultStyleId` in `styles[]`; returns `VisualStyle()` if not found. **Setter:** updates the matching style in-place, or creates a new `NamedStyle(name: "Default Style")` and appends it to `styles[]`, setting `defaultStyleId` to its id. |

### CodingKeys

All stored properties use identity mapping (key name matches property name):
`id`, `name`, `description`, `styles`, `defaultStyleId`, `assets`, `frames`, `shots`, `defaultImageProvider`, `defaultVideoProvider`, `createdAt`, `modifiedAt`

### Custom Decoder Behavior

- `defaultImageProvider`: decoded with `decodeIfPresent`, nil if absent.
- `defaultVideoProvider`: decoded with `decodeIfPresent`, nil if absent.
- `defaultStyleId`: decoded with `decodeIfPresent`, nil if absent.
- All other fields are required (`decode`).

### Custom Encoder Behavior

- `defaultStyleId`, `defaultImageProvider`, `defaultVideoProvider`: encoded with `encodeIfPresent` (omitted when nil).
- All other fields are always encoded.

### Relationships

```
Project
  |-- styles: [NamedStyle]        (owned, inline)
  |-- assets: [Asset]             (owned, inline)
  |-- frames: [Frame]             (owned, inline)
  |-- shots: [Shot]               (owned, inline)
  |-- defaultStyleId  --> NamedStyle.id
  |-- defaultImageProvider --> AIProvider.id (external)
  |-- defaultVideoProvider --> AIProvider.id (external)
```

---

## 2. NamedStyle

**File:** `NamedStyle.swift`
**Protocols:** `Identifiable`, `Codable`, `Hashable`

A user-named wrapper around `VisualStyle`. Enables multiple styles per project.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Auto-generated on init |
| `name` | `String` | -- (required) | User-provided display name |
| `style` | `VisualStyle` | -- (required) | Full style configuration |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `lastUsedAt` | `Date?` | `nil` | Timestamp of last use |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `wasRecentlyUsed` | `Bool` | `true` if `lastUsedAt` is within the last 7 days |
| `lastUsedString` | `String` | Relative date string (e.g., "2 days ago") or "Never used" |

### Methods

| Method | Description |
|---|---|
| `markAsUsed()` | Sets `lastUsedAt` to `Date()` |

### Encoding/Decoding

Uses automatic `Codable` synthesis (no custom CodingKeys or init(from:)).

---

## 3. VisualStyle

**File:** `VisualStyle.swift`
**Protocols:** `Codable`, `Hashable`

The core visual style definition with dual-mode editing (Standard preset dropdowns vs. Advanced free-form text) and a full draft/reference lifecycle.

### Stored Properties -- Core Parameters

| Property | Type | Default | Description |
|---|---|---|---|
| `medium` | `Medium?` | `nil` | Visual medium (16mm, CGI, etc.) |
| `filmFormat` | `FilmFormat?` | `nil` | Film format (Standard, Anamorphic, IMAX) |
| `filmGrain` | `FilmGrain?` | `nil` | Film grain intensity |
| `depthOfField` | `DepthOfField?` | `nil` | Depth of field range |
| `lighting` | `String` | `""` | Active lighting description |
| `colorPalette` | `String` | `""` | Active color palette description |
| `aesthetic` | `String` | `""` | Active aesthetic description |
| `atmosphere` | `String` | `""` | Active atmosphere description |
| `mood` | `String` | `""` | Active mood description |
| `motion` | `String` | `""` | Active motion description |
| `texture` | `String` | `""` | Active texture description |
| `detailLevel` | `Int` | `75` | Detail level slider, range 0-100 |
| `customPrompt` | `String` | `""` | Free-form custom prompt text |

### Stored Properties -- Preset Mode Storage (Dropdown Selections)

| Property | Type | Default |
|---|---|---|
| `presetLighting` | `String?` | `nil` |
| `presetColorPalette` | `String?` | `nil` |
| `presetAesthetic` | `String?` | `nil` |
| `presetAtmosphere` | `String?` | `nil` |
| `presetMood` | `String?` | `nil` |
| `presetMotion` | `String?` | `nil` |
| `presetTexture` | `String?` | `nil` |

### Stored Properties -- Manual Mode Storage (Free-Form Text)

| Property | Type | Default |
|---|---|---|
| `manualLighting` | `String?` | `nil` |
| `manualColorPalette` | `String?` | `nil` |
| `manualAesthetic` | `String?` | `nil` |
| `manualAtmosphere` | `String?` | `nil` |
| `manualMood` | `String?` | `nil` |
| `manualMotion` | `String?` | `nil` |
| `manualTexture` | `String?` | `nil` |

### Stored Properties -- UI Mode

| Property | Type | Default | Description |
|---|---|---|---|
| `isAdvancedMode` | `Bool` | `false` | `false` = Standard (dropdown) mode; `true` = Advanced (free text) mode |

### Stored Properties -- Aspect Ratio

| Property | Type | Default | Description |
|---|---|---|---|
| `aspectRatio` | `ImageAspectRatio?` | `nil` | Default aspect ratio for this style |

### Stored Properties -- Draft/Reference System

| Property | Type | Default | Description |
|---|---|---|---|
| `reference` | `StyleReference?` | `nil` | Saved committed reference |
| `currentDraft` | `StyleDraft?` | `nil` | Current working draft |
| `draftHistory` | `[StyleDraft]` | `[]` | All previous drafts |
| `appliedDraftId` | `UUID?` | `nil` | ID of the applied/committed draft |

### Stored Properties -- Legacy

| Property | Type | Default | Description |
|---|---|---|---|
| `referenceImages` | `[Data]` | `[]` | Legacy inline reference image data |
| `styleSheetText` | `String` | `""` | Legacy style sheet text |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `activeLighting` | `String` | Returns `manualLighting` in advanced mode, `presetLighting` in standard mode (unwrap to `""`) |
| `activeColorPalette` | `String` | Same pattern for color palette |
| `activeAesthetic` | `String` | Same pattern for aesthetic |
| `activeAtmosphere` | `String` | Same pattern for atmosphere |
| `activeMood` | `String` | Same pattern for mood |
| `activeMotion` | `String` | Same pattern for motion |
| `activeTexture` | `String` | Same pattern for texture |
| `hasUnsavedChanges` | `Bool` | `true` when `currentDraft != nil` and either no reference exists or the reference savedAt differs from draft createdAt |
| `status` | `StyleStatus` | Returns `.modified`, `.draft`, `.reference`, or `.none` |

### StyleStatus Enum

| Case | Meaning |
|---|---|
| `.none` | No reference or draft exists |
| `.draft` | Has a draft but no saved reference |
| `.reference` | Has a saved reference with no unsaved changes |
| `.modified` | Has a reference but the current draft has unsaved changes |

### Custom Decoder -- Backward Compatibility

1. Enum-based fields (`medium`, `filmFormat`, `filmGrain`, `depthOfField`): `decodeIfPresent`, default `nil`.
2. String fields (`lighting`, `colorPalette`, `aesthetic`, `atmosphere`, `mood`, `motion`, `texture`, `customPrompt`): required `decode`.
3. `detailLevel`: required `decode`.
4. `isAdvancedMode`: `decodeIfPresent` with default `true` (legacy projects default to Advanced mode).
5. All `preset*` and `manual*` fields: `decodeIfPresent`, default `nil`.
6. **Migration logic**: For each of the 7 style parameters (lighting, colorPalette, aesthetic, atmosphere, mood, motion, texture), if BOTH the preset and manual storage are nil after decoding, the legacy value from the base field is migrated into the appropriate storage based on `isAdvancedMode`. Empty strings are stored as `nil`.
7. `aspectRatio`: `decodeIfPresent`, default `nil`.
8. Draft/reference fields: `decodeIfPresent`, with `draftHistory` defaulting to `[]`.
9. Legacy fields: `decodeIfPresent` with `referenceImages` defaulting to `[]` and `styleSheetText` defaulting to `""`.

### CodingKeys

All properties have identity-mapped coding keys. The full set:
`medium`, `filmFormat`, `filmGrain`, `depthOfField`, `lighting`, `colorPalette`, `aesthetic`, `atmosphere`, `mood`, `motion`, `texture`, `detailLevel`, `customPrompt`, `isAdvancedMode`, `presetLighting`, `presetColorPalette`, `presetAesthetic`, `presetAtmosphere`, `presetMood`, `presetMotion`, `presetTexture`, `manualLighting`, `manualColorPalette`, `manualAesthetic`, `manualAtmosphere`, `manualMood`, `manualMotion`, `manualTexture`, `aspectRatio`, `reference`, `currentDraft`, `draftHistory`, `appliedDraftId`, `referenceImages`, `styleSheetText`

---

## 4. Style Support Enums

**File:** `VisualStyle.swift`

All enums below are `String`-backed, conform to `Codable` and `CaseIterable`, and serialize to their raw string value.

### Medium

| Case | Raw Value |
|---|---|
| `film16mm` | `"16mm Film"` |
| `film35mm` | `"35mm Film"` |
| `film70mm` | `"70mm Film"` |
| `vhsCamera` | `"VHS Camera"` |
| `dvCamera` | `"DV Camera"` |
| `photorealistic` | `"Photorealistic"` |
| `animation3D` | `"3D CGI"` |
| `animation2D` | `"2D Hand-drawn"` |
| `stopMotion` | `"Stop Motion"` |
| `claymation` | `"Claymation"` |
| `pixelArt` | `"Pixel Art"` |
| `watercolor` | `"Watercolor"` |
| `oilPainting` | `"Oil Painting"` |
| `comicBook` | `"Comic Book"` |

### FilmFormat

| Case | Raw Value |
|---|---|
| `standard` | `"Standard"` |
| `anamorphic` | `"Anamorphic"` |
| `imax` | `"IMAX"` |

### FilmGrain

| Case | Raw Value |
|---|---|
| `none` | `"None"` |
| `subtle` | `"Subtle"` |
| `moderate` | `"Moderate"` |
| `heavy` | `"Heavy"` |
| `vintage` | `"Vintage"` |

### DepthOfField

| Case | Raw Value |
|---|---|
| `shallow` | `"Shallow (f/1.4-2.8)"` |
| `moderate` | `"Moderate (f/4-5.6)"` |
| `deep` | `"Deep (f/8-16)"` |

---

## 5. StyleDraft / StyleParameters

**File:** `StyleDraft.swift`

### StyleDraft

**Protocols:** `Identifiable`, `Codable`, `Hashable`

Represents a single iteration/draft of a visual style.

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `examples` | `[Data]` | -- (required) | Generated example images (character, object, set samples) |
| `parameters` | `StyleParameters` | -- (required) | The style parameters snapshot used for generation |
| `prompt` | `String` | -- (required) | Full compiled prompt sent to AI |
| `aiModel` | `String` | `""` | AI model used for generation |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `notes` | `String?` | `nil` | Optional user notes |

**Custom Decoder:** `aiModel` uses `decodeIfPresent` with default `""` for backward compatibility. `notes` uses `decodeIfPresent`.

### StyleParameters

**Protocols:** `Codable`, `Hashable`

A snapshot of the visual style parameters at the time of draft generation.

| Property | Type | Default | Description |
|---|---|---|---|
| `medium` | `Medium?` | `nil` | |
| `filmFormat` | `FilmFormat?` | `nil` | |
| `filmGrain` | `FilmGrain?` | `nil` | |
| `depthOfField` | `DepthOfField?` | `nil` | |
| `lighting` | `String` | `""` | |
| `colorPalette` | `String` | `""` | |
| `aesthetic` | `String` | `""` | |
| `atmosphere` | `String` | `""` | |
| `mood` | `String` | `""` | |
| `motion` | `String` | `""` | |
| `texture` | `String` | `""` | |
| `detailLevel` | `Int` | `75` | |
| `customPrompt` | `String` | `""` | |
| `presetLighting` | `String?` | `nil` | |
| `presetColorPalette` | `String?` | `nil` | |
| `presetAesthetic` | `String?` | `nil` | |
| `presetAtmosphere` | `String?` | `nil` | |
| `presetMood` | `String?` | `nil` | |
| `presetMotion` | `String?` | `nil` | |
| `presetTexture` | `String?` | `nil` | |
| `manualLighting` | `String?` | `nil` | |
| `manualColorPalette` | `String?` | `nil` | |
| `manualAesthetic` | `String?` | `nil` | |
| `manualAtmosphere` | `String?` | `nil` | |
| `manualMood` | `String?` | `nil` | |
| `manualMotion` | `String?` | `nil` | |
| `manualTexture` | `String?` | `nil` | |

**Convenience Initializer:** `init(from visualStyle: VisualStyle)` copies all matching properties from a `VisualStyle` into a `StyleParameters` snapshot.

---

## 6. StyleReference

**File:** `StyleReference.swift`
**Protocols:** `Identifiable`, `Codable`, `Hashable`

A saved, committed visual style that serves as the baseline reference.

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `examples` | `[Data]` | -- (required) | Saved example images |
| `parameters` | `StyleParameters` | -- (required) | Finalized style parameters |
| `prompt` | `String` | -- (required) | Full compiled prompt used |
| `savedAt` | `Date` | `Date()` | When the reference was saved |
| `modifiedAt` | `Date?` | `nil` | When the reference was last updated |
| `notes` | `String?` | `nil` | Optional user notes |

**Convenience Initializer:** `init(from draft: StyleDraft)` creates a reference by copying all data from a draft, generating a new `id`, setting `savedAt` to now, and `modifiedAt` to nil.

---

## 7. StyleParameterOptions

**File:** `StyleParameterOptions.swift`

A static-only struct providing curated dropdown option arrays for Standard mode. These are NOT persisted -- they are UI constants.

| Static Property | Type | Count | Description |
|---|---|---|---|
| `lightingOptions` | `[String]` | 18 | Options including empty default, "Natural daylight", "Golden hour", etc. |
| `colorPaletteOptions` | `[String]` | 15 | Options including "Vibrant saturated colors", "Muted pastels", etc. |
| `aestheticOptions` | `[String]` | 26 | Options including "Cinematic blockbuster", "Japanese anime", etc. |
| `atmosphereOptions` | `[String]` | 16 | Options including "Clear and bright", "Tense and suspenseful", etc. |
| `moodOptions` | `[String]` | 12 | Options including "Neutral", "Dynamic", "Serene", etc. |
| `motionOptions` | `[String]` | 15 | Options including "Static composition", "Smooth steady movement", etc. |
| `textureOptions` | `[String]` | 17 | Options including "Smooth", "Clean cel-shaded", etc. |

All arrays begin with an empty string `""` as the "no selection" default option.

---

## 8. Asset

**File:** `Asset.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

Represents a visual asset (character, object, or set) used in frame composition.

### Support Enums

#### AssetType (`String`, `Codable`, `CaseIterable`)

| Case | Raw Value |
|---|---|
| `character` | `"Character"` |
| `object` | `"Object"` |
| `set` | `"Set"` |

#### ViewAngle (`String`, `Codable`, `CaseIterable`)

| Case | Raw Value |
|---|---|
| `front` | `"Front View"` |
| `back` | `"Back View"` |
| `side` | `"Side View"` |
| `threeFourths` | `"3/4 View"` |

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `type` | `AssetType` | -- (required) | Character, Object, or Set |
| `name` | `String` | -- (required) | Display name |
| `reference` | `AssetReference?` | `nil` | Saved committed reference |
| `currentDraft` | `AssetDraft?` | `nil` | Current working draft |
| `draftHistory` | `[AssetDraft]` | `[]` | All previous drafts |
| `selectedStyleId` | `UUID?` | `nil` | Links to `Project.styles[].id` |
| `aspectRatio` | `ImageAspectRatio?` | `nil` | Aspect ratio used for generation |
| `visualStyleReferenceID` | `UUID?` | `nil` | Legacy visual style reference (backward compatibility) |
| `finalImageData` | `[Data]` | `[]` | Legacy inline image data |
| `prompt` | `String` | `""` | Legacy prompt text |
| `attributes` | `[String: String]` | `[:]` | Legacy attribute dictionary |
| `aiProviderId` | `UUID` | `UUID()` | Legacy AI provider ID |
| `aiModel` | `String` | `""` | Legacy AI model name |
| `legacyDrafts` | `[Draft]` | `[]` | Old draft structure array |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `googleFileId` | `String?` | `nil` | Google Files API file ID for persistent cloud storage |
| `primaryDraftIndex` | `Int?` | `nil` | Index into `legacyDrafts[]` for the primary/thumbnail draft |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `hasUnsavedChanges` | `Bool` | `true` when `currentDraft` exists and either no reference or timestamps differ |
| `status` | `AssetStatus` | Returns `.modified`, `.draft`, `.reference`, or `.none` |
| `primaryDraft` | `Draft?` | Returns `legacyDrafts[primaryDraftIndex]` if index is valid |
| `thumbnailImageData` | `[Data]` | Tries primary draft images, then `finalImageData`, then first legacy draft |

### AssetStatus Enum

| Case | Meaning |
|---|---|
| `.none` | No reference or draft |
| `.draft` | Has draft but no reference |
| `.reference` | Has saved reference, no changes |
| `.modified` | Has reference but unsaved changes |

### Custom Decoder -- Backward Compatibility

Nearly every field uses `decodeIfPresent` with sensible defaults:
- `reference`, `currentDraft`, `selectedStyleId`, `aspectRatio`, `visualStyleReferenceID`, `googleFileId`: `decodeIfPresent`, default `nil`.
- `draftHistory`: `decodeIfPresent`, default `[]`.
- `finalImageData`: `decodeIfPresent`, default `[]`.
- `prompt`: `decodeIfPresent`, default `""`.
- `attributes`: `decodeIfPresent`, default `[:]`.
- `aiProviderId`: `decodeIfPresent`, default `UUID()` (generates new random UUID for legacy data).
- `aiModel`: `decodeIfPresent`, default `""`.
- `legacyDrafts`: `decodeIfPresent`, default `[]`.
- `createdAt`: `decodeIfPresent`, default `Date()`.

**Migration logic for `primaryDraftIndex`:** If `primaryDraftIndex` is nil after decoding AND `legacyDrafts` is not empty, it auto-sets to `legacyDrafts.count - 1` (the last draft).

### Methods

| Method | Description |
|---|---|
| `validatePrimaryDraftIndex()` | Resets `primaryDraftIndex` to `nil` if out of bounds |

### CodingKeys

`id`, `type`, `name`, `reference`, `currentDraft`, `draftHistory`, `selectedStyleId`, `aspectRatio`, `visualStyleReferenceID`, `finalImageData`, `prompt`, `attributes`, `aiProviderId`, `aiModel`, `legacyDrafts`, `createdAt`, `googleFileId`, `primaryDraftIndex`

---

## 9. AssetDraft / AssetParameters

**File:** `AssetDraft.swift`

### AssetDraft

**Protocols:** `Identifiable`, `Codable`, `Hashable`

Represents a single iteration/draft of an asset in the new draft system.

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `name` | `String` | -- (required) | Draft name |
| `description` | `String` | -- (required) | Draft description |
| `images` | `[Data]` | -- (required) | Generated multi-view images (front, back, side, 3/4) |
| `parameters` | `AssetParameters` | -- (required) | Generation parameters snapshot |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `notes` | `String?` | `nil` | Optional user notes |
| `conversationHistory` | `ConversationHistory?` | `nil` | Chat history for iterative refinements |

**Computed Properties:**

| Property | Type | Description |
|---|---|---|
| `refinementCount` | `Int` | Delegates to `conversationHistory?.refinementCount ?? 0` |

### AssetParameters

**Protocols:** `Codable`, `Hashable`

| Property | Type | Default | Description |
|---|---|---|---|
| `prompt` | `String` | -- (required) | Generation prompt |
| `negativePrompt` | `String?` | `nil` | Optional negative prompt |
| `attributes` | `[String: String]` | `[:]` | Type-specific attributes dictionary |
| `aiModel` | `String` | -- (required) | AI model used |
| `usedReference` | `Bool` | `false` | Whether a reference image was used |
| `referenceImageId` | `UUID?` | `nil` | ID of reference image used |

---

## 10. AssetReference

**File:** `AssetReference.swift`
**Protocols:** `Identifiable`, `Codable`, `Hashable`

A saved, committed asset that can be used in frames and shots.

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `name` | `String` | -- (required) | Reference name |
| `description` | `String` | -- (required) | Reference description |
| `images` | `[Data]` | -- (required) | Finalized multi-view images |
| `parameters` | `AssetParameters` | -- (required) | Parameters used for generation |
| `savedAt` | `Date` | `Date()` | When the reference was saved |
| `modifiedAt` | `Date?` | `nil` | When the reference was last updated |
| `notes` | `String?` | `nil` | Optional user notes |

**Convenience Initializer:** `init(from draft: AssetDraft)` creates a reference by copying all data from an `AssetDraft`, generating a new `id`, setting `savedAt` to now.

---

## 11. AssetAttributes / AssetAttributeSet

**File:** `AssetAttributes.swift`

### Character Attribute Enums

All are `String`-backed, conform to `Codable`, `CaseIterable`, `Identifiable` (with `id` = `rawValue`).

#### CharacterAge
`child` ("Child"), `teen` ("Teen"), `youngAdult` ("Young Adult"), `adult` ("Adult"), `middleAged` ("Middle-Aged"), `elderly` ("Elderly")

#### CharacterBuild
`petite` ("Petite"), `slim` ("Slim"), `average` ("Average"), `athletic` ("Athletic"), `muscular` ("Muscular"), `stocky` ("Stocky"), `heavyset` ("Heavyset"), `tall` ("Tall")

#### CharacterClothing
`casual` ("Casual"), `formal` ("Formal"), `business` ("Business"), `athletic` ("Athletic"), `vintage` ("Vintage"), `fantasy` ("Fantasy"), `sciFi` ("Sci-Fi"), `military` ("Military"), `traditional` ("Traditional"), `costume` ("Costume")

#### CharacterHair
`short` ("Short"), `medium` ("Medium"), `long` ("Long"), `bald` ("Bald"), `curly` ("Curly"), `straight` ("Straight"), `wavy` ("Wavy"), `braided` ("Braided"), `dreadlocks` ("Dreadlocks")

#### CharacterExpression
`neutral` ("Neutral"), `happy` ("Happy"), `sad` ("Sad"), `angry` ("Angry"), `surprised` ("Surprised"), `fearful` ("Fearful"), `disgusted` ("Disgusted"), `confident` ("Confident"), `serious` ("Serious"), `playful` ("Playful")

#### CharacterPosture
`standing` ("Standing"), `sitting` ("Sitting"), `walking` ("Walking"), `running` ("Running"), `crouching` ("Crouching"), `leaning` ("Leaning"), `relaxed` ("Relaxed"), `tense` ("Tense")

### Object Attribute Enums

#### ObjectSize
`tiny` ("Tiny"), `small` ("Small"), `medium` ("Medium"), `large` ("Large"), `huge` ("Huge")

#### ObjectMaterial
`wood` ("Wood"), `metal` ("Metal"), `plastic` ("Plastic"), `glass` ("Glass"), `fabric` ("Fabric"), `stone` ("Stone"), `ceramic` ("Ceramic"), `leather` ("Leather"), `paper` ("Paper"), `rubber` ("Rubber"), `mixed` ("Mixed Materials")

#### ObjectCondition
`pristine` ("Pristine"), `new` ("New"), `good` ("Good"), `worn` ("Worn"), `damaged` ("Damaged"), `broken` ("Broken"), `ancient` ("Ancient"), `weathered` ("Weathered")

#### ObjectStyle
`modern` ("Modern"), `vintage` ("Vintage"), `antique` ("Antique"), `industrial` ("Industrial"), `rustic` ("Rustic"), `minimalist` ("Minimalist"), `ornate` ("Ornate"), `futuristic` ("Futuristic"), `traditional` ("Traditional")

#### ObjectEra
`prehistoric` ("Prehistoric"), `ancient` ("Ancient"), `medieval` ("Medieval"), `renaissance` ("Renaissance"), `victorian` ("Victorian"), `earlyModern` ("Early 20th Century"), `midCentury` ("Mid-Century"), `contemporary` ("Contemporary"), `future` ("Future")

#### ObjectFunction
`decorative` ("Decorative"), `functional` ("Functional"), `tool` ("Tool"), `weapon` ("Weapon"), `furniture` ("Furniture"), `vehicle` ("Vehicle"), `technology` ("Technology"), `container` ("Container"), `toy` ("Toy")

### Set Attribute Enums

#### SetLocation
`interior` ("Interior"), `exterior` ("Exterior"), `urban` ("Urban"), `rural` ("Rural"), `wilderness` ("Wilderness"), `underwater` ("Underwater"), `space` ("Space"), `fantasy` ("Fantasy Realm"), `abstract` ("Abstract")

#### SetTime
`dawn` ("Dawn"), `morning` ("Morning"), `midday` ("Midday"), `afternoon` ("Afternoon"), `dusk` ("Dusk"), `evening` ("Evening"), `night` ("Night"), `midnight` ("Midnight")

#### SetWeather
`clear` ("Clear"), `partlyCloudy` ("Partly Cloudy"), `cloudy` ("Cloudy"), `overcast` ("Overcast"), `rainy` ("Rainy"), `stormy` ("Stormy"), `snowy` ("Snowy"), `foggy` ("Foggy"), `windy` ("Windy")

#### SetScale
`intimate` ("Intimate"), `small` ("Small"), `medium` ("Medium"), `large` ("Large"), `vast` ("Vast"), `epic` ("Epic")

#### SetArchitecture
`modern` ("Modern"), `classical` ("Classical"), `gothic` ("Gothic"), `industrial` ("Industrial"), `brutalist` ("Brutalist"), `victorian` ("Victorian"), `artDeco` ("Art Deco"), `minimalist` ("Minimalist"), `organic` ("Organic"), `futuristic` ("Futuristic")

#### SetAtmosphere
`peaceful` ("Peaceful"), `tense` ("Tense"), `mysterious` ("Mysterious"), `cheerful` ("Cheerful"), `gloomy` ("Gloomy"), `dramatic` ("Dramatic"), `serene` ("Serene"), `chaotic` ("Chaotic"), `romantic` ("Romantic"), `foreboding` ("Foreboding")

### AssetAttributeSet

**Protocols:** `Codable`, `Hashable`, `Equatable`

A unified container holding all possible attributes across all asset types plus camera composition settings. Only the attributes relevant to the asset type are typically populated.

#### Stored Properties

| Property | Type | Category | Description |
|---|---|---|---|
| `age` | `CharacterAge?` | Character | |
| `build` | `CharacterBuild?` | Character | |
| `clothing` | `CharacterClothing?` | Character | |
| `hair` | `CharacterHair?` | Character | |
| `expression` | `CharacterExpression?` | Character | |
| `posture` | `CharacterPosture?` | Character | |
| `size` | `ObjectSize?` | Object | |
| `material` | `ObjectMaterial?` | Object | |
| `condition` | `ObjectCondition?` | Object | |
| `style` | `ObjectStyle?` | Object | |
| `era` | `ObjectEra?` | Object | |
| `function` | `ObjectFunction?` | Object | |
| `location` | `SetLocation?` | Set | |
| `time` | `SetTime?` | Set | |
| `weather` | `SetWeather?` | Set | |
| `scale` | `SetScale?` | Set | |
| `architecture` | `SetArchitecture?` | Set | |
| `atmosphere` | `SetAtmosphere?` | Set | |
| `framing` | `ShotAngle?` | Camera | |
| `cameraPerspective` | `CameraPerspective?` | Camera | |
| `composition` | `CompositionRule?` | Camera | |
| `lensType` | `LensType?` | Camera | |
| `motionBlur` | `MotionBlurEffect?` | Camera | |
| `lighting` | `LightingStyle?` | Camera | |

All properties default to `nil`.

#### Methods

| Method | Signature | Description |
|---|---|---|
| `toDictionary()` | `-> [String: String]` | Converts all non-nil attributes to a flat dictionary using display keys (e.g., `"Age"`, `"Build"`, `"Camera Perspective"`) and raw enum values. |
| `fromDictionary(_:)` | `static, ([String: String]) -> AssetAttributeSet` | Creates an `AssetAttributeSet` from a dictionary, parsing raw values back into enum cases. Keys must match the display keys exactly. |
| `defaults(for:)` | `static, (AssetType) -> AssetAttributeSet` | Returns an empty `AssetAttributeSet()` for any asset type. |

#### Dictionary Key Mapping

| Key String | Property | Enum Type |
|---|---|---|
| `"Age"` | `age` | `CharacterAge` |
| `"Build"` | `build` | `CharacterBuild` |
| `"Clothing"` | `clothing` | `CharacterClothing` |
| `"Hair"` | `hair` | `CharacterHair` |
| `"Expression"` | `expression` | `CharacterExpression` |
| `"Posture"` | `posture` | `CharacterPosture` |
| `"Size"` | `size` | `ObjectSize` |
| `"Material"` | `material` | `ObjectMaterial` |
| `"Condition"` | `condition` | `ObjectCondition` |
| `"Style"` | `style` | `ObjectStyle` |
| `"Era"` | `era` | `ObjectEra` |
| `"Function"` | `function` | `ObjectFunction` |
| `"Location"` | `location` | `SetLocation` |
| `"Time"` | `time` | `SetTime` |
| `"Weather"` | `weather` | `SetWeather` |
| `"Scale"` | `scale` | `SetScale` |
| `"Architecture"` | `architecture` | `SetArchitecture` |
| `"Atmosphere"` | `atmosphere` | `SetAtmosphere` |
| `"Framing"` | `framing` | `ShotAngle` |
| `"Camera Perspective"` | `cameraPerspective` | `CameraPerspective` |
| `"Composition"` | `composition` | `CompositionRule` |
| `"Lens Type"` | `lensType` | `LensType` |
| `"Motion Blur"` | `motionBlur` | `MotionBlurEffect` |
| `"Lighting"` | `lighting` | `LightingStyle` |

---

## 12. Frame

**File:** `Frame.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

Represents a composed frame (still image) combining multiple assets with camera parameters.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `name` | `String` | -- (required) | Display name |
| `description` | `String` | `""` | Frame description |
| `assetIds` | `[UUID]` | `[]` | References to `Asset.id` values |
| `cameraParameters` | `CameraParameters` | `CameraParameters()` | Camera and composition settings |
| `duration` | `TimeInterval` | `3.0` | Duration in seconds |
| `previewImageData` | `Data?` | `nil` | Legacy inline image storage |
| `previewImagePath` | `String?` | `nil` | Relative file path for file-based storage |
| `aiProviderId` | `UUID?` | `nil` | AI provider used |
| `aiModel` | `String?` | `nil` | AI model used |
| `draftHistory` | `[FrameDraft]` | `[]` | All frame drafts |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `selectedStyleId` | `UUID?` | `nil` | Links to `Project.styles[].id` |
| `aspectRatio` | `ImageAspectRatio?` | `nil` | Aspect ratio used for generation |
| `googleFileId` | `String?` | `nil` | Google Files API file ID |
| `frameAttributes` | `AssetAttributeSet?` | `nil` | Frame environment attributes (location, time, weather, etc.) |
| `primaryDraftIndex` | `Int?` | `nil` | Index into `draftHistory[]` for the primary/thumbnail draft |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `primaryDraft` | `FrameDraft?` | Returns `draftHistory[primaryDraftIndex]` if index is valid |
| `thumbnailImageData` | `Data?` | Tries primary draft `imageData`, then falls back to `previewImageData` |

### CodingKeys

Includes both current and legacy keys:
`id`, `name`, `description`, `assetIds`, `cameraParameters`, `duration`, `previewImageData`, `previewImagePath`, `aiProviderId`, `aiModel`, `draftHistory`, `createdAt`, `selectedStyleId`, `aspectRatio`, `googleFileId`, `frameAttributes`, `primaryDraftIndex`, `cameraAngle` (legacy), `composition` (legacy)

### Custom Decoder -- Backward Compatibility

- Most optional fields use `decodeIfPresent`.
- `draftHistory`: `decodeIfPresent`, default `[]`.
- **CameraParameters migration:** Attempts to decode `cameraParameters` as `CameraParameters` first. If that fails, falls back to reading legacy string fields `cameraAngle` and `composition`, constructing a `CameraParameters` with `ShotAngle(rawValue:)` (default `.mediumShot`) and `CompositionRule(rawValue:)` (default `.ruleOfThirds`), with perspective defaulting to `.eyeLevel`.
- **primaryDraftIndex migration:** Same pattern as Asset -- if nil and `draftHistory` is not empty, auto-sets to `draftHistory.count - 1`.

### Custom Encoder

Encodes all current fields. Does NOT encode legacy `cameraAngle`/`composition` keys (they are read-only for migration).

### Methods

| Method | Description |
|---|---|
| `validatePrimaryDraftIndex()` | Resets `primaryDraftIndex` to `nil` if out of bounds |

### Relationships

```
Frame
  |-- assetIds[]     --> Asset.id (reference by UUID)
  |-- selectedStyleId --> NamedStyle.id
  |-- cameraParameters: CameraParameters (owned, inline)
  |-- draftHistory: [FrameDraft] (owned, inline)
  |-- frameAttributes: AssetAttributeSet? (owned, inline)
```

---

## 13. FrameDraft

**File:** `FrameDraft.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

A single draft iteration of a frame composition.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `imageData` | `Data?` | `nil` | AI-generated image -- legacy inline storage |
| `imagePath` | `String?` | `nil` | Relative file path for file-based storage |
| `prompt` | `String` | -- (required) | Frame description/prompt |
| `fullPrompt` | `String?` | `nil` | Complete JSON prompt sent to AI |
| `renderedPrompt` | `String?` | `nil` | Human-readable version for display |
| `negativePrompt` | `String?` | `nil` | Optional negative prompt |
| `assetIds` | `[UUID]` | -- (required) | Assets included in this frame |
| `cameraParameters` | `CameraParameters` | -- (required) | Camera settings used |
| `aiModel` | `String` | -- (required) | AI model used |
| `aiProviderId` | `UUID` | -- (required) | AI provider used |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `conversationHistory` | `ConversationHistory?` | `nil` | Chat history for refinements |
| `frameAttributes` | `AssetAttributeSet?` | `nil` | Frame environment attributes |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `refinementCount` | `Int` | Delegates to `conversationHistory?.refinementCount ?? 0` |
| `usesFileStorage` | `Bool` | `imagePath != nil` |

### Custom Decoder -- Backward Compatibility

- `imageData`, `imagePath`, `fullPrompt`, `renderedPrompt`, `negativePrompt`, `conversationHistory`, `frameAttributes`: all `decodeIfPresent`.
- `createdAt`: `decodeIfPresent`, default `Date()`.

---

## 14. Shot

**File:** `Shot.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

Represents a video shot composed from frames.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `name` | `String` | -- (required) | Display name |
| `description` | `String` | `""` | Shot description |
| `narrative` | `String` | `""` | Shot narrative/instructions for AI |
| `audioPrompt` | `String?` | `nil` | Optional audio/sound description |
| `frameIds` | `[UUID]` | `[]` | References to `Frame.id` values |
| `videoData` | `Data?` | `nil` | Legacy inline video storage |
| `videoPath` | `String?` | `nil` | Relative file path for file-based storage |
| `audioData` | `Data?` | `nil` | Audio data |
| `thumbnailData` | `Data?` | `nil` | Legacy cached thumbnail |
| `thumbnailPath` | `String?` | `nil` | Relative file path for thumbnail |
| `duration` | `TimeInterval` | `0` | Shot duration in seconds |
| `transitions` | `String` | `"smooth"` | Transition description (simplified from legacy array) |
| `draftHistory` | `[ShotDraft]` | `[]` | All shot drafts |
| `aiProviderId` | `UUID?` | `nil` | AI provider used |
| `aiModel` | `String?` | `nil` | AI model used |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `primaryDraftIndex` | `Int?` | `nil` | Index into `draftHistory[]` for the primary/thumbnail draft |
| `framing` | `ShotAngle?` | `nil` | Camera framing |
| `cameraPerspective` | `CameraPerspective?` | `nil` | Camera perspective |
| `composition` | `CompositionRule?` | `nil` | Composition rule |
| `lensType` | `LensType?` | `nil` | Lens type |
| `motionBlur` | `MotionBlurEffect?` | `nil` | Motion blur effect |
| `lighting` | `LightingStyle?` | `nil` | Lighting style |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `primaryDraft` | `ShotDraft?` | Returns `draftHistory[primaryDraftIndex]` if index is valid |
| `thumbnailVideoData` | `Data?` | Tries primary draft `videoData`, then falls back to Shot-level `videoData` |

### CodingKeys

`id`, `name`, `description`, `narrative`, `audioPrompt`, `frameIds`, `videoData`, `videoPath`, `audioData`, `thumbnailData`, `thumbnailPath`, `duration`, `transitions`, `draftHistory`, `aiProviderId`, `aiModel`, `createdAt`, `primaryDraftIndex`, `framing`, `cameraPerspective`, `composition`, `lensType`, `motionBlur`, `lighting`

### Custom Decoder -- Backward Compatibility

- `narrative`: `decodeIfPresent`, default `""`.
- `audioPrompt`, `videoData`, `videoPath`, `audioData`, `thumbnailData`, `thumbnailPath`: `decodeIfPresent`.
- **Transitions migration:** Attempts to decode `transitions` as `[String]` first (legacy array format). If successful, takes the first element or defaults to `"smooth"`. Otherwise decodes as `String` with `decodeIfPresent`, default `"smooth"`.
- `draftHistory`: `decodeIfPresent`, default `[]`.
- Camera composition fields (`framing`, `cameraPerspective`, `composition`, `lensType`, `motionBlur`, `lighting`): all `decodeIfPresent`.
- **primaryDraftIndex migration:** Same pattern -- if nil and `draftHistory` is not empty, auto-sets to `draftHistory.count - 1`.

### Methods

| Method | Description |
|---|---|
| `validatePrimaryDraftIndex()` | Resets `primaryDraftIndex` to `nil` if out of bounds |

### Relationships

```
Shot
  |-- frameIds[]  --> Frame.id (reference by UUID)
  |-- draftHistory: [ShotDraft] (owned, inline)
```

---

## 15. ShotDraft

**File:** `ShotDraft.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

A single draft iteration of a video shot.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `videoData` | `Data?` | `nil` | Legacy inline video storage |
| `videoPath` | `String?` | `nil` | Relative file path for file-based video storage |
| `thumbnailPath` | `String?` | `nil` | Relative file path for thumbnail |
| `prompt` | `String` | -- (required) | Shot narrative/instructions |
| `fullPrompt` | `String?` | `nil` | Complete JSON prompt sent to AI |
| `renderedPrompt` | `String?` | `nil` | Human-readable version for display |
| `negativePrompt` | `String?` | `nil` | Optional negative prompt |
| `audioPrompt` | `String?` | `nil` | Optional audio/sound description |
| `frameIds` | `[UUID]` | -- (required) | Ordered list of frames used |
| `shotDuration` | `TimeInterval` | -- (required) | Total shot duration |
| `aiModel` | `String` | -- (required) | AI model used |
| `aiProviderId` | `UUID` | -- (required) | AI provider used |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `extensionCount` | `Int` | `0` | Number of times this video has been extended (max 20) |
| `videoReference` | `String?` | `nil` | Veo video reference string for chaining extensions |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `usesFileStorage` | `Bool` | `videoPath != nil` |

### Custom Decoder -- Backward Compatibility

- `videoData`, `videoPath`, `thumbnailPath`, `fullPrompt`, `renderedPrompt`, `negativePrompt`, `audioPrompt`, `videoReference`: `decodeIfPresent`.
- `extensionCount`: `decodeIfPresent`, default `0`.

---

## 16. Draft (Legacy)

**File:** `Draft.swift`
**Protocols:** `Codable`, `Identifiable`, `Hashable`

The original draft structure used for asset drafts before the new `AssetDraft`/`AssetReference` system. Still used by `Asset.legacyDrafts`.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `imageData` | `[Data]` | `[]` | Multiple view images (front, back, side, 3/4) -- legacy inline storage |
| `imagePaths` | `[String]` | `[]` | Relative file paths for file-based storage |
| `prompt` | `String` | -- (required) | Generation prompt |
| `fullPrompt` | `String?` | `nil` | Complete compiled prompt sent to AI (JSON format) |
| `renderedPrompt` | `String?` | `nil` | Human-readable version of the prompt |
| `negativePrompt` | `String?` | `nil` | Optional negative prompt |
| `parameters` | `[String: String]` | `[:]` | Generation parameters dictionary |
| `aiModel` | `String` | -- (required) | AI model used |
| `usedReference` | `Bool` | `false` | Whether a reference image was used |
| `referenceImageId` | `UUID?` | `nil` | ID of reference image if used |
| `createdAt` | `Date` | `Date()` | Creation timestamp |
| `conversationHistory` | `ConversationHistory?` | `nil` | Chat history for refinements |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `refinementCount` | `Int` | Delegates to `conversationHistory?.refinementCount ?? 0` |
| `usesFileStorage` | `Bool` | `!imagePaths.isEmpty` |

### Dual Storage Pattern

This draft supports both inline `Data` arrays and file-path-based storage. The `usesFileStorage` computed property indicates which mode is active. At runtime the application checks `imagePaths` first; if empty, falls back to `imageData`.

### Custom Decoder -- Backward Compatibility

- `imageData`: `decodeIfPresent`, default `[]`.
- `imagePaths`: `decodeIfPresent`, default `[]`.
- `fullPrompt`, `renderedPrompt`, `negativePrompt`, `referenceImageId`, `conversationHistory`: `decodeIfPresent`.
- `parameters`: `decodeIfPresent`, default `[:]`.
- `usedReference`: `decodeIfPresent`, default `false`.
- `createdAt`: `decodeIfPresent`, default `Date()`.

---

## 17. CameraParameters

**File:** `CameraParameters.swift`
**Protocols:** `Codable`, `Equatable`, `Hashable`

All camera and composition settings for a frame or shot. Every property is optional, defaulting to nil.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `angle` | `ShotAngle?` | `nil` | Shot angle / framing |
| `perspective` | `CameraPerspective?` | `nil` | Camera perspective (eye level, high angle, etc.) |
| `composition` | `CompositionRule?` | `nil` | Composition rule |
| `aspectRatio` | `AspectRatio?` | `nil` | Aspect ratio for the camera (from CameraParameters.swift enum, not ImageAspectRatio) |
| `lensType` | `LensType?` | `nil` | Lens type |
| `motionBlurEffect` | `MotionBlurEffect?` | `nil` | Motion blur / focus effect |
| `lightingStyle` | `LightingStyle?` | `nil` | Lighting style |

### CodingKeys

`angle`, `perspective`, `composition`, `aspectRatio`, `lensType`, `motionBlurEffect`, `lightingStyle`, `focalLength` (legacy, read-only)

### Custom Decoder -- Backward Compatibility

- All properties use `decodeIfPresent`, defaulting to nil.
- **Legacy `focalLength`:** The decoder reads and discards this field if present (`_ = try? container.decodeIfPresent(String.self, forKey: .focalLength)`). This ensures old projects with a `focalLength` string field do not cause decoding failures.

### Custom Encoder

Only encodes non-nil properties using `encodeIfPresent`. Does NOT encode the legacy `focalLength` key.

---

## 18. Camera and Composition Enums

**File:** `CameraParameters.swift`

All enums below are `String`-backed and conform to `Codable` and `CaseIterable`.

### ShotAngle

| Case | Raw Value | Description |
|---|---|---|
| `extremeWideShot` | `"Extreme Wide Shot"` | Shows entire subject and surroundings -- establishes location and scale |
| `wideShot` | `"Wide Shot"` | Shows full subject with some surrounding environment |
| `mediumShot` | `"Medium Shot"` | Subject from waist up -- balanced framing for dialogue |
| `mediumCloseup` | `"Medium Close-up"` | Subject from chest up -- emphasizes expressions |
| `closeup` | `"Close-up"` | Subject face or specific detail -- intimate and focused |
| `extremeCloseup` | `"Extreme Close-up"` | Tiny detail -- eyes, hands, or specific objects |
| `twoShot` | `"Two Shot"` | Frames two subjects together -- common for conversations |
| `overTheShoulder` | `"Over-the-shoulder"` | Subject from behind another's shoulder -- dialogue perspective |

### CameraPerspective

| Case | Raw Value | Description |
|---|---|---|
| `eyeLevel` | `"Eye Level"` | Neutral, natural perspective at subject's eye level |
| `highAngle` | `"High Angle"` | Camera looks down -- subject appears smaller or vulnerable |
| `lowAngle` | `"Low Angle"` | Camera looks up -- subject appears powerful or imposing |
| `birdsEye` | `"Bird's Eye View"` | Directly above -- shows spatial relationships |
| `wormsEye` | `"Worm's Eye View"` | Ground level looking up -- dramatic upward perspective |
| `dutchAngle` | `"Dutch Angle"` | Tilted on axis -- creates tension or disorientation |

### CompositionRule

| Case | Raw Value | Description |
|---|---|---|
| `ruleOfThirds` | `"Rule of Thirds"` | Divide frame into 9 sections, place subjects at intersections |
| `goldenRatio` | `"Golden Ratio"` | Mathematical ratio 1.618:1 for aesthetically pleasing composition |
| `centered` | `"Centered"` | Subject in exact center, symmetrical and balanced |
| `leadingLines` | `"Leading Lines"` | Use lines in frame to guide viewer's eye to subject |
| `frameWithinFrame` | `"Frame within Frame"` | Use environmental elements to frame the subject |
| `symmetry` | `"Symmetry"` | Mirror composition for visual harmony and balance |

### AspectRatio (Camera)

Note: This is a SEPARATE enum from `ImageAspectRatio`. This one lives in `CameraParameters.swift` and is used within `CameraParameters`. `ImageAspectRatio` lives in `AspectRatio.swift` and is used for image generation dimensions.

| Case | Raw Value | Description |
|---|---|---|
| `widescreen` | `"16:9 (Widescreen)"` | Modern widescreen format for HD video and streaming |
| `standard` | `"4:3 (Standard)"` | Classic television format |
| `letterbox` | `"21:9 (Letterbox)"` | Ultra-wide cinematic format |
| `square` | `"1:1 (Square)"` | Square format popular for social media |

### LensType

| Case | Raw Value |
|---|---|
| `standard` | `"None"` |
| `mm35` | `"35mm"` |
| `mm50` | `"50mm"` |
| `fisheye` | `"Fisheye"` |
| `wideAngle` | `"Wide Angle"` |
| `telephoto` | `"Telephoto"` |
| `macro` | `"Macro"` |
| `anamorphic` | `"Anamorphic"` |

### MotionBlurEffect

| Case | Raw Value |
|---|---|
| `none` | `"None"` |
| `motionBlur` | `"Motion Blur"` |
| `softFocus` | `"Soft Focus"` |
| `bokeh` | `"Bokeh"` |
| `portrait` | `"Portrait"` |
| `tiltShift` | `"Tilt-Shift"` |

### LightingStyle

| Case | Raw Value |
|---|---|
| `none` | `"None"` |
| `natural` | `"Natural"` |
| `dramatic` | `"Dramatic"` |
| `warm` | `"Warm"` |
| `cold` | `"Cold"` |
| `golden` | `"Golden Hour"` |
| `blue` | `"Blue Hour"` |
| `neon` | `"Neon"` |
| `cinematic` | `"Cinematic"` |

### CameraMovement

| Case | Raw Value |
|---|---|
| `staticShot` | `"Static Shot"` |
| `slowPushIn` | `"Slow Push In"` |
| `slowPullOut` | `"Slow Pull Out"` |
| `panLeft` | `"Pan Left"` |
| `panRight` | `"Pan Right"` |
| `tiltUp` | `"Tilt Up"` |
| `tiltDown` | `"Tilt Down"` |
| `trackingLeft` | `"Tracking Left"` |
| `trackingRight` | `"Tracking Right"` |
| `craneUp` | `"Crane Up"` |
| `craneDown` | `"Crane Down"` |
| `dollyForward` | `"Dolly Forward"` |
| `dollyBackward` | `"Dolly Backward"` |
| `arcLeft` | `"Arc Left"` |
| `arcRight` | `"Arc Right"` |
| `handheld` | `"Handheld"` |
| `zoomIn` | `"Zoom In"` |
| `zoomOut` | `"Zoom Out"` |

Note: `CameraMovement` is not a property of `CameraParameters` -- it is a standalone enum used elsewhere in the UI/generation pipeline.

---

## 19. ConversationHistory / ConversationMessage

**File:** `ConversationHistory.swift`

### MessageRole Enum

`String`-backed, `Codable`.

| Case | Raw Value |
|---|---|
| `user` | `"user"` |
| `assistant` | `"assistant"` |
| `system` | `"system"` |

### ConversationMessage

**Protocols:** `Codable`, `Identifiable`, `Hashable`

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `role` | `MessageRole` (let) | -- (required) | Who sent this message |
| `text` | `String?` (let) | `nil` | Text content |
| `imageData` | `Data?` (let) | `nil` | Image content |
| `timestamp` | `Date` (let) | `Date()` | When the message was created |

All properties are immutable (let). Messages are created once and never modified.

### ConversationHistory

**Protocols:** `Codable`, `Hashable`

Manages multi-turn chat conversations for iterative image refinement.

#### Constants

| Constant | Value | Description |
|---|---|---|
| `maxMessages` | `26` (private static) | Maximum retained messages. Allows initial generation (2 messages) plus approximately 12 refinement rounds (24 messages). |

#### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `messages` | `[ConversationMessage]` | `[]` | Ordered array of conversation messages |

#### Computed Properties

| Property | Type | Description |
|---|---|---|
| `refinementCount` | `Int` | Count of user messages after the first one (initial generation). Formula: `max(0, userMessages.count - 1)` |
| `messageCount` | `Int` | Total number of messages |
| `isEmpty` | `Bool` | Whether messages array is empty |
| `isLongConversation` | `Bool` | `true` if `messages.count > 20` (more than 10 turns) |
| `summary` | `String` | Multi-line debug string showing counts by role |

#### Mutation Methods

| Method | Description |
|---|---|
| `addUserMessage(text:imageData:)` | Appends a user message, then prunes if needed |
| `addAssistantMessage(imageData:description:)` | Appends an assistant message with image data, then prunes |
| `addSystemMessage(text:)` | Appends a system message, then prunes |
| `clear()` | Removes all messages |
| `removeLastTurn()` | Removes the last assistant message and last user message (undo one turn) |

#### Pruning Logic

When `messages.count > maxMessages` (26):
1. Preserve the first 2 messages (initial user prompt + assistant generation).
2. Calculate `removeCount = messages.count - maxMessages`.
3. Remove messages from index 2 through `min(2 + removeCount, messages.count - 1)`.

This ensures the initial generation context is always preserved while older intermediate refinements are discarded.

#### Query Methods

| Method | Return Type | Description |
|---|---|---|
| `getAPIContext()` | `[ConversationMessage]` | All messages excluding system messages (for Gemini API calls) |
| `getRefinementHistory()` | `[ConversationMessage]` | User messages after the first (refinement prompts only) |
| `getLatestUserMessage()` | `ConversationMessage?` | Most recent user message |
| `getLatestAssistantMessage()` | `ConversationMessage?` | Most recent assistant message |
| `getCurrentImage()` | `Data?` | Image data from the most recent assistant message |

#### Static Factory

| Method | Description |
|---|---|
| `fromInitialGeneration(prompt:generatedImage:)` | Creates a history with one user message (the prompt) and one assistant message (the generated image with description "Initial generation") |

---

## 20. AIProvider

**File:** `AIProvider.swift`

### ProviderType Enum

`String`-backed, `Codable`, `CaseIterable`.

| Case | Raw Value |
|---|---|
| `google` | `"Google"` |

**Computed Properties on ProviderType:**

| Property | Type | Value |
|---|---|---|
| `displayName` | `String` | Same as `rawValue` |
| `defaultCapabilities` | `[ProviderCapability]` | `[.imageGeneration, .videoGeneration]` |
| `defaultModels` | `[String]` | `["gemini-2.5-flash-image", "gemini-3-pro-image-preview", "veo-3.1-generate-preview", "veo-3.1-fast-generate-preview", "veo-3.0-generate-001", "veo-3.0-fast-generate-001"]` |

### ProviderCapability Enum

`String`-backed, `Codable`, `CaseIterable`.

| Case | Raw Value |
|---|---|
| `imageGeneration` | `"Image Generation"` |
| `imageToImage` | `"Image-to-Image"` |
| `videoGeneration` | `"Video Generation"` |
| `multiView` | `"Multi-View Generation"` |

### AIProvider Struct

**Protocols:** `Codable`, `Identifiable`, `Equatable`

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Immutable unique identifier |
| `type` | `ProviderType` | -- (required) | Provider type |
| `name` | `String` | -- (required) | Display name |
| `apiEndpoint` | `String?` | `nil` | Custom API endpoint override |
| `capabilities` | `[ProviderCapability]` | -- (required) | Supported capabilities |
| `defaultForCapabilities` | `Set<ProviderCapability>?` | `nil` | Which capabilities this provider is the default for |
| `modelOptions` | `[String]` | `[]` | Available model names |
| `customHeaders` | `[String: String]?` | `nil` | Custom HTTP headers for API calls |
| `lastUsed` | `Date?` | `nil` | Last usage timestamp |
| `totalGenerations` | `Int` | `0` | Lifetime generation count |

**Computed Properties:**

| Property | Type | Description |
|---|---|---|
| `isDefaultForImage` | `Bool` | `defaultForCapabilities` contains `.imageGeneration` |
| `isDefaultForVideo` | `Bool` | `defaultForCapabilities` contains `.videoGeneration` |
| `isDefault` | `Bool` | `defaultForCapabilities` is not nil and not empty |

**Equality:** Compared by `id` only.

**Methods:**

| Method | Return Type | Description |
|---|---|---|
| `getBestModel()` | `String?` | Returns the model with the highest version number extracted via regex |
| `getModelsForCapability(_:)` | `[String]` | Filters `modelOptions` by capability. Image capabilities exclude models containing "veo", "gen-3", "gen-2", "runway". Video capability includes models containing "veo", "gen-3", "gen-2", "runway", "video". |

---

## 21. WindowContexts

**File:** `WindowContexts.swift`

Context types passed to SwiftUI `WindowGroup` for opening creation/edit windows. All conform to `Codable` and `Hashable`. Each context includes a `sessionId: UUID` generated fresh on every init to prevent SwiftUI window reuse issues.

### AssetCreationContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `assetType` | `AssetType` (let) | Type of asset to create |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier for data sync |
| `skipTypeSelection` | `Bool` (let) | If true, skip the type selection step |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"create-asset-\(sessionId)"`

### AssetEditContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `assetId` | `UUID` (let) | Asset being edited |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"edit-asset-\(assetId)"` (based on assetId, not sessionId, for duplicate window detection)

### FrameCreationContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"create-frame-\(sessionId)"`

### FrameEditContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `frameId` | `UUID` (let) | Frame being edited |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"edit-frame-\(frameId)"`

### ShotCreationContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier |
| `initialFrameId` | `UUID?` (var) | Optional initial frame for ReFrame feature |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"create-shot-\(sessionId)"`

### ShotEditContext

| Property | Type | Description |
|---|---|---|
| `projectId` | `UUID` (let) | Parent project |
| `shotId` | `UUID` (let) | Shot being edited |
| `projectViewModelId` | `String` (let) | ViewModel instance identifier |
| `sessionId` | `UUID` (let) | Auto-generated unique session ID |

**Computed:** `id` = `"edit-shot-\(shotId)"`

### MediaPreviewContext

**Protocols:** `Codable`, `Hashable`, `Identifiable`

| Property | Type | Description |
|---|---|---|
| `id` | `UUID` (let) | Unique identifier |
| `title` | `String` (let) | Display title |
| `mediaType` | `MediaType` (let) | `.image` or `.video` |
| `imageData` | `Data?` (let) | Image data (for image type) |
| `videoData` | `Data?` (let) | Video data (for video type) |

**MediaType Enum:** `String`, `Codable`. Cases: `image`, `video`.

Two convenience initializers: one for images (sets `mediaType = .image`, `videoData = nil`) and one for videos (sets `mediaType = .video`, `imageData = nil`).

### Window ID Pattern

- **Creation contexts** use `sessionId` in their `id` to guarantee a fresh window every time.
- **Edit contexts** use the entity ID (assetId, frameId, shotId) to prevent opening duplicate edit windows for the same entity while `sessionId` ensures fresh SwiftUI state.

---

## 22. ImageSelectionItem / ImportedImage

**File:** `ImageSelectionItem.swift`

### ImportedImage

**Protocols:** `Identifiable`, `Codable`, `Equatable`, `Hashable`

Represents a user-imported image file.

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Unique identifier |
| `imageData` | `Data` (let) | -- (required) | Raw image data |
| `fileName` | `String` (let) | -- (required) | Original file name |
| `importedAt` | `Date` (let) | `Date()` | Import timestamp |

### ImageSelectionItem

**Protocols:** `Identifiable`, `Equatable`, `Hashable`

A unified enum representing any selectable image source. Used in video generation and frame composition image pickers.

#### Cases

| Case | Associated Value | Description |
|---|---|---|
| `.asset(Asset)` | `Asset` | A project asset |
| `.frame(Frame)` | `Frame` | A project frame |
| `.imported(ImportedImage)` | `ImportedImage` | A user-imported image |

#### Computed Properties

| Property | Type | Description |
|---|---|---|
| `id` | `UUID` | Delegates to the associated value's `id` |
| `name` | `String` | Asset name, frame name, or imported file name |
| `previewImageData` | `Data?` | First image from `asset.finalImageData`, frame's `previewImageData`, or imported `imageData` |
| `sourceType` | `SourceType` | Categorizes the source (see below) |
| `asset` | `Asset?` | Extracts the Asset if case is `.asset`, else nil |
| `frame` | `Frame?` | Extracts the Frame if case is `.frame`, else nil |
| `importedImage` | `ImportedImage?` | Extracts the ImportedImage if case is `.imported`, else nil |

**Equality:** Compared by `id` only.
**Hashing:** Hashes `id` only.

#### SourceType Enum

| Case | Associated Value | `displayName` |
|---|---|---|
| `.asset(AssetType)` | The asset's type | Capitalized asset type raw value |
| `.frame` | -- | `"Frame"` |
| `.imported` | -- | `"Imported"` |

Convenience booleans: `isAsset`, `isFrame`, `isImported`.

---

## 23. ImageAspectRatio

**File:** `AspectRatio.swift`
**Protocols:** `String`-backed enum, `Codable`, `CaseIterable`, `Identifiable`

Used for image and video generation dimension specification. Separate from the `AspectRatio` enum in `CameraParameters.swift`.

### Cases

| Case | Raw Value | Display Name | Numeric Ratio | Use Case |
|---|---|---|---|---|
| `square` | `"1:1"` | Square (1:1) | 1.0 | Social media posts, profile pictures |
| `standard` | `"4:3"` | Standard (4:3) | 1.333... | Classic TV, presentations |
| `widescreen` | `"16:9"` | Widescreen (16:9) | 1.777... | Modern video, YouTube |
| `ultrawide` | `"21:9"` | Ultrawide (21:9) | 2.333... | Cinematic films, immersive scenes |
| `portrait` | `"9:16"` | Portrait (9:16) | 0.5625 | Mobile video, Instagram stories |
| `anamorphic` | `"2.39:1"` | Anamorphic (2.39:1) | 2.39 | Epic cinema, theatrical release |

**`id`:** Returns `rawValue`.

### QualityLevel Enum

Nested enum (not Codable, used at runtime only).

| Case | Description |
|---|---|
| `draft` | Lower resolution for quick previews |
| `standard` | Standard production quality |
| `high` | High resolution for final output |

### Dimension Table

`dimensions(quality:)` returns `(width: Int, height: Int)`:

| Ratio | Draft | Standard | High |
|---|---|---|---|
| `square` | 512 x 512 | 1024 x 1024 | 2048 x 2048 |
| `standard` | 640 x 480 | 1024 x 768 | 1920 x 1440 |
| `widescreen` | 960 x 540 | 1920 x 1080 | 3840 x 2160 |
| `ultrawide` | 1280 x 540 | 2560 x 1080 | 5120 x 2160 |
| `portrait` | 540 x 960 | 1080 x 1920 | 2160 x 3840 |
| `anamorphic` | 1024 x 429 | 2048 x 858 | 4096 x 1716 |

---

## 24. ValidationError

**File:** `ValidationError.swift`
**Protocols:** `Identifiable`, `Equatable`

Describes why a generation configuration is invalid. NOT Codable -- used at runtime only.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Auto-generated |
| `severity` | `Severity` (let) | -- (required) | Error severity level |
| `message` | `String` (let) | -- (required) | User-facing error message |
| `solution` | `String?` (let) | -- (required parameter, can be nil) | Suggested fix |
| `errorCode` | `String?` (let) | `nil` | Debugging/support code (e.g., "AUTH_001") |

**Equality:** Compared by `id` only.

### Severity Enum

| Case | Meaning |
|---|---|
| `.error` | Prevents generation |
| `.warning` | Generation may fail or produce unexpected results |
| `.info` | Informational message |

### Factory Methods (Static)

| Method | Severity | Description |
|---|---|---|
| `noProviderSelected()` | error | No AI provider selected |
| `noModelSelected()` | error | No model selected |
| `tooManyReferenceImages(selected:max:modelName:)` | error | Too many reference images for model |
| `noReferenceImagesSupported(modelName:)` | error | Model does not support reference images |
| `emptyPrompt()` | error | Prompt cannot be empty |
| `promptTooLong(current:max:)` | warning | Prompt exceeds recommended length |
| `invalidDuration(selected:model:)` | error | Unsupported duration for model |
| `invalidResolution(selected:model:)` | error | Unsupported resolution for model |
| `unsupportedAspectRatio(selected:model:)` | warning | Aspect ratio may not be supported |
| `fromAPIError(_:provider:model:)` | varies | Transforms API errors into user-friendly messages |

### API Error Transformation

`fromAPIError` pattern-matches on the error's `localizedDescription` to detect:
- Model not supported errors
- Camera control not supported
- Authentication failures (401/403) -- code `AUTH_001`
- Quota exceeded -- code `QUOTA_001`
- Rate limit exceeded (429) -- code `RATE_001`
- Service unavailable (500/503) -- code `SVC_001`
- Network connection errors -- code `NET_001`
- Timeout errors -- code `NET_002`
- Invalid/decoding response errors -- code `RESP_001`
- Generic fallback with HTTP status extraction -- code `HTTP_<status>`

---

## 25. ImageModelCapabilities

**File:** `ImageModelCapabilities.swift`

NOT Codable -- used at runtime only as a capability descriptor.

### Stored Properties

| Property | Type | Description |
|---|---|---|
| `modelId` | `String` (let) | Model identifier string |
| `displayName` | `String` (let) | Human-readable model name |
| `supportsTextToImage` | `Bool` (let) | Whether the model supports text-to-image |
| `supportsImageToImage` | `Bool` (let) | Whether the model supports single reference image |
| `supportsMultiImageComposition` | `Bool` (let) | Whether the model supports multi-image composition |
| `maxReferenceImages` | `Int` (let) | Max reference images (0 = none, 1 = single, 4 = multi, 16 = edit) |
| `minReferenceImages` | `Int` (let) | Min required reference images (0 = no minimum) |
| `supportsNegativePrompt` | `Bool` (let) | Whether negative prompts are supported |
| `supportedAspectRatios` | `[ImageAspectRatio]` (let) | List of supported aspect ratios |
| `aspectRatioFormat` | `AspectRatioFormat` (let) | How the provider expects aspect ratio formatting |
| `supportedResolutions` | `[String]` (let) | Supported resolution options (empty = single resolution) |
| `defaultResolution` | `String?` (let) | Default resolution when not specified |
| `maxCandidateCount` | `Int` (let) | Max images per single request (1 = single, 4 = batch) |

### AspectRatioFormat Enum

| Case | Associated Value | Description |
|---|---|---|
| `.ratio(String)` | API field name | Aspect ratio as string ratio (e.g., "1:1", "16:9") |
| `.dimensions(String)` | API field name | Aspect ratio as pixel dimensions (e.g., "512x512") |
| `.promptBased` | -- | Aspect ratio injected into prompt text |
| `.none` | -- | Provider does not support aspect ratio specification |

---

## 26. AppState

**File:** `AppState.swift`
**Class:** `@MainActor class`, `ObservableObject`

Singleton global application state for managing sheet visibility and preventing duplicate commands.

### Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `shared` | `AppState` (static let) | -- | Singleton instance |
| `isShowingNewProject` | `Bool` (@Published) | `false` | Whether the new project sheet is visible |
| `isShowingOpenProject` | `Bool` (@Published) | `false` | Whether the open project sheet is visible |

### Computed Properties

| Property | Type | Description |
|---|---|---|
| `hasOpenSheet` | `Bool` | `isShowingNewProject \|\| isShowingOpenProject` |

### Methods

| Method | Description |
|---|---|
| `requestNewProject()` | Sets `isShowingNewProject = true` only if not already showing |
| `requestOpenProject()` | Sets `isShowingOpenProject = true` only if not already showing |

Private initializer enforces singleton pattern.

---

## 27. AppNotification

**File:** `AppNotification.swift`
**Protocols:** `Identifiable`, `Equatable`

Unified notification model for displaying messages across the application. NOT Codable -- runtime UI only.

### Stored Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `UUID` (let) | `UUID()` | Auto-generated |
| `type` | `NotificationType` (let) | -- (required) | Notification severity/type |
| `message` | `String` (let) | -- (required) | Primary message text |
| `detail` | `String?` (let) | -- | Solution or additional info |
| `errorCode` | `String?` (let) | -- | For debugging/support |
| `autoDismiss` | `Bool` (let) | -- | Whether the notification auto-dismisses |
| `dismissDuration` | `TimeInterval` (let) | -- | Auto-dismiss delay in seconds |

**Equality:** Compared by `id` only.

### NotificationType Enum

| Case | Icon (SF Symbol) | Icon Color | Background Color |
|---|---|---|---|
| `.error` | `exclamationmark.triangle.fill` | `.red` | `.red` |
| `.warning` | `exclamationmark.circle.fill` | `.orange` | `.orange` |
| `.info` | `info.circle.fill` | `.blue` | `.blue` |
| `.success` | `checkmark.circle.fill` | `.green` | `.green` |

### Factory Methods

| Method | Type | Auto-Dismiss | Duration | Description |
|---|---|---|---|---|
| `success(_:detail:)` | `.success` | `true` | 3.0s | Success messages |
| `error(_:solution:code:)` | `.error` | `false` | 0 | Error messages (persist until dismissed) |
| `warning(_:detail:)` | `.warning` | `false` | 0 | Warning messages (persist until dismissed) |
| `info(_:detail:)` | `.info` | `true` | 3.0s | Info messages |
| `fromValidationError(_:)` | mapped | `.info` auto-dismisses | 3.0s for info | Converts a `ValidationError` into an `AppNotification` |

---

## 28. Backward Compatibility Summary

ShotMaker uses consistent patterns across all models to ensure older project files load correctly in newer versions of the application. A developer implementing these models must follow these patterns precisely.

### Pattern 1: `decodeIfPresent` with Defaults

Every field added after the initial release uses `decodeIfPresent` in the custom `init(from decoder:)` with a sensible default value. This ensures JSON missing the key does not cause a decoding failure.

**Examples:**
```
// Optional fields default to nil
reference = try container.decodeIfPresent(AssetReference.self, forKey: .reference)

// Arrays default to empty
draftHistory = try container.decodeIfPresent([AssetDraft].self, forKey: .draftHistory) ?? []

// Strings default to empty
prompt = try container.decodeIfPresent(String.self, forKey: .prompt) ?? ""

// Booleans default to a specific value
isAdvancedMode = try container.decodeIfPresent(Bool.self, forKey: .isAdvancedMode) ?? true

// Integers default to zero or specific value
extensionCount = try container.decodeIfPresent(Int.self, forKey: .extensionCount) ?? 0
```

### Pattern 2: Legacy Field Migration

When a field's structure changes, the old field is kept for reading and data is migrated.

**Frame.cameraParameters:** If decoding `CameraParameters` fails, reads legacy `cameraAngle` (String) and `composition` (String) keys and constructs a `CameraParameters` with enum lookups and defaults.

**Shot.transitions:** If decoding as `String` fails, tries `[String]` (legacy array format), takes the first element, or defaults to `"smooth"`.

**VisualStyle dual storage:** On decode, if both `presetX` and `manualX` are nil for a parameter, the legacy base field value is migrated into the appropriate storage based on `isAdvancedMode`.

**CameraParameters.focalLength:** Legacy field is read and silently discarded.

### Pattern 3: Primary Draft Index Migration

Assets, Frames, and Shots all share the same pattern: if `primaryDraftIndex` is nil after decoding and the draft array is not empty, `primaryDraftIndex` is automatically set to the last index (`count - 1`). This ensures old projects where the concept did not exist get a reasonable default.

### Pattern 4: Dual Storage (Inline Data + File Paths)

Several models support both inline `Data` storage and file-path-based storage:
- `Draft`: `imageData: [Data]` + `imagePaths: [String]`
- `FrameDraft`: `imageData: Data?` + `imagePath: String?`
- `ShotDraft`: `videoData: Data?` + `videoPath: String?` + `thumbnailPath: String?`
- `Frame`: `previewImageData: Data?` + `previewImagePath: String?`
- `Shot`: `videoData: Data?` + `videoPath: String?` + `thumbnailData: Data?` + `thumbnailPath: String?`

The application checks the file path first; if nil or empty, falls back to inline data. The `usesFileStorage` computed property indicates which mode is active.

### Pattern 5: `encodeIfPresent` for Optional Fields

Optional properties are encoded with `encodeIfPresent`, which omits the key entirely when the value is nil. This keeps serialized JSON clean and reduces file sizes.

---

## 29. Entity Relationship Diagram

```
Project (root)
  |
  |-- styles: [NamedStyle]
  |     |-- style: VisualStyle
  |     |     |-- reference: StyleReference?
  |     |     |     |-- parameters: StyleParameters
  |     |     |-- currentDraft: StyleDraft?
  |     |     |     |-- parameters: StyleParameters
  |     |     |-- draftHistory: [StyleDraft]
  |     |     |-- aspectRatio: ImageAspectRatio?
  |
  |-- defaultStyleId  -----> NamedStyle.id
  |
  |-- assets: [Asset]
  |     |-- type: AssetType (character | object | set)
  |     |-- selectedStyleId  -----> NamedStyle.id
  |     |-- reference: AssetReference?
  |     |     |-- parameters: AssetParameters
  |     |-- currentDraft: AssetDraft?
  |     |     |-- parameters: AssetParameters
  |     |     |-- conversationHistory: ConversationHistory?
  |     |-- draftHistory: [AssetDraft]
  |     |-- legacyDrafts: [Draft]  (legacy)
  |     |     |-- conversationHistory: ConversationHistory?
  |     |-- aspectRatio: ImageAspectRatio?
  |
  |-- frames: [Frame]
  |     |-- assetIds[]  -----> Asset.id
  |     |-- selectedStyleId  -----> NamedStyle.id
  |     |-- cameraParameters: CameraParameters
  |     |-- frameAttributes: AssetAttributeSet?
  |     |-- draftHistory: [FrameDraft]
  |     |     |-- assetIds[]  -----> Asset.id
  |     |     |-- cameraParameters: CameraParameters
  |     |     |-- conversationHistory: ConversationHistory?
  |     |     |-- frameAttributes: AssetAttributeSet?
  |     |-- aspectRatio: ImageAspectRatio?
  |
  |-- shots: [Shot]
  |     |-- frameIds[]  -----> Frame.id
  |     |-- draftHistory: [ShotDraft]
  |     |     |-- frameIds[]  -----> Frame.id
  |     |     |-- videoReference: String?  (Veo extension chain)
  |     |     |-- extensionCount: Int
  |
  |-- defaultImageProvider  -----> AIProvider.id (stored externally)
  |-- defaultVideoProvider  -----> AIProvider.id (stored externally)
```

### Reference Resolution

All cross-entity references use UUIDs:
- `Asset.selectedStyleId` -> look up in `Project.styles[]`
- `Frame.assetIds[]` -> look up in `Project.assets[]`
- `Frame.selectedStyleId` -> look up in `Project.styles[]`
- `Shot.frameIds[]` -> look up in `Project.frames[]`
- `Project.defaultStyleId` -> look up in `Project.styles[]`
- `Project.defaultImageProvider` / `defaultVideoProvider` -> look up in external AIProvider storage

There are no foreign key constraints enforced at the data model level. The application is responsible for resolving references and handling dangling UUIDs gracefully (e.g., an asset referenced by a frame that has since been deleted).

### Serialization Format

The entire `Project` is serialized as JSON using Swift's `JSONEncoder`/`JSONDecoder` with default settings. Date encoding uses the default `Date` coding strategy (seconds since reference date). All `Data` fields are Base64-encoded in the JSON output.
