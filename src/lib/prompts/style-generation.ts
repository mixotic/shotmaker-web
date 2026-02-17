const SUBJECT_MAP: Record<"character" | "object" | "environment", string> = {
  character: "a weathered detective in a long coat",
  object: "an ornate vintage pocket watch",
  environment: "a moody alleyway at night",
};

const REQUIREMENTS_MAP: Record<"character" | "object" | "environment", string> = {
  character:
    "Single full-body character concept on a clean neutral background. Clear silhouette, readable costume details, gentle studio falloff, subtle rim light. Centered framing, no props unless essential.",
  object:
    "Single hero object on a clean neutral background. Three-quarter angle with soft shadow, studio lighting, precise material definition, no text labels.",
  environment:
    "Wide establishing shot of the environment. Cinematic composition, layered depth, clear foreground/midground/background, atmospheric perspective.",
};

function buildStyleDescription(styleValues: Record<string, string>): string {
  const parts: string[] = [];

  if (styleValues.VISUAL_MEDIUM) parts.push(`Visual medium: ${styleValues.VISUAL_MEDIUM}`);
  if (styleValues.AESTHETIC) parts.push(`Aesthetic: ${styleValues.AESTHETIC}`);
  if (styleValues.ATMOSPHERE) parts.push(`Atmosphere: ${styleValues.ATMOSPHERE}`);
  if (styleValues.MOOD) parts.push(`Mood: ${styleValues.MOOD}`);
  if (styleValues.COLOR_PALETTE) parts.push(`Color palette: ${styleValues.COLOR_PALETTE}`);
  if (styleValues.LIGHTING) parts.push(`Lighting: ${styleValues.LIGHTING}`);
  if (styleValues.TEXTURE) parts.push(`Texture: ${styleValues.TEXTURE}`);
  if (styleValues.DEPTH_OF_FIELD) parts.push(`Depth of field: ${styleValues.DEPTH_OF_FIELD}`);
  if (styleValues.FILM_GRAIN) parts.push(`Film grain: ${styleValues.FILM_GRAIN}`);
  if (styleValues.MOTION) parts.push(`Motion style: ${styleValues.MOTION}`);
  if (styleValues.FILM_FORMAT) parts.push(`Film format: ${styleValues.FILM_FORMAT}`);

  return parts.join(". ") + ".";
}

export function buildStyleGenerationPrompt(
  styleValues: Record<string, string>,
  subjectType: "character" | "object" | "environment",
): string {
  const subject = SUBJECT_MAP[subjectType];
  const requirements = REQUIREMENTS_MAP[subjectType];
  const styleDescription = buildStyleDescription(styleValues);
  const customNotes = styleValues.CUSTOM_PROMPT?.trim();

  return [
    `Generate an image of ${subject}.`,
    "",
    requirements,
    "",
    `Apply this visual style throughout: ${styleDescription}`,
    customNotes ? `\nAdditional style direction: ${customNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
