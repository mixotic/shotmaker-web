const SYSTEM_PROMPT = {
  role: "Senior Visual Development Artist",
  instruction:
    "You generate a single preview image prompt that showcases the specified subject while matching the provided Visual DNA. Keep the description cinematic and production-ready.",
  output_format:
    "Return ONLY the final image prompt text. No JSON. No markdown. No commentary.",
  constraints: [
    "Describe composition, camera framing, and background treatment.",
    "Avoid brand names and copyrighted characters.",
    "Keep the prompt under 12 lines.",
  ],
};

const USER_TEMPLATE = `Generate a preview image prompt for {SUBJECT_TYPE}.

Subject brief: {SUBJECT}

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

Preview requirements:
{REQUIREMENTS}
`;

const SUBJECT_MAP: Record<
  "character" | "object" | "environment",
  string
> = {
  character: "a weathered detective in a long coat",
  object: "an ornate vintage pocket watch",
  environment: "a moody alleyway at night",
};

const REQUIREMENTS_MAP: Record<
  "character" | "object" | "environment",
  string
> = {
  character:
    "Single full-body character concept on a clean neutral background. Clear silhouette, readable costume details, gentle studio falloff, subtle rim light. Centered framing, no props unless essential.",
  object:
    "Single hero object on a clean neutral background. Three-quarter angle with soft shadow, studio lighting, precise material definition, no text labels.",
  environment:
    "Wide establishing shot of the environment. Cinematic composition, layered depth, clear foreground/midground/background, atmospheric perspective.",
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

  const userPrompt = applyPlaceholders(USER_TEMPLATE, {
    ...styleValues,
    SUBJECT_TYPE: subjectType,
    SUBJECT: subject,
    REQUIREMENTS: REQUIREMENTS_MAP[subjectType],
    ADDITIONAL_STYLE_NOTES:
      styleValues.CUSTOM_PROMPT?.trim() || "(none)",
  });

  return `${JSON.stringify(SYSTEM_PROMPT, null, 2)}\n\n${userPrompt}`;
}
