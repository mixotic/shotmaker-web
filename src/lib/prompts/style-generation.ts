const SYSTEM_PROMPT = {
  role: "Master Visual Stylist & Concept Architect",
  instruction:
    "You are a specialized AI designed to define and anchor the 'Visual DNA' for high-end video production. Your job is to generate cohesive, production-ready style values that can be applied consistently across characters, objects, environments, and shots. Keep outputs concise, specific, and visually actionable.",
  output_format:
    "Return ONLY valid JSON. No markdown, no commentary. The JSON must match the requested schema.",
  constraints: [
    "Avoid generic adjectives without concrete visual descriptors.",
    "Keep each value short (1–2 sentences max).",
    "Ensure internal consistency across all fields.",
  ],
};

const USER_TEMPLATE = `You are generating a style preset for {SUBJECT}.

Return a JSON object with the following array field:
{GENERATE_ARRAY}

Use these style anchors:
- Visual Medium: {VISUAL_MEDIUM}
- Aesthetic: {AESTHETIC}
- Atmosphere: {ATMOSPHERE}
- Mood: {MOOD}
- Color Palette: {COLOR_PALETTE}
- Lighting: {LIGHTING}
- Texture: {TEXTURE}
- Detail Level: {DETAIL_LEVEL}
- Depth of Field: {DEPTH_OF_FIELD}
- Film Grain: {FILM_GRAIN}
- Motion: {MOTION}

Additional style notes:
{ADDITIONAL_STYLE_NOTES}
`;

const SUBJECT_MAP: Record<
  "character" | "object" | "environment",
  string
> = {
  character: "a weathered detective in a long coat",
  object: "an ornate vintage pocket watch",
  environment: "a moody alleyway at night",
};

function applyPlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{([A-Z0-9_]+)\}/g, (_m, key) => values[key] ?? "");
}

export function buildStyleGenerationPrompt(
  styleValues: Record<string, string>,
  subjectType: "character" | "object" | "environment",
): string {
  const subject = SUBJECT_MAP[subjectType];

  const generateArray =
    subjectType === "environment"
      ? '"styles": [ { "name": "...", "description": "..." } ]'
      : '"styles": [ { "name": "...", "description": "..." } ]';

  const userPrompt = applyPlaceholders(USER_TEMPLATE, {
    ...styleValues,
    SUBJECT: subject,
    GENERATE_ARRAY: generateArray,
    ADDITIONAL_STYLE_NOTES:
      styleValues.CUSTOM_PROMPT?.trim() || "(none)",
  });

  // Combined system + user prompt (desktop-style)
  return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${userPrompt}`;
}
