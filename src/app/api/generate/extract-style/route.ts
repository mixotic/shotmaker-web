import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/generate/extract-style
 * 
 * Accepts an uploaded image and uses Gemini vision to extract visual style parameters.
 * Returns a VisualStyle-compatible object with all parameters populated.
 * 
 * Based on Mac app's StyleAnalysisService.swift
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const ANALYSIS_MODEL = "gemini-2.5-flash";

// System prompt from Mac app's DeveloperSettings.defaultStyleExtractionSystemPromptJSON
const SYSTEM_PROMPT = `{
  "role": "Expert Visual Style Forensic Analyst",
  "instruction": "You are a specialist in 'Style DNA' extraction. Your goal is to deconstruct a reference image into its core visual parameters for the purpose of replication in a new context. You must ignore the 'what' (the specific subjects) and focus entirely on the 'how' (the aesthetic execution).",
  "critical_constraints": [
    "NO BRAND/IP NAMES: Never mention specific directors, movies, games, or artists. Use descriptive technical terms instead.",
    "CHARACTER LIMIT: To prevent model drift in downstream tasks, each text-based parameter must be a dense, descriptive phrase of MAXIMUM 200 characters.",
    "STYLE OVER CONTENT: If an image shows a cat in a neon city, do not describe a cat. Describe 'high-contrast cinematic lighting with vibrant cyan and magenta chromatic saturation.'",
    "TECHNICAL TERMINOLOGY: Use cinematography, lighting, and art-theory terminology to ensure professional-grade output."
  ]
}`;

// User prompt from Mac app's DeveloperSettings.defaultStyleExtractionUserPromptJSON
const USER_PROMPT = `Extract the Visual DNA from the provided image and return a JSON object. Ensure each description is concise, technical, and under 200 characters.

### EXTRACTION SCHEMA

Return a JSON object with the following fields:

- **medium**: Select ONE: 16mm Film, 35mm Film, 70mm Film, VHS Camera, DV Camera, Photorealistic, 3D CGI, 2D Hand-drawn, Stop Motion, Claymation, Pixel Art, Watercolor, Oil Painting, Comic Book
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
Return ONLY a valid JSON object following the schema above.`;

async function resolveApiKey(userId: string): Promise<string> {
  // For now, use the platform key. Later: check user BYOK keys first.
  const key = process.env.GOOGLE_GEMINI_API_KEY ?? "";
  if (!key) throw new Error("Missing Gemini API key");
  return key;
}

// Parse extracted medium string to our enum value
function parseMedium(str: string): string | null {
  const n = str.toLowerCase().trim();
  if (n.includes("16mm")) return "16mm Film";
  if (n.includes("35mm")) return "35mm Film";
  if (n.includes("70mm")) return "70mm Film";
  if (n.includes("vhs")) return "VHS Camera";
  if (n.includes("dv") && n.includes("camera")) return "DV Camera";
  if (n.includes("photo")) return "Photorealistic";
  if (n.includes("3d") || n.includes("cgi")) return "3D CGI";
  if (n.includes("2d") || n.includes("hand")) return "2D Hand-drawn";
  if (n.includes("stop motion") && !n.includes("clay")) return "Stop Motion";
  if (n.includes("clay")) return "Claymation";
  if (n.includes("pixel")) return "Pixel Art";
  if (n.includes("watercolor")) return "Watercolor";
  if (n.includes("oil")) return "Oil Painting";
  if (n.includes("comic")) return "Comic Book";
  return null;
}

function parseFilmGrain(str: string): string | null {
  const n = str.toLowerCase().trim();
  if (n.includes("none")) return "None";
  if (n.includes("subtle")) return "Subtle";
  if (n.includes("moderate")) return "Moderate";
  if (n.includes("heavy")) return "Heavy";
  if (n.includes("vintage")) return "Vintage";
  return null;
}

function parseDepthOfField(str: string): string | null {
  const n = str.toLowerCase().trim();
  if (n.includes("shallow")) return "Shallow (f/1.4-2.8)";
  if (n.includes("moderate")) return "Moderate (f/4-5.6)";
  if (n.includes("deep")) return "Deep (f/8-16)";
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const apiKey = await resolveApiKey(userId);

    // Build Gemini request — matches Mac app's StyleAnalysisService
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `System Instructions:\n${SYSTEM_PROMPT}\n\nTask:\n${USER_PROMPT}`,
            },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    };

    const url = `${GEMINI_BASE_URL}/${ANALYSIS_MODEL}:generateContent`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini analysis failed (${res.status}): ${text.substring(0, 500)}`);
    }

    const json: any = await res.json();

    // Extract JSON text from response
    const candidate = json.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error("No analysis text in Gemini response");
    }

    // Parse the JSON response
    let analysisResult: any;
    try {
      analysisResult = JSON.parse(textPart);
    } catch {
      throw new Error(`Failed to parse style analysis JSON: ${textPart.substring(0, 200)}`);
    }

    // Convert to our VisualStyle format
    const extractedStyle = {
      medium: parseMedium(analysisResult.medium ?? "") ?? null,
      filmFormat: null, // Not extracted — could add later
      filmGrain: parseFilmGrain(analysisResult.film_grain ?? "") ?? null,
      depthOfField: parseDepthOfField(analysisResult.depth_of_field ?? "") ?? null,
      detailLevel: typeof analysisResult.detail_level === "number"
        ? Math.max(0, Math.min(100, analysisResult.detail_level))
        : 75,
      // Manual values (detailed text from AI)
      manualValues: {
        lighting: analysisResult.lighting ?? "",
        colorPalette: analysisResult.color_palette ?? "",
        aesthetic: analysisResult.aesthetic ?? "",
        atmosphere: analysisResult.atmosphere ?? "",
        mood: analysisResult.mood ?? "",
        motion: analysisResult.motion_style ?? "",
        texture: analysisResult.texture ?? "",
      },
      customPrompt: analysisResult.additional_notes ?? "",
      // Switch to manual mode to show the extracted text
      isAdvancedMode: true,
    };

    return NextResponse.json({ style: extractedStyle });
  } catch (error: any) {
    const msg = error?.message ?? "Style extraction failed";
    console.error("[style-extract] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
