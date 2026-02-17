type SubjectType = "character" | "object" | "set";

const SYSTEM_PROMPT = {
  role: "Senior Production Concept Artist & Sheet Designer",
  instruction:
    "You generate production-ready concept images and turnaround sheets that are consistent with a provided Visual DNA. Follow composition/layout instructions precisely and keep backgrounds clean unless instructed.",
  output_format:
    "Return ONLY the final image prompt text. No JSON. No markdown. No commentary.",
  constraints: [
    "Be explicit about layout and white background requirements for sheets.",
    "Avoid brand names and copyrighted characters.",
  ],
};

function baseStyleBlock(styleValues: Record<string, string>): string {
  return `Style anchors:\n- Visual Medium: ${styleValues.VISUAL_MEDIUM}\n- Film Format: ${styleValues.FILM_FORMAT}\n- Film Grain: ${styleValues.FILM_GRAIN}\n- Depth of Field: ${styleValues.DEPTH_OF_FIELD}\n- Lighting: ${styleValues.LIGHTING}\n- Color Palette: ${styleValues.COLOR_PALETTE}\n- Aesthetic: ${styleValues.AESTHETIC}\n- Atmosphere: ${styleValues.ATMOSPHERE}\n- Mood: ${styleValues.MOOD}\n- Motion: ${styleValues.MOTION}\n- Texture: ${styleValues.TEXTURE}\n- Detail Level: ${styleValues.DETAIL_LEVEL}\nAdditional notes: ${styleValues.CUSTOM_PROMPT || "(none)"}`;
}

export type BuildAssetGenerationPromptParams = {
  type: SubjectType;
  name: string;
  description?: string;
  styleValues: Record<string, string>;
};

export function buildAssetGenerationPrompt(
  params: BuildAssetGenerationPromptParams,
): string {
  const desc = params.description?.trim() ? `\nDescription: ${params.description}` : "";

  if (params.type === "character") {
    const user = `Create a 4x1 horizontal turnaround sheet of a CHARACTER on a pure white background.\n\nPanels (left to right): Front view, Side view, Back view, 3/4 view.\nKeep the character centered in each panel, consistent proportions, consistent lighting.\nNo text labels. No borders.\nAspect ratio: 4:3.\n\nCharacter name: ${params.name}${desc}\n\n${baseStyleBlock(params.styleValues)}`;
    return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${user}`;
  }

  if (params.type === "object") {
    const user = `Create a 2x2 quadrant grid turnaround sheet of an OBJECT on a pure white background.\n\nQuadrants: Front view, Back view, Side view, 3/4 view.\nKeep scale consistent across quadrants. No text labels. No borders.\nAspect ratio: 4:3.\n\nObject name: ${params.name}${desc}\n\n${baseStyleBlock(params.styleValues)}`;
    return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${user}`;
  }

  // set
  const user = `Create a single cinematic environment concept image of a SET / LOCATION.\n\nNo grid. No white background requirement unless it makes sense; prioritize cinematic composition.\nAspect ratio: 16:9 unless otherwise implied.\n\nSet name: ${params.name}${desc}\n\n${baseStyleBlock(params.styleValues)}`;
  return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${user}`;
}

export function buildRefinementPrompt(params: {
  type: SubjectType;
  originalPrompt: string;
  instructions: string;
  styleValues: Record<string, string>;
}): string {
  const user = `Refine the following prompt for a ${params.type} while preserving the existing style consistency.\n\nORIGINAL PROMPT:\n${params.originalPrompt}\n\nREFINEMENT INSTRUCTIONS:\n${params.instructions}\n\n${baseStyleBlock(params.styleValues)}\n\nReturn ONLY the refined prompt text.`;

  return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${user}`;
}
