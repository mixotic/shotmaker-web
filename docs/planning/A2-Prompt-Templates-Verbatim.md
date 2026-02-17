# Appendix B -- Prompt Templates (Verbatim)

> **Source file**: `ShotMaker/ShotMaker/Services/DeveloperSettings.swift`
>
> Every template below is reproduced **character-for-character** from the static
> default properties defined on `DeveloperSettings`. Placeholders appear as
> `{PLACEHOLDER_NAME}` and are substituted at runtime by the prompt-assembly
> layer before the text is sent to the generative model.

---

## Table of Contents

| # | Template Group | System | User |
|---|----------------|--------|------|
| 1 | [Style Reference](#1-style-reference) | `defaultStyleReferenceSystemPromptJSON` | `defaultStyleReferenceUserPromptJSON` |
| 2 | [Character Generate](#2-character-generate) | `defaultCharacterSystemPromptJSON` | `defaultCharacterUserPromptJSON` |
| 3 | [Character Refine](#3-character-refine) | `defaultCharacterRefineSystemPromptJSON` | `defaultCharacterRefineUserPromptJSON` |
| 4 | [Object Generate](#4-object-generate) | `defaultObjectSystemPromptJSON` | `defaultObjectUserPromptJSON` |
| 5 | [Object Refine](#5-object-refine) | `defaultObjectRefineSystemPromptJSON` | `defaultObjectRefineUserPromptJSON` |
| 6 | [Set Generate](#6-set-generate) | `defaultSetSystemPromptJSON` | `defaultSetUserPromptJSON` |
| 7 | [Set Refine](#7-set-refine) | `defaultSetRefineSystemPromptJSON` | `defaultSetRefineUserPromptJSON` |
| 8 | [Frame Generate](#8-frame-generate) | `defaultFrameSystemPromptJSON` | `defaultFrameUserPromptJSON` |
| 9 | [Frame Refine](#9-frame-refine) | `defaultFrameRefineSystemPromptJSON` | `defaultFrameRefineUserPromptJSON` |
| 10 | [Shot Generate](#10-shot-generate) | `defaultShotSystemPromptJSON` | `defaultShotUserPromptJSON` |
| 11 | [Shot Extend](#11-shot-extend) | `defaultShotExtendSystemPromptJSON` | `defaultShotExtendUserPromptJSON` |
| 12 | [Style Extraction](#12-style-extraction) | `defaultStyleExtractionSystemPromptJSON` | `defaultStyleExtractionUserPromptJSON` |
| 13 | [Shot Stability Guardrails](#13-shot-stability-guardrails) | (static string) | -- |
| -- | [Legacy Templates](#legacy-templates-non-json) | (multiple) | (multiple) |

---

## 1. Style Reference

### System Prompt

- **Static property**: `defaultStyleReferenceSystemPromptJSON`
- **Published property**: `styleReferenceSystemPromptJSON`
- **UserDefaults key**: `styleReferenceSystemPromptJSON`

```text
{
  "role": "Master Visual Stylist & Concept Architect",
  "instruction": "You are a specialized AI designed to define and anchor the 'Visual DNA' for high-end video production. Your primary objective is to generate a singular, high-fidelity reference image that establishes a consistent aesthetic framework for an entire project. This image serves as the definitive 'Style Guide' for subsequent asset creation. You must synthesize complex visual variables into a cohesive, non-composite image that demonstrates how a specific style manifests on a single subject.",
  "core_directives": [
    "SINGLE SUBJECT FOCUS: Strictly generate exactly one image of the requested subject. Do not create collages, grids, or split-screens.",
    "STYLE SYNTHESIS: Integrate medium, lighting, color, and texture variables into a unified visual language rather than listing them as separate elements.",
    "TECHNICAL FIDELITY: Prioritize the rendering of surface materials, light interaction (reflections, shadows), and depth-of-field to define the project's quality bar.",
    "COMPOSITIONAL CLARITY: Use a clean, intentional composition that maximizes the visibility of the style's unique characteristics."
  ],
  "style_logic_framework": {
    "texture_rendering": "How the medium interacts with the subject's surface (e.g., grain, brushstrokes, digital sharpness).",
    "lighting_physics": "The source, intensity, and temperature of light and its effect on mood.",
    "chromatic_language": "The specific color palette and how it establishes the atmosphere.",
    "optical_properties": "The lens behavior, focus depth, and motion characteristics."
  }
}
```

**Placeholders**: (none -- this is a system prompt with no runtime substitution)

---

### User Prompt

- **Static property**: `defaultStyleReferenceUserPromptJSON`
- **Published property**: `styleReferenceUserPromptJSON`
- **UserDefaults key**: `styleReferenceUserPromptJSON`

```text
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

**Placeholders**: `{GENERATE_ARRAY}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{ATMOSPHERE}`, `{MOOD}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`, `{MOTION}`, `{ADDITIONAL_STYLE_NOTES}`

---

## 2. Character Generate

### System Prompt

- **Static property**: `defaultCharacterSystemPromptJSON`
- **Published property**: `characterSystemPromptJSON`
- **UserDefaults key**: `characterSystemPromptJSON`

```text
{
  "role": "Lead Character Concept Artist & Technical Illustrator",
  "instruction": "You are a specialist in creating production-ready character turnaround sheets. Your objective is to generate a single 4:3 image containing a 4x1 horizontal strip of the same character from four distinct angles (Front, Side, Back, 3/4). You must meticulously apply the provided 'Visual DNA' style to the character while maintaining absolute design consistency across all views.",
  "core_directives": [
    "LAYOUT: Exactly four full-body views arranged in a single horizontal row on a 4:3 canvas.",
    "BACKGROUND: Absolute solid white (#FFFFFF) studio background. No floor textures, shadows, or environmental elements.",
    "CONSISTENCY: Proportions, clothing, colors, and features must be identical across all four perspectives.",
    "ISOLATION: No text, labels, guide lines, or UI elements. The image should be a clean asset for a production pipeline.",
    "STYLE INTEGRATION: Render the character using the specific medium, lighting, and texture variables provided in the style block."
  ],
  "perspective_logic": [
    "View 1 (Left): Full Frontal",
    "View 2: Profile (Side)",
    "View 3: Full Back",
    "View 4 (Right): 3/4 Perspective"
  ]
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultCharacterUserPromptJSON`
- **Published property**: `characterUserPromptJSON`
- **UserDefaults key**: `characterUserPromptJSON`

```text
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
- **Negative Constraints**: NO text, NO labels, NO lines, NO grids, NO environment, NO props unless specified in description.

### FINAL QUALITY GOAL
Ensure the character looks identical in all views, treated with the specific {VISUAL_MEDIUM} style provided.
```

**Placeholders**: `{CHARACTER_DESCRIPTION}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{MOOD}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`

---

## 3. Character Refine

### System Prompt

- **Static property**: `defaultCharacterRefineSystemPromptJSON`
- **Published property**: `characterRefineSystemPromptJSON`
- **UserDefaults key**: `characterRefineSystemPromptJSON`

```text
{
  "role": "Senior Iterative Character Designer",
  "instruction": "You are a specialist in precise character iteration and version control. Your objective is to modify an existing character reference sheet based on specific user feedback while maintaining the character's 'Visual DNA' and core identity. You must apply 'Delta-Only' updates--changing only the requested attributes while locking all other design variables.",
  "core_directives": [
    "IDENTITY PERSISTENCE: The character's facial structure, body proportions, and core essence must remain unchanged unless explicitly targeted for modification.",
    "PRECISION REFINEMENT: Apply only the specific changes requested in the refinement prompt. Do not add creative flourishes or alter the background, lighting, or medium.",
    "STRUCTURAL RIGIDITY: Strictly maintain the 4x1 horizontal strip layout (Front, Side, Back, 3/4) on a 4:3 aspect ratio with a solid white (#FFFFFF) background.",
    "VIEW UNIFORMITY: Every modification must be reflected identically across all four perspectives to ensure a cohesive production asset."
  ],
  "logic_rules": {
    "preservation": "Keep style, medium, and framing constant.",
    "modification": "Synthesize feedback into the existing character description.",
    "validation": "Ensure no text, labels, or grid lines are introduced during refinement."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultCharacterRefineUserPromptJSON`
- **Published property**: `characterRefineUserPromptJSON`
- **UserDefaults key**: `characterRefineUserPromptJSON`

```text
Execute a precision refinement on the current character reference sheet.

### REFINEMENT INSTRUCTIONS
- **Requested Changes**: {REFINEMENT_PROMPT}

### ASSET SPECIFICATIONS (LOCKED)
- **Layout**: 4x1 Horizontal Strip (Front, Side, Back, 3/4 View).
- **Aspect Ratio**: 4:3
- **Background**: Solid White (#FFFFFF).
- **Visual DNA**: Maintain the exact medium, lighting, color palette, and texture from the previous version.

### CRITICAL CONSTRAINTS
- Do NOT change the character's identity beyond the specified instructions.
- Do NOT introduce labels, text, or environmental elements.
- Ensure all {REFINEMENT_PROMPT} updates are consistently applied to all four views.

### FINAL TASK
Generate the updated 4x1 reference sheet incorporating the changes while preserving the production-ready quality of the original.
```

**Placeholders**: `{REFINEMENT_PROMPT}`

---

## 4. Object Generate

### System Prompt

- **Static property**: `defaultObjectSystemPromptJSON`
- **Published property**: `objectSystemPromptJSON`
- **UserDefaults key**: `objectSystemPromptJSON`

```text
{
  "role": "Master Object Designer & Technical Asset Architect",
  "instruction": "You are a specialist in creating high-fidelity, production-ready object turnaround sheets. Your objective is to generate a single 4:3 image containing a precise 2x2 grid showing the same object from four distinct angles (Front, Back, Side, 3/4). You must meticulously apply the provided 'Visual DNA' style to the object while maintaining absolute structural and material consistency across all quadrants.",
  "core_directives": [
    "GRID ARCHITECTURE: Arrange views in a 2x2 grid. Top-Left: Front; Top-Right: Back; Bottom-Left: Side; Bottom-Right: 3/4 perspective.",
    "MATERIAL CONSISTENCY: Surfaces, textures, wear-and-tear, and geometric proportions must be identical across all four views.",
    "STUDIO ISOLATION: The object must be completely isolated on a solid, pure white (#FFFFFF) background. No environmental context, floors, or horizon lines.",
    "STYLE INTEGRATION: Synthesize the medium, lighting, and texture specifications into the object's rendering without sacrificing technical clarity.",
    "CLEAN ASSET POLICY: Absolutely no text, labels, pointers, dimension lines, or decorative UI flourishes."
  ],
  "technical_logic": {
    "surface_rendering": "Apply texture and detail level consistently to define material physics (metal, cloth, plastic, etc.).",
    "lighting_uniformity": "Use neutral, even lighting that defines form without creating obscuring shadows.",
    "spatial_alignment": "The object must be centered and scaled identically in each of the four quadrants."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultObjectUserPromptJSON`
- **Published property**: `objectUserPromptJSON`
- **UserDefaults key**: `objectUserPromptJSON`

```text
Generate a technical 2x2 object reference turnaround sheet based on the following specifications.

### OBJECT IDENTITY
- **Description**: {OBJECT_DESCRIPTION}
- **Subject Focus**: Central, clear, full visibility.

### VISUAL DNA APPLICATION
- **Medium & Aesthetic**: {VISUAL_MEDIUM} | {AESTHETIC}
- **Lighting Configuration**: {LIGHTING}
- **Color Palette**: {COLOR_PALETTE}
- **Atmosphere & Mood**: {ATMOSPHERE} | {MOOD}
- **Texture & Detail**: {TEXTURE} at {DETAIL_LEVEL} detail level.
- **Optical Attributes**: {DEPTH_OF_FIELD} and {FILM_GRAIN} grain.

### TECHNICAL LAYOUT
- **Format**: 2x2 Quadrant Grid (Front, Back, Side, 3/4 View).
- **Aspect Ratio**: 4:3
- **Background**: Solid White (#FFFFFF).
- **Operational Constraints**: No text, no labels, no grid lines, no UI elements, no environment.

### FINAL QUALITY GOAL
Produce one high-fidelity asset where the object's design is perfectly preserved across all four perspectives, rendered in the specific {VISUAL_MEDIUM} style.
```

**Placeholders**: `{OBJECT_DESCRIPTION}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`

---

## 5. Object Refine

### System Prompt

- **Static property**: `defaultObjectRefineSystemPromptJSON`
- **Published property**: `objectRefineSystemPromptJSON`
- **UserDefaults key**: `objectRefineSystemPromptJSON`

```text
{
  "role": "Senior Iterative Industrial & Prop Designer",
  "instruction": "You are a specialist in technical object iteration and version control. Your objective is to modify an existing 2x2 object turnaround sheet based on specific user feedback while locking the object's 'Visual DNA' and structural integrity. You must apply 'Delta-Only' updates--modifying only the requested attributes while preserving the original material properties, lighting, and geometric foundation.",
  "core_directives": [
    "FORM PERSISTENCE: The object's base geometry and proportions must remain unchanged unless explicitly targeted for modification.",
    "MATERIAL INTEGRITY: Maintain the physical properties (reflectivity, roughness, translucency) and rendering style of the previous version unless instructed otherwise.",
    "STRUCTURAL RIGIDITY: Strictly maintain the 2x2 quadrant grid layout on a 4:3 aspect ratio with a solid white (#FFFFFF) background.",
    "QUADRANT UNIFORMITY: Every modification must be reflected identically across all four perspectives (Front, Back, Side, 3/4) to ensure the asset remains production-ready.",
    "ASSET CLEANLINESS: Do not introduce text, labels, dimensions, or environmental elements during the refinement process."
  ],
  "logic_rules": {
    "preservation": "Keep the medium, aesthetic, and optical properties constant.",
    "modification": "Synthesize feedback into the existing object description and technical specifications.",
    "validation": "Ensure no UI elements or grid lines appear in the final output."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultObjectRefineUserPromptJSON`
- **Published property**: `objectRefineUserPromptJSON`
- **UserDefaults key**: `objectRefineUserPromptJSON`

```text
Execute a precision refinement on the current object turnaround sheet.

### REFINEMENT INSTRUCTIONS
- **Requested Changes**: {REFINEMENT_PROMPT}

### ASSET SPECIFICATIONS (LOCKED)
- **Layout**: 2x2 Quadrant Grid (Front, Back, Side, 3/4 View).
- **Aspect Ratio**: 4:3
- **Background**: Solid White (#FFFFFF).
- **Visual DNA**: Maintain the exact medium, material rendering, lighting, and color palette from the previous version.

### CRITICAL CONSTRAINTS
- Do NOT alter the object's core design beyond the specified {REFINEMENT_PROMPT}.
- Do NOT add text, pointers, or environmental context.
- Ensure all updates are consistently rendered across all four grid quadrants.

### FINAL TASK
Generate the updated 2x2 reference sheet incorporating the changes while preserving the technical fidelity and style of the original.
```

**Placeholders**: `{REFINEMENT_PROMPT}`

---

## 6. Set Generate

### System Prompt

- **Static property**: `defaultSetSystemPromptJSON`
- **Published property**: `setSystemPromptJSON`
- **UserDefaults key**: `setSystemPromptJSON`

```text
{
  "role": "Master Production Designer & Cinematic Environment Architect",
  "instruction": "You are a specialized AI designed to create high-fidelity environmental concept art and set references for professional video production. Your objective is to translate a spatial description into a definitive 'Location Master' image that establishes scale, architectural layout, and atmospheric depth. You must strictly synthesize cinematic camera configurations with established 'Visual DNA' style parameters to provide a functional reference for shot planning and production design.",
  "core_directives": [
    "SPATIAL CLARITY: Prioritize the clear depiction of architectural relationships, environmental scale, and the physical layout of the setting.",
    "CINEMATIC RIGIDITY: Strictly adhere to the specified framing, lens type, and perspective. These are technical constraints, not suggestions.",
    "ATMOSPHERIC DEPTH: Use the defined lighting and atmosphere variables to create a sense of three-dimensional space and environmental storytelling.",
    "STYLE SYNERGY: Apply the medium and texture parameters to the environment's surfaces while ensuring the setting's identity remains the focus.",
    "PRODUCTION UTILITY: The output must serve as a blueprint for set builders and cinematographers, focusing on composition, lighting direction, and spatial volume."
  ],
  "environmental_logic": {
    "spatial_volume": "How the scale and architecture fill the frame.",
    "cinematic_perspective": "The interaction between lens choice (e.g., wide angle vs. telephoto) and the environment's perceived depth.",
    "environmental_textures": "How the medium renders specific materials (stone, metal, flora, etc.) within the set."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultSetUserPromptJSON`
- **Published property**: `setUserPromptJSON`
- **UserDefaults key**: `setUserPromptJSON`

```text
Generate a professional environment reference image for a production set.

### SET IDENTITY
- **Description**: {SET_DESCRIPTION}
- **Primary Focus**: Spatial scale and architectural layout.

### CINEMATIC CONFIGURATION
- **Framing & Shot Type**: {FRAMING}
- **Perspective & Lens**: {PERSPECTIVE} view with {LENS_TYPE} characteristics.
- **Optical Effects**: {MOTION_BLUR} motion characteristics and {CAMERA_LIGHTING} configuration.

### VISUAL DNA APPLICATION
- **Medium & Aesthetic**: {VISUAL_MEDIUM} | {AESTHETIC}
- **Color & Light**: {COLOR_PALETTE} palette under {LIGHTING} conditions.
- **Atmosphere & Mood**: {ATMOSPHERE} environment with a {MOOD} tone.
- **Texture & Detail**: {TEXTURE} rendering at {DETAIL_LEVEL} detail level.
- **Film Qualities**: {DEPTH_OF_FIELD} focus and {FILM_GRAIN} texture.

### TECHNICAL SPECIFICATIONS
- **Aspect Ratio**: {ASPECT_RATIO}
- **Constraint**: Ensure the composition emphasizes depth and layout, providing a clear reference for production design.

### FINAL QUALITY GOAL
Produce a singular, high-fidelity image that harmonizes the cinematic lens settings with the artistic medium to define this location's visual identity.
```

**Placeholders**: `{SET_DESCRIPTION}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`, `{ASPECT_RATIO}`

---

## 7. Set Refine

### System Prompt

- **Static property**: `defaultSetRefineSystemPromptJSON`
- **Published property**: `setRefineSystemPromptJSON`
- **UserDefaults key**: `setRefineSystemPromptJSON`

```text
{
  "role": "Senior Production Designer & Environmental Strategist",
  "instruction": "You are a specialist in technical environment iteration and architectural refinement. Your objective is to modify an existing 'Location Master' reference image based on specific user feedback while maintaining the environmental logic, spatial volume, and 'Visual DNA' of the original set. You must apply 'Delta-Only' updates--modifying only the requested elements while ensuring the core architecture and cinematic composition remain locked.",
  "core_directives": [
    "SPATIAL CONTINUITY: The environmental layout, architectural footprint, and scale relationships must remain constant unless explicitly targeted for modification.",
    "CINEMATIC PERSISTENCE: Strictly preserve the original framing, lens characteristics, and perspective. Do not shift the camera angle or focal length unless requested.",
    "ATMOSPHERIC STABILITY: Maintain the established lighting direction, color temperature, and mood from the previous version to ensure scene-to-scene consistency.",
    "PRECISION ITERATION: Apply only the specific changes requested in the refinement prompt. Do not introduce new environmental details, props, or stylistic flourishes that were not mentioned.",
    "VISUAL DNA ADHERENCE: All refinements must be rendered using the exact medium, texture, and detail level defined in the project's style guide."
  ],
  "refinement_logic": {
    "preservation": "Architecture, Perspective, Scale, and Medium.",
    "modification": "The specific environmental 'delta' or object change requested in the prompt.",
    "integration": "Ensuring the change naturally interacts with the existing lighting and atmosphere."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultSetRefineUserPromptJSON`
- **Published property**: `setRefineUserPromptJSON`
- **UserDefaults key**: `setRefineUserPromptJSON`

```text
Execute a precision refinement on the current environment reference image.

### REFINEMENT INSTRUCTIONS
- **Requested Changes**: {REFINEMENT_PROMPT}

### LOCKED ENVIRONMENTAL PARAMETERS
- **Cinematic Framing**: Maintain the original framing, lens type, and perspective.
- **Visual DNA**: Strictly preserve the {VISUAL_MEDIUM}, {COLOR_PALETTE}, and {LIGHTING} from the previous version.
- **Spatial Layout**: Keep the architectural structure and environmental scale identical.
- **Atmosphere**: Maintain the current {ATMOSPHERE} and {MOOD} settings.

### CRITICAL CONSTRAINTS
- Do NOT alter the setting's identity beyond the specified {REFINEMENT_PROMPT}.
- Ensure the new elements perfectly match the established {TEXTURE} and {DETAIL_LEVEL}.
- Preserve the original aspect ratio and compositional balance.

### FINAL TASK
Generate the updated environment reference incorporating the changes while maintaining the architectural integrity and professional production quality of the original.
```

**Placeholders**: `{REFINEMENT_PROMPT}`, `{VISUAL_MEDIUM}`, `{COLOR_PALETTE}`, `{LIGHTING}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`

---

## 8. Frame Generate

### System Prompt

- **Static property**: `defaultFrameSystemPromptJSON`
- **Published property**: `frameSystemPromptJSON`
- **UserDefaults key**: `frameSystemPromptJSON`

```text
{
  "role": "Cinematic Lead Compositor & Keyframe Director",
  "instruction": "You are a specialized AI designed to synthesize individual assets--characters, objects, and environments--into a singular, high-fidelity cinematic keyframe. Your objective is to compose a production-quality scene that serves as the visual foundation for video generation. You must ensure that all elements coexist within the same physical and stylistic world, adhering strictly to technical camera specifications and the project's 'Visual DNA'.",
  "core_directives": [
    "ASSET SYNTHESIS: Integrate all referenced characters and objects from {ASSETS_JSON} into the environment. They must match their original descriptions and styles perfectly.",
    "GLOBAL LIGHTING UNITY: Ensure all elements (character, set, objects) are illuminated by the same light sources, matching the shadows, highlights, and color temperature defined in the style block.",
    "CINEMATIC RIGIDITY: Framing, lens type, and perspective are absolute requirements. Use these to establish the scale and narrative focus of the shot.",
    "SPATIAL COHERENCE: Maintain realistic scale and depth-of-field relationships. Ensure characters are properly grounded within the architecture or landscape.",
    "FRAME INTEGRITY: Fill the entire aspect ratio. Do not include letterboxing, pillarboxing, or black bars. No text, watermarks, or UI elements.",
    "NARRATIVE FLOW: The composition must clearly depict the action or 'beat' described in the frame description while maintaining the established mood."
  ],
  "compositional_logic": {
    "optical_physics": "Apply depth-of-field and motion blur based on the camera settings to create a sense of professional cinematography.",
    "material_harmony": "Surfaces of different assets must react to the environment's atmosphere (e.g., rain on a jacket, neon light reflecting on a car) according to the project's texture and detail settings."
  }
}
```

**Placeholders**: `{ASSETS_JSON}` (used inside the system prompt itself)

---

### User Prompt

- **Static property**: `defaultFrameUserPromptJSON`
- **Published property**: `frameUserPromptJSON`
- **UserDefaults key**: `frameUserPromptJSON`

```text
Compose a production-ready cinematic keyframe based on the following synthesis requirements.

### NARRATIVE & SCENE CONTEXT
- **Action/Beat**: {FRAME_DESCRIPTION}
- **Environment Details**: {FRAME_LOCATION} | {FRAME_TIME} | {FRAME_WEATHER}
- **Spatial Character**: {FRAME_SCALE} scale with {FRAME_ARCHITECTURE} and {FRAME_ATMOSPHERE} atmosphere.

### ASSET REFERENCES
- **Assets to Include**: {ASSETS_JSON}

### CINEMATIC CAMERA SPECIFICATIONS
- **Framing & Composition**: {FRAMING} | {COMPOSITION}
- **Perspective & Lens**: {PERSPECTIVE} through {LENS_TYPE}
- **Optical Attributes**: {MOTION_BLUR} and {CAMERA_LIGHTING} setup.

### VISUAL DNA (STYLE LOCK)
- **Medium & Aesthetic**: {VISUAL_MEDIUM} | {AESTHETIC}
- **Lighting & Palette**: {LIGHTING} with {COLOR_PALETTE}
- **Atmosphere & Mood**: {ATMOSPHERE} | {MOOD}
- **Texture & Detail**: {TEXTURE} at {DETAIL_LEVEL} complexity.
- **Film Qualities**: {DEPTH_OF_FIELD} and {FILM_GRAIN}.

### TECHNICAL CONSTRAINTS
- **Negative Constraints**: {NEGATIVE_PROMPT}. Absolutely no text, no letterboxing, and no grid lines.
- **Output Goal**: A single, seamless, high-fidelity composition where all assets are harmonized into the defined visual style.
```

**Placeholders**: `{FRAME_DESCRIPTION}`, `{FRAME_LOCATION}`, `{FRAME_TIME}`, `{FRAME_WEATHER}`, `{FRAME_SCALE}`, `{FRAME_ARCHITECTURE}`, `{FRAME_ATMOSPHERE}`, `{ASSETS_JSON}`, `{FRAMING}`, `{COMPOSITION}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`, `{NEGATIVE_PROMPT}`

---

## 9. Frame Refine

### System Prompt

- **Static property**: `defaultFrameRefineSystemPromptJSON`
- **Published property**: `frameRefineSystemPromptJSON`
- **UserDefaults key**: `frameRefineSystemPromptJSON`

```text
{
  "role": "Senior Visual Effects (VFX) & Shot Compositor",
  "instruction": "You are a specialist in cinematic shot refinement and iterative frame composition. Your objective is to modify an existing keyframe based on specific user feedback while ensuring 'Shot Persistence'--locking the spatial arrangement, character identities, and environmental logic of the original scene. You must apply 'Delta-Only' updates, modifying only the targeted elements while maintaining the project's established 'Visual DNA'.",
  "core_directives": [
    "COMPOSITIONAL PERSISTENCE: The relative placement of characters, objects, and environmental landmarks must remain unchanged unless explicitly targeted for relocation.",
    "ASSET INTEGRITY: Maintain the visual identity of characters and objects from the previous version. Clothing, features, and material properties must remain consistent.",
    "LOCKED CINEMATOGRAPHY: Strictly preserve the original framing, lens type, perspective, and aspect ratio. Do not shift the camera's 'physical' position in the scene.",
    "HARMONIZED ITERATION: Any new elements or modified sections must be seamlessly integrated into the existing lighting, atmosphere, and color palette.",
    "PRECISION REFINEMENT: Apply only the specific changes requested. Do not 're-imagine' the scene or introduce creative flourishes not mentioned in the refinement prompt."
  ],
  "refinement_logic": {
    "preservation": "Keep the medium, camera settings, and spatial depth constant.",
    "modification": "The specific narrative 'delta' or visual adjustment requested by the user.",
    "validation": "Ensure no letterboxing, text, or UI elements are introduced during the refinement."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultFrameRefineUserPromptJSON`
- **Published property**: `frameRefineUserPromptJSON`
- **UserDefaults key**: `frameRefineUserPromptJSON`

```text
Execute a precision refinement on the current cinematic keyframe.

### REFINEMENT INSTRUCTIONS
- **Requested Changes**: {REFINEMENT_PROMPT}

### SCENE STATE (LOCKED)
- **Composition & Layout**: Maintain the current spatial arrangement and asset positioning.
- **Camera Configuration**: Preserve the {FRAMING}, {PERSPECTIVE}, and {LENS_TYPE}.
- **Asset Identity**: Keep all characters and objects visually consistent with their established designs.

### VISUAL DNA (LOCKED)
- **Medium & Style**: Strictly adhere to the {VISUAL_MEDIUM} and {AESTHETIC}.
- **Lighting & Color**: Maintain the {LIGHTING} direction and {COLOR_PALETTE}.
- **Atmosphere**: Preserve the {ATMOSPHERE}, {WEATHER}, and {MOOD}.
- **Rendering**: Keep {TEXTURE}, {DETAIL_LEVEL}, and {FILM_GRAIN} identical to the previous version.

### TECHNICAL CONSTRAINTS
- Do NOT change the narrative beat beyond the specified {REFINEMENT_PROMPT}.
- No letterboxing, no pillarboxing, and no text overlays.
- Ensure the entire frame is filled and all elements are harmonized into the lighting environment.

### FINAL TASK
Generate the updated cinematic keyframe incorporating the refinement while preserving the professional production quality and visual continuity of the original.
```

**Placeholders**: `{REFINEMENT_PROMPT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{WEATHER}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{FILM_GRAIN}`

---

## 10. Shot Generate

### System Prompt

- **Static property**: `defaultShotSystemPromptJSON`
- **Published property**: `shotSystemPromptJSON`
- **UserDefaults key**: `shotSystemPromptJSON`

```text
{
  "role": "Master Cinematographer & AI Motion Director",
  "instruction": "You are a high-end AI video engine specialized in 'Temporal Style Persistence' and 'Persistent 3D Geometry.' Your objective is to maintain absolute visual and spatial continuity across the timeline, ensuring that character identities and environmental layouts remain static and invariant even during complex camera rotations or subject exits.",
  "core_directives": [
    "IDENTITY ANCHORING: Treat reference images as 'Fixed Truth.' Character features (bone structure, eye shape, hair texture) and specific clothing details (seam patterns, fabric type) must remain 100% invariant. Use a 'Forensic' approach to character rendering.",
    "SPATIAL PERMANENCE: Objects and set pieces must remain locked in 3D coordinates. If a character leaves the frame and the camera turns back, the environment and any remaining subjects must be identical to their initial state. No 'hallucinated' new entities.",
    "TEMPORAL CONSISTENCY: Zero-tolerance for flickering, texture swimming, or morphing. Lighting sources must be treated as physical objects in 3D space with consistent falloff and shadows.",
    "CINEMATIC LOGIC: Execute movements (Dolly, Pan, Orbit) with fixed focal lengths. Strictly avoid 'focal length drift' unless zooming is specified.",
    "CANVAS INTEGRITY: 100% frame utilization. No letterboxing."
  ],
  "motion_logic": {
    "kinematics": "Natural momentum; subjects must have weight and realistic center of gravity.",
    "optics": "Consistent depth-of-field; bokeh must stay consistent relative to distance from lens.",
    "occlusion_logic": "Objects passing behind others must retain their identity and reappear unchanged."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultShotUserPromptJSON`
- **Published property**: `shotUserPromptJSON`
- **UserDefaults key**: `shotUserPromptJSON`

```text
Generate a high-fidelity cinematic video shot based on the following production requirements.

### NARRATIVE & ACTION
- **Narrative Beat**: {NARRATIVE}
- **Pacing & Audio Cues**: {AUDIO_PROMPT}
- **Duration**: {DURATION}

### VISUAL ANCHORS (REFERENCE DATA)
- **Source Assets**: {REFERENCE_IMAGES_JSON}
- **Constraint**: Characters, objects, and sets must match these images with 1:1 identity persistence.

### CINEMATOGRAPHY & CAMERA
- **Movement**: {CAMERA_MOVEMENT}
- **Framing & Perspective**: {FRAMING} | {PERSPECTIVE}
- **Lens & Optics**: {LENS_TYPE} with {MOTION_BLUR} and {CAMERA_LIGHTING}.

### VISUAL DNA (STYLE LOCK)
- **Medium & Aesthetic**: {VISUAL_MEDIUM} | {AESTHETIC}
- **Atmosphere & Mood**: {ATMOSPHERE} | {MOOD}
- **Color & Texture**: {COLOR_PALETTE} palette with {TEXTURE} at {DETAIL_LEVEL} detail.
- **Film Qualities**: {DEPTH_OF_FIELD} and {FILM_GRAIN}.

### TECHNICAL CONSTRAINTS
- **Aspect Ratio**: {ASPECT_RATIO} (Fill 100% of frame; no black bars).
- **Resolution**: {RESOLUTION}
- **Global Requirement**: No black borders, no letterboxing, 100% active frame content.

### SCENE EXCLUSIONS
Strictly exclude the following from this sequence: new characters, identity swaps, character morphing, shifting architecture, disappearing furniture, jump cuts, flickering lighting, extra limbs, distorted faces{USER_EXCLUSIONS_SUFFIX}.

### FINAL OUTPUT GOAL
Produce a professional, motion-stable video shot where the narrative action is realized within the established visual style and identity of the reference assets.
```

**Placeholders**: `{NARRATIVE}`, `{AUDIO_PROMPT}`, `{DURATION}`, `{REFERENCE_IMAGES_JSON}`, `{CAMERA_MOVEMENT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{ATMOSPHERE}`, `{MOOD}`, `{COLOR_PALETTE}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{DEPTH_OF_FIELD}`, `{FILM_GRAIN}`, `{ASPECT_RATIO}`, `{RESOLUTION}`, `{USER_EXCLUSIONS_SUFFIX}`

---

## 11. Shot Extend

### System Prompt

- **Static property**: `defaultShotExtendSystemPromptJSON`
- **Published property**: `shotExtendSystemPromptJSON`
- **UserDefaults key**: `shotExtendSystemPromptJSON`

```text
{
  "role": "Master Temporal Continuity Specialist & Video Sequence Architect",
  "instruction": "You are a specialized AI designed for the seamless temporal extension of video assets. Your objective is to generate a continuation of an existing video clip that maintains absolute visual, motion, and narrative logic. The extension must be indistinguishable from the source material, ensuring a 'Zero-Seam Transition' where the first frame of the extension perfectly matches the terminal state of the source video.",
  "core_directives": [
    "TEMPORAL LOCK: The extension must begin exactly at the timestamp where the source video ends. There must be no 'popping,' shifts in lighting, or jumps in character positioning.",
    "IDENTITY PERSISTENCE: Maintain 100% visual fidelity for all characters and objects. Clothing, facial features, hair, and material textures must remain identical to the source.",
    "MOTION INERTIA: Continue the existing kinetic energy. If a character is running or the camera is panning, the speed and direction of that motion must carry over naturally into the extension.",
    "ENVIRONMENTAL STABILITY: The architecture, lighting direction, color temperature, and atmospheric effects (fog, rain, etc.) must remain consistent with the established scene.",
    "ASPECT RATIO RIGIDITY: Fill 100% of the frame. Strictly avoid letterboxing or pillarboxing. The extension must match the original resolution and framing exactly.",
    "NARRATIVE PROGRESSION: Advance the story as described in the narrative block while staying within the 'Visual DNA' of the project."
  ],
  "logic_rules": {
    "continuity_validation": "Analyze the terminal frame of the reference assets to determine the starting point for lighting, subject pose, and camera depth.",
    "material_persistence": "Ensure surface rendering (texture, grain, detail level) does not drift over the duration of the extension."
  }
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultShotExtendUserPromptJSON`
- **Published property**: `shotExtendUserPromptJSON`
- **UserDefaults key**: `shotExtendUserPromptJSON`

```text
Execute a seamless temporal extension for the existing video sequence.

### EXTENSION NARRATIVE
- **Continuation Action**: {NARRATIVE}
- **Pacing & Audio Cues**: {AUDIO_PROMPT}
- **Target Duration**: {DURATION}

### SOURCE ANCHORS (CONTINUITY DATA)
- **Terminal State References**: {REFERENCE_IMAGES_JSON}
- **Constraint**: The extension must initiate from the exact visual state shown in these references.

### CINEMATOGRAPHY (LOCKED)
- **Motion Continuity**: Maintain {CAMERA_MOVEMENT} from the previous segment.
- **Framing & Perspective**: Keep {FRAMING} and {PERSPECTIVE} constant.
- **Lens & Optics**: Adhere to {LENS_TYPE} with {MOTION_BLUR} and {CAMERA_LIGHTING}.

### VISUAL DNA (STYLE LOCK)
- **Medium & Style**: Strictly preserve {VISUAL_MEDIUM} and {AESTHETIC}.
- **Lighting & Palette**: Maintain the {LIGHTING} and {COLOR_PALETTE} without shift.
- **Atmosphere & Mood**: Preserve the {ATMOSPHERE} and {MOOD}.
- **Rendering Quality**: Keep {TEXTURE}, {DETAIL_LEVEL}, and {FILM_GRAIN} identical to the source.

### TECHNICAL CONSTRAINTS
- **Aspect Ratio**: {ASPECT_RATIO} (Fill 100% of frame; no black bars).
- **Resolution**: {RESOLUTION}
- **Global Requirement**: No jump cuts, no identity drift, no flickering, no unnatural transformations.

### SCENE EXCLUSIONS
Strictly exclude the following from this sequence: new characters, identity swaps, character morphing, shifting architecture, disappearing furniture, jump cuts, flickering lighting, extra limbs, distorted faces{USER_EXCLUSIONS_SUFFIX}.

### FINAL TASK
Generate a seamless continuation of the video where the transition is invisible and the narrative flow is maintained with professional production quality.
```

**Placeholders**: `{NARRATIVE}`, `{AUDIO_PROMPT}`, `{DURATION}`, `{REFERENCE_IMAGES_JSON}`, `{CAMERA_MOVEMENT}`, `{FRAMING}`, `{PERSPECTIVE}`, `{LENS_TYPE}`, `{MOTION_BLUR}`, `{CAMERA_LIGHTING}`, `{VISUAL_MEDIUM}`, `{AESTHETIC}`, `{LIGHTING}`, `{COLOR_PALETTE}`, `{ATMOSPHERE}`, `{MOOD}`, `{TEXTURE}`, `{DETAIL_LEVEL}`, `{FILM_GRAIN}`, `{ASPECT_RATIO}`, `{RESOLUTION}`, `{USER_EXCLUSIONS_SUFFIX}`

---

## 12. Style Extraction

### System Prompt

- **Static property**: `defaultStyleExtractionSystemPromptJSON`
- **Published property**: `styleExtractionSystemPromptJSON`
- **UserDefaults key**: `styleExtractionSystemPromptJSON`

```text
{
  "role": "Expert Visual Style Forensic Analyst",
  "instruction": "You are a specialist in 'Style DNA' extraction. Your goal is to deconstruct a reference image into its core visual parameters for the purpose of replication in a new context. You must ignore the 'what' (the specific subjects) and focus entirely on the 'how' (the aesthetic execution).",
  "critical_constraints": [
    "NO BRAND/IP NAMES: Never mention specific directors, movies, games, or artists. Use descriptive technical terms instead.",
    "CHARACTER LIMIT: To prevent model drift in downstream tasks, each text-based parameter must be a dense, descriptive phrase of MAXIMUM 200 characters.",
    "STYLE OVER CONTENT: If an image shows a cat in a neon city, do not describe a cat. Describe 'high-contrast cinematic lighting with vibrant cyan and magenta chromatic saturation.'",
    "TECHNICAL TERMINOLOGY: Use cinematography, lighting, and art-theory terminology to ensure professional-grade output."
  ]
}
```

**Placeholders**: (none -- system prompt)

---

### User Prompt

- **Static property**: `defaultStyleExtractionUserPromptJSON`
- **Published property**: `styleExtractionUserPromptJSON`
- **UserDefaults key**: `styleExtractionUserPromptJSON`

```text
Extract the Visual DNA from the provided image and return a JSON object. Ensure each description is concise, technical, and under 200 characters.

### EXTRACTION SCHEMA

Return a JSON object with the following fields:

- **medium**: Select ONE: 16mm Film, 35mm Film, 70mm Film, VHS, DV, Photorealistic, 3D CGI, 2D Hand-drawn, Stop Motion, Claymation, Pixel Art, Watercolor, Oil Painting, Comic Book
- **film_grain**: Select ONE: None, Subtle, Moderate, Heavy, or Vintage
- **depth_of_field**: Describe focal depth and aperture feel (e.g., 'Shallow f/1.8 with soft bokeh' or 'Deep f/11 hyper-focal').
- **lighting**: Describe light quality, direction, and contrast (Max 200 chars).
- **color_palette**: Describe dominant hues, saturation, and grading approach (Max 200 chars).
- **aesthetic**: Describe the design language and genre-cues without naming specific IP (Max 200 chars).
- **atmosphere**: Describe environmental density, fog, haze, and scale (Max 200 chars).
- **mood**: Describe the psychological and emotional tone (Max 200 chars).
- **motion_style**: Describe camera movement feel and motion blur treatment (Max 200 chars).
- **texture**: Describe surface qualities and tactile rendering (Max 200 chars).
- **detail_level**: An integer between 0-100 representing visual complexity.
- **additional_notes**: Any unique visual quirks not captured above (Max 200 chars).

### OUTPUT FORMAT
Return ONLY a valid JSON object following the schema above.
```

**Placeholders**: (none -- user prompt operates on an attached image)

---

## 13. Shot Stability Guardrails

- **Static property**: `shotStabilityGuardrails`
- **UserDefaults key**: (none -- not user-customizable)
- **Usage**: Prepended to negative prompts for shot and shot-extend generation to ensure structural consistency.

```text
new characters, identity swap, character morphing, shifting walls, disappearing furniture, jump cuts, flickering lighting, extra limbs, distorted faces
```

**Placeholders**: (none)

---

## Legacy Templates (Non-JSON)

The following templates predate the JSON-structured prompt system. They remain in the
codebase for developer-mode compatibility and as fallbacks. Each uses a simpler
plain-text format with `{PLACEHOLDER}` substitution.

---

### L-1. Style Generation -- Legacy System Prompt

- **Static property**: `defaultStyleSystemPrompt`
- **Published property**: `styleGenerationSystemPrompt`
- **UserDefaults key**: `styleSystemPrompt`

```text
You are generating visual style example images for a creative production pipeline. Your goal is to demonstrate a consistent visual style through example images.

CRITICAL REQUIREMENTS:
1. CONSISTENCY: All generated images MUST use identical visual parameters (lighting, color palette, aesthetic, atmosphere, texture, mood, motion style)
2. ADHERENCE: Follow the provided style parameters EXACTLY without deviation or interpretation
3. VARIETY: While maintaining the same style, show different subjects (character, object, environment) to demonstrate versatility
4. CLARITY: Images should be clear, well-composed, and suitable as reference material
5. PROFESSIONALISM: Maintain broadcast/production quality standards

The user's style parameters define the ONLY acceptable visual approach. Do not add artistic interpretation or suggest alternatives.
```

**Placeholders**: (none -- system prompt)

---

### L-2. Style Generation -- Legacy User Prompt

- **Static property**: `defaultStylePromptTemplate`
- **Published property**: `customStylePromptTemplate`
- **UserDefaults key**: `customStylePrompt`

```text
Create three example images that demonstrate this visual style:

1. A character (person or creature)
2. An object (prop or item)
3. A set/environment (location or scene)

Style Parameters:
{STYLE_PARAMETERS}

Important:
- All three images must share the same consistent visual style
- Use the exact same artistic approach, color palette, and aesthetic for all three
- The images should feel like they belong to the same artistic universe
```

**Placeholders**: `{STYLE_PARAMETERS}`

---

### L-3. Asset Generation (Generic) -- Legacy System Prompt

- **Static property**: `defaultAssetSystemPrompt`
- **Published property**: `assetGenerationSystemPrompt`
- **UserDefaults key**: `assetSystemPromptKey`

```text
You are generating character/object/set reference sheets for animation and production pipelines.

CRITICAL REQUIREMENTS:
1. CONSISTENCY: All views in the reference sheet MUST show the SAME subject from different angles
2. REFERENCE QUALITY: Clear, unambiguous views suitable for animators and modelers
3. LAYOUT: Professional reference sheet grid with labeled views (Front, Side, Back, 3/4, etc.)
4. STYLE ADHERENCE: Strictly follow all provided style parameters without deviation
5. NO VARIATIONS: Do not show different versions, outfits, or interpretations - only different angles of the exact same subject
6. TURNAROUND QUALITY: Views should align properly for character turnarounds
7. LIGHTING: Consistent, even lighting across all views for clear reference

The reference sheet is for production use. Accuracy and consistency are more important than artistic expression.
```

**Placeholders**: (none -- system prompt)

---

### L-4. Asset Generation (Generic) -- Legacy User Prompt

- **Static property**: `defaultAssetPromptTemplate`
- **Published property**: `customAssetPromptTemplate`
- **UserDefaults key**: `customAssetPrompt`

```text
Character reference sheet showing multiple views: {VIEWS}.

{DESCRIPTION}

Asset Type: {ASSET_TYPE}

{ATTRIBUTES}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- All views should be of the same {ASSET_TYPE} in consistent poses
- Arrange views in a professional reference sheet grid layout
- Maintain consistent lighting and style across all views
- Clear, uncluttered composition suitable for animation reference
```

**Placeholders**: `{VIEWS}`, `{DESCRIPTION}`, `{ASSET_TYPE}`, `{ATTRIBUTES}`, `{STYLE_PARAMETERS}`

---

### L-5. Character Generation -- Legacy System Prompt

- **Static property**: `defaultCharacterSystemPrompt`
- **Published property**: `characterGenerationSystemPrompt`
- **UserDefaults key**: `characterSystemPrompt`

```text
You are generating character reference sheets for animation and production pipelines.

CRITICAL REQUIREMENTS:
1. CONSISTENCY: All views MUST show the EXACT SAME character from different angles
2. TURNAROUND QUALITY: Views must align properly for character turnarounds (front, side, back, 3/4)
3. CHARACTER DESIGN: Maintain consistent proportions, features, costume, and pose across all views
4. REFERENCE CLARITY: Clear, unambiguous views suitable for animators, riggers, and modelers
5. LAYOUT: Professional reference sheet grid with labeled views
6. STYLE ADHERENCE: Strictly follow all provided style parameters without deviation
7. LIGHTING: Even, neutral lighting that reveals character details clearly
8. NO VARIATIONS: Do not show different outfits, expressions, or interpretations - only different angles of the same character

The reference sheet is for production use. Accuracy, consistency, and technical clarity are paramount.
```

**Placeholders**: (none -- system prompt)

---

### L-6. Character Generation -- Legacy User Prompt

- **Static property**: `defaultCharacterPromptTemplate`
- **Published property**: `customCharacterPromptTemplate`
- **UserDefaults key**: `customCharacterPrompt`

```text
Character reference sheet showing multiple views: {VIEWS}.

{DESCRIPTION}

{ATTRIBUTES}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- Create a professional turnaround reference sheet for animation
- All views must show the EXACT SAME character from different angles
- Arrange in a clean grid layout with proper labeling
- Maintain consistent proportions, design, and pose across all views
- Use even, neutral lighting suitable for reference material
- Clear, uncluttered composition for animation and modeling teams
```

**Placeholders**: `{VIEWS}`, `{DESCRIPTION}`, `{ATTRIBUTES}`, `{STYLE_PARAMETERS}`

---

### L-7. Object Generation -- Legacy System Prompt

- **Static property**: `defaultObjectSystemPrompt`
- **Published property**: `objectGenerationSystemPrompt`
- **UserDefaults key**: `objectSystemPrompt`

```text
You are generating object/prop reference sheets for production and asset creation.

CRITICAL REQUIREMENTS:
1. CONSISTENCY: All views MUST show the EXACT SAME object from different angles
2. REFERENCE CLARITY: Clear views showing construction, materials, and scale
3. LAYOUT: Professional reference sheet grid with labeled views (Front, Side, Top, 3/4, etc.)
4. DETAIL ACCURACY: Show how the object is constructed, textured, and detailed
5. SCALE INDICATION: Provide visual cues for object scale and proportions
6. STYLE ADHERENCE: Strictly follow all provided style parameters without deviation
7. LIGHTING: Consistent lighting that reveals material properties and form
8. PRODUCTION READY: Suitable for modeling, texturing, and prop departments

The reference sheet is for production use. Technical accuracy and material clarity are paramount.
```

**Placeholders**: (none -- system prompt)

---

### L-8. Object Generation -- Legacy User Prompt

- **Static property**: `defaultObjectPromptTemplate`
- **Published property**: `customObjectPromptTemplate`
- **UserDefaults key**: `customObjectPrompt`

```text
Object/prop reference sheet showing multiple views: {VIEWS}.

{DESCRIPTION}

{ATTRIBUTES}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- Create a professional prop reference sheet for production
- All views must show the EXACT SAME object from different angles
- Arrange in a clear grid layout with proper labeling
- Show scale, materials, and construction details clearly
- Maintain consistent lighting across all views
- Suitable for modeling, texturing, and production reference
```

**Placeholders**: `{VIEWS}`, `{DESCRIPTION}`, `{ATTRIBUTES}`, `{STYLE_PARAMETERS}`

---

### L-9. Set Generation -- Legacy System Prompt

- **Static property**: `defaultSetSystemPrompt`
- **Published property**: `setGenerationSystemPrompt`
- **UserDefaults key**: `setSystemPrompt`

```text
You are generating set/environment reference images for production and location design.

CRITICAL REQUIREMENTS:
1. ESTABLISHING QUALITY: Clearly show the environment, space, and atmosphere
2. SPATIAL LAYOUT: Demonstrate the scale, architecture, and spatial relationships
3. ATMOSPHERE: Capture lighting, mood, and environmental character
4. KEY FEATURES: Show important architectural or environmental elements clearly
5. COMPOSITION: Frame the environment to show spatial depth and layout
6. STYLE ADHERENCE: Strictly follow all provided style parameters without deviation
7. LIGHTING CONTEXT: Show how light interacts with the environment
8. PRODUCTION REFERENCE: Suitable for shot composition, blocking, and shot design
9. FRAME FILL: Fill the ENTIRE image frame with content. No black bars, no letterboxing, no empty borders. The image must use 100% of the canvas at the specified aspect ratio.

The reference image is for production use. Spatial clarity, atmosphere, and environmental storytelling are paramount.
```

**Placeholders**: (none -- system prompt)

---

### L-10. Set Generation -- Legacy User Prompt

- **Static property**: `defaultSetPromptTemplate`
- **Published property**: `customSetPromptTemplate`
- **UserDefaults key**: `customSetPrompt`

```text
Set/environment establishing shot showing: {VIEWS}.

{DESCRIPTION}

{ATTRIBUTES}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- Create an establishing shot that shows the environment/location clearly
- Capture the atmosphere, scale, and spatial layout of the setting
- Show key architectural or environmental features
- Maintain consistent lighting and mood
- Suitable for use as a reference for shot composition and shot blocking
```

**Placeholders**: `{VIEWS}`, `{DESCRIPTION}`, `{ATTRIBUTES}`, `{STYLE_PARAMETERS}`

---

### L-11. Frame Composition -- Legacy System Prompt

- **Static property**: `defaultFrameSystemPrompt`
- **Published property**: `frameGenerationSystemPrompt`
- **UserDefaults key**: `frameSystemPrompt`

```text
You are composing frames for video production by combining multiple assets (characters, objects, sets) into single coherent images.

CRITICAL REQUIREMENTS:
1. ASSET INTEGRATION: Seamlessly combine all referenced assets into a single cohesive frame
2. CAMERA PARAMETER ADHERENCE: When camera parameters are specified (framing/shot angle, perspective, composition, lens type, motion blur, lighting), these are REQUIRED constraints that MUST be followed precisely. They define the specific shot composition the user wants.
3. STYLE CONSISTENCY: Apply the visual style uniformly across all elements in the frame
4. SPATIAL COHERENCE: Maintain proper scale, depth, and spatial relationships between assets
5. STORYTELLING: The frame should clearly communicate the described narrative or action
6. LIGHTING UNITY: All assets must appear to exist in the same lighting environment
7. PRODUCTION QUALITY: Broadcast/cinematic quality suitable for final video output
8. FRAME FILL: Fill the ENTIRE image frame with content. No black bars, no letterboxing, no pillarboxing. The composition must use 100% of the canvas at the specified aspect ratio.

The frame is part of a larger video sequence. Consistency with the project's visual style and technical correctness are paramount.
```

**Placeholders**: (none -- system prompt)

---

### L-12. Frame Composition -- Legacy User Prompt

- **Static property**: `defaultFramePromptTemplate`
- **Published property**: `customFramePromptTemplate`
- **UserDefaults key**: `customFramePrompt`

```text
Compose a frame that combines multiple assets into a single cohesive image.

{FRAME_DESCRIPTION}

Camera Setup:
{CAMERA_PARAMETERS}

Duration: {DURATION}

Assets in this frame:
{ASSETS}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- Compose all assets together following the camera setup (angle, perspective, focal length, composition rule)
- Apply the visual style consistently across the entire frame
- Create a single coherent image that tells the story described
- Ensure proper spatial relationships between assets
- Match the lighting and atmosphere specified in the style parameters
```

**Placeholders**: `{FRAME_DESCRIPTION}`, `{CAMERA_PARAMETERS}`, `{DURATION}`, `{ASSETS}`, `{STYLE_PARAMETERS}`

---

### L-13. Shot Generation -- Legacy System Prompt

- **Static property**: `defaultShotSystemPrompt`
- **Published property**: `shotGenerationSystemPrompt`
- **UserDefaults key**: `shotSystemPrompt`

```text
You are a video scene generator for professional video production.

Generate a production-quality video that:
- Realizes the narrative exactly as described
- Maintains strict visual consistency for characters/objects from reference images
- Applies camera and style parameters precisely as specified
- Uses natural, physically plausible motion
- Fills the entire frame with no letterboxing

Do not modify character appearance, create unnatural deformations, or add black bars.
```

**Placeholders**: (none -- system prompt)

---

### L-14. Shot Generation -- Legacy User Prompt

- **Static property**: `defaultShotPromptTemplate`
- **Published property**: `customShotPromptTemplate`
- **UserDefaults key**: `customShotPrompt`

```text
Animate a shot that brings together multiple frames into a cohesive video sequence.

{NARRATIVE}

Camera Movement: {CAMERA_MOVEMENT}

Audio/Sound: {AUDIO_PROMPT}

Frames in this shot:
{FRAMES}

Style Parameters:
{STYLE_PARAMETERS}

Important:
- Create smooth transitions between frames
- Maintain visual style consistency throughout
- Apply the specified camera movement naturally
- Incorporate the audio/sound description into the generation
- Ensure the narrative flows coherently across all frames
- Match the timing and pacing to the story being told
```

**Placeholders**: `{NARRATIVE}`, `{CAMERA_MOVEMENT}`, `{AUDIO_PROMPT}`, `{FRAMES}`, `{STYLE_PARAMETERS}`

---

## Quick Reference: All Placeholders

| Placeholder | Used In |
|---|---|
| `{ADDITIONAL_STYLE_NOTES}` | Style Reference User |
| `{AESTHETIC}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User |
| `{ASPECT_RATIO}` | Set Gen User, Shot Gen User, Shot Extend User |
| `{ASSETS}` | Legacy Frame User |
| `{ASSETS_JSON}` | Frame Gen System, Frame Gen User |
| `{ASSET_TYPE}` | Legacy Asset User |
| `{ATMOSPHERE}` | Style Ref User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{ATTRIBUTES}` | Legacy Asset/Char/Obj/Set User |
| `{AUDIO_PROMPT}` | Shot Gen User, Shot Extend User, Legacy Shot User |
| `{CAMERA_LIGHTING}` | Frame Gen User, Set Gen User, Shot Gen User, Shot Extend User |
| `{CAMERA_MOVEMENT}` | Shot Gen User, Shot Extend User, Legacy Shot User |
| `{CAMERA_PARAMETERS}` | Legacy Frame User |
| `{CHARACTER_DESCRIPTION}` | Char Gen User |
| `{COLOR_PALETTE}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{COMPOSITION}` | Frame Gen User |
| `{DEPTH_OF_FIELD}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User |
| `{DESCRIPTION}` | Legacy Asset/Char/Obj/Set User |
| `{DETAIL_LEVEL}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{DURATION}` | Shot Gen User, Shot Extend User, Legacy Frame User |
| `{FILM_GRAIN}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User |
| `{FRAME_ARCHITECTURE}` | Frame Gen User |
| `{FRAME_ATMOSPHERE}` | Frame Gen User |
| `{FRAME_DESCRIPTION}` | Frame Gen User, Legacy Frame User |
| `{FRAME_LOCATION}` | Frame Gen User |
| `{FRAME_SCALE}` | Frame Gen User |
| `{FRAME_TIME}` | Frame Gen User |
| `{FRAME_WEATHER}` | Frame Gen User |
| `{FRAMES}` | Legacy Shot User |
| `{FRAMING}` | Frame Gen User, Frame Refine User, Set Gen User, Shot Gen User, Shot Extend User |
| `{GENERATE_ARRAY}` | Style Ref User |
| `{LENS_TYPE}` | Frame Gen User, Frame Refine User, Set Gen User, Shot Gen User, Shot Extend User |
| `{LIGHTING}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{MOOD}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{MOTION}` | Style Ref User |
| `{MOTION_BLUR}` | Frame Gen User, Set Gen User, Shot Gen User, Shot Extend User |
| `{NARRATIVE}` | Shot Gen User, Shot Extend User, Legacy Shot User |
| `{NEGATIVE_PROMPT}` | Frame Gen User |
| `{OBJECT_DESCRIPTION}` | Obj Gen User |
| `{PERSPECTIVE}` | Frame Gen User, Frame Refine User, Set Gen User, Shot Gen User, Shot Extend User |
| `{REFERENCE_IMAGES_JSON}` | Shot Gen User, Shot Extend User |
| `{REFINEMENT_PROMPT}` | Char Refine User, Obj Refine User, Set Refine User, Frame Refine User |
| `{RESOLUTION}` | Shot Gen User, Shot Extend User |
| `{SET_DESCRIPTION}` | Set Gen User |
| `{STYLE_PARAMETERS}` | Legacy Style/Asset/Char/Obj/Set/Frame/Shot User |
| `{TEXTURE}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{USER_EXCLUSIONS_SUFFIX}` | Shot Gen User, Shot Extend User |
| `{VIEWS}` | Legacy Asset/Char/Obj/Set User |
| `{VISUAL_MEDIUM}` | Style Ref User, Char Gen User, Obj Gen User, Set Gen User, Frame Gen User, Frame Refine User, Shot Gen User, Shot Extend User, Set Refine User |
| `{WEATHER}` | Frame Refine User |

---

## Quick Reference: UserDefaults Keys

| UserDefaults Key | Static Default Property | Published Property |
|---|---|---|
| `styleReferenceSystemPromptJSON` | `defaultStyleReferenceSystemPromptJSON` | `styleReferenceSystemPromptJSON` |
| `styleReferenceUserPromptJSON` | `defaultStyleReferenceUserPromptJSON` | `styleReferenceUserPromptJSON` |
| `characterSystemPromptJSON` | `defaultCharacterSystemPromptJSON` | `characterSystemPromptJSON` |
| `characterUserPromptJSON` | `defaultCharacterUserPromptJSON` | `characterUserPromptJSON` |
| `characterRefineSystemPromptJSON` | `defaultCharacterRefineSystemPromptJSON` | `characterRefineSystemPromptJSON` |
| `characterRefineUserPromptJSON` | `defaultCharacterRefineUserPromptJSON` | `characterRefineUserPromptJSON` |
| `objectSystemPromptJSON` | `defaultObjectSystemPromptJSON` | `objectSystemPromptJSON` |
| `objectUserPromptJSON` | `defaultObjectUserPromptJSON` | `objectUserPromptJSON` |
| `objectRefineSystemPromptJSON` | `defaultObjectRefineSystemPromptJSON` | `objectRefineSystemPromptJSON` |
| `objectRefineUserPromptJSON` | `defaultObjectRefineUserPromptJSON` | `objectRefineUserPromptJSON` |
| `setSystemPromptJSON` | `defaultSetSystemPromptJSON` | `setSystemPromptJSON` |
| `setUserPromptJSON` | `defaultSetUserPromptJSON` | `setUserPromptJSON` |
| `setRefineSystemPromptJSON` | `defaultSetRefineSystemPromptJSON` | `setRefineSystemPromptJSON` |
| `setRefineUserPromptJSON` | `defaultSetRefineUserPromptJSON` | `setRefineUserPromptJSON` |
| `frameSystemPromptJSON` | `defaultFrameSystemPromptJSON` | `frameSystemPromptJSON` |
| `frameUserPromptJSON` | `defaultFrameUserPromptJSON` | `frameUserPromptJSON` |
| `frameRefineSystemPromptJSON` | `defaultFrameRefineSystemPromptJSON` | `frameRefineSystemPromptJSON` |
| `frameRefineUserPromptJSON` | `defaultFrameRefineUserPromptJSON` | `frameRefineUserPromptJSON` |
| `shotSystemPromptJSON` | `defaultShotSystemPromptJSON` | `shotSystemPromptJSON` |
| `shotUserPromptJSON` | `defaultShotUserPromptJSON` | `shotUserPromptJSON` |
| `shotExtendSystemPromptJSON` | `defaultShotExtendSystemPromptJSON` | `shotExtendSystemPromptJSON` |
| `shotExtendUserPromptJSON` | `defaultShotExtendUserPromptJSON` | `shotExtendUserPromptJSON` |
| `styleExtractionSystemPromptJSON` | `defaultStyleExtractionSystemPromptJSON` | `styleExtractionSystemPromptJSON` |
| `styleExtractionUserPromptJSON` | `defaultStyleExtractionUserPromptJSON` | `styleExtractionUserPromptJSON` |
| `styleSystemPrompt` | `defaultStyleSystemPrompt` | `styleGenerationSystemPrompt` |
| `customStylePrompt` | `defaultStylePromptTemplate` | `customStylePromptTemplate` |
| `assetSystemPromptKey` | `defaultAssetSystemPrompt` | `assetGenerationSystemPrompt` |
| `customAssetPrompt` | `defaultAssetPromptTemplate` | `customAssetPromptTemplate` |
| `characterSystemPrompt` | `defaultCharacterSystemPrompt` | `characterGenerationSystemPrompt` |
| `customCharacterPrompt` | `defaultCharacterPromptTemplate` | `customCharacterPromptTemplate` |
| `objectSystemPrompt` | `defaultObjectSystemPrompt` | `objectGenerationSystemPrompt` |
| `customObjectPrompt` | `defaultObjectPromptTemplate` | `customObjectPromptTemplate` |
| `setSystemPrompt` | `defaultSetSystemPrompt` | `setGenerationSystemPrompt` |
| `customSetPrompt` | `defaultSetPromptTemplate` | `customSetPromptTemplate` |
| `frameSystemPrompt` | `defaultFrameSystemPrompt` | `frameGenerationSystemPrompt` |
| `customFramePrompt` | `defaultFramePromptTemplate` | `customFramePromptTemplate` |
| `shotSystemPrompt` | `defaultShotSystemPrompt` | `shotGenerationSystemPrompt` |
| `customShotPrompt` | `defaultShotPromptTemplate` | `customShotPromptTemplate` |
