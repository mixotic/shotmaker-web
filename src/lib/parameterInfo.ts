export interface ParameterInfoContent {
  title: string;
  description: string;
  examples: string[];
}

export const PARAMETER_INFO: Record<string, ParameterInfoContent> = {
  medium: {
    title: "Visual Medium",
    description:
      "The fundamental artistic medium or format used to create the imagery. This determines the base look and technical approach.",
    examples: [
      "Film formats create organic, cinematic looks",
      "Animation styles have clean, stylized aesthetics",
      "Painting mediums create artistic, textured results",
    ],
  },
  filmFormat: {
    title: "Film Format",
    description:
      "The film stock or camera format used to capture the image. Film formats add unique grain, color rendering, and contrast characteristics.",
    examples: [
      "35mm: Classic film look with natural grain",
      "16mm: Grainier, indie or documentary aesthetic",
      "70mm: Epic, ultra-sharp cinematic quality",
      "Super 8: Vintage home movie feel",
    ],
  },
  filmGrain: {
    title: "Film Grain",
    description:
      "The amount of visible grain or noise texture in the image, simulating analog film characteristics.",
    examples: [
      "Subtle: Light grain for modern film look",
      "Moderate: Classic film photography feel",
      "Heavy/Vintage: Strong grain for aged or artistic effect",
    ],
  },
  depthOfField: {
    title: "Depth of Field",
    description:
      "How much of the image is in focus. Affects the cinematic quality and subject emphasis.",
    examples: [
      "Shallow (f/1.4-2.8): Blurred background, subject focus",
      "Moderate (f/4-5.6): Balanced focus depth",
      "Deep (f/8-16): Everything sharp, documentary style",
    ],
  },
  aspectRatio: {
    title: "Aspect Ratio",
    description:
      "The proportional relationship between width and height of the frame. Different ratios suit different types of content and platforms.",
    examples: [
      "16:9: Modern widescreen, HD video standard",
      "4:3: Classic TV format, more square",
      "21:9: Ultra-wide cinematic format",
      "1:1: Square format for social media",
    ],
  },
  lighting: {
    title: "Lighting",
    description:
      "The lighting setup and quality. One of the most important factors in establishing mood and visual style.",
    examples: [
      "Golden hour: Warm, soft, magical quality",
      "Dramatic shadows: High contrast, film noir",
      "Studio three-point: Professional, controlled",
      "Neon lighting: Cyberpunk, colorful glow",
      "Natural daylight: Realistic, bright",
    ],
  },
  colorPalette: {
    title: "Color Palette",
    description:
      "The overall color scheme and saturation level. Defines the emotional temperature of the imagery.",
    examples: [
      "Vibrant saturated: Bold, energetic colors",
      "Muted pastels: Soft, dreamy, vintage",
      "Warm tones: Reds, oranges, yellows - cozy feel",
      "Cool tones: Blues, greens, purples - calm feel",
      "Monochromatic: Single color variations",
    ],
  },
  aesthetic: {
    title: "Aesthetic",
    description:
      "The overall artistic style and cultural reference. This is the 'look and feel' that ties everything together.",
    examples: [
      "Cinematic blockbuster: Epic, polished Hollywood",
      "Japanese anime: Clean lines, expressive",
      "Film noir: Dark, moody, high contrast",
      "Cyberpunk: Neon, tech, dystopian",
      "Art Deco: Geometric, luxurious, 1920s-30s",
    ],
  },
  atmosphere: {
    title: "Atmosphere",
    description:
      "The environmental feeling and air quality. Creates the emotional backdrop for your scenes.",
    examples: [
      "Clear and bright: Open, optimistic",
      "Foggy and misty: Mysterious, ethereal",
      "Tense and suspenseful: Edge-of-seat feeling",
      "Calm and peaceful: Relaxed, serene",
      "Energetic: Dynamic, active",
    ],
  },
  mood: {
    title: "Mood",
    description:
      "The emotional tone and feeling the imagery should convey to viewers.",
    examples: [
      "Dynamic: Active, exciting, moving",
      "Serene: Calm, peaceful, meditative",
      "Dark and gritty: Harsh, realistic, raw",
      "Whimsical: Playful, fantastical, light",
      "Heroic: Noble, brave, inspiring",
    ],
  },
  motion: {
    title: "Motion",
    description:
      "How movement is depicted or implied in the imagery. Affects the sense of energy and pacing.",
    examples: [
      "Static composition: Still, photographic",
      "Smooth steady: Controlled camera movement",
      "Slow motion: Dramatic, time-stretched",
      "Exaggerated action: Anime-style dynamic poses",
      "Rapid cuts: Fast-paced, energetic",
    ],
  },
  texture: {
    title: "Texture",
    description:
      "The surface quality and level of detail in the imagery. Affects tactile feeling and visual complexity.",
    examples: [
      "Smooth: Clean, polished surfaces",
      "Grainy/organic: Natural, film-like quality",
      "Sharp and crisp: Ultra-detailed, clear",
      "Painterly: Visible brushstrokes, artistic",
      "Soft and diffused: Dreamy, gentle",
    ],
  },
  detailLevel: {
    title: "Detail Level",
    description:
      "How much fine detail and complexity is present in the imagery. Higher values create more intricate, complex visuals.",
    examples: [
      "0-30%: Simple, minimalist",
      "40-60%: Moderate detail, balanced",
      "70-90%: High detail, complex",
      "90-100%: Maximum detail, intricate",
    ],
  },
  customPrompt: {
    title: "Custom Prompt",
    description:
      "Additional freeform instructions to further refine your visual style. Use this to add specific details not covered by other parameters.",
    examples: [
      "Add vintage film scratches",
      "Include lens flares and light leaks",
      "Use Dutch angles for dynamic framing",
      "Apply Wes Anderson symmetrical composition",
    ],
  },
};
