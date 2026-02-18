# Veo API Reference (from ideafactory.ltd/guides/veo-api)

> Source: Aaron's guide based on extensive trial and error. Google's own docs are wrong/misleading.

## Critical Insight

The Veo video generation endpoint (`predictLongRunning`) is available at `generativelanguage.googleapis.com` but uses **Vertex AI request format**, NOT standard Gemini format.

## Model IDs (Gemini API vs Vertex AI)

| Model | Gemini API | Vertex AI |
|---|---|---|
| Veo 3.1 Standard | `veo-3.1-generate-preview` | `veo-3.1-generate-001` |
| Veo 3.1 Fast | `veo-3.1-fast-generate-preview` | `veo-3.1-fast-generate-001` |
| Veo 3.0 Standard | `veo-3.0-generate-001` | `veo-3.0-generate-001` |
| Veo 3.0 Fast | `veo-3.0-fast-generate-001` | `veo-3.0-fast-generate-001` |

**Using `-001` models with Gemini API returns 404 errors.** Must use `-preview` suffix.

## Image Data Format

| Format | Field | Structure | Veo Support |
|---|---|---|---|
| Gemini | `inlineData` | `{ data, mimeType }` | **NO** |
| Files API | `fileUri` | `{ fileUri }` | **NO** |
| Vertex AI | `bytesBase64Encoded` | `{ bytesBase64Encoded, mimeType }` | **YES** |

**Key: Use `bytesBase64Encoded` with `mimeType` for ALL image data.**

## Request Structure

Must use `instances` + `parameters` structure (Vertex AI style), NOT flat request body.

## Model Capabilities

| Model | First Frame | Last Frame | Reference Images | Video Extension | Max Duration |
|---|---|---|---|---|---|
| Veo 3.1 Standard | ✅ | ✅ | ✅ (up to 3) | ✅ | 8s |
| Veo 3.1 Fast | ✅ | ✅ | ❌ | ✅ | 8s |
| Veo 3.0 Standard | ✅ | ❌ | ❌ | ✅ | 8s |
| Veo 3.0 Fast | ✅ | ❌ | ❌ | ✅ | 8s |

## Common Gotchas

1. **`lastFrame` placement** — Goes at instance level, NOT in parameters
2. **No nested `image` wrapper** for lastFrame — use `{ bytesBase64Encoded, mimeType }` directly
3. **Reference image type is case-sensitive** — Use lowercase `"asset"`, NOT `"ASSET"`
4. **Reference images** go in `referenceImages[]` array with `{ referenceType: "asset", image: { bytesBase64Encoded, mimeType } }`
5. **Video extension** — Place video URI in `instances[0].video.uri`
6. **Keep images under 1MB** — Large payloads cause gateway errors
7. **Use 16:9 aspect ratio** for reference images initially

## Summary Rules

1. Use `-preview` model IDs for Gemini API (`veo-3.1-generate-preview`)
2. Use `bytesBase64Encoded` format for all images, not `inlineData`
3. Wrap requests in `instances` + `parameters` structure
4. Place `lastFrame` at instance level, not in parameters
5. No nested `image` wrapper for lastFrame
6. Use lowercase `"asset"` for reference image type
7. For video extension, place video URI in `instances[0].video.uri`
