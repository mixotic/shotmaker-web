# Appendix A: Enum Reference

Exhaustive listing of every enum in ShotMaker with all cases, raw values, conformances, and usage context.

---

## Table of Contents

1. [Asset Domain Enums](#1-asset-domain-enums)
2. [Visual Style Enums](#2-visual-style-enums)
3. [Camera Parameter Enums](#3-camera-parameter-enums)
4. [Character Attribute Enums](#4-character-attribute-enums)
5. [Object Attribute Enums](#5-object-attribute-enums)
6. [Set Attribute Enums](#6-set-attribute-enums)
7. [Image Aspect Ratio and Quality Level](#7-image-aspect-ratio-and-quality-level)
8. [Provider and Capability Enums](#8-provider-and-capability-enums)
9. [Status Enums](#9-status-enums)
10. [Validation and Error Enums](#10-validation-and-error-enums)
11. [Image Selection Enums](#11-image-selection-enums)
12. [Window Context Enums](#12-window-context-enums)
13. [Model Capability Enums](#13-model-capability-enums)
14. [Style Parameter Preset Options](#14-style-parameter-preset-options)
15. [Built-In Style Presets (15 Presets)](#15-built-in-style-presets-15-presets)
16. [Notification Enums](#16-notification-enums)
17. [Conversation Enums](#17-conversation-enums)

---

## 1. Asset Domain Enums

### AssetType

| Property | Value |
|----------|-------|
| **File** | `Models/Asset.swift` |
| **Declaration** | `enum AssetType: String, Codable, CaseIterable` |
| **Case Count** | 3 |
| **Used By** | `Asset.type`, `AssetCreationContext.assetType`, `ImageSelectionItem.SourceType`, asset creation/editing workflows |

| Case | Raw Value |
|------|-----------|
| `character` | `"Character"` |
| `object` | `"Object"` |
| `set` | `"Set"` |

---

### ViewAngle

| Property | Value |
|----------|-------|
| **File** | `Models/Asset.swift` |
| **Declaration** | `enum ViewAngle: String, Codable, CaseIterable` |
| **Case Count** | 4 |
| **Used By** | Asset reference sheet generation, turnaround view selection |

| Case | Raw Value |
|------|-----------|
| `front` | `"Front View"` |
| `back` | `"Back View"` |
| `side` | `"Side View"` |
| `threeFourths` | `"3/4 View"` |

---

## 2. Visual Style Enums

### Medium

| Property | Value |
|----------|-------|
| **File** | `Models/VisualStyle.swift` |
| **Declaration** | `enum Medium: String, Codable, CaseIterable` |
| **Case Count** | 14 |
| **Used By** | `VisualStyle.medium`, style presets, prompt generation, `StyleParameters.medium` |

| Case | Raw Value |
|------|-----------|
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

---

### FilmFormat

| Property | Value |
|----------|-------|
| **File** | `Models/VisualStyle.swift` |
| **Declaration** | `enum FilmFormat: String, Codable, CaseIterable` |
| **Case Count** | 3 |
| **Used By** | `VisualStyle.filmFormat`, style presets, prompt generation |

| Case | Raw Value |
|------|-----------|
| `standard` | `"Standard"` |
| `anamorphic` | `"Anamorphic"` |
| `imax` | `"IMAX"` |

---

### FilmGrain

| Property | Value |
|----------|-------|
| **File** | `Models/VisualStyle.swift` |
| **Declaration** | `enum FilmGrain: String, Codable, CaseIterable` |
| **Case Count** | 5 |
| **Used By** | `VisualStyle.filmGrain`, style presets, prompt generation, style extraction |

| Case | Raw Value |
|------|-----------|
| `none` | `"None"` |
| `subtle` | `"Subtle"` |
| `moderate` | `"Moderate"` |
| `heavy` | `"Heavy"` |
| `vintage` | `"Vintage"` |

---

### DepthOfField

| Property | Value |
|----------|-------|
| **File** | `Models/VisualStyle.swift` |
| **Declaration** | `enum DepthOfField: String, Codable, CaseIterable` |
| **Case Count** | 3 |
| **Used By** | `VisualStyle.depthOfField`, style presets, prompt generation |

| Case | Raw Value |
|------|-----------|
| `shallow` | `"Shallow (f/1.4-2.8)"` |
| `moderate` | `"Moderate (f/4-5.6)"` |
| `deep` | `"Deep (f/8-16)"` |

---

### StyleStatus

| Property | Value |
|----------|-------|
| **File** | `Models/VisualStyle.swift` |
| **Declaration** | `enum StyleStatus` |
| **Raw Type** | None (plain enum) |
| **Case Count** | 4 |
| **Used By** | `VisualStyle.status` computed property, UI status indicators |

| Case | Description |
|------|-------------|
| `none` | No reference or draft |
| `draft` | Has draft but no reference |
| `reference` | Has saved reference, no changes |
| `modified` | Has reference but unsaved changes |

---

## 3. Camera Parameter Enums

### ShotAngle

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum ShotAngle: String, Codable, CaseIterable` |
| **Case Count** | 8 |
| **Used By** | `CameraParameters.angle`, `Shot.framing`, `AssetAttributeSet.framing`, `Frame.cameraParameters` |

| Case | Raw Value | Description |
|------|-----------|-------------|
| `extremeWideShot` | `"Extreme Wide Shot"` | Shows the entire subject and surroundings - establishes location and scale |
| `wideShot` | `"Wide Shot"` | Shows the full subject with some surrounding environment |
| `mediumShot` | `"Medium Shot"` | Shows subject from waist up - balanced framing for dialogue |
| `mediumCloseup` | `"Medium Close-up"` | Shows subject from chest up - emphasizes expressions |
| `closeup` | `"Close-up"` | Shows subject's face or specific detail - intimate and focused |
| `extremeCloseup` | `"Extreme Close-up"` | Shows tiny detail - eyes, hands, or specific objects |
| `twoShot` | `"Two Shot"` | Frames two subjects together - common for conversations |
| `overTheShoulder` | `"Over-the-shoulder"` | Shows subject from behind another's shoulder - dialogue perspective |

---

### CameraPerspective

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum CameraPerspective: String, Codable, CaseIterable` |
| **Case Count** | 6 |
| **Used By** | `CameraParameters.perspective`, `Shot.cameraPerspective`, `AssetAttributeSet.cameraPerspective` |

| Case | Raw Value | Description |
|------|-----------|-------------|
| `eyeLevel` | `"Eye Level"` | Camera at subject's eye level - neutral, natural perspective |
| `highAngle` | `"High Angle"` | Camera looks down at subject - makes subject appear smaller or vulnerable |
| `lowAngle` | `"Low Angle"` | Camera looks up at subject - makes subject appear powerful or imposing |
| `birdsEye` | `"Bird's Eye View"` | Camera directly above subject - shows spatial relationships |
| `wormsEye` | `"Worm's Eye View"` | Camera at ground level looking up - dramatic upward perspective |
| `dutchAngle` | `"Dutch Angle"` | Camera tilted on its axis - creates tension or disorientation |

---

### CompositionRule

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum CompositionRule: String, Codable, CaseIterable` |
| **Case Count** | 6 |
| **Used By** | `CameraParameters.composition`, `Shot.composition`, `AssetAttributeSet.composition` |

| Case | Raw Value | Description |
|------|-----------|-------------|
| `ruleOfThirds` | `"Rule of Thirds"` | Divide frame into 9 sections - place subjects at intersections |
| `goldenRatio` | `"Golden Ratio"` | Mathematical ratio (1.618:1) for aesthetically pleasing composition |
| `centered` | `"Centered"` | Subject in exact center - symmetrical and balanced |
| `leadingLines` | `"Leading Lines"` | Use lines in frame to guide viewer's eye to subject |
| `frameWithinFrame` | `"Frame within Frame"` | Use environmental elements to frame the subject |
| `symmetry` | `"Symmetry"` | Mirror composition for visual harmony and balance |

---

### AspectRatio (Camera)

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum AspectRatio: String, Codable, CaseIterable` |
| **Case Count** | 4 |
| **Used By** | `CameraParameters.aspectRatio` (legacy camera aspect ratio, distinct from `ImageAspectRatio`) |

| Case | Raw Value | Description |
|------|-----------|-------------|
| `widescreen` | `"16:9 (Widescreen)"` | Modern widescreen format for HD video and streaming |
| `standard` | `"4:3 (Standard)"` | Classic television format, more square composition |
| `letterbox` | `"21:9 (Letterbox)"` | Ultra-wide cinematic format for dramatic panoramic shots |
| `square` | `"1:1 (Square)"` | Square format popular for social media and portraits |

---

### LensType

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum LensType: String, Codable, CaseIterable` |
| **Case Count** | 8 |
| **Used By** | `CameraParameters.lensType`, `Shot.lensType`, `AssetAttributeSet.lensType` |

| Case | Raw Value |
|------|-----------|
| `standard` | `"None"` |
| `mm35` | `"35mm"` |
| `mm50` | `"50mm"` |
| `fisheye` | `"Fisheye"` |
| `wideAngle` | `"Wide Angle"` |
| `telephoto` | `"Telephoto"` |
| `macro` | `"Macro"` |
| `anamorphic` | `"Anamorphic"` |

---

### MotionBlurEffect

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum MotionBlurEffect: String, Codable, CaseIterable` |
| **Case Count** | 6 |
| **Used By** | `CameraParameters.motionBlurEffect`, `Shot.motionBlur`, `AssetAttributeSet.motionBlur` |

| Case | Raw Value |
|------|-----------|
| `none` | `"None"` |
| `motionBlur` | `"Motion Blur"` |
| `softFocus` | `"Soft Focus"` |
| `bokeh` | `"Bokeh"` |
| `portrait` | `"Portrait"` |
| `tiltShift` | `"Tilt-Shift"` |

---

### LightingStyle

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum LightingStyle: String, Codable, CaseIterable` |
| **Case Count** | 9 |
| **Used By** | `CameraParameters.lightingStyle`, `Shot.lighting`, `AssetAttributeSet.lighting` |

| Case | Raw Value |
|------|-----------|
| `none` | `"None"` |
| `natural` | `"Natural"` |
| `dramatic` | `"Dramatic"` |
| `warm` | `"Warm"` |
| `cold` | `"Cold"` |
| `golden` | `"Golden Hour"` |
| `blue` | `"Blue Hour"` |
| `neon` | `"Neon"` |
| `cinematic` | `"Cinematic"` |

---

### CameraMovement

| Property | Value |
|----------|-------|
| **File** | `Models/CameraParameters.swift` |
| **Declaration** | `enum CameraMovement: String, Codable, CaseIterable` |
| **Case Count** | 18 |
| **Used By** | Shot video generation, shot prompt templates (`{CAMERA_MOVEMENT}`) |

| Case | Raw Value |
|------|-----------|
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

---

## 4. Character Attribute Enums

### CharacterAge

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterAge: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 6 |
| **Used By** | `AssetAttributeSet.age`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `child` | `"Child"` |
| `teen` | `"Teen"` |
| `youngAdult` | `"Young Adult"` |
| `adult` | `"Adult"` |
| `middleAged` | `"Middle-Aged"` |
| `elderly` | `"Elderly"` |

---

### CharacterBuild

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterBuild: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 8 |
| **Used By** | `AssetAttributeSet.build`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `petite` | `"Petite"` |
| `slim` | `"Slim"` |
| `average` | `"Average"` |
| `athletic` | `"Athletic"` |
| `muscular` | `"Muscular"` |
| `stocky` | `"Stocky"` |
| `heavyset` | `"Heavyset"` |
| `tall` | `"Tall"` |

---

### CharacterClothing

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterClothing: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 10 |
| **Used By** | `AssetAttributeSet.clothing`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `casual` | `"Casual"` |
| `formal` | `"Formal"` |
| `business` | `"Business"` |
| `athletic` | `"Athletic"` |
| `vintage` | `"Vintage"` |
| `fantasy` | `"Fantasy"` |
| `sciFi` | `"Sci-Fi"` |
| `military` | `"Military"` |
| `traditional` | `"Traditional"` |
| `costume` | `"Costume"` |

---

### CharacterHair

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterHair: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.hair`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `short` | `"Short"` |
| `medium` | `"Medium"` |
| `long` | `"Long"` |
| `bald` | `"Bald"` |
| `curly` | `"Curly"` |
| `straight` | `"Straight"` |
| `wavy` | `"Wavy"` |
| `braided` | `"Braided"` |
| `dreadlocks` | `"Dreadlocks"` |

---

### CharacterExpression

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterExpression: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 10 |
| **Used By** | `AssetAttributeSet.expression`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `neutral` | `"Neutral"` |
| `happy` | `"Happy"` |
| `sad` | `"Sad"` |
| `angry` | `"Angry"` |
| `surprised` | `"Surprised"` |
| `fearful` | `"Fearful"` |
| `disgusted` | `"Disgusted"` |
| `confident` | `"Confident"` |
| `serious` | `"Serious"` |
| `playful` | `"Playful"` |

---

### CharacterPosture

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum CharacterPosture: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 8 |
| **Used By** | `AssetAttributeSet.posture`, character asset creation forms |

| Case | Raw Value |
|------|-----------|
| `standing` | `"Standing"` |
| `sitting` | `"Sitting"` |
| `walking` | `"Walking"` |
| `running` | `"Running"` |
| `crouching` | `"Crouching"` |
| `leaning` | `"Leaning"` |
| `relaxed` | `"Relaxed"` |
| `tense` | `"Tense"` |

---

## 5. Object Attribute Enums

### ObjectSize

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectSize: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 5 |
| **Used By** | `AssetAttributeSet.size`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `tiny` | `"Tiny"` |
| `small` | `"Small"` |
| `medium` | `"Medium"` |
| `large` | `"Large"` |
| `huge` | `"Huge"` |

---

### ObjectMaterial

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectMaterial: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 11 |
| **Used By** | `AssetAttributeSet.material`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `wood` | `"Wood"` |
| `metal` | `"Metal"` |
| `plastic` | `"Plastic"` |
| `glass` | `"Glass"` |
| `fabric` | `"Fabric"` |
| `stone` | `"Stone"` |
| `ceramic` | `"Ceramic"` |
| `leather` | `"Leather"` |
| `paper` | `"Paper"` |
| `rubber` | `"Rubber"` |
| `mixed` | `"Mixed Materials"` |

---

### ObjectCondition

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectCondition: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 8 |
| **Used By** | `AssetAttributeSet.condition`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `pristine` | `"Pristine"` |
| `new` | `"New"` |
| `good` | `"Good"` |
| `worn` | `"Worn"` |
| `damaged` | `"Damaged"` |
| `broken` | `"Broken"` |
| `ancient` | `"Ancient"` |
| `weathered` | `"Weathered"` |

---

### ObjectStyle

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectStyle: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.style`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `modern` | `"Modern"` |
| `vintage` | `"Vintage"` |
| `antique` | `"Antique"` |
| `industrial` | `"Industrial"` |
| `rustic` | `"Rustic"` |
| `minimalist` | `"Minimalist"` |
| `ornate` | `"Ornate"` |
| `futuristic` | `"Futuristic"` |
| `traditional` | `"Traditional"` |

---

### ObjectEra

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectEra: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.era`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `prehistoric` | `"Prehistoric"` |
| `ancient` | `"Ancient"` |
| `medieval` | `"Medieval"` |
| `renaissance` | `"Renaissance"` |
| `victorian` | `"Victorian"` |
| `earlyModern` | `"Early 20th Century"` |
| `midCentury` | `"Mid-Century"` |
| `contemporary` | `"Contemporary"` |
| `future` | `"Future"` |

---

### ObjectFunction

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum ObjectFunction: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.function`, object asset creation forms |

| Case | Raw Value |
|------|-----------|
| `decorative` | `"Decorative"` |
| `functional` | `"Functional"` |
| `tool` | `"Tool"` |
| `weapon` | `"Weapon"` |
| `furniture` | `"Furniture"` |
| `vehicle` | `"Vehicle"` |
| `technology` | `"Technology"` |
| `container` | `"Container"` |
| `toy` | `"Toy"` |

---

## 6. Set Attribute Enums

### SetLocation

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetLocation: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.location`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `interior` | `"Interior"` |
| `exterior` | `"Exterior"` |
| `urban` | `"Urban"` |
| `rural` | `"Rural"` |
| `wilderness` | `"Wilderness"` |
| `underwater` | `"Underwater"` |
| `space` | `"Space"` |
| `fantasy` | `"Fantasy Realm"` |
| `abstract` | `"Abstract"` |

---

### SetTime

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetTime: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 8 |
| **Used By** | `AssetAttributeSet.time`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `dawn` | `"Dawn"` |
| `morning` | `"Morning"` |
| `midday` | `"Midday"` |
| `afternoon` | `"Afternoon"` |
| `dusk` | `"Dusk"` |
| `evening` | `"Evening"` |
| `night` | `"Night"` |
| `midnight` | `"Midnight"` |

---

### SetWeather

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetWeather: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 9 |
| **Used By** | `AssetAttributeSet.weather`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `clear` | `"Clear"` |
| `partlyCloudy` | `"Partly Cloudy"` |
| `cloudy` | `"Cloudy"` |
| `overcast` | `"Overcast"` |
| `rainy` | `"Rainy"` |
| `stormy` | `"Stormy"` |
| `snowy` | `"Snowy"` |
| `foggy` | `"Foggy"` |
| `windy` | `"Windy"` |

---

### SetScale

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetScale: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 6 |
| **Used By** | `AssetAttributeSet.scale`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `intimate` | `"Intimate"` |
| `small` | `"Small"` |
| `medium` | `"Medium"` |
| `large` | `"Large"` |
| `vast` | `"Vast"` |
| `epic` | `"Epic"` |

---

### SetArchitecture

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetArchitecture: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 10 |
| **Used By** | `AssetAttributeSet.architecture`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `modern` | `"Modern"` |
| `classical` | `"Classical"` |
| `gothic` | `"Gothic"` |
| `industrial` | `"Industrial"` |
| `brutalist` | `"Brutalist"` |
| `victorian` | `"Victorian"` |
| `artDeco` | `"Art Deco"` |
| `minimalist` | `"Minimalist"` |
| `organic` | `"Organic"` |
| `futuristic` | `"Futuristic"` |

---

### SetAtmosphere

| Property | Value |
|----------|-------|
| **File** | `Models/AssetAttributes.swift` |
| **Declaration** | `enum SetAtmosphere: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 10 |
| **Used By** | `AssetAttributeSet.atmosphere`, set asset creation forms, frame environment attributes |

| Case | Raw Value |
|------|-----------|
| `peaceful` | `"Peaceful"` |
| `tense` | `"Tense"` |
| `mysterious` | `"Mysterious"` |
| `cheerful` | `"Cheerful"` |
| `gloomy` | `"Gloomy"` |
| `dramatic` | `"Dramatic"` |
| `serene` | `"Serene"` |
| `chaotic` | `"Chaotic"` |
| `romantic` | `"Romantic"` |
| `foreboding` | `"Foreboding"` |

---

## 7. Image Aspect Ratio and Quality Level

### ImageAspectRatio

| Property | Value |
|----------|-------|
| **File** | `Models/AspectRatio.swift` |
| **Declaration** | `enum ImageAspectRatio: String, Codable, CaseIterable, Identifiable` |
| **Case Count** | 6 |
| **Used By** | `VisualStyle.aspectRatio`, `Asset.aspectRatio`, `Frame.aspectRatio`, image generation, `ImageModelCapabilities.supportedAspectRatios` |

| Case | Raw Value | Display Name | Numeric Ratio | Use Case |
|------|-----------|-------------|----------------|----------|
| `square` | `"1:1"` | Square (1:1) | 1.0 | Social media posts, profile pictures |
| `standard` | `"4:3"` | Standard (4:3) | 1.333 | Classic TV, presentations |
| `widescreen` | `"16:9"` | Widescreen (16:9) | 1.778 | Modern video, YouTube |
| `ultrawide` | `"21:9"` | Ultrawide (21:9) | 2.333 | Cinematic films, immersive scenes |
| `portrait` | `"9:16"` | Portrait (9:16) | 0.5625 | Mobile video, Instagram stories |
| `anamorphic` | `"2.39:1"` | Anamorphic (2.39:1) | 2.39 | Epic cinema, theatrical release |

#### Dimensions by QualityLevel

| Aspect Ratio | Draft (w x h) | Standard (w x h) | High (w x h) |
|-------------|---------------|-------------------|---------------|
| `square` (1:1) | 512 x 512 | 1024 x 1024 | 2048 x 2048 |
| `standard` (4:3) | 640 x 480 | 1024 x 768 | 1920 x 1440 |
| `widescreen` (16:9) | 960 x 540 | 1920 x 1080 | 3840 x 2160 |
| `ultrawide` (21:9) | 1280 x 540 | 2560 x 1080 | 5120 x 2160 |
| `portrait` (9:16) | 540 x 960 | 1080 x 1920 | 2160 x 3840 |
| `anamorphic` (2.39:1) | 1024 x 429 | 2048 x 858 | 4096 x 1716 |

---

### QualityLevel

| Property | Value |
|----------|-------|
| **File** | `Models/AspectRatio.swift` |
| **Declaration** | `enum QualityLevel` (nested inside `ImageAspectRatio`) |
| **Raw Type** | None (plain enum) |
| **Case Count** | 3 |
| **Used By** | `ImageAspectRatio.dimensions(quality:)` method |

| Case | Description |
|------|-------------|
| `draft` | Lower resolution for quick previews |
| `standard` | Standard production quality |
| `high` | High resolution for final output |

---

## 8. Provider and Capability Enums

### ProviderType

| Property | Value |
|----------|-------|
| **File** | `Models/AIProvider.swift` |
| **Declaration** | `enum ProviderType: String, Codable, CaseIterable` |
| **Case Count** | 1 |
| **Used By** | `AIProvider.type`, provider configuration |

| Case | Raw Value |
|------|-----------|
| `google` | `"Google"` |

Default capabilities: `[.imageGeneration, .videoGeneration]`

Default models: `["gemini-2.5-flash-image", "gemini-3-pro-image-preview", "veo-3.1-generate-preview", "veo-3.1-fast-generate-preview", "veo-3.0-generate-001", "veo-3.0-fast-generate-001"]`

---

### ProviderCapability

| Property | Value |
|----------|-------|
| **File** | `Models/AIProvider.swift` |
| **Declaration** | `enum ProviderCapability: String, Codable, CaseIterable` |
| **Case Count** | 4 |
| **Used By** | `AIProvider.capabilities`, `AIProvider.defaultForCapabilities`, model filtering |

| Case | Raw Value |
|------|-----------|
| `imageGeneration` | `"Image Generation"` |
| `imageToImage` | `"Image-to-Image"` |
| `videoGeneration` | `"Video Generation"` |
| `multiView` | `"Multi-View Generation"` |

---

## 9. Status Enums

### AssetStatus

| Property | Value |
|----------|-------|
| **File** | `Models/Asset.swift` |
| **Declaration** | `enum AssetStatus` |
| **Raw Type** | None (plain enum) |
| **Case Count** | 4 |
| **Used By** | `Asset.status` computed property, UI status badge indicators |

| Case | Description |
|------|-------------|
| `none` | No reference or draft |
| `draft` | Has draft but no reference |
| `reference` | Has saved reference, no changes |
| `modified` | Has reference but unsaved changes |

---

### StyleStatus

(See [Section 2 - StyleStatus](#stylestatus) above for full listing.)

---

## 10. Validation and Error Enums

### ValidationError.Severity

| Property | Value |
|----------|-------|
| **File** | `Models/ValidationError.swift` |
| **Declaration** | `enum Severity` (nested inside `ValidationError`) |
| **Raw Type** | None (plain enum) |
| **Case Count** | 3 |
| **Used By** | `ValidationError.severity`, validation UI display, generation gating |

| Case | Description |
|------|-------------|
| `error` | Prevents generation |
| `warning` | Generation may fail or produce unexpected results |
| `info` | Informational message |

---

### AspectRatioFormat (ImageModelCapabilities)

| Property | Value |
|----------|-------|
| **File** | `Models/ImageModelCapabilities.swift` |
| **Declaration** | `enum AspectRatioFormat` (nested inside `ImageModelCapabilities`) |
| **Raw Type** | None (plain enum with associated values) |
| **Case Count** | 4 |
| **Used By** | `ImageModelCapabilities.aspectRatioFormat`, provider API formatting |

| Case | Associated Value | Description |
|------|-----------------|-------------|
| `ratio(String)` | API field name | Aspect ratio as string ratio (e.g., "1:1", "16:9") |
| `dimensions(String)` | API field name | Aspect ratio as pixel dimensions (e.g., "512x512") |
| `promptBased` | None | Aspect ratio injected into prompt text |
| `none` | None | Provider does not support aspect ratio specification |

---

## 11. Image Selection Enums

### ImageSelectionItem

| Property | Value |
|----------|-------|
| **File** | `Models/ImageSelectionItem.swift` |
| **Declaration** | `enum ImageSelectionItem: Identifiable, Equatable, Hashable` |
| **Raw Type** | None (enum with associated values) |
| **Case Count** | 3 |
| **Used By** | Video generation image selection, frame composition image picker |

| Case | Associated Value | Description |
|------|-----------------|-------------|
| `asset(Asset)` | An `Asset` instance | Selects an asset as a reference image |
| `frame(Frame)` | A `Frame` instance | Selects a frame as a reference image |
| `imported(ImportedImage)` | An `ImportedImage` instance | Selects an imported image file |

---

### ImageSelectionItem.SourceType

| Property | Value |
|----------|-------|
| **File** | `Models/ImageSelectionItem.swift` |
| **Declaration** | `enum SourceType: Equatable, Hashable` (nested inside `ImageSelectionItem`) |
| **Raw Type** | None (enum with associated values) |
| **Case Count** | 3 |
| **Used By** | `ImageSelectionItem.sourceType`, display name resolution |

| Case | Associated Value | Display Name |
|------|-----------------|--------------|
| `asset(AssetType)` | The asset's type | Capitalized asset type (e.g., "Character") |
| `frame` | None | `"Frame"` |
| `imported` | None | `"Imported"` |

---

## 12. Window Context Enums

### MediaPreviewContext.MediaType

| Property | Value |
|----------|-------|
| **File** | `Models/WindowContexts.swift` |
| **Declaration** | `enum MediaType: String, Codable` (nested inside `MediaPreviewContext`) |
| **Case Count** | 2 |
| **Used By** | `MediaPreviewContext.mediaType`, media preview window routing |

| Case | Raw Value |
|------|-----------|
| `image` | `"image"` |
| `video` | `"video"` |

---

## 13. Model Capability Enums

### AspectRatioFormat (ImageModelCapabilities)

(See [Section 10 - AspectRatioFormat](#aspectratioformat-imagemodelcapabilities) above for full listing.)

---

## 14. Style Parameter Preset Options

These are not enums but static `String` arrays defined in `Models/StyleParameterOptions.swift`. They power the dropdown menus in Standard (preset) mode for the style definition UI. Each array begins with an empty string `""` as the default/unselected option.

**File**: `Models/StyleParameterOptions.swift`
**Struct**: `StyleParameterOptions`

### lightingOptions (18 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Natural daylight"` |
| 2 | `"Golden hour (sunrise/sunset)"` |
| 3 | `"Blue hour (twilight)"` |
| 4 | `"Overcast soft light"` |
| 5 | `"Harsh direct sunlight"` |
| 6 | `"Dramatic shadows"` |
| 7 | `"Studio three-point lighting"` |
| 8 | `"Rembrandt lighting"` |
| 9 | `"High-key bright lighting"` |
| 10 | `"Low-key dark lighting"` |
| 11 | `"Neon lighting"` |
| 12 | `"Candlelight / firelight"` |
| 13 | `"Moonlight"` |
| 14 | `"Volumetric light rays"` |
| 15 | `"Backlit / rim lighting"` |
| 16 | `"Bright anime-style cel shading"` |
| 17 | `"Cinematic dramatic lighting"` |
| 18 | `"Flat even lighting"` |

### colorPaletteOptions (15 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Vibrant saturated colors"` |
| 2 | `"Muted pastels"` |
| 3 | `"Monochromatic (single color variations)"` |
| 4 | `"Desaturated / washed out"` |
| 5 | `"High contrast"` |
| 6 | `"Warm tones (reds, oranges, yellows)"` |
| 7 | `"Cool tones (blues, greens, purples)"` |
| 8 | `"Earth tones (browns, greens)"` |
| 9 | `"Neon colors"` |
| 10 | `"Black and white"` |
| 11 | `"Sepia toned"` |
| 12 | `"Complementary colors"` |
| 13 | `"Analogous colors"` |
| 14 | `"Rich deep shadows"` |
| 15 | `"Bright vivid primary colors"` |

### aestheticOptions (26 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Cinematic blockbuster"` |
| 2 | `"Japanese anime"` |
| 3 | `"Film noir"` |
| 4 | `"Cyberpunk dystopian"` |
| 5 | `"Steampunk Victorian"` |
| 6 | `"Art Deco"` |
| 7 | `"Renaissance classical"` |
| 8 | `"Baroque ornate"` |
| 9 | `"Minimalist modern"` |
| 10 | `"Brutalist architecture"` |
| 11 | `"Gothic dark"` |
| 12 | `"Retro 80s"` |
| 13 | `"Vintage 1920s-40s"` |
| 14 | `"Mid-century modern"` |
| 15 | `"Futuristic sci-fi"` |
| 16 | `"Fantasy medieval"` |
| 17 | `"Western frontier"` |
| 18 | `"Horror unsettling"` |
| 19 | `"Romantic dreamy"` |
| 20 | `"Documentary realism"` |
| 21 | `"Stop motion clay animation"` |
| 22 | `"Vector graphics geometric"` |
| 23 | `"Puppet stop motion"` |
| 24 | `"Watercolor painting"` |
| 25 | `"Retro pixel graphics"` |
| 26 | `"Comic book graphic novel"` |

### atmosphereOptions (16 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Clear and bright"` |
| 2 | `"Energetic"` |
| 3 | `"Calm and peaceful"` |
| 4 | `"Tense and suspenseful"` |
| 5 | `"Mysterious"` |
| 6 | `"Melancholic"` |
| 7 | `"Joyful and uplifting"` |
| 8 | `"Oppressive and heavy"` |
| 9 | `"Ethereal and dreamlike"` |
| 10 | `"Gritty and raw"` |
| 11 | `"Foggy and misty"` |
| 12 | `"Rainy urban decay"` |
| 13 | `"Playful and whimsical"` |
| 14 | `"Clean and modern"` |
| 15 | `"Nostalgic retro"` |
| 16 | `"Epic and grand"` |

### moodOptions (12 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Neutral"` |
| 2 | `"Dynamic"` |
| 3 | `"Serene"` |
| 4 | `"Dark and gritty"` |
| 5 | `"Whimsical"` |
| 6 | `"Heroic and adventurous"` |
| 7 | `"Intimate and personal"` |
| 8 | `"Epic and grand"` |
| 9 | `"Playful"` |
| 10 | `"Contemplative"` |
| 11 | `"Ominous"` |
| 12 | `"Hopeful"` |

### motionOptions (15 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Static composition"` |
| 2 | `"Smooth steady movement"` |
| 3 | `"Slow motion"` |
| 4 | `"Exaggerated action"` |
| 5 | `"Rapid cuts and movement"` |
| 6 | `"Sweeping camera movements"` |
| 7 | `"Handheld / cinema verite"` |
| 8 | `"Locked-off camera"` |
| 9 | `"Glitchy effects"` |
| 10 | `"Freeze frames"` |
| 11 | `"Stop motion frame-by-frame"` |
| 12 | `"Geometric transitions"` |
| 13 | `"Pixel animation"` |
| 14 | `"Dynamic action poses"` |
| 15 | `"Fluid organic motion"` |

### textureOptions (17 values including empty default)

| Index | Value |
|-------|-------|
| 0 | `""` (empty default) |
| 1 | `"Smooth"` |
| 2 | `"Clean cel-shaded"` |
| 3 | `"Clean hyper-detailed"` |
| 4 | `"Grainy / organic"` |
| 5 | `"Rough"` |
| 6 | `"Soft and diffused"` |
| 7 | `"Sharp and crisp"` |
| 8 | `"Ultra-sharp with fine detail"` |
| 9 | `"Painterly brushstrokes"` |
| 10 | `"Pixelated"` |
| 11 | `"Wet and reflective surfaces"` |
| 12 | `"Matte finish"` |
| 13 | `"Clay plasticine handmade"` |
| 14 | `"Handmade miniature materials"` |
| 15 | `"Halftone dots ink lines"` |
| 16 | `"Watercolor paper"` |
| 17 | `"Limited palette colors"` |

---

## 15. Built-In Style Presets (15 Presets)

Defined in `ViewModels/StyleDefinitionViewModel.swift` inside the `applyPreset(_:)` method. Each preset populates both preset (dropdown) and manual (free-text) values for all style parameters. These serve as one-click starting points ("Quick Styles") in the style definition UI.

---

### Preset 1: "70mm Epic"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.film70mm` ("70mm Film") |
| **Film Format** | `.imax` ("IMAX") |
| **Film Grain** | `.subtle` ("Subtle") |
| **Depth of Field** | `.moderate` ("Moderate (f/4-5.6)") |
| **Detail Level** | 95 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Cinematic dramatic lighting"` |
| Color Palette | `"Vibrant saturated colors"` |
| Aesthetic | `"Cinematic blockbuster"` |
| Atmosphere | `"Epic and grand"` |
| Mood | `"Heroic and adventurous"` |
| Motion | `"Sweeping camera movements"` |
| Texture | `"Ultra-sharp with fine detail"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Dramatic three-point setup, 45-degree key with strong directional shadows. High contrast, balanced fill preserving detail. Backlight for separation and heroic rim lighting."` |
| Color Palette | `"Rich saturated primaries with warm undertones. Cool blues and purples in shadows, warm golds in highlights. Crushed blacks and bloomed highlights for large-format aesthetic."` |
| Aesthetic | `"Sweeping 70mm IMAX blockbuster with massive scope. Every frame composed like a painting with perfect symmetry. Practical effects prioritized over digital."` |
| Atmosphere | `"Grand epic scale evoking awe. Vast landscapes and monumental architecture dwarfing subjects. Rolling storm clouds, divine light shafts, swirling dust and mist."` |
| Mood | `"Heroic and adventurous, inspiring courage. Triumphant tone with sacrifice and nobility undertones. Quiet introspection before explosive action."` |
| Motion | `"Sweeping Technocrane and Steadicam movements. Slow deliberate push-ins building tension. Orbital reveals of scope. Crane-ups from intimate to epic. Locked-off for gravitas."` |
| Texture | `"Ultra-sharp 70mm clarity with fine detail across frame. Extremely fine organic grain, barely perceptible. Tack-sharp foreground and background. Subtle halation on bright sources."` |

---

### Preset 2: "Anime"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.animation2D` ("2D Hand-drawn") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 80 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Bright anime-style cel shading"` |
| Color Palette | `"Vibrant saturated colors"` |
| Aesthetic | `"Japanese anime"` |
| Atmosphere | `"Energetic"` |
| Mood | `"Dynamic"` |
| Motion | `"Exaggerated action"` |
| Texture | `"Clean cel-shaded"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Bright high-contrast cel shading with distinct light/shadow planes. Hard edge transitions, minimal gradation. Strong rim lighting on character edges. Pure white specular highlights on eyes and hair."` |
| Color Palette | `"Vibrant saturated primaries, pure even in shadows. Complementary colors for impact. Limited 3-5 color palettes per character. Desaturated backgrounds push focus to characters."` |
| Aesthetic | `"Japanese anime with clean varying-weight linework. Large expressive eyes. Dynamic still frames, speed lines, impact frames. Detailed keyframes with simplified in-betweens."` |
| Atmosphere | `"Energetic vibrant atmosphere with youthful enthusiasm. Dynamic compositions, dutch angles, dramatic perspective. Stylized graphic environments. Weather reflects emotions symbolically."` |
| Mood | `"Dynamic emotionally expressive mood. Exaggerated expressions and body language. Rapid shifts from comedy to drama. Sakuga techniques for powerful action impact."` |
| Motion | `"Exaggerated theatrical movement with anticipation poses. Smear frames and speed lines. Impact frames freeze at contact. Handheld-style pans and zooms. Bouncy follow-through animation."` |
| Texture | `"Clean crisp cel-shaded with flat fills and sharp lineart. No grain - pure digital clarity. Screentones for effects. Pure white highlights, saturated shadow tones. Glow and bloom effects."` |

---

### Preset 3: "Cyberpunk"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.photorealistic` ("Photorealistic") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 90 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Neon lighting"` |
| Color Palette | `"Neon colors"` |
| Aesthetic | `"Cyberpunk dystopian"` |
| Atmosphere | `"Rainy urban decay"` |
| Mood | `"Dark and gritty"` |
| Motion | `"Glitchy effects"` |
| Texture | `"Wet and reflective surfaces"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Harsh neon with cyan/magenta LED color contamination. Volumetric fog scatter creating light shafts. Flickering fluorescents. Backlit steam and smoke. Crushed blacks in unlit areas."` |
| Color Palette | `"Electric cyan, hot magenta, toxic green, midnight blue. Sodium yellows versus LED blues. Saturation pushed uncomfortable. Desaturated sickly skin tones. Chromatic aberration artifacts."` |
| Aesthetic | `"Dystopian cyberpunk with dense neon signage and holograms. High-tech corporate towers above grimy streets. Asian typography influences. Visible wiring and technological augmentation."` |
| Atmosphere | `"Oppressive constant rain, fog, urban decay. Perpetual night. Steam from grates, wet surfaces. Claustrophobic density. Omnipresent surveillance. Corporate stratification above desperate streets."` |
| Mood | `"Dark gritty dystopian hopelessness with rebellious defiance. Noir moral ambiguity. Systemic corruption. Paranoid surveillance undertones. Transhumanist transcendence moments."` |
| Motion | `"Kinetic camera with glitchy artifacts. Rapid surveillance-style cuts. Handheld documentary feel. Smooth drone tracking. Time remapping. Scan lines, signal interference. Slow-motion action beats."` |
| Texture | `"Wet reflective surfaces - rain-slicked streets, metal, glass. Neon mirror reflections. Grime and weathering everywhere. Digital noise artifacts. Lens flares and chromatic aberration."` |

---

### Preset 4: "Documentary"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.film16mm` ("16mm Film") |
| **Film Format** | `.standard` ("Standard") |
| **Film Grain** | `.moderate` ("Moderate") |
| **Depth of Field** | `.deep` ("Deep (f/8-16)") |
| **Detail Level** | 70 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Natural daylight"` |
| Color Palette | `"Desaturated / washed out"` |
| Aesthetic | `"Documentary realism"` |
| Atmosphere | `"Gritty and raw"` |
| Mood | `"Contemplative"` |
| Motion | `"Handheld / cinema verite"` |
| Texture | `"Grainy / organic"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Natural available light only from practical sources - windows, fluorescents, streetlights. Ambient exposure even if suboptimal. Underexposed shadows, blown highlights acceptable. Backlit silhouettes."` |
| Color Palette | `"Muted realistic tones without stylized grading. Slight desaturation with fluorescent/tungsten color casts. Uncorrected mixed temperatures. Earth tones, realistic skin without enhancement."` |
| Aesthetic | `"Cinema verite documentary realism prioritizing truth over beauty. Raw unpolished observational approach. Real locations and situations. Imperfect framing acceptable for genuine moments."` |
| Atmosphere | `"Authentic real environments without set dressing. Spaces as they exist. Background activity suggesting life beyond frame. Environmental context showing socioeconomic reality."` |
| Mood | `"Observational non-judgmental mood. Empathetic but not sentimental. Intimate psychological closeness. Sometimes uncomfortable confronting difficult realities. Humanistic dignity."` |
| Motion | `"Handheld with natural shake and breathing. Reactive following rather than choreographed. Jerky corrections, momentary defocus. Visible zoom adjustments. Shoulder-mounted instability."` |
| Texture | `"Organic 16mm grain visible in shadows and midtones. Slight softness, lower contrast. Natural halation on highlights. Gate weave. Dust and scratches as authenticity marks."` |

---

### Preset 5: "Claymation"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.stopMotion` ("Stop Motion") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `.moderate` ("Moderate (f/4-5.6)") |
| **Detail Level** | 75 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Soft and diffused"` |
| Color Palette | `"Vibrant saturated colors"` |
| Aesthetic | `"Stop motion clay animation"` |
| Atmosphere | `"Playful and whimsical"` |
| Mood | `"Whimsical"` |
| Motion | `"Stop motion frame-by-frame"` |
| Texture | `"Clay plasticine handmade"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Soft even studio lighting with diffused sources minimizing shadows. Miniature practicals in sets. Subtle rim for separation. Consistent across frames. Cool temperature."` |
| Color Palette | `"Vibrant saturated pigmented plasticine colors. Bold primaries with playful combinations. Distinctive character color schemes. Complementary background colors. Hand-mixed marbling variations."` |
| Aesthetic | `"Handcrafted clay animation with visible fingerprints and tool marks. Expressive exaggerated character designs. Meticulous miniature sets. Everything physically constructed - no digital characters."` |
| Atmosphere | `"Playful tactile handmade charm. Whimsical miniature worlds. Cozy contained character-scale spaces. Practical miniature effects. Environmental storytelling through tiny details."` |
| Mood | `"Whimsical lighthearted with gentle humor and heart. Plasticine malleability for expression. Squash and stretch comedy. Earnest sincerity. Cozy domestic scenarios and small adventures."` |
| Motion | `"Jerky stop-motion at 24fps on ones or twos. Visible strobing. Exaggerated anticipation and follow-through. Characters wobble, sets breathe. Miniature dolly and crane moves."` |
| Texture | `"Rich clay texture with matte surface showing fingerprints and tool marks. Organic deformation under pressure. Hand-mixed color striations. Sculpted hair strands. Miniature set textures."` |

---

### Preset 6: "Film Noir"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.film35mm` ("35mm Film") |
| **Film Format** | `.standard` ("Standard") |
| **Film Grain** | `.moderate` ("Moderate") |
| **Depth of Field** | `.shallow` ("Shallow (f/1.4-2.8)") |
| **Detail Level** | 85 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Low-key dark lighting"` |
| Color Palette | `"Black and white"` |
| Aesthetic | `"Film noir"` |
| Atmosphere | `"Mysterious"` |
| Mood | `"Dark and gritty"` |
| Motion | `"Locked-off camera"` |
| Texture | `"Grainy / organic"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Dramatic chiaroscuro with deep blacks and hot highlights. Hard single sources casting venetian blind shadows. Shadowy areas hide faces for mystery. Rim lighting separation. Low-key dominant."` |
| Color Palette | `"High-contrast black and white. Crushed blacks, near-clipping highlights. Pure black shadows, near-white highlights. Silver nitrate aesthetic with rich midtone gradation. Strictly monochromatic."` |
| Aesthetic | `"1940s-50s noir with Expressionist shadows. Low angles showing ceilings. Wet streets reflecting lights. Urban nightscape - alleys, diners, cheap hotels. Venetian blind shadows."` |
| Atmosphere | `"Dark mysterious urban corruption. Rain-slicked streets, neon, cigarette smoke. Late night. Seedy bars, frosted offices. Interrogation rooms. Docks. Fog-obscured backgrounds."` |
| Mood | `"Cynical brooding moral ambiguity and existential dread. Hardboiled worldview. Fatalistic corruption. Sexual tension, dangerous desire. Paranoid psychology. Doomed romance, tragic endings."` |
| Motion | `"Deliberate purposeful composition. Dutch angles for unease. Low angles suggesting menace. Slow push-ins building tension. Lateral tracking. Crane reveals. Locked-off dramatic scenes."` |
| Texture | `"Visible 35mm grain in shadows. Sharp face focus with soft bokeh backgrounds. High midtone definition. Hard shadow edges. Slight halation on brights. Classic silver halide response."` |

---

### Preset 7: "Horror"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.film35mm` ("35mm Film") |
| **Film Format** | `.standard` ("Standard") |
| **Film Grain** | `.moderate` ("Moderate") |
| **Depth of Field** | `.shallow` ("Shallow (f/1.4-2.8)") |
| **Detail Level** | 85 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Low-key dark lighting"` |
| Color Palette | `"Desaturated / washed out"` |
| Aesthetic | `"Horror unsettling"` |
| Atmosphere | `"Mysterious"` |
| Mood | `"Ominous"` |
| Motion | `"Slow motion"` |
| Texture | `"Grainy / organic"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Deeply underexposed with impenetrable darkness. Limited practicals - candles, flashlights, moonlight. Extreme low-key, shadow-dominated. Sinister backlit silhouettes. Harsh sidelight."` |
| Color Palette | `"Heavily desaturated draining life. Strategic visceral red accents. Sickly decay greens. Cold blue moonlight. Jaundiced sodium skin. Near-monochrome with selective saturation. Teal-black shadows."` |
| Aesthetic | `"Atmospheric horror with slow-burn psychological dread. Meticulous unsettling symmetry. Practical effects over CGI. Found-footage or elevated arthouse approach. Sustained unease and ambiguity."` |
| Atmosphere | `"Eerie supernatural dread and psychological unraveling. Isolated remote houses, empty forests, abandoned institutions. Wrong-feeling time. Uncanny quiet with disturbing sounds. Being watched."` |
| Mood | `"Creeping dread building to terror. Paranoid anxiety. Loss of control and sanity. Ancient evil or human monstrosity. Safe spaces violated. Helplessness. Nihilistic endings."` |
| Motion | `"Slow deliberate movements building dread. Long static holds on empty spaces. Sudden violent shock cuts. Handheld panic sequences. Slow push-ins on terrified faces. Dark corridor POV."` |
| Texture | `"Dark gritty prominent grain in shadows. Heavy contrast crushing detail. Practical blood and decay texture. Rough surfaces, peeling wallpaper, mold. Pushed film stock. Shallow depth isolation."` |

---

### Preset 8: "Fantasy"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.photorealistic` ("Photorealistic") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `.moderate` ("Moderate (f/4-5.6)") |
| **Detail Level** | 95 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Cinematic dramatic lighting"` |
| Color Palette | `"Vibrant saturated colors"` |
| Aesthetic | `"Fantasy medieval"` |
| Atmosphere | `"Ethereal and dreamlike"` |
| Mood | `"Epic and grand"` |
| Motion | `"Sweeping camera movements"` |
| Texture | `"Ultra-sharp with fine detail"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Magical otherworldly glow with mystical luminescence. Glowing crystals, enchanted artifacts, divine beams. Enhanced golden hour. Volumetric god rays. Purple/blue/gold rim lighting."` |
| Color Palette | `"Hyper-saturated jewel tones with metallic accents. Purple/magenta magic, emerald nature, golden divine. Sunset oranges. Natural skin against fantastical. Misty blue depth."` |
| Aesthetic | `"Epic high fantasy with meticulous world-building. Medieval European mixed with fantastical. Matte paintings enhance sets. Realistic-imaginative creatures. Culturally-rich costumes."` |
| Atmosphere | `"Awe-inspiring magical wonder. Ancient ruins. Misty towering forests. Castle spires against dramatic skies. Visible magic - glowing runes, particles. Supernatural weather."` |
| Mood | `"Epic enchanting heroism and quest. Noble characters facing mythic challenges. Impossible romance. Sacrificial tragedy. Hope against darkness. Childlike wonder. Destiny-driven action."` |
| Motion | `"Sweeping epic scale and spectacle. Crane shots revealing magical landscapes. Aerial armies and castles. Triumphant hero orbits. Slow-motion spell casting. Steadicam through elaborate environments."` |
| Texture | `"Ultra-sharp digital clarity with fine costume, armor, environment detail. Aged leather, weathered metal, embroidered fabric. Ethereal translucent magic particles."` |

---

### Preset 9: "Sci-Fi"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.photorealistic` ("Photorealistic") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `.shallow` ("Shallow (f/1.4-2.8)") |
| **Detail Level** | 95 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Neon lighting"` |
| Color Palette | `"Cool tones (blues, greens, purples)"` |
| Aesthetic | `"Futuristic sci-fi"` |
| Atmosphere | `"Clear and bright"` |
| Mood | `"Neutral"` |
| Motion | `"Smooth steady movement"` |
| Texture | `"Sharp and crisp"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Cold artificial tech - LED panels, holograms, bioluminescence. Clinical overhead in sterile spaces. Blue operational, red alert accents. Single-source spaceship shadows. Volumetric light."` |
| Color Palette | `"Cool cyan, teal, ice blue with amber/orange human accents. Desaturated base with punchy interface colors. Organic-synthetic separation. White environments. Digital precision."` |
| Aesthetic | `"Sleek futuristic with clean geometric precision. Believable near-future technology extrapolation. Minimalist sophistication avoiding clutter. Real sets with seamless CG. Functional technology design."` |
| Atmosphere | `"Sterile controlled advanced civilization. Climate-controlled recycled air. Machinery hum. Antiseptic cleanliness. Vast minimal spaces. Alien vistas or deep space. Technological isolation."` |
| Mood | `"Intellectually cold yet wonder-filled. Philosophical consciousness and identity questions. Cosmic awe. Space travel isolation. Balanced hope and fear. Cerebral detachment meets childlike wonder."` |
| Motion | `"Precision robotic camera movements. Perfectly smooth tracking. Symmetrical geometric compositions. Slow deliberate cerebral tension. Zero-gravity floating camera. Gimbal impossible perspectives."` |
| Texture | `"Pristine metallic synthetic surfaces with mirror reflections. Brushed aluminum, polished plastic, transparent displays. No organic weathering. Specular materials. Shallow depth. Digital sharpness."` |

---

### Preset 10: "Western"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.film35mm` ("35mm Film") |
| **Film Format** | `.anamorphic` ("Anamorphic") |
| **Film Grain** | `.subtle` ("Subtle") |
| **Depth of Field** | `.deep` ("Deep (f/8-16)") |
| **Detail Level** | 85 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Golden hour (sunrise/sunset)"` |
| Color Palette | `"Earth tones (browns, greens)"` |
| Aesthetic | `"Western frontier"` |
| Atmosphere | `"Gritty and raw"` |
| Mood | `"Heroic and adventurous"` |
| Motion | `"Sweeping camera movements"` |
| Texture | `"Grainy / organic"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Golden hour warm sunset/sunrise with long landscape shadows. Hard noon sun stark contrast. Dusty haze diffusing light. Oil lamp interiors. Campfire firelight. Desert sky silhouettes."` |
| Color Palette | `"Warm earth tones - dusty browns, leather tans, faded denim, rusty reds, golden wheat. Desaturated age and harshness. Sepia undertones. Deep orange sunsets. Bleached sun highlights."` |
| Aesthetic | `"Classic Hollywood Western with Monument Valley vistas. One-street frontier towns, wooden boardwalks. Weathered Stetsons, bandanas, dusty boots. Widescreen anamorphic horizontal compositions."` |
| Atmosphere | `"Harsh unforgiving frontier under relentless sun and endless skies. Vast landscapes of freedom and danger. Dust devils, tumbleweeds. Isolated settlements. Smoky saloons. Desert silence, wind, eagles."` |
| Mood | `"Rugged individualist frontier spirit. Laconic decisive heroes. Personal justice. Frontier romance and brutal reality. Stoic hardship acceptance. Melancholy for passing era."` |
| Motion | `"Wide establishing shots with tiny figures against nature. Slow standoff push-ins. Rapid action whip pans. Galloping horse dollies. Static weather-beaten faces. Crane wilderness reveals."` |
| Texture | `"Subtle 35mm grain for period authenticity. Weathered wood, leather, worn denim, dusty boots. Sand, tumbleweeds, rough stone. Anamorphic sun flares. Dust particles in light shafts."` |

---

### Preset 11: "Vector Animation"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.animation2D` ("2D Hand-drawn") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 50 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Flat even lighting"` |
| Color Palette | `"Bright vivid primary colors"` |
| Aesthetic | `"Vector graphics geometric"` |
| Atmosphere | `"Clean and modern"` |
| Mood | `"Neutral"` |
| Motion | `"Geometric transitions"` |
| Texture | `"Clean cel-shaded"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Completely flat ambient lighting with no shadows or highlights. Even illumination across all surfaces. No visible sources - conceptual not realistic. Occasional single-color mood tints."` |
| Color Palette | `"Limited curated 3-5 color palette plus black and white. Bold flat 100% saturation. Complementary colors for contrast. Purposeful color choices. Swiss/Bauhaus principles. No gradients."` |
| Aesthetic | `"Pure vector graphics with geometric abstraction. Mathematical curves and straight lines. Swiss/Bauhaus design principles. Essential geometric forms only. No photographic or organic elements."` |
| Atmosphere | `"Clean organized modern tech atmosphere. Minimalist sophisticated efficiency. Digital-native never mimicking physical. Abstract spatial relationships. Purposeful negative space as design element."` |
| Mood | `"Professional minimalist for corporate and educational content. Friendly not childish. Modern forward-thinking. Visually clear and accessible. Confident simplicity. Optimistic without chaos."` |
| Motion | `"Smooth mathematically perfect geometric transitions. Tweened morphing shapes. Perfect axis rotations. Ease-in ease-out timing curves. No motion blur or physics. Choreographed simultaneous movements."` |
| Texture | `"Absolutely no texture - pure flat fills. Perfectly smooth mathematically clean edges. Anti-aliased digital smoothness. No grain, noise, or variation. Matte finish. Flat transparency percentages."` |

---

### Preset 12: "Stop Motion"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.stopMotion` ("Stop Motion") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `.moderate` ("Moderate (f/4-5.6)") |
| **Detail Level** | 80 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Studio three-point lighting"` |
| Color Palette | `"Muted pastels"` |
| Aesthetic | `"Puppet stop motion"` |
| Atmosphere | `"Playful and whimsical"` |
| Mood | `"Whimsical"` |
| Motion | `"Stop motion frame-by-frame"` |
| Texture | `"Handmade miniature materials"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Controlled studio lighting for miniature scale. Soft diffused sources preventing harsh shadows. LED practicals in sets. Consistent lighting across days. Fiber optics for tiny details."` |
| Color Palette | `"Muted realistic miniature material colors - painted foam, carved wood, knitted fabric, molded resin. Slightly desaturated practicals. Distinctive character palettes. Subtle lighting gels for mood."` |
| Aesthetic | `"Puppet stop-motion with sophisticated armatures. Incredible miniature set detail using hard and soft materials. Replacement face animation. CG enhancement celebrating handmade quality."` |
| Atmosphere | `"Tangible handcrafted with everything physically real at exact scale. Complete environmental detail. Practical miniature effects. Dedicated craft and patience. Frame-by-frame magic."` |
| Mood | `"Nostalgic charming childhood wonder. Whimsical scenarios grounded in puppet physicality. Emotional resonance despite non-human characters. Dark fairy tale sensibility. Earnest handmade celebration."` |
| Motion | `"Frame-by-frame on ones or twos creating characteristic strobing. Subtle hand-adjustment vibration. Malleable squash and stretch. Multiple exposure blur. Motion control camera rigs."` |
| Texture | `"Rich practical material texture - knit stitches, carved wood, brush strokes, silicone pores. Scaled miniature brick, stone, grass. Puppet seams visible. Handmade imperfections."` |

---

### Preset 13: "Watercolor Dream"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.watercolor` ("Watercolor") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 60 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Soft and diffused"` |
| Color Palette | `"Muted pastels"` |
| Aesthetic | `"Watercolor painting"` |
| Atmosphere | `"Ethereal and dreamlike"` |
| Mood | `"Serene"` |
| Motion | `"Fluid organic motion"` |
| Texture | `"Watercolor paper"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Soft luminous diffused daylight through morning mist or evening glow. No harsh shadows - gentle ambient bathing. Light emanates from within. Transparency suggests light rather than direct sources."` |
| Color Palette | `"Delicate pastel washes bleeding together. Optical color mixing at wet edges. Soft pinks, sky blues, lavender, mint, buttery yellow. Diluted desaturated pigments. Paper white as highlights."` |
| Aesthetic | `"Traditional watercolor with blooms, bleeds, granulation, pooling. Loose gestural marks suggesting forms. Visible brush strokes and water movement. Paper texture through transparent washes."` |
| Atmosphere | `"Ethereal dreamlike gentle memories. Soft-focus details dissolving to suggestion. Misty mornings, quiet afternoons, twilight. Transience and impermanence. Nostalgic contemplative stillness."` |
| Mood | `"Serene peaceful meditation and reflection. Gentle emotion without dramatic intensity. Melancholy fleeting beauty. Simple scenes elevated artistically. Calming introspective. Wabi-sabi impermanence."` |
| Motion | `"Fluid organic watercolor washing motion. Dissolving bleeding transitions. Gentle drifts rather than cuts. Subjects emerge from or dissolve into color washes. Liquid flowing quality. Slowed time."` |
| Texture | `"Visible watercolor paper - cold or hot press surface. Pigment granulation in valleys. Backruns and blooms. Hard and soft edges. Salt texture. Authentic watercolor qualities."` |

---

### Preset 14: "Pixel Art"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.pixelArt` ("Pixel Art") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 30 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Flat even lighting"` |
| Color Palette | `"Limited palette colors"` |
| Aesthetic | `"Retro pixel graphics"` |
| Atmosphere | `"Nostalgic retro"` |
| Mood | `"Playful"` |
| Motion | `"Pixel animation"` |
| Texture | `"Pixelated"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"Simplified palette-based lighting - shadows through darker hue shifts. Single pixel specular highlights. Directional via lighter pixels. Dithering for gradation illusion. Flat cel-shading."` |
| Color Palette | `"Strictly limited 8-bit (256) or 16-bit palette. Deliberate fixed-set color choices. Palette ramping with reserved shading hues. Dithering for in-between hues. Authentic retro restrictions."` |
| Aesthetic | `"Authentic retro pixel art honoring 8/16-bit limitations. Pixel-by-pixel sprites and tiles. Isometric or side-scrolling perspective. Intentional pixel placement following arcade traditions."` |
| Atmosphere | `"Nostalgic golden age arcade and console gaming. CRT scanline warmth implied. Chiptune energy. Evocative pixel environments - castles, caves, space stations. Lo-fi charm."` |
| Mood | `"Playful retro celebrating gaming's past. Joyful nostalgia without pastiche. Creative limitations as strength. Indie underdog aesthetic. Earnest classic game heroism. Timeless simplicity."` |
| Motion | `"Frame-by-frame sprite animation with limited choppy charm. 4-8 frame walk cycles. Minimal clear attack animations. Discrete tile scrolling. Parallax depth. Pixelated transitions."` |
| Texture | `"Visible pixel grid - no anti-aliasing, sharp stair-stepping edges. Checkerboard and bayer dithering patterns. Hard upscaled edges. No subpixel positioning. Color variation suggests texture."` |

---

### Preset 15: "Comic Book"

| Parameter | Value |
|-----------|-------|
| **Medium** | `.animation2D` ("2D Hand-drawn") |
| **Film Format** | `nil` |
| **Film Grain** | `nil` |
| **Depth of Field** | `nil` |
| **Detail Level** | 75 |

| Preset Field | Value |
|-------------|-------|
| Lighting | `"Dramatic shadows"` |
| Color Palette | `"Bright vivid primary colors"` |
| Aesthetic | `"Comic book graphic novel"` |
| Atmosphere | `"Energetic"` |
| Mood | `"Dynamic"` |
| Motion | `"Dynamic action poses"` |
| Texture | `"Halftone dots ink lines"` |

| Manual Field | Value |
|-------------|-------|
| Lighting | `"High contrast with deep blacks and bright highlights mimicking ink. Harsh directional bold shadow shapes. Rim lighting for outlines. Distinct light/shadow areas. Dramatic face shadows."` |
| Color Palette | `"Bold primaries with heavy black outlines. Flat fills within areas. Limited scene palettes. High saturation four-color process. Halftone depth patterns. Black-dominant. Sparse white."` |
| Aesthetic | `"Classic comic book with heavy black ink and varying line weights. Ben-Day dots and halftone. Panel-like compositions. Dynamic action poses. Onomatopoeia and speed lines. Pop art."` |
| Atmosphere | `"Dynamic action-packed superhero and noir atmosphere. Urban alleys and skylines. Constant motion energy. Dramatic lightning and rain. Graphic explosive effects. Heightened reality."` |
| Mood | `"Energetic dramatic larger-than-life heroism and villainy. Exaggerated poses and expressions. Triumph and tragedy extremes. Bold good versus evil. Intensity at eleven. Exclamatory not contemplative."` |
| Motion | `"Dynamic action poses held for impact. Speed lines radiating velocity. Multiple blur positions. Impact frames with force lines. Whip pans and dramatic zooms. Panel-like camera angles."` |
| Texture | `"Bold ink lines with varying weights - thick outlines, thin details. Halftone dot tonal variation. Ben-Day vintage printing dots. Shadow crosshatching. Mechanical print texture over organic painting."` |

---

## 16. Notification Enums

### NotificationType

| Property | Value |
|----------|-------|
| **File** | `Models/AppNotification.swift` |
| **Declaration** | `enum NotificationType` (nested inside `AppNotification`) |
| **Case Count** | 4 |
| **Used By** | `AppNotification.type`, notification display across all views via `NotificationBanner` |

| Case | Icon (SF Symbol) | Color |
|------|-----------------|-------|
| `error` | `exclamationmark.triangle.fill` | `.red` |
| `warning` | `exclamationmark.circle.fill` | `.orange` |
| `info` | `info.circle.fill` | `.blue` |
| `success` | `checkmark.circle.fill` | `.green` |

**Computed properties:** `iconName: String`, `iconColor: Color`, `backgroundColor: Color`.

**Factory methods on `AppNotification`:**
- `.success(_:detail:)` — auto-dismiss after 3s
- `.error(_:solution:code:)` — does not auto-dismiss
- `.warning(_:detail:)` — does not auto-dismiss
- `.info(_:detail:)` — auto-dismiss after 3s
- `.fromValidationError(_:)` — maps `ValidationError.Severity` → `NotificationType`

---

## 17. Conversation Enums

### MessageRole

| Property | Value |
|----------|-------|
| **File** | `Models/ConversationHistory.swift` |
| **Declaration** | `enum MessageRole: String, Codable` |
| **Case Count** | 3 |
| **Used By** | `ConversationMessage.role`, multi-turn refinement conversations, API context generation |

| Case | Raw Value |
|------|-----------|
| `user` | `"user"` |
| `assistant` | `"assistant"` |
| `system` | `"system"` |

**Usage in ConversationHistory:**
- `user` — the human's refinement instruction or initial prompt
- `assistant` — the AI-generated image response (carries `imageData`)
- `system` — internal system messages (filtered out by `getAPIContext()` before sending to API)

---

## Summary Statistics

| Category | Enum Count | Total Cases |
|----------|-----------|-------------|
| Asset Domain | 2 | 7 |
| Visual Style | 5 | 29 |
| Camera Parameters | 8 | 65 |
| Character Attributes | 6 | 51 |
| Object Attributes | 6 | 51 |
| Set Attributes | 6 | 52 |
| Image Aspect Ratio | 2 | 9 |
| Provider/Capability | 2 | 5 |
| Status Enums | 2 | 8 |
| Validation/Error | 1 | 3 |
| Image Selection | 2 | 6 |
| Window Context | 1 | 2 |
| Notification | 1 | 4 |
| Conversation | 1 | 3 |
| **Total** | **45** | **295** |

Style parameter preset option arrays: 7 arrays with 119 total values (including empty defaults).

Built-in style presets: 15 (named "Quick Styles" in the UI).
